"""Data store backed by a SQL database via SQLAlchemy.

Keeps the same method surface the routers and auth already use, but reads and
writes a real database instead of process memory, so data survives restarts.
Each method manages its own short-lived session. The database itself is chosen
by DATABASE_URL (see config.py), so this same code runs on SQLite or Postgres.
"""

import secrets
import time
from dataclasses import dataclass

from sqlalchemy import delete, func, select

from .database import SessionLocal
from .db_models import GameRow, ScoreRow, TokenRow, UserRow
from .models import ActiveGame, GameState, Mode, ScoreEntry, User

# Active games idle longer than this are treated as gone (matches the frontend).
ACTIVE_GAME_TTL_MS = 30_000


def now_ms() -> int:
    return int(time.time() * 1000)


def new_id() -> str:
    return secrets.token_hex(8)


@dataclass
class StoredUser:
    """Plain value object handed back to callers (detached from the session)."""

    id: str
    username: str
    password_hash: str
    salt: str

    def public(self) -> User:
        return User(id=self.id, username=self.username)


def _to_stored(row: UserRow | None) -> StoredUser | None:
    if row is None:
        return None
    return StoredUser(
        id=row.id, username=row.username, password_hash=row.password_hash, salt=row.salt
    )


def _to_score(row: ScoreRow) -> ScoreEntry:
    return ScoreEntry(
        id=row.id,
        userId=row.user_id,
        username=row.username,
        mode=row.mode,  # type: ignore[arg-type]
        score=row.score,
        createdAt=row.created_at,
    )


def _to_active_game(row: GameRow) -> ActiveGame:
    return ActiveGame(
        id=row.id,
        userId=row.user_id,
        username=row.username,
        mode=row.mode,  # type: ignore[arg-type]
        score=row.score,
        state=GameState.model_validate_json(row.state_json),
        updatedAt=row.updated_at,
    )


class Store:
    # ---- test / maintenance helpers ----

    def reset(self) -> None:
        """Delete all rows (used by tests for isolation)."""
        with SessionLocal() as s:
            for model in (TokenRow, ScoreRow, GameRow, UserRow):
                s.execute(delete(model))
            s.commit()

    def is_empty(self) -> bool:
        with SessionLocal() as s:
            return s.execute(select(UserRow.id).limit(1)).first() is None

    # ---- users ----

    def user_by_username(self, username: str) -> StoredUser | None:
        target = username.strip().lower()
        with SessionLocal() as s:
            row = s.execute(
                select(UserRow).where(func.lower(UserRow.username) == target)
            ).scalar_one_or_none()
            return _to_stored(row)

    def user_by_id(self, user_id: str) -> StoredUser | None:
        with SessionLocal() as s:
            return _to_stored(s.get(UserRow, user_id))

    def add_user(self, username: str, password_hash: str, salt: str) -> StoredUser:
        user_id = new_id()
        clean = username.strip()
        with SessionLocal() as s:
            s.add(
                UserRow(
                    id=user_id,
                    username=clean,
                    password_hash=password_hash,
                    salt=salt,
                )
            )
            s.commit()
        return StoredUser(id=user_id, username=clean, password_hash=password_hash, salt=salt)

    # ---- tokens ----

    def issue_token(self, user_id: str) -> str:
        token = secrets.token_urlsafe(24)
        with SessionLocal() as s:
            s.add(TokenRow(token=token, user_id=user_id))
            s.commit()
        return token

    def user_for_token(self, token: str) -> StoredUser | None:
        with SessionLocal() as s:
            tok = s.get(TokenRow, token)
            if tok is None:
                return None
            return _to_stored(s.get(UserRow, tok.user_id))

    def revoke_token(self, token: str) -> None:
        with SessionLocal() as s:
            tok = s.get(TokenRow, token)
            if tok is not None:
                s.delete(tok)
                s.commit()

    # ---- scores ----

    def add_score(self, user: StoredUser, mode: Mode, score: int) -> ScoreEntry:
        entry_id = new_id()
        created = now_ms()
        with SessionLocal() as s:
            s.add(
                ScoreRow(
                    id=entry_id,
                    user_id=user.id,
                    username=user.username,
                    mode=mode,
                    score=score,
                    created_at=created,
                )
            )
            s.commit()
        return ScoreEntry(
            id=entry_id,
            userId=user.id,
            username=user.username,
            mode=mode,
            score=score,
            createdAt=created,
        )

    def leaderboard(self, mode: Mode, limit: int = 10) -> list[ScoreEntry]:
        with SessionLocal() as s:
            rows = (
                s.execute(
                    select(ScoreRow)
                    .where(ScoreRow.mode == mode)
                    .order_by(ScoreRow.score.desc())
                    .limit(limit)
                )
                .scalars()
                .all()
            )
            return [_to_score(r) for r in rows]

    # ---- active games ----

    def _prune(self, session) -> None:
        cutoff = now_ms() - ACTIVE_GAME_TTL_MS
        session.execute(delete(GameRow).where(GameRow.updated_at < cutoff))
        session.commit()

    def upsert_game(
        self, user: StoredUser, mode: Mode, score: int, state: GameState
    ) -> ActiveGame:
        ts = now_ms()
        state_json = state.model_dump_json()
        with SessionLocal() as s:
            self._prune(s)
            row = s.execute(
                select(GameRow).where(GameRow.user_id == user.id)
            ).scalar_one_or_none()
            if row is None:
                game_id = new_id()
                s.add(
                    GameRow(
                        id=game_id,
                        user_id=user.id,
                        username=user.username,
                        mode=mode,
                        score=score,
                        state_json=state_json,
                        updated_at=ts,
                    )
                )
            else:
                game_id = row.id
                row.mode = mode
                row.score = score
                row.state_json = state_json
                row.updated_at = ts
            s.commit()
        return ActiveGame(
            id=game_id,
            userId=user.id,
            username=user.username,
            mode=mode,
            score=score,
            state=state,
            updatedAt=ts,
        )

    def active_games(self) -> list[ActiveGame]:
        with SessionLocal() as s:
            self._prune(s)
            rows = (
                s.execute(select(GameRow).order_by(GameRow.updated_at.desc()))
                .scalars()
                .all()
            )
            return [_to_active_game(r) for r in rows]

    def get_game(self, game_id: str) -> ActiveGame | None:
        with SessionLocal() as s:
            self._prune(s)
            row = s.get(GameRow, game_id)
            return _to_active_game(row) if row else None

    def remove_game(self, game_id: str) -> bool:
        with SessionLocal() as s:
            row = s.get(GameRow, game_id)
            if row is None:
                return False
            s.delete(row)
            s.commit()
            return True

    def add_game_raw(self, game: ActiveGame) -> None:
        """Insert a fully-formed game (used for seeding demo data)."""
        with SessionLocal() as s:
            s.add(
                GameRow(
                    id=game.id,
                    user_id=game.userId,
                    username=game.username,
                    mode=game.mode,
                    score=game.score,
                    state_json=game.state.model_dump_json(),
                    updated_at=game.updatedAt,
                )
            )
            s.commit()


# Single shared instance used across the app.
store = Store()
