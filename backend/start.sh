#!/bin/bash
# Start all three processes inside the container:
#   - Python backend (uvicorn)            internal :8000  -> /api/*
#   - Node frontend SSR server (nitro)    internal :3000  -> everything else
#   - Caddy reverse proxy                 public   :80
# If any one exits, the script exits so the container stops (and can restart).
set -e

uvicorn app.main:app --host 127.0.0.1 --port 8000 &

( cd /frontend && PORT=3000 node .output/server/index.mjs ) &

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &

wait -n
exit $?
