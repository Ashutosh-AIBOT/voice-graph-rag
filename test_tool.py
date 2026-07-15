from livekit.agents import llm
from livekit.agents.voice.agent_session import AgentSession

class MyTools(llm.ToolContext):
    @llm.function_tool
    async def test_tool(self, x: str) -> str:
        return x

ctx = MyTools()
print("Tools in ctx:", ctx.tools)
