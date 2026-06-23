"""Database engine, session factory, and table creation.

Database-agnostic: the engine is built from DATABASE_URL. SQLite needs one extra
connect arg; other databases (e.g. Postgres) need none.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import DATABASE_URL


def _normalize(url: str) -> str:
    """Use the psycopg (v3) driver for Postgres, whatever URL form we're given.

    Compose/AWS typically hand out `postgresql://...` or `postgres://...`;
    SQLAlchemy would otherwise reach for psycopg2. Rewrite to the v3 dialect.
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


_url = _normalize(DATABASE_URL)
_connect_args = {"check_same_thread": False} if _url.startswith("sqlite") else {}

engine = create_engine(_url, connect_args=_connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    """Create tables if they don't exist. Idempotent."""
    from . import db_models  # noqa: F401  (register models on Base)

    Base.metadata.create_all(bind=engine)
