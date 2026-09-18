from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.password_reset import PasswordResetToken
from app.models.session import UserSession
from app.models.user import User
from app.services.auth import get_user_by_email, hash_reset_token


@pytest.mark.asyncio
async def test_forgot_password_existing_user(client: AsyncClient, db_session):
    """Test forgot-password endpoint generates a hashed token in DB and returns generic 200 response."""
    # 1. Register test user
    reg_payload = {
        "email": "forgot.existing@poshancare.in",
        "password": "InitialPassword123!",
        "full_name": "Reset Test User",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201

    # 2. Request password reset
    forgot_res = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "forgot.existing@poshancare.in"},
    )
    assert forgot_res.status_code == 200
    data = forgot_res.json()
    assert data["status"] == "success"
    assert "instructions have been sent" in data["message"]

    # 3. Verify database has hashed token
    user = await get_user_by_email(db_session, "forgot.existing@poshancare.in")
    assert user is not None

    stmt = select(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
    result = await db_session.execute(stmt)
    tokens = result.scalars().all()
    assert len(tokens) == 1
    token_record = tokens[0]
    assert token_record.used_at is None
    expires_at = token_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    assert expires_at > datetime.now(timezone.utc)


@pytest.mark.asyncio
async def test_forgot_password_nonexistent_email_identical_response(client: AsyncClient):
    """Test forgot-password returns the identical generic response for nonexistent email (no enumeration)."""
    res = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "completely.nonexistent@poshancare.in"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert (
        data["message"]
        == "If an account exists for that email, password reset instructions have been sent."
    )


@pytest.mark.asyncio
async def test_raw_token_not_stored_in_database(client: AsyncClient, db_session):
    """Verify raw secret token is never stored in plaintext in the database."""
    reg_payload = {
        "email": "rawtoken.check@poshancare.in",
        "password": "InitialPassword123!",
        "full_name": "Raw Token User",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "rawtoken.check@poshancare.in"},
    )

    user = await get_user_by_email(db_session, "rawtoken.check@poshancare.in")
    stmt = select(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
    result = await db_session.execute(stmt)
    token_record = result.scalar_one()

    # The token_hash must be a 64-char hexadecimal string (SHA-256)
    assert len(token_record.token_hash) == 64
    assert all(c in "0123456789abcdef" for c in token_record.token_hash)


@pytest.mark.asyncio
async def test_reset_password_success_flow(client: AsyncClient, db_session):
    """Verify complete password reset flow: valid token updates password and allows login."""
    # 1. Register user
    email = "reset.success@poshancare.in"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "OldPassword123!", "full_name": "Reset Success"},
    )

    user = await get_user_by_email(db_session, email)

    # 2. Insert known reset token
    raw_token = "secure_production_test_token_1234567890abcdef"
    token_hash = hash_reset_token(raw_token)
    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(reset_record)
    await db_session.commit()

    # 3. Perform reset
    new_password = "BrandNewSecurePassword123!"
    reset_res = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_token, "new_password": new_password},
    )
    assert reset_res.status_code == 200
    assert reset_res.json()["status"] == "success"

    # 4. Old password must fail
    login_old = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "OldPassword123!"},
    )
    assert login_old.status_code == 401

    # 5. New password must succeed
    login_new = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": new_password},
    )
    assert login_new.status_code == 200
    assert "access_token" in login_new.cookies


@pytest.mark.asyncio
async def test_reset_password_invalid_token(client: AsyncClient):
    """Test reset password with non-existent token fails safely."""
    res = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "completely_invalid_random_token_string", "new_password": "NewSecurePass123!"},
    )
    assert res.status_code == 400
    data = res.json()
    assert data["error"]["code"] == "INVALID_RESET_TOKEN"


