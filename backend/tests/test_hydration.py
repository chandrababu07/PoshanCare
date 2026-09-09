import pytest
from httpx import AsyncClient
from datetime import datetime, timezone


async def register_and_login(client: AsyncClient, email: str) -> dict:
    """Helper to register user, login, and return auth cookies."""
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Hydration Test User",
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_unauthenticated_hydration_rejected(client: AsyncClient):
    """Test 401 Unauthorized for unauthenticated GET/POST hydration requests."""
    res_get = await client.get("/api/v1/hydration")
    assert res_get.status_code == 401

    res_post = await client.post("/api/v1/hydration", json={"date": "2026-09-09", "amount_ml": 250})
    assert res_post.status_code == 401


@pytest.mark.asyncio
async def test_add_water_log_authenticated(client: AsyncClient):
    """Test creating a water log increment for authenticated user."""
    cookies = await register_and_login(client, "water_user1@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    res = await client.post("/api/v1/hydration", json={
        "date": today_str,
        "amount_ml": 500,
        "note": "Morning glass of water",
    }, cookies=cookies)

    assert res.status_code == 201
    data = res.json()
    assert data["amount_ml"] == 500
    assert data["date"] == today_str
    assert data["note"] == "Morning glass of water"


@pytest.mark.asyncio
async def test_negative_water_amount_rejected(client: AsyncClient):
    """Test 422 Unprocessable Entity for invalid negative or zero water amount."""
    cookies = await register_and_login(client, "negative_water@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    res = await client.post("/api/v1/hydration", json={
        "date": today_str,
        "amount_ml": -100,
    }, cookies=cookies)

    assert res.status_code == 422


@pytest.mark.asyncio
async def test_retrieve_daily_hydration_and_totals(client: AsyncClient):
    """Test GET /api/v1/hydration returns correct daily total and log array."""
    cookies = await register_and_login(client, "hydration_totals@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Add 250ml and 500ml
    await client.post("/api/v1/hydration", json={"date": today_str, "amount_ml": 250}, cookies=cookies)
    await client.post("/api/v1/hydration", json={"date": today_str, "amount_ml": 500}, cookies=cookies)

    res = await client.get(f"/api/v1/hydration?date={today_str}", cookies=cookies)
    assert res.status_code == 200
    data = res.json()

    assert data["has_data"] is True
    assert data["total_water_ml"] == 750
    assert len(data["logs"]) == 2


@pytest.mark.asyncio
async def test_user_hydration_isolation(client: AsyncClient):
    """Test user data isolation — User A cannot view User B's hydration logs."""
    cookies_a = await register_and_login(client, "user_a_water@poshancare.in")
    cookies_b = await register_and_login(client, "user_b_water@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # User A logs 1000ml
    await client.post("/api/v1/hydration", json={"date": today_str, "amount_ml": 1000}, cookies=cookies_a)

    # User B queries hydration
    res_b = await client.get(f"/api/v1/hydration?date={today_str}", cookies=cookies_b)
    assert res_b.status_code == 200
    data_b = res_b.json()

    assert data_b["has_data"] is False
    assert data_b["total_water_ml"] == 0
    assert len(data_b["logs"]) == 0


@pytest.mark.asyncio
async def test_delete_water_log(client: AsyncClient):
    """Test deleting a user-owned water log record."""
    cookies = await register_and_login(client, "delete_water@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    post_res = await client.post("/api/v1/hydration", json={"date": today_str, "amount_ml": 350}, cookies=cookies)
    log_id = post_res.json()["raw_id"]

    del_res = await client.delete(f"/api/v1/hydration/{log_id}", cookies=cookies)
    assert del_res.status_code == 200

    summary_res = await client.get(f"/api/v1/hydration?date={today_str}", cookies=cookies)
    assert summary_res.json()["total_water_ml"] == 0


@pytest.mark.asyncio
async def test_delete_other_user_water_log_rejected(client: AsyncClient):
    """Test 404/unauthorized when attempting to delete another user's water log."""
    cookies_a = await register_and_login(client, "user_a_del_water@poshancare.in")
    cookies_b = await register_and_login(client, "user_b_del_water@poshancare.in")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    post_res = await client.post("/api/v1/hydration", json={"date": today_str, "amount_ml": 350}, cookies=cookies_a)
    log_id = post_res.json()["raw_id"]

    # User B tries to delete User A's log
    del_res = await client.delete(f"/api/v1/hydration/{log_id}", cookies=cookies_b)
    assert del_res.status_code == 404
