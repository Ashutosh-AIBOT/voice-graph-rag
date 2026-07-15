
import json
import logging
import os

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentServer, AgentSession, JobContext, room_io, llm
from livekit.plugins import noise_cancellation, silero
from livekit.agents import stt, tts, inference
from livekit.agents import AgentStateChangedEvent, MetricsCollectedEvent, metrics
import httpx

logger = logging.getLogger(__name__)

# Load agent-specific .env first, then fall back to parent-level .env
_agent_dir = os.path.dirname(os.path.abspath(__file__))
_project_env = os.path.join(_agent_dir, "..", ".env")
load_dotenv(os.path.join(_agent_dir, ".env"), override=True)   # agent/.env (if present)
load_dotenv(_project_env, override=False)                       # project root .env as fallback

# Persistent context file stored inside the agent directory
CONTEXT_FILE = os.path.join(_agent_dir, "user_context.json")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a helpful voice assistant for a document knowledge base.
Always use the 'query_knowledge_graph' tool to find answers to any questions.
Be extremely concise, direct, and conversational — you are speaking, not writing.
Keep responses under 2-3 sentences where possible.
When you retrieve facts, briefly mention the key concepts you found.""",
        )


class GraphRAGTools:
    """Holds the user/doc context and exposes tools for the agent."""

    def __init__(self, user_id: str, doc_id: str, room):
        self.user_id = user_id
        self.doc_id = doc_id
        self.room = room

    @llm.function_tool(description="MANDATORY TOOL: Queries the GraphRAG knowledge base to retrieve specific factual information, context, and entities from the user's document. ALWAYS call this tool when the user asks a factual question, asks about a document, transformers, papers, or any topic they uploaded. Do not answer from your own knowledge.")
    async def query_knowledge_graph(self, question: str) -> str:
        """Queries the GraphRAG knowledge base for information about the document.

        Args:
            question: The exact question to search in the database.
        """
        api_url = os.environ.get("GRAPHRAG_API_URL", "http://localhost:8000")
        agent_secret = os.environ.get("VOICE_AGENT_SECRET")

        headers = {"Content-Type": "application/json"}
        if agent_secret:
            headers["X-Voice-Agent-Secret"] = agent_secret

        payload = {
            "query": question,
            "document_ids": [self.doc_id],
            "user_id": self.user_id,
            "mode": "hybrid",
        }

        logger.info(
            "🔥 LLM TRIGGERED TOOL: query_knowledge_graph! Searching backend for: '%s' | user: %s | doc: %s",
            question, self.user_id, self.doc_id
        )
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{api_url}/api/query/",
                    json=payload,
                    headers=headers,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    answer = data.get("answer", "No answer found.")
                    # Backend returns cited_entities: [{id, name, score}]
                    cited_entities = data.get("cited_entities", [])

                    logger.info(
                        "✅ BACKEND RETURNED HYBRID CHUNKS! Sending %d characters to LLM memory. 🌐 Extracted %d graph nodes.", len(answer), len(cited_entities)
                    )

                    # Publish cited entities to the frontend via LiveKit DataChannel
                    if cited_entities:
                        highlight_payload = json.dumps(
                            {"type": "graph_highlight", "entities": cited_entities}
                        )
                        await self.room.local_participant.publish_data(
                            highlight_payload.encode("utf-8"),
                            reliable=True,
                        )
                        logger.info(
                            "Published graph highlight (%d nodes) to LiveKit room.",
                            len(cited_entities),
                        )

                    return answer

                else:
                    logger.error(
                        "Error querying GraphRAG: %d - %s",
                        response.status_code, response.text,
                    )
                    return (
                        f"I encountered an error querying the database "
                        f"(Status {response.status_code})."
                    )
        except Exception as e:
            logger.error("Failed to query GraphRAG: %s", e, exc_info=True)
            return (
                "I failed to retrieve information from the knowledge graph "
                "due to a connection issue."
            )


server = AgentServer()

@server.rtc_session()
async def entrypoint(ctx: JobContext):
    # Wait for the participant to connect
    participant = await ctx.wait_for_participant()
    logger.info("Participant joined: %s", participant.identity)

    # Parse user_id and doc_id from room name: user-<user_id>-doc-<doc_id>-voice-rag
    user_id = None
    doc_id = None
    try:
        room_name = ctx.room.name
        if "-doc-" in room_name:
            parts = room_name.split("-doc-", 1)
            user_id = parts[0].replace("user-", "").strip()
            doc_id = parts[1].replace("-voice-rag", "").strip()
        logger.info("Parsed from room name: user_id=%s, doc_id=%s", user_id, doc_id)
    except Exception as e:
        logger.error("Error parsing room name %s: %s", ctx.room.name, e)

    if not user_id or not doc_id:
        logger.warning(
            "Could not parse user_id/doc_id from room '%s'. Using identity as fallback.",
            ctx.room.name,
        )
        user_id = participant.identity
        doc_id = "default"

    # Instantiate the tools object bound to this session's user/doc context
    tools_ctx = GraphRAGTools(user_id=user_id, doc_id=doc_id, room=ctx.room)

    # Load past conversation history from persistent context file
    past_messages = []
    if os.path.exists(CONTEXT_FILE):
        try:
            with open(CONTEXT_FILE, "r") as f:
                data = json.load(f)
                past_messages = data.get(participant.identity, [])
            logger.info(
                "Loaded %d past messages for %s", len(past_messages), participant.identity
            )
        except Exception as e:
            logger.error("Failed to load user context: %s", e)

    # Build the session with STT → LLM → TTS pipeline
    session = AgentSession(
        stt=stt.FallbackAdapter(
            [
                inference.STT.from_model_string("assemblyai/universal-streaming:en"),
                inference.STT.from_model_string("deepgram/nova-3"),
            ]            
        ),

        llm=inference.LLM.from_model_string("openai/gpt-4o"),

        tts=tts.FallbackAdapter(
            [
                inference.TTS.from_model_string("cartesia/sonic-3"),
                inference.TTS.from_model_string("openai/tts-1"),
            ]            
        ),
        vad=silero.VAD.load(),
        turn_handling={
            "turn_detection": inference.TurnDetector(),
            "preemptive_generation": {"enabled": True}
        },
        tools=[tools_ctx.query_knowledge_graph],
    )

    # Pre-populate history with an EXTREMELY strong system prompt first
    system_prompt = (
        "You are an AI assistant bound to a private document database. "
        "You have exactly one tool: 'query_knowledge_graph'. "
        "YOU MUST USE THIS TOOL to answer every single question about facts, concepts, or documents. "
        "For example, if the user asks 'how does a transformer work?', DO NOT explain it from your memory. "
        "INSTEAD, call the 'query_knowledge_graph' tool to fetch the answer from the document! "
        "NEVER say you cannot view documents. YOU CAN, by using the tool."
    )
    session.history.add_message(role="system", content=system_prompt)

    # Pre-populate history with past context (Limit to last 6 messages to save context window)
    for msg in past_messages[-6:]:
        logger.info("📚 INJECTING PAST HISTORY [%s]: %s...", msg["role"], msg["content"][:60])
        session.history.add_message(role=msg["role"], content=msg["content"])

    # Observability callbacks
    @session.on("agent_state_changed")
    def on_agent_state_changed(event: AgentStateChangedEvent):
        logger.info("Agent state: %s → %s", event.old_state, event.new_state)

    @session.on("metrics_collected")
    def on_metrics_collected(event: MetricsCollectedEvent):
        metrics.log_metrics(event.metrics, logger=logger)

    @session.on("user_speech_committed")
    def on_user_speech(msg: llm.ChatMessage):
        logger.info("🗣️ USER SPOKE (STT): %s", msg.content)

    @session.on("agent_speech_committed")
    def on_agent_speech(msg: llm.ChatMessage):
        logger.info("🤖 AGENT RESPONDED (LLM): %s", msg.content)

    # Start the session
    try:
        await session.start(
            agent=Assistant(),
            room=ctx.room,
            room_options=room_io.RoomOptions(
                audio_input=room_io.AudioInputOptions(
                    noise_cancellation=noise_cancellation.BVC(),
                ),
            ),
        )
    except Exception as e:
        logger.error("Error starting session: %s", e, exc_info=True)

    # Save context on shutdown
    async def save_context(reason: str = ""):
        updated_messages = []
        for item in session.history.messages():
            content_str = ""
            if isinstance(item.content, list):
                content_str = " ".join(
                    c for c in item.content if isinstance(c, str)
                )
            elif isinstance(item.content, str):
                content_str = item.content

            if content_str.strip():
                updated_messages.append(
                    {"role": item.role, "content": content_str}
                )

        try:
            saved = {}
            if os.path.exists(CONTEXT_FILE):
                with open(CONTEXT_FILE, "r") as f:
                    saved = json.load(f)
            saved[participant.identity] = updated_messages
            with open(CONTEXT_FILE, "w") as f:
                json.dump(saved, f, indent=2)
            logger.info(
                "Saved %d messages for participant %s",
                len(updated_messages), participant.identity,
            )
        except Exception as e:
            logger.error("Failed to save user context: %s", e)

    ctx.add_shutdown_callback(save_context)


async def request_fnc(req: agents.JobRequest) -> None:
    logger.info("Accepting job for room %s", req.room.name)
    await req.accept()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            request_fnc=request_fnc,
            agent_name="voice-rag-agent",
        )
    )
