#!/bin/bash
echo "Starting LiveKit Voice Agent..."
cd agent

# Create unified venv in root if it doesn't exist
if [ ! -d "../venv" ]; then
    echo "Creating unified virtual environment in root venv..."
    python3 -m venv ../venv
fi

# Activate the unified venv
source ../venv/bin/activate

# Install all universal requirements
pip install -r ../requirements.txt

# Run the agent in dev mode to connect with the web frontend
PYTHONPATH=. python agent.py dev
