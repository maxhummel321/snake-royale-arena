"""Shared test fixtures.

Unit tests run against a throwaway SQLite file, created fresh and cleared before
each test. The DATABASE_URL is set before importing the app so config.py picks
it up (load_dotenv does not override an already-set variable).
"""

import os
import tempfile

_TEST_DB = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_TEST_DB.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB.name}"

import pytest
from fastapi.testclient import TestClient

from app.database import init_db
from app.main import app
from app.store import store

init_db()  # create tables once for the test database


@pytest.fixture
def client() -> TestClient:
    store.reset()
    return TestClient(app)


def auth_headers(client: TestClient, username: str = "alice", password: str = "pass123"):
    """Sign up a user and return headers for authenticated requests."""
    r = client.post("/api/auth/signup", json={"username": username, "password": password})
    assert r.status_code == 201, r.text
    token = r.json()["token"]
    return {"Authorization": f"Bearer {token}"}
