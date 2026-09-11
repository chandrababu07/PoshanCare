import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.models.food import Food
from app.models.user import User
from app.models.weight import WeightLog


@pytest.mark.asyncio
async def test_get_account_summary_authenticated(client: AsyncClient):
    """Test GET /api/v1/account/summary returns real metrics for authenticated user."""
    # Register & Login user
    reg_payload = {
        "email": "acc.summary@example.com",
        "password": "SecurePassword123!",
        "full_name": "Summary User",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    cookies = reg_res.cookies

    # Call summary
    response = await client.get("/api/v1/account/summary", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "acc.summary@example.com"
    assert data["full_name"] == "Summary User"
    assert "record_counts" in data
    assert data["record_counts"]["meals"] == 0
    assert data["record_counts"]["weight_logs"] == 0


@pytest.mark.asyncio
async def test_get_account_summary_unauthenticated(client: AsyncClient):
    """Test GET /api/v1/account/summary without cookies returns 401 Unauthorized."""
    response = await client.get("/api/v1/account/summary")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_export_data_authenticated_and_sanitized(client: AsyncClient):
    """Test GET /api/v1/account/export returns user health data without passwords or secrets."""
    reg_payload = {
        "email": "acc.export@example.com",
        "password": "SecurePassword123!",
        "full_name": "Export User",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    cookies = reg_res.cookies

    # Call export
    response = await client.get("/api/v1/account/export", cookies=cookies)
    assert response.status_code == 200
    assert "attachment; filename=" in response.headers.get("content-disposition", "")
    assert response.headers.get("content-type") == "application/json"

    export_json = response.json()
    assert export_json["user"]["email"] == "acc.export@example.com"
    assert export_json["user"]["full_name"] == "Export User"

    # Security Verification: Ensure NO passwords, hashes, tokens or infrastructure secrets exist
    raw_str = response.text.lower()
    assert "password_hash" not in export_json["user"]
    assert "secret" not in raw_str
    assert "jwt" not in raw_str
    assert "securepassword123!" not in raw_str


@pytest.mark.asyncio
async def test_export_user_isolation(client: AsyncClient, db_session):
    """Test User A export does NOT include User B's health records."""
    # User A
    res_a = await client.post(
        "/api/v1/auth/register",
        json={"email": "usera@example.com", "password": "SecurePassword123!", "full_name": "User A"},
    )
    cookies_a = res_a.cookies

    # User B
    res_b = await client.post(
        "/api/v1/auth/register",
        json={"email": "userb@example.com", "password": "SecurePassword123!", "full_name": "User B"},
    )
    cookies_b = res_b.cookies

    # Log weight for User B
    await client.post(
        "/api/v1/weight",
        json={"date": "2026-09-10T10:00:00Z", "weight_kg": 75.5, "note": "User B weight"},
        cookies=cookies_b,
    )

    # Export User A data
    export_a = await client.get("/api/v1/account/export", cookies=cookies_a)
    assert export_a.status_code == 200
    data_a = export_a.json()

    # User A weight logs must be empty, ignoring User B's record
    assert len(data_a["weight_logs"]) == 0


@pytest.mark.asyncio
async def test_account_deletion_unauthenticated(client: AsyncClient):
    """Test DELETE /api/v1/account without credentials returns 401 Unauthorized."""
    response = await client.delete("/api/v1/account")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_account_deletion_success_and_cascade(client: AsyncClient, db_session):
    """Test DELETE /api/v1/account deletes user data, invalidates session, and leaves global foods intact."""
    # 1. Create global system food item in database
    global_food = Food(
        name="Global System Apple",
        category="Fruits",
        region="India",
        serving_size_name="1 medium",
        serving_size_g=100.0,
        calories=52.0,
        protein_g=0.3,
        carbs_g=13.8,
        fat_g=0.2,
        user_id=None,  # Global system food
        source="system",
    )
    db_session.add(global_food)
    await db_session.commit()
    await db_session.refresh(global_food)
    global_food_id = global_food.id

    # 2. Register & Login Target User
    res_del = await client.post(
        "/api/v1/auth/register",
        json={"email": "to_delete@example.com", "password": "SecurePassword123!", "full_name": "Delete Me"},
    )
    cookies_del = res_del.cookies
    user_id = res_del.json()["user"]["id"]

    # 3. Add personal weight log & custom food for Target User
    await client.post(
        "/api/v1/weight",
        json={"date": "2026-09-10T12:00:00Z", "weight_kg": 68.0, "note": "To be deleted"},
        cookies=cookies_del,
    )

    custom_food_res = await client.post(
        "/api/v1/foods",
        json={
            "name": "Custom User Food",
            "category": "Home Made",
            "region": "South",
            "serving_size_name": "1 bowl",
            "serving_size_g": 150.0,
            "calories": 200.0,
            "protein_g": 5.0,
            "carbs_g": 30.0,
            "fat_g": 4.0,
        },
        cookies=cookies_del,
    )
    assert custom_food_res.status_code == 201

    # 4. Perform Account Deletion
    del_res = await client.delete("/api/v1/account", cookies=cookies_del)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # 5. Verify user record is deleted
    user_in_db = await db_session.get(User, user_id)
    assert user_in_db is None

    # 6. Verify user's weight logs are deleted
    w_res = await db_session.execute(select(WeightLog).where(WeightLog.user_id == user_id))
    assert len(w_res.scalars().all()) == 0

    # 7. Verify session is invalidated (GET /auth/me fails)
    me_res = await client.get("/api/v1/auth/me", cookies=cookies_del)
    assert me_res.status_code == 401

    # 8. VERIFY GLOBAL SYSTEM FOOD REMAINS INTACT
    global_food_check = await db_session.get(Food, global_food_id)
    assert global_food_check is not None
    assert global_food_check.name == "Global System Apple"


@pytest.mark.asyncio
async def test_child_teen_account_privacy_safety(client: AsyncClient):
    """Test child/teen persona profiles maintain safety and valid account summary."""
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "teen.user@example.com", "password": "SecurePassword123!", "full_name": "Teen User"},
    )
    cookies = res.cookies

    # Set profile to teen
    await client.patch(
        "/api/v1/profile",
        json={"profile_type": "teen", "age": 15},
        cookies=cookies,
    )

    summary_res = await client.get("/api/v1/account/summary", cookies=cookies)
    assert summary_res.status_code == 200
    assert summary_res.json()["profile_type"] == "teen"
