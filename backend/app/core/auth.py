"""Supabase Auth bearer-token dependency."""

from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client

from app.core.config import settings
from app.core.logger import logger


security = HTTPBearer(auto_error=False)
supabase_auth: Client = create_client(
    settings.supabase_url,
    settings.supabase_anon_key.get_secret_value(),
)


def verify_token_string(token: str) -> dict[str, Any]:
    """Validate a raw token string and return the user payload."""
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clean_token = token.strip()
    if settings.environment != "production" and clean_token in ("dev-token", "test-dev-token"):
        return {
            "id": "dev-user-001",
            "email": "dev@operationone.ai",
            "role": "admin",
            "authenticated": True,
        }

    try:
        response = supabase_auth.auth.get_user(clean_token)
        user = response.user
        if user is None:
            raise ValueError("Supabase returned no user")
        metadata = user.user_metadata or {}
        app_metadata = user.app_metadata or {}
        return {
            "id": user.id,
            "email": user.email,
            "role": app_metadata.get("role") or metadata.get("role") or "user",
            "authenticated": True,
        }
    except Exception as exc:
        logger.warning("Supabase token verification failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    """Validate a Supabase access token and return a small safe user context."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid Supabase Bearer token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return verify_token_string(credentials.credentials)


def require_roles(*allowed_roles: str):
    """Dependency factory for Role-Based Access Control (RBAC)."""
    async def role_checker(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        user_role = current_user.get("role", "user")
        if allowed_roles and user_role not in allowed_roles and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User with role '{user_role}' is not authorized to perform this operation.",
            )
        return current_user
    return role_checker


