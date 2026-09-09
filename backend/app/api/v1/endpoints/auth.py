from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.errors import PoshanCareException
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth import (
    authenticate_user,
    create_user_refresh_session,
    register_new_user,
    revoke_refresh_token_session,
    rotate_refresh_token_session,
)

router = APIRouter(prefix="/auth", tags=["Authentication & User Identity"])


def set_auth_cookies(
    response: Response, access_token: str, refresh_token: str
) -> None:
    """Utility to set HttpOnly, Secure, SameSite access and refresh token cookies."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/api/v1/auth",
    )


def clear_auth_cookies(response: Response) -> None:
    """Utility to explicitly clear access and refresh token cookies."""
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth",
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user account",
)
async def register(
    request: Request,
    response: Response,
    user_in: UserRegister,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Register a new PoshanCare user, initialize session, and set HttpOnly auth cookies."""
    user = await register_new_user(db, user_in)
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    access_token, refresh_token = await create_user_refresh_session(
        db, user.id, user_agent, ip_address
    )
    set_auth_cookies(response, access_token, refresh_token)

    return AuthResponse(
        status="success",
        message="Account registered successfully.",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate existing user",
)
async def login(
    request: Request,
    response: Response,
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Authenticate user credentials, start a refresh session, and issue HttpOnly auth cookies."""
    user = await authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise PoshanCareException(
            message="Invalid email or password credentials.",
            code="INVALID_CREDENTIALS",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    access_token, refresh_token = await create_user_refresh_session(
        db, user.id, user_agent, ip_address
    )
    set_auth_cookies(response, access_token, refresh_token)

    return AuthResponse(
        status="success",
        message="Logged in successfully.",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/refresh",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate refresh token & renew access token",
)
async def refresh_session(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Validate refresh token cookie, perform rotation, and return updated user session."""
    raw_refresh_token = request.cookies.get("refresh_token")
    if not raw_refresh_token:
        raise PoshanCareException(
            message="Refresh token cookie missing.",
            code="MISSING_REFRESH_TOKEN",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    user, new_access_token, new_refresh_token = await rotate_refresh_token_session(
        db, raw_refresh_token, user_agent, ip_address
    )
    set_auth_cookies(response, new_access_token, new_refresh_token)

    return AuthResponse(
        status="success",
        message="Session refreshed successfully.",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Log out & invalidate refresh session",
)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Revoke server-side session record and clear HttpOnly auth cookies."""
    raw_refresh_token = request.cookies.get("refresh_token")
    if raw_refresh_token:
        await revoke_refresh_token_session(db, raw_refresh_token)

    clear_auth_cookies(response)
    return {"status": "success", "message": "Logged out successfully."}


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated current user profile",
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return sanitized profile for the currently authenticated user."""
    return UserResponse.model_validate(current_user)
