"""Leaderboard endpoints: read top scores, submit a score."""

from fastapi import APIRouter, Depends, Query, status

from ..auth import get_current_user
from ..models import Mode, ScoreEntry, SubmitScoreRequest, User
from ..store import store

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[ScoreEntry])
def get_leaderboard(
    mode: Mode = Query(..., description="Game mode to filter by"),
    limit: int = Query(10, ge=1, description="Maximum number of entries"),
) -> list[ScoreEntry]:
    return store.leaderboard(mode, limit)


@router.post("", response_model=ScoreEntry, status_code=status.HTTP_201_CREATED)
def submit_score(
    body: SubmitScoreRequest, user: User = Depends(get_current_user)
) -> ScoreEntry:
    stored = store.user_by_id(user.id)
    assert stored is not None  # current user always exists
    return store.add_score(stored, body.mode, body.score)
