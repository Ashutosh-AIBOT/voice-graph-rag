import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import json
from livekit import api as lkapi

try:
    livekit_api_key = os.environ.get("LIVEKIT_API_KEY", "test_key")
    livekit_api_secret = os.environ.get("LIVEKIT_API_SECRET", "test_secret")
    room_name = "test-room"

    token = (
        lkapi.AccessToken(livekit_api_key, livekit_api_secret)
        .with_grants(lkapi.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
        ))
        .with_identity("123")
        .with_name("Test User")
        .with_metadata(json.dumps({
            "user_id": "123",
            "doc_id": "doc123",
            "doc_name": "My Doc",
        }))
        .to_jwt()
    )
    print("Token generation successful!")
except Exception as e:
    import traceback
    traceback.print_exc()
