"""In-memory data store.

No database yet: everything lives in process memory and disappears on restart.
This lets us wire the frontend and backend together first; a real database
arrives in a later step.
"""

import secrets
import time
from dataclasses import dataclass

from .models import ActiveGame, GameState, Mode, ScoreEntry, User

# Active games idle longer than this are treated as gone (matches the frontend).
ACTIVE_GAME_TTL_MS = 30_000


def now_ms() -> int:
    return int(time.time() * 1000)


def new_id() -> str:
    return secrets.token_hex(8)


@dataclass
class StoredUser:
    id: str
    username: str
    password_hash: str
    salt: str

    def public(self) -> User:
        return User(id=self.id, username=self.username)


class Store:
    def __init__(self) -> None:
        self._users: dict[str, StoredUser] = {}  # id -> StoredUser
        self._tokens: dict[str, str] = {}  # token -> user id
        self._scores: list[ScoreEntry] = []
        self._games: dict[str, ActiveGame] = {}  # game id -> ActiveGame

    def reset(self) -> None:
        """Clear everything (used by tests for isolation)."""
        self._users.clear()
        self._tokens.clear()
        self._scores.clear()
        self._games.clear()

    # ---- users ----

    def user_by_username(self, username: str) -> StoredUser | None:
        username = username.strip().lower()
        for u in self._users.values():
            if u.username.lower() == username:
                return u
        return None

    def user_by_id(self, user_id: str) -> StoredUser | None:
        return self._users.get(user_id)

    def add_user(self, username: str, password_hash: str, salt: str) -> StoredUser:
        user = StoredUser(
            id=new_id(),
            username=username.strip(),
            password_hash=password_hash,
            salt=salt,
        )
        self._users[user.id] = user
        return user

    # ---- tokens ----

    def issue_token(self, user_id: str) -> str:
        token = secrets.token_urlsafe(24)
        self._tokens[token] = user_id
        return token

    def user_for_token(self, token: str) -> StoredUser | None:
        user_id = self._tokens.get(token)
        return self._users.get(user_id) if user_id else None

    def revoke_token(self, token: str) -> None:
        self._tokens.pop(token, None)

    # ---- scores ----

    def add_score(self, user: StoredUser, mode: Mode, score: int) -> ScoreEntry:
        entry = ScoreEntry(
            id=new_id(),
            userId=user.id,
            username=user.username,
            mode=mode,
            score=score,
            createdAt=now_ms(),
        )
        self._scores.append(entry)
        return entry

    def leaderboard(self, mode: Mode, limit: int = 10) -> list[ScoreEntry]:
        entries = [s for s in self._scores if s.mode == mode]
        entries.sort(key=lambda s: s.score, reverse=True)
        return entries[:limit]

    # ---- active games ----

    def _prune_games(self) -> None:
        cutoff = now_ms() - ACTIVE_GAME_TTL_MS
        stale = [gid for gid, g in self._games.items() if g.updatedAt < cutoff]
        for gid in stale:
            del self._games[gid]

    def upsert_game(
        self, user: StoredUser, mode: Mode, score: int, state: GameState
    ) -> ActiveGame:
        """Publish or update the caller's active game (one per user)."""
        existing = next(
            (g for g in self._games.values() if g.userId == user.id), None
        )
        game = ActiveGame(
            id=existing.id if existing else new_id(),
            userId=user.id,
            username=user.username,
            mode=mode,
            score=score,
            state=state,
            updatedAt=now_ms(),
        )
        self._games[game.id] = game
        self._prune_games()
        return game

    def active_games(self) -> list[ActiveGame]:
        self._prune_games()
        return sorted(self._games.values(), key=lambda g: g.updatedAt, reverse=True)

    def get_game(self, game_id: str) -> ActiveGame | None:
        self._prune_games()
        return self._games.get(game_id)

    def remove_game(self, game_id: str) -> bool:
        return self._games.pop(game_id, None) is not None

    def add_game_raw(self, game: ActiveGame) -> None:
        """Insert a fully-formed game (used for seeding demo data)."""
        self._games[game.id] = game


# Single shared instance used across the app.
store = Store()
