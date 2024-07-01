#!/bin/bash
set -e


# Clean up
rm -rf .next && rm -rf api/__pycache__

# Install Python
if ! command -v python3 &> /dev/null; then
  sudo apt-get update
  sudo apt-get install python3 python3-pip -y
fi

# Install Python dependencies
pip3 install -r requirements.txt

# Build Next.js app
next build