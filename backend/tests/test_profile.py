import pytest
from httpx import AsyncClient


async def create_auth_user(client: AsyncClient, email: str, name: str) -> dict:
    """Helper to register user and return auth cookies."""
    payload = {
        "email": email,
        "password": "SecurePassword123!",
        "full_name": name,
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return response.cookies


@pytest.mark.asyncio
async def test_get_or_create_profile(client: AsyncClient):
    """Test authenticated user gets or initializes profile automatically."""
    cookies = await create_auth_user(client, "profile.test1@example.com", "User One")
    response = await client.get("/api/v1/profile", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["onboarding_completed"] is False
    assert data["onboarding_step"] == 0
    assert "user_id" in data


@pytest.mark.asyncio
async def test_onboarding_status_endpoint(client: AsyncClient):
    """Test GET /api/v1/profile/onboarding/status returns status, step, and next_step."""
    cookies = await create_auth_user(client, "status.test@example.com", "Status User")

    status_res = await client.get("/api/v1/profile/onboarding/status", cookies=cookies)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["onboarding_completed"] is False
    assert status_data["onboarding_step"] == 0
    assert status_data["next_step"] == "/onboarding"
    assert status_data["is_ready_to_complete"] is False


@pytest.mark.asyncio
async def test_unauthenticated_profile_access(client: AsyncClient):
    """Test unauthenticated profile access returns 401 Unauthorized."""
    response = await client.get("/api/v1/profile")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_partial_update_profile(client: AsyncClient):
    """Test PATCH /api/v1/profile allows progressive step updating (0 -> 1 -> 2)."""
    cookies = await create_auth_user(client, "profile.test2@example.com", "User Two")

    # Step 1: Update Profile Identity
    step1_payload = {"age": 28, "biological_sex": "male", "onboarding_step": 1}
    patch1 = await client.patch("/api/v1/profile", json=step1_payload, cookies=cookies)
    assert patch1.status_code == 200
    data1 = patch1.json()
    assert data1["age"] == 28
    assert data1["biological_sex"] == "male"
    assert data1["onboarding_step"] == 1

    # Check status endpoint next_step
    status_res = await client.get("/api/v1/profile/onboarding/status", cookies=cookies)
    assert status_res.json()["next_step"] == "/onboarding/profile"

    # Step 2: Update Body Metrics (Canonical Metric units)
    step2_payload = {
        "unit_system": "metric",
        "height_cm": 178.5,
        "weight_kg": 75.0,
        "target_mass_kg": 72.0,
        "onboarding_step": 2,
    }
    patch2 = await client.patch("/api/v1/profile", json=step2_payload, cookies=cookies)
    assert patch2.status_code == 200
    data2 = patch2.json()
    assert data2["height_cm"] == 178.5
    assert data2["weight_kg"] == 75.0
    assert data2["age"] == 28  # Preserves previously saved Step 1 fields
    assert data2["onboarding_step"] == 2


@pytest.mark.asyncio
async def test_invalid_age_boundary(client: AsyncClient):
    """Test updating age to invalid boundary (>120 or <1) returns 422."""
    cookies = await create_auth_user(client, "invalid.age@example.com", "Age Test")
    patch = await client.patch(
        "/api/v1/profile", json={"age": 150}, cookies=cookies
    )
    assert patch.status_code == 422


@pytest.mark.asyncio
async def test_invalid_height_boundary(client: AsyncClient):
    """Test updating height_cm out of range returns 422."""
    cookies = await create_auth_user(client, "invalid.height@example.com", "Height Test")
    patch = await client.patch(
        "/api/v1/profile", json={"height_cm": 10.0}, cookies=cookies
    )
    assert patch.status_code == 422


@pytest.mark.asyncio
async def test_invalid_weight_boundary(client: AsyncClient):
    """Test updating weight_kg out of range returns 422."""
    cookies = await create_auth_user(client, "invalid.weight@example.com", "Weight Test")
    patch = await client.patch(
        "/api/v1/profile", json={"weight_kg": 500.0}, cookies=cookies
    )
    assert patch.status_code == 422


@pytest.mark.asyncio
async def test_invalid_enum_fields(client: AsyncClient):
    """Test updating invalid goal or activity level enums returns 422."""
    cookies = await create_auth_user(client, "invalid.enum@example.com", "Enum Test")
    patch1 = await client.patch(
        "/api/v1/profile", json={"primary_goal": "invalid_goal"}, cookies=cookies
    )
    assert patch1.status_code == 422

    patch2 = await client.patch(
        "/api/v1/profile",
        json={"activity_level": "Super Ultra Active"},
        cookies=cookies,
    )
    assert patch2.status_code == 422


@pytest.mark.asyncio
async def test_incomplete_onboarding_completion_rejected(client: AsyncClient):
    """Test POST /api/v1/profile/onboarding/complete fails if required fields are missing."""
    cookies = await create_auth_user(client, "incomplete@example.com", "Incomplete User")
    # Attempt complete with blank profile
    complete_res = await client.post("/api/v1/profile/onboarding/complete", cookies=cookies)
    assert complete_res.status_code == 400
    data = complete_res.json()
    assert data["error"]["code"] == "INCOMPLETE_ONBOARDING"


@pytest.mark.asyncio
async def test_full_onboarding_completion_success(client: AsyncClient):
    """Test completing onboarding after supplying all required profile parameters."""
    cookies = await create_auth_user(client, "complete.user@example.com", "Complete User")

    full_payload = {
        "age": 30,
        "biological_sex": "female",
        "unit_system": "metric",
        "height_cm": 165.0,
        "weight_kg": 60.0,
        "target_mass_kg": 58.0,
        "primary_goal": "maintain",
        "progression_pace": "gradual",
        "activity_level": "Moderately Active",
        "daily_steps": 8500,
        "onboarding_step": 5,
    }
    patch_res = await client.patch("/api/v1/profile", json=full_payload, cookies=cookies)
    assert patch_res.status_code == 200

    # Call onboarding complete
    complete_res = await client.post("/api/v1/profile/onboarding/complete", cookies=cookies)
    assert complete_res.status_code == 200
    data = complete_res.json()
    assert data["onboarding_completed"] is True
    assert data["onboarding_step"] == 6

    # Verify status endpoint returns completed & /app route
    status_res = await client.get("/api/v1/profile/onboarding/status", cookies=cookies)
    assert status_res.json()["next_step"] == "/app"


@pytest.mark.asyncio
async def test_user_ownership_isolation(client: AsyncClient):
    """Test User A's profile updates do not impact User B's profile."""
    cookies_a = await create_auth_user(client, "usera@example.com", "User A")
    cookies_b = await create_auth_user(client, "userb@example.com", "User B")

    # Update User A
    await client.patch("/api/v1/profile", json={"age": 25}, cookies=cookies_a)

    # Update User B
    await client.patch("/api/v1/profile", json={"age": 45}, cookies=cookies_b)

    # Check User A
    res_a = await client.get("/api/v1/profile", cookies=cookies_a)
    assert res_a.json()["age"] == 25

    # Check User B
    res_b = await client.get("/api/v1/profile", cookies=cookies_b)
    assert res_b.json()["age"] == 45
