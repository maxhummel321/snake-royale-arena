"""Database engine, session factory, and table creation.

Database-agnostic: the engine is built from DATABASE_URL. SQLite needs one extra
connect arg; other databases (e.g. Postgres) need none.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import DATABASE_URL

_connect_args = (
    {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    """Create tables if they don't exist. Idempotent."""
    from . import db_models  # noqa: F401  (register models on Base)

    Base.metadata.create_all(bind=engine)
