import requests
import json
import time
import os

API_URL = "http://localhost:8000/api/query/"
SECRET = "super-secret-agent-voice-rag-token-xyz123"
LOG_FILE = "pipeline_debug.log"

def main():
    print("="*60)
    print("🚀 GRAPH-RAG UNIFIED END-TO-END PIPELINE TEST")
    print("="*60)
    
    # 1. Clear the log file so we only see this run
    if os.path.exists(LOG_FILE):
        open(LOG_FILE, 'w').close()
        print(f"[*] Cleared previous {LOG_FILE}")
        
    # 2. Formulate test request
    payload = {
        "query": "How does the transformer work and what are the main parts of it?",
        "mode": "hybrid",
        "user_id": "b85795fc-587a-4b32-a1fa-5d0f5ebba984",  # Valid UUID user ID
        # "document_ids": ["doc-uuid-here"] # Optional
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-Voice-Agent-Secret": SECRET
    }
    
    print("\n[*] Sending request to GraphRAG Backend (simulating Voice Agent)...")
    print(f"    Query: '{payload['query']}'")
    
    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        print("\n[*] API Response Status:", response.status_code)
        
        if response.status_code == 200:
            data = response.json()
            print("\n[+] SUCCESS! Final LLM Answer:")
            print("-" * 40)
            print(data.get("answer", "No answer found"))
            print("-" * 40)
        else:
            print("\n[-] API Error Response:")
            print(response.text)
            
    except Exception as e:
        print("\n[-] Failed to connect to API:", e)
        return

    # 3. Read and print the unified log
    print("\n" + "="*60)
    print("📊 UNIFIED PIPELINE LOG OUTPUT (pipeline_debug.log)")
    print("="*60)
    
    time.sleep(1) # Ensure logs are flushed
    
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r') as f:
            logs = f.read()
            if not logs.strip():
                print("WARNING: Log file is empty! Check if Django is writing to it.")
            else:
                print(logs)
    else:
        print(f"ERROR: {LOG_FILE} was not created!")
        
if __name__ == "__main__":
    main()
