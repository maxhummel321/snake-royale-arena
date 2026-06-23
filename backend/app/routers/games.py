"""Active game endpoints: list, publish/update, fetch one, end."""

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..auth import get_current_user
from ..models import ActiveGame, PublishGameRequest, User
from ..store import store

router = APIRouter(prefix="/games", tags=["games"])


@router.get("/active", response_model=list[ActiveGame])
def list_active_games() -> list[ActiveGame]:
    return store.active_games()


@router.post("", response_model=ActiveGame, status_code=status.HTTP_201_CREATED)
def publish_game(
    body: PublishGameRequest, user: User = Depends(get_current_user)
) -> ActiveGame:
    stored = store.user_by_id(user.id)
    assert stored is not None
    return store.upsert_game(stored, body.mode, body.score, body.state)


@router.get("/{game_id}", response_model=ActiveGame)
def get_game(game_id: str) -> ActiveGame:
    game = store.get_game(game_id)
    if game is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Game not found"
        )
    return game


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def end_game(game_id: str, user: User = Depends(get_current_user)) -> Response:
    if not store.remove_game(game_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Game not found"
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
