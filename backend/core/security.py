"""
core/security.py
----------------
JWT creation/verification and password hashing.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from core.config import settings

# ── Password hashing ───────────────────────────────────────────────────────────
_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_ctx.verify(plain, hashed)


# ── JWT ────────────────────────────────────────────────────────────────────────
_bearer = HTTPBearer()


def create_access_token(customer_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": customer_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """FastAPI dependency — returns {'customer_id': ..., 'email': ...}."""
    payload = _decode_token(credentials.credentials)
    customer_id: Optional[str] = payload.get("sub")
    email: Optional[str] = payload.get("email")
    if not customer_id:
        raise HTTPException(status_code=401, detail="Token missing subject")
    return {"customer_id": customer_id, "email": email}
