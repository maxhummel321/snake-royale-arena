"""Shared test fixtures.

Each test gets a fresh, empty in-memory store. The TestClient is created
without the lifespan context manager, so demo seeding does not run and tests
build exactly the data they need.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import store


@pytest.fixture
def client() -> TestClient:
    store.reset()
    return TestClient(app)


def auth_headers(client: TestClient, username: str = "alice", password: str = "pass123"):
    """Sign up a user and return (headers, body) for authenticated requests."""
    r = client.post("/api/auth/signup", json={"username": username, "password": password})
    assert r.status_code == 201, r.text
    token = r.json()["token"]
    return {"Authorization": f"Bearer {token}"}
