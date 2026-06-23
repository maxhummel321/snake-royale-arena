"""Verify demo data is seeded on app startup (lifespan)."""

from fastapi.testclient import TestClient

from app.main import app
from app.store import store


def test_demo_data_seeded_on_startup():
    store.reset()
    # Entering the context manager triggers the lifespan startup -> seeding.
    with TestClient(app) as client:
        wrap = client.get("/api/leaderboard", params={"mode": "wrap"}).json()
        walls = client.get("/api/leaderboard", params={"mode": "walls"}).json()
        active = client.get("/api/games/active").json()

        assert len(wrap) >= 1
        assert len(walls) >= 1
        assert len(active) >= 1
        # demo account can log in
        assert client.post(
            "/api/auth/login", json={"username": "alice", "password": "password"}
        ).status_code == 200
    store.reset()
