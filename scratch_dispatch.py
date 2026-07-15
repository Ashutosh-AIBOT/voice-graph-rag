import asyncio
import os
from livekit import api

LIVEKIT_URL = "https://human-voice-agent-fnohob61.livekit.cloud" # Note: HTTP url for api
LIVEKIT_API_KEY = "APIrkrKXGvrjrP4"
LIVEKIT_API_SECRET = "an7c6P4v4ILXsDxW830eQADPwHUqIG2BrDB2pQDWFkD"

async def dispatch():
    room_name = "test-dispatch-room"
    
    # Initialize the LiveKit API
    lkapi = api.LiveKitAPI(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    
    print(f"Creating room {room_name}...")
    await lkapi.room.create_room(api.CreateRoomRequest(name=room_name))
    
    print("Dispatching agent 'voice-rag-agent' to room...")
    dispatch_req = api.CreateAgentDispatchRequest(
        room=room_name,
        agent_name="voice-rag-agent"
    )
    
    try:
        res = await lkapi.agent_dispatch.create_dispatch(dispatch_req)
        print("Dispatch successful:", res)
    except Exception as e:
        print("Dispatch failed:", e)
        
    await lkapi.aclose()

if __name__ == "__main__":
    asyncio.run(dispatch())
