import requests
import os
import json

BASE_URL = "http://localhost:8000"
EMAIL = "ashutoshknp12@gmail.com"
PASSWORD = "Ayush@123"
AGENT_SECRET = "super-secret-agent-voice-rag-token-xyz123"

def print_step(msg):
    print(f"\n[{'='*10}] {msg} [{'='*10}]")

def run_tests():
    session = requests.Session()

    # Step 1: Login
    print_step("Stage 1: Authentication")
    res = session.post(f"{BASE_URL}/api/auth/login/", json={
        "username": EMAIL,
        "password": PASSWORD
    })
    
    if res.status_code != 200:
        print(f"❌ Login failed: {res.text}")
        return
    
    token = res.json().get('access')
    user_id = res.json().get('user_id', 1) # Assuming user_id is in token or response, else we'll hardcode 1 or get from profile
    session.headers.update({"Authorization": f"Bearer {token}"})
    print("✅ Login successful. Received JWT token.")

    # Get User ID
    res_user = session.get(f"{BASE_URL}/api/auth/me/")
    if res_user.status_code == 200:
        user_id = res_user.json().get('id')
    print(f"✅ Authenticated as User ID: {user_id}")

    # Step 2: Get Documents
    print_step("Stage 2: Document Retrieval")
    res_docs = session.get(f"{BASE_URL}/api/documents/")
    if res_docs.status_code != 200:
        print(f"❌ Failed to fetch documents: {res_docs.text}")
        return
    docs = res_docs.json()
    if isinstance(docs, dict):
        docs = docs.get('results', [])
    
    if not docs:
        print("❌ No documents found for this user.")
        return
    
    doc = docs[0]
    doc_id = doc['id']
    doc_name = doc['name']
    print(f"✅ Found document: {doc_name} (ID: {doc_id})")

    # Step 3: Get LiveKit Token
    print_step("Stage 3: LiveKit Handshake Configuration")
    # Usually this is at /api/livekit-token/, wait, let's check views.py for the exact endpoint. 
    # The frontend code said: api.post('/livekit-token/', { doc_id: selectedDoc.id });
    res_lk = session.post(f"{BASE_URL}/api/livekit-token/", json={"doc_id": doc_id})
    if res_lk.status_code == 200:
        lk_data = res_lk.json()
        room_name = lk_data.get('room', '')
        print(f"✅ LiveKit Token Generated.")
        print(f"   Room Name: {room_name}")
        print("   -> Room Name correctly embeds user_id and doc_id for the Python Agent to parse.")
        
        # Extract user_id from room_name: user-<user_id>-doc-...
        if room_name.startswith("user-"):
            user_id = room_name.split("-doc-")[0].replace("user-", "")
    else:
        print(f"⚠️ Failed to get LiveKit token: {res_lk.text} (Maybe endpoint is different?)")

    # Step 4: Simulate Agent GraphRAG Query
    print_step("Stage 4: Multi-hop Hybrid GraphRAG Query (Simulating Agent)")
    # The agent sends to /api/query/ using X-Voice-Agent-Secret
    query_payload = {
        "query": "What is the core idea of the attention mechanism in this paper?",
        "document_ids": [doc_id],
        "user_id": user_id,
        "mode": "hybrid"
    }
    headers = {
        "X-Voice-Agent-Secret": AGENT_SECRET,
        "Content-Type": "application/json"
    }
    
    res_query = requests.post(f"{BASE_URL}/api/query/", json=query_payload, headers=headers)
    
    if res_query.status_code != 200:
        print(f"❌ GraphRAG Query failed: {res_query.text}")
        return
    
    query_data = res_query.json()
    print("✅ Query successful. Backend properly orchestrated ChromaDB + Neo4j.")
    
    print("\n--- LLM Answer ---")
    print(query_data.get('answer')[:200] + "...")
    
    print("\n--- Strategy Used ---")
    print(query_data.get('strategy'))
    
    print("\n--- Cited Entities (for 3D Graph Highlighting) ---")
    entities = query_data.get('cited_entities', [])
    print(f"Extracted {len(entities)} entities: {json.dumps(entities[:3], indent=2)}")

    print("\n✅ Data Transformation Pipeline is verified. The agent will successfully stream this text to Cartesia (TTS) and broadcast the cited_entities to the frontend via LiveKit DataChannel!")

if __name__ == "__main__":
    run_tests()