@pytest.mark.asyncio
async def test_reset_password_expired_token(client: AsyncClient, db_session):
    """Test reset password with expired token fails."""
    email = "expired.token@poshancare.in"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "OldPassword123!", "full_name": "Expired User"},
    )
    user = await get_user_by_email(db_session, email)

    raw_token = "expired_token_random_string_1234567890"
    token_hash = hash_reset_token(raw_token)
    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=5),  # Expired
        created_at=datetime.now(timezone.utc) - timedelta(minutes=35),
    )
    db_session.add(reset_record)
    await db_session.commit()

    res = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_token, "new_password": "NewSecurePass123!"},
    )
    assert res.status_code == 400
    data = res.json()
    assert data["error"]["code"] == "EXPIRED_RESET_TOKEN"


@pytest.mark.asyncio
async def test_reset_password_single_use_prevents_replay(client: AsyncClient, db_session):
    """Test that a reset token can only be used once."""
    email = "singleuse@poshancare.in"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "OldPassword123!", "full_name": "Single Use"},
    )
    user = await get_user_by_email(db_session, email)

    raw_token = "single_use_token_1234567890abcdef"
    token_hash = hash_reset_token(raw_token)
    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(reset_record)
    await db_session.commit()

    # First use succeeds
    res1 = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_token, "new_password": "NewPassword123!"},
    )
    assert res1.status_code == 200

    # Second use fails
    res2 = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_token, "new_password": "AnotherPassword123!"},
    )
    assert res2.status_code == 400
    assert res2.json()["error"]["code"] == "INVALID_RESET_TOKEN"


@pytest.mark.asyncio
async def test_reset_password_revokes_existing_sessions(client: AsyncClient, db_session):
    """Test that resetting a password invalidates all existing active user sessions."""
    email = "session.revocation@poshancare.in"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "OldPassword123!", "full_name": "Session User"},
    )
    old_cookies = reg_res.cookies

    user = await get_user_by_email(db_session, email)

    # Verify session is initially active
    stmt = select(UserSession).where(UserSession.user_id == user.id, UserSession.is_revoked.is_(False))
    active_sessions = (await db_session.execute(stmt)).scalars().all()
    assert len(active_sessions) >= 1

    # Issue reset token and execute reset
    raw_token = "session_revocation_token_test_12345"
    token_hash = hash_reset_token(raw_token)
    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(reset_record)
    await db_session.commit()

    await client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_token, "new_password": "NewPassword123!"},
    )

    # Refresh endpoint with old refresh token must be rejected
    refresh_res = await client.post("/api/v1/auth/refresh", cookies=old_cookies)
    assert refresh_res.status_code == 401
    assert refresh_res.json()["error"]["code"] == "SESSION_REVOKED"


@pytest.mark.asyncio
async def test_reset_password_weak_password_rejected(client: AsyncClient):
    """Test that password policy is enforced on reset password."""
    res = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "any_valid_length_token_12345678", "new_password": "weak"},
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_password_reset_user_isolation(client: AsyncClient, db_session):
    """Verify strict user isolation: User A's token cannot affect User B's account or sessions."""
    # Register User A and User B
    await client.post(
        "/api/v1/auth/register",
        json={"email": "user_a@poshancare.in", "password": "UserAPassword123!", "full_name": "User A"},
    )
    res_b = await client.post(
        "/api/v1/auth/register",
        json={"email": "user_b@poshancare.in", "password": "UserBPassword123!", "full_name": "User B"},
    )
    cookies_b = res_b.cookies

    user_a = await get_user_by_email(db_session, "user_a@poshancare.in")

    raw_token_a = "token_for_user_a_only_1234567890"
    token_hash_a = hash_reset_token(raw_token_a)
    reset_record = PasswordResetToken(
        user_id=user_a.id,
        token_hash=token_hash_a,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(reset_record)
    await db_session.commit()

    # Reset User A's password
    await client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_token_a, "new_password": "NewUserAPassword123!"},
    )

    # User B's password and session must remain completely intact
    login_b = await client.post(
        "/api/v1/auth/login",
        json={"email": "user_b@poshancare.in", "password": "UserBPassword123!"},
    )
    assert login_b.status_code == 200

    # User B's active session is NOT revoked
    refresh_b = await client.post("/api/v1/auth/refresh", cookies=cookies_b)
    assert refresh_b.status_code == 200
