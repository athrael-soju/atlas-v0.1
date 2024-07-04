#!/bin/sh

if [ "$START_PYTHON_SERVER" = "true" ]; then
    concurrently "npm:dev:next" "npm:dev:fastapi"
else
    npm run dev:next
fi
