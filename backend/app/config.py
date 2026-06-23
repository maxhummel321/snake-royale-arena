"""Application configuration.

The database is chosen entirely by the DATABASE_URL environment variable, so the
same code runs on SQLite locally and Postgres later with no code change. We load
backend/.env explicitly so the setting is picked up whether the server is started
by `make`, by uvicorn directly, or via dirdotenv.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# backend/.env sits two levels up from this file (app/config.py -> backend/).
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)  # does not override variables already set in the environment

# Default to a local SQLite file when nothing is configured.
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./snake.db")
