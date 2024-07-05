#!/bin/bash

# Navigate to the script directory
cd "$(dirname "$0")"

# Remove the existing Vercel configuration file
rm -rf ../../vercel.json
rm -rf ../../.vercel
rm -rf ../../.next

echo "--------------------------------------"
echo "Atlas - Vercel Configuration Builder"
echo "--------------------------------------"
# Load environment variables from .env.local located in the project root
if [ -f "../../.env.local" ]; then
  echo "- Loading environment variables from .env.local"
  source "../../.env.local"
else
  echo "- Loading environment variables from Vercel"
fi

# Define the path to the default Vercel configuration
DEFAULT_CONFIG="./build-node.json"
# Define the path to the Python-specific Vercel configuration
PYTHON_CONFIG="./build-node-python.json"
# Define the target Vercel configuration file name
TARGET_CONFIG="../../vercel.json"

if ! cp "$PYTHON_CONFIG" "$TARGET_CONFIG"; then
  echo "Error copying Python configuration."
  exit 1
fi

# Check the value of ENABLE_PYTHON_ROUTE and switch configurations
if [[ "$ENABLE_PYTHON_ROUTE" == "true" ]]; then
  # If Python route is enabled, use the Python-specific configuration
  cp "$PYTHON_CONFIG" "$TARGET_CONFIG"
  echo "- Building with Python routes enabled"
else
  # Otherwise, use the default configuration
  cp "$DEFAULT_CONFIG" "$TARGET_CONFIG"
  echo "- Building with Python routes disabled"
fi
echo "--------------------------------------"
