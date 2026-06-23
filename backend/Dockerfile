# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: build the frontend into a standalone Node server (.output)
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Empty API base => the browser calls /api/* on the same origin (Caddy routes it).
ENV VITE_API_BASE_URL=""
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: install backend dependencies with uv
# ---------------------------------------------------------------------------
FROM python:3.13-slim AS backend-builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

# ---------------------------------------------------------------------------
# Final image: Python backend + Node frontend server + Caddy proxy
# ---------------------------------------------------------------------------
FROM python:3.13-slim
WORKDIR /app

# Node runtime (to run the prebuilt frontend server) and bash (for start.sh).
RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs bash \
    && rm -rf /var/lib/apt/lists/*

# Caddy reverse proxy (static binary from the official image).
COPY --from=caddy:2 /usr/bin/caddy /usr/local/bin/caddy

# Backend: virtualenv + application code.
COPY --from=backend-builder /app/.venv /app/.venv
COPY backend/app ./app
ENV PATH="/app/.venv/bin:$PATH"

# Frontend: the built Node server + static assets.
COPY --from=frontend-builder /frontend/.output /frontend/.output

# Proxy config + process launcher.
COPY backend/Caddyfile /etc/caddy/Caddyfile
COPY backend/start.sh /start.sh
RUN chmod +x /start.sh

# SQLite lives inside the container (resets when the container is removed).
ENV DATABASE_URL="sqlite:////app/snake.db"
ENV PORT=3000

EXPOSE 80
CMD ["/start.sh"]
