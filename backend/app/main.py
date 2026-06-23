"""FastAPI application entry point.

Mounts the auth, leaderboard, and games routers under /api, enables permissive
CORS for local development, serves interactive docs at /api/docs, and seeds the
in-memory store with demo data on startup.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, games, leaderboard
from .database import init_db
from .seed import seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_demo_data()
    yield


app = FastAPI(
    title="Snake Royale Arena API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Permissive CORS so the Vite dev server (localhost:5173/8080) can call the API
# at localhost:8000 during local development. Tighten before going public.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All endpoints live under /api, matching openapi.yaml.
app.include_router(auth.router, prefix="/api")
app.include_router(leaderboard.router, prefix="/api")
app.include_router(games.router, prefix="/api")


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
