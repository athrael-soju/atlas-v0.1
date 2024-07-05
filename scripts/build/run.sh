#!/bin/bash

set -euo pipefail

# Navigate to the script directory
cd "$(dirname "$0")"

echo "--------------------------------------"
echo "Atlas - Vercel Configuration Builder"
echo "--------------------------------------"

# Define paths
DEFAULT_CONFIG="./build-node.json"
PYTHON_CONFIG="./build-node-python.json"
TARGET_CONFIG="../../vercel.json"
ENV_FILE="../../.env.local"

# Load environment variables
if [ -f "$ENV_FILE" ]; then
  echo "- Loading environment variables from .env.local"
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "- Loading environment variables from Vercel"
fi

# Remove existing Vercel configuration file
rm -f "$TARGET_CONFIG"

# Choose configuration based on ENABLE_PYTHON_ROUTE
if [[ "${ENABLE_PYTHON_ROUTE:-false}" == "true" ]]; then
  CONFIG_SOURCE="$PYTHON_CONFIG"
  echo "- Building with Python routes enabled"
else
  CONFIG_SOURCE="$DEFAULT_CONFIG"
  echo "- Building with Python routes disabled"
fi

# Copy the chosen configuration
if cp "$CONFIG_SOURCE" "$TARGET_CONFIG"; then
  echo "- Successfully copied configuration to $TARGET_CONFIG"
else
  echo "Error: Failed to copy configuration to $TARGET_CONFIG" >&2
  exit 1
fi

echo "--------------------------------------"
echo "Configuration build complete"
echo "--------------------------------------"
