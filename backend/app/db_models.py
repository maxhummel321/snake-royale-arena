"""SQLAlchemy ORM models — the database tables.

GameState is stored as a JSON string so the schema stays simple and works the
same on SQLite and Postgres.
"""

from sqlalchemy import BigInteger, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class UserRow(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    salt: Mapped[str] = mapped_column(String)


class TokenRow(Base):
    __tablename__ = "tokens"

    token: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, index=True)


class ScoreRow(Base):
    __tablename__ = "scores"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, index=True)
    username: Mapped[str] = mapped_column(String)
    mode: Mapped[str] = mapped_column(String, index=True)
    score: Mapped[int] = mapped_column(Integer, index=True)
    created_at: Mapped[int] = mapped_column(BigInteger)


class GameRow(Base):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    # one active game per user
    user_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    username: Mapped[str] = mapped_column(String)
    mode: Mapped[str] = mapped_column(String)
    score: Mapped[int] = mapped_column(Integer)
    state_json: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[int] = mapped_column(BigInteger)
