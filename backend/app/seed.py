"""Seed the in-memory store with a few fake users, scores, and active games.

Gives the frontend something to show on first load. Safe to call once at
startup; it no-ops if data already exists.
"""

from .auth import hash_password
from .models import ActiveGame, Cell, GameState, Mode
from .store import StoredUser, new_id, now_ms, store

# Demo accounts (username -> password). Handy for trying login in the docs.
DEMO_USERS = {
    "alice": "password",
    "bob": "password",
    "carol": "password",
}


def _initial_state(mode: Mode, score: int = 0) -> GameState:
    mid = 10
    snake = [Cell(x=mid, y=mid), Cell(x=mid - 1, y=mid), Cell(x=mid - 2, y=mid)]
    return GameState(
        snake=snake,
        direction="right",
        food=Cell(x=5, y=5),
        score=score,
        mode=mode,
        alive=True,
        tick=0,
    )


def seed_demo_data() -> None:
    if store._users:  # already seeded
        return

    users: dict[str, StoredUser] = {}
    for username, password in DEMO_USERS.items():
        password_hash, salt = hash_password(password)
        users[username] = store.add_user(username, password_hash, salt)

    # A spread of scores across both modes.
    seed_scores = [
        ("alice", "walls", 120),
        ("alice", "wrap", 80),
        ("bob", "walls", 90),
        ("bob", "wrap", 150),
        ("carol", "walls", 60),
        ("carol", "wrap", 200),
    ]
    for username, mode, score in seed_scores:
        store.add_score(users[username], mode, score)  # type: ignore[arg-type]

    # A couple of in-progress games to spectate.
    alice, bob = users["alice"], users["bob"]
    store.add_game_raw(
        ActiveGame(
            id=new_id(),
            userId=alice.id,
            username=alice.username,
            mode="walls",
            score=30,
            state=_initial_state("walls", 30),
            updatedAt=now_ms(),
        )
    )
    store.add_game_raw(
        ActiveGame(
            id=new_id(),
            userId=bob.id,
            username=bob.username,
            mode="wrap",
            score=50,
            state=_initial_state("wrap", 50),
            updatedAt=now_ms(),
        )
    )
