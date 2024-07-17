#!/bin/sh

# Source the .env.local file
if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi

echo "ENABLE_PYTHON_ROUTE is set to '$ENABLE_PYTHON_ROUTE'"

if [ "$ENABLE_PYTHON_ROUTE" = "true" ]; then
  echo "Running both Next.js and FastAPI in development mode..."
  concurrently "npm:dev:next" "npm:dev:fastapi"
else
  echo "Running Next.js in development mode..."
  npm run dev:next
fi
