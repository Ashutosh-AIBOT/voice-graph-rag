import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from graphrag.models import Document
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()
user = User.objects.first()

client = APIClient(SERVER_NAME='localhost')
client.force_authenticate(user=user)

# Get some documents
docs = Document.objects.filter(user=user, status="COMPLETED")[:2]
doc_ids = [str(d.id) for d in docs]
print(f"Testing with doc_ids: {doc_ids}")

response = client.post('/api/livekit-token/', {'doc_ids': doc_ids}, format='json')
print("Status:", response.status_code)
if response.status_code == 200:
    print("Success")
    data = response.json()
    print("Token created:", bool(data.get('token')))
    print("Room:", data.get('room'))
    print("Summary length:", len(data.get('doc_summary', '')))
else:
    print("Data:", response.json())
