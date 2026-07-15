from livekit.agents import llm
class MyTools:
    @llm.function_tool
    async def my_func(self):
        pass

tools_ctx = MyTools()
print(type(tools_ctx.my_func))
print(isinstance(tools_ctx.my_func, llm.Tool))
