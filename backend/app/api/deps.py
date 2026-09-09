from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import PoshanCareException
from app.core.security import decode_jwt_token
from app.db.session import get_db
from app.models.user import User
from app.services.auth import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login", auto_error=False
)


async def get_current_user(
    request: Request,
    header_token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency extracting and validating current authenticated user from cookie or bearer header."""
    # 1. Try reading access_token from HttpOnly cookie
    token = request.cookies.get("access_token") or header_token

    if not token:
        raise PoshanCareException(
            message="Authentication credentials were not provided.",
            code="UNAUTHENTICATED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    payload = decode_jwt_token(token)
    if not payload or payload.get("type") != "access":
        raise PoshanCareException(
            message="Could not validate authentication credentials or token expired.",
            code="INVALID_TOKEN",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise PoshanCareException(
            message="Invalid token claims.",
            code="INVALID_TOKEN",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise PoshanCareException(
            message="Invalid user identifier format.",
            code="INVALID_TOKEN",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    user = await get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise PoshanCareException(
            message="User account does not exist or has been disabled.",
            code="USER_INACTIVE",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    return user


async def get_optional_current_user(
    request: Request,
    header_token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Dependency returning current authenticated user if logged in, or None if unauthenticated."""
    try:
        return await get_current_user(request=request, header_token=header_token, db=db)
    except Exception:
        return None
