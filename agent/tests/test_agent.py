import sys
import os

# Allow running from project root: pytest agent/tests/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent import Assistant

def test_assistant_initialization():
    assistant = Assistant()
    assert "helpful voice assistant" in assistant.instructions
