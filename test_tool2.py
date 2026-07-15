from livekit.agents.voice.agent_session import AgentSession
import inspect
sig = inspect.signature(AgentSession.__init__)
print(sig.parameters['tools'].annotation)
