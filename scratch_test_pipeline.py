import os
import json
import httpx
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env")

async def test_pipeline():
    print("🚀 Starting End-to-End Pipeline Test...\n")
    
    api_url = "http://localhost:8000"
    agent_secret = os.environ.get("VOICE_AGENT_SECRET", "supersecret")
    
    # We will test the hybrid query exactly as the LiveKit Agent does
    question = "What are the main topics discussed in this document?"
    
    # We will query against ALL documents since we don't have a specific doc_id right now
    payload = {
        "query": question,
        "mode": "hybrid",
        "user_id": "b85795fc-587a-4b32-a1fa-5d0f5ebba984"
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-Voice-Agent-Secret": agent_secret
    }
    
    print(f"📡 1. Simulating Voice Agent tool call to: {api_url}/api/query/")
    print(f"   Payload: {json.dumps(payload)}\n")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{api_url}/api/query/",
                json=payload,
                headers=headers,
                timeout=60.0
            )
            
            print(f"📥 2. Received Response: HTTP {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("\n✅ SUCCESS! Here is what the LLM receives:")
                print("-" * 50)
                print(f"🤖 LLM Answer Text (What the TTS will say):\n{data.get('answer', 'No answer')}\n")
                
                cited = data.get("cited_entities", [])
                print(f"🌐 Graph Nodes Extracted (What the 3D Frontend will highlight): {len(cited)} nodes")
                for c in cited[:5]: # print first 5
                    print(f"   - {c.get('name')} (Score: {c.get('score')})")
                
                print("-" * 50)
                print("End-to-End Hybrid RAG data flow verified successfully!")
            else:
                print(f"❌ FAILED! Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_pipeline())
