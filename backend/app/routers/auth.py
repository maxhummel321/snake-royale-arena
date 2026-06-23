"""Auth endpoints: signup, login, logout, me."""

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..auth import get_current_token, get_current_user, hash_password, verify_password
from ..models import AuthResult, CredentialsRequest, User
from ..store import store

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResult, status_code=status.HTTP_201_CREATED)
def signup(body: CredentialsRequest) -> AuthResult:
    if store.user_by_username(body.username) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username already taken"
        )
    password_hash, salt = hash_password(body.password)
    user = store.add_user(body.username, password_hash, salt)
    token = store.issue_token(user.id)
    return AuthResult(user=user.public(), token=token)


@router.post("/login", response_model=AuthResult)
def login(body: CredentialsRequest) -> AuthResult:
    stored = store.user_by_username(body.username)
    if stored is None or not verify_password(
        body.password, stored.password_hash, stored.salt
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    token = store.issue_token(stored.id)
    return AuthResult(user=stored.public(), token=token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(token: str = Depends(get_current_token)) -> Response:
    store.revoke_token(token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=User)
def me(user: User = Depends(get_current_user)) -> User:
    return user
