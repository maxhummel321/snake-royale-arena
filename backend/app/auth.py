"""Authentication: password hashing and bearer-token verification.

Passwords are hashed with PBKDF2-HMAC-SHA256 (Python standard library, no extra
dependency) using a per-user random salt. Tokens are opaque random strings
issued on signup/login and looked up in the in-memory store.
"""

import hashlib
import hmac
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .models import User
from .store import StoredUser, store

_PBKDF2_ROUNDS = 200_000


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    """Return (hash_hex, salt_hex). Generates a salt if none is given."""
    if salt is None:
        salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt), _PBKDF2_ROUNDS
    )
    return digest.hex(), salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    candidate, _ = hash_password(password, salt)
    # constant-time comparison
    return hmac.compare_digest(candidate, password_hash)


# HTTPBearer makes the "Authorize" button appear in the FastAPI docs and
# advertises the bearerAuth security scheme in the generated OpenAPI.
_bearer = HTTPBearer(auto_error=False)

_UNAUTHENTICATED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> User:
    """FastAPI dependency: resolve the bearer token to the current user."""
    if creds is None or not creds.credentials:
        raise _UNAUTHENTICATED
    stored: StoredUser | None = store.user_for_token(creds.credentials)
    if stored is None:
        raise _UNAUTHENTICATED
    return stored.public()


def get_current_token(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    """FastAPI dependency: return the raw bearer token (used by logout)."""
    if creds is None or not creds.credentials:
        raise _UNAUTHENTICATED
    if store.user_for_token(creds.credentials) is None:
        raise _UNAUTHENTICATED
    return creds.credentials
