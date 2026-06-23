"""Integration test fixtures.

These run against a real, on-disk temporary SQLite database to prove data
survives across separate database connections — exactly what broke when the
store was in memory.
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


@pytest.fixture
def client() -> TestClient:
    init_db()
    store.reset()
    return TestClient(app)
