"""Pydantic models mirroring the schemas in openapi.yaml.

Response field names use camelCase (userId, createdAt, updatedAt) to match
exactly what the frontend expects, so the JSON the backend returns lines up
with the TypeScript types in frontend/src/services/types.ts.
"""

from typing import Literal

from pydantic import BaseModel, Field

Mode = Literal["walls", "wrap"]
Direction = Literal["up", "down", "left", "right"]


class Cell(BaseModel):
    x: int
    y: int


class GameState(BaseModel):
    snake: list[Cell]
    direction: Direction
    food: Cell
    score: int
    mode: Mode
    alive: bool
    tick: int


class User(BaseModel):
    id: str
    username: str


class AuthResult(BaseModel):
    user: User
    token: str


class ScoreEntry(BaseModel):
    id: str
    userId: str
    username: str
    mode: Mode
    score: int
    createdAt: int  # epoch milliseconds


class ActiveGame(BaseModel):
    id: str
    userId: str
    username: str
    mode: Mode
    score: int
    state: GameState
    updatedAt: int  # epoch milliseconds


# ---- request bodies ----


class CredentialsRequest(BaseModel):
    username: str = Field(min_length=2)
    password: str = Field(min_length=4)


class SubmitScoreRequest(BaseModel):
    mode: Mode
    score: int = Field(ge=0)


class PublishGameRequest(BaseModel):
    mode: Mode
    score: int
    state: GameState


class Error(BaseModel):
    detail: str
