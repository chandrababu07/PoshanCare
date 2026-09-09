import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import PoshanCareException
from app.core.logging import logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_jwt_token,
    get_password_hash,
    verify_password,
)
from app.models.session import UserSession
from app.models.user import User
from app.schemas.auth import UserRegister


def hash_token_id(token_id: str) -> str:
    """Hash token ID for secure database session tracking."""
    return hashlib.sha256(token_id.encode("utf-8")).hexdigest()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Retrieve user record by email address."""
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """Retrieve active user record by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def register_new_user(db: AsyncSession, user_in: UserRegister) -> User:
    """Register a new user account if email is available."""
    existing = await get_user_by_email(db, user_in.email)
    if existing:
        raise PoshanCareException(
            message="An account with this email address is already registered.",
            code="EMAIL_EXISTS",
            status_code=400,
        )

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        email=user_in.email.lower(),
        password_hash=hashed_pw,
        full_name=user_in.full_name,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info(f"New user registered: id={user.id}")
    return user


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> Optional[User]:
    """Authenticate user credentials."""
    user = await get_user_by_email(db, email)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def create_user_refresh_session(
    db: AsyncSession,
    user_id: int,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Tuple[str, str]:
    """Create a server-tracked refresh token session and return (access_token, raw_refresh_token)."""
    user = await get_user_by_id(db, user_id)
    if not user:
        raise PoshanCareException(
            message="User profile not found.",
            code="USER_NOT_FOUND",
            status_code=404,
        )

    token_id = str(uuid.uuid4())
    token_hash = hash_token_id(token_id)
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    session_record = UserSession(
        user_id=user.id,
        refresh_token_hash=token_hash,
        user_agent=user_agent[:500] if user_agent else None,
        ip_address=ip_address[:100] if ip_address else None,
        is_revoked=False,
        expires_at=expires_at,
    )
    db.add(session_record)
    await db.commit()

    access_token = create_access_token(subject=user.id, email=user.email)
    raw_refresh_token = create_refresh_token(subject=user.id, token_id=token_id)
    return access_token, raw_refresh_token


async def rotate_refresh_token_session(
    db: AsyncSession,
    raw_refresh_token: str,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Tuple[User, str, str]:
    """Validate old refresh token, revoke session, and issue rotated credentials."""
    payload = decode_jwt_token(raw_refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise PoshanCareException(
            message="Invalid or expired refresh token.",
            code="INVALID_REFRESH_TOKEN",
            status_code=401,
        )

    user_id = int(payload.get("sub", 0))
    token_id = payload.get("jti")
    if not user_id or not token_id:
        raise PoshanCareException(
            message="Malformed refresh token claims.",
            code="INVALID_REFRESH_TOKEN",
            status_code=401,
        )

    token_hash = hash_token_id(token_id)
    result = await db.execute(
        select(UserSession).where(UserSession.refresh_token_hash == token_hash)
    )
    session_record = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if (
        not session_record
        or session_record.is_revoked
        or session_record.expires_at.replace(tzinfo=timezone.utc) < now
    ):
        raise PoshanCareException(
            message="Session has expired or been revoked.",
            code="SESSION_REVOKED",
            status_code=401,
        )

    # Revoke old session (Rotation)
    session_record.is_revoked = True
    await db.commit()

    # Issue new session & tokens
    user = await get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise PoshanCareException(
            message="User account is inactive or disabled.",
            code="USER_INACTIVE",
            status_code=401,
        )

    new_access_token, new_refresh_token = await create_user_refresh_session(
        db, user.id, user_agent, ip_address
    )
    return user, new_access_token, new_refresh_token


async def revoke_refresh_token_session(
    db: AsyncSession, raw_refresh_token: str
) -> None:
    """Revoke a specific refresh token session in the database."""
    payload = decode_jwt_token(raw_refresh_token)
    if not payload or payload.get("type") != "refresh":
        return

    token_id = payload.get("jti")
    if token_id:
        token_hash = hash_token_id(token_id)
        result = await db.execute(
            select(UserSession).where(UserSession.refresh_token_hash == token_hash)
        )
        session_record = result.scalar_one_or_none()
        if session_record:
            session_record.is_revoked = True
            await db.commit()


async def get_user_by_google_sub(db: AsyncSession, google_sub: str) -> Optional[User]:
    """Retrieve user record by Google subject ID (sub)."""
    result = await db.execute(select(User).where(User.google_sub == google_sub))
    return result.scalar_one_or_none()


async def authenticate_or_create_google_user(
    db: AsyncSession,
    google_sub: str,
    email: str,
    full_name: str,
) -> User:
    """Authenticate user with Google credentials.

    1. If user matches google_sub -> return user.
    2. If user matches email -> link google_sub to user, update auth_provider to 'hybrid', mark is_verified=True.
    3. If user doesn't exist -> create new user with google_sub, auth_provider='google', is_verified=True.
    """
    # 1. Check by google_sub
    user = await get_user_by_google_sub(db, google_sub)
    if user:
        if not user.is_active:
            raise PoshanCareException(
                message="User account is inactive or disabled.",
                code="USER_INACTIVE",
                status_code=401,
            )
        if full_name and (not user.full_name or user.full_name == "User"):
            user.full_name = full_name
            await db.commit()
            await db.refresh(user)
        return user

    # 2. Check by email for account linking
    user = await get_user_by_email(db, email)
    if user:
        if not user.is_active:
            raise PoshanCareException(
                message="User account is inactive or disabled.",
                code="USER_INACTIVE",
                status_code=401,
            )
        user.google_sub = google_sub
        user.is_verified = True
        if user.auth_provider == "email":
            user.auth_provider = "hybrid"
        await db.commit()
        await db.refresh(user)
        logger.info(f"Linked Google account {google_sub} to existing email {email} (id={user.id})")
        return user

    # 3. Create new user for Google login
    display_name = full_name.strip() if full_name and full_name.strip() else email.split("@")[0].capitalize()
    user = User(
        email=email.lower(),
        google_sub=google_sub,
        full_name=display_name,
        password_hash=None,
        is_active=True,
        is_verified=True,
        auth_provider="google",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info(f"Created new Google OAuth user account: id={user.id}, email={user.email}")
    return user

