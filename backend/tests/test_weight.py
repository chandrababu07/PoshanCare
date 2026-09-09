import pytest
from httpx import AsyncClient


async def get_auth_cookies(client: AsyncClient, email: str) -> dict:
    """Helper to register user and return auth cookies."""
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Weight Test User",
    })
    assert reg_res.status_code == 201
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_empty_weight_summary(client: AsyncClient):
    """Test retrieving weight summary for new user returns empty logs structure."""
    cookies = await get_auth_cookies(client, "empty_weight@poshancare.in")
    response = await client.get("/api/v1/weight", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["current_weight"] == 0.0
    assert data["days_tracked"] == 0
    assert data["logs"] == []


@pytest.mark.asyncio
async def test_unauthenticated_weight_access_rejected(client: AsyncClient):
    """Test 401 Unauthorized for unauthenticated weight requests."""
    response = await client.get("/api/v1/weight")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_log_weight_entry_success(client: AsyncClient):
    """Test logging a valid daily weight measurement."""
    cookies = await get_auth_cookies(client, "log_weight@poshancare.in")

    payload = {
        "date": "2026-09-06",
        "weight_kg": 72.5,
        "note": "Post morning workout",
    }
    response = await client.post("/api/v1/weight", json=payload, cookies=cookies)
    assert response.status_code == 201
    data = response.json()
    assert data["weight_kg"] == 72.5
    assert data["moving_average"] == 72.5
    assert data["note"] == "Post morning workout"


@pytest.mark.asyncio
async def test_update_existing_date_weight_entry(client: AsyncClient):
    """Test logging weight for an existing date updates the record."""
    cookies = await get_auth_cookies(client, "update_weight@poshancare.in")

    # Initial log
    await client.post("/api/v1/weight", json={
        "date": "2026-09-06",
        "weight_kg": 70.0,
    }, cookies=cookies)

    # Re-log on same date
    update_res = await client.post("/api/v1/weight", json={
        "date": "2026-09-06",
        "weight_kg": 70.5,
        "note": "Updated evening measurement",
    }, cookies=cookies)
    assert update_res.status_code == 201

    summary_res = await client.get("/api/v1/weight", cookies=cookies)
    summary = summary_res.json()
    assert summary["days_tracked"] == 1
    assert summary["current_weight"] == 70.5


@pytest.mark.asyncio
async def test_moving_average_computation(client: AsyncClient):
    """Test 7-day trailing moving average calculation across multiple logs."""
    cookies = await get_auth_cookies(client, "moving_avg@poshancare.in")

    weights = [70.0, 71.0, 72.0]
    dates = ["2026-09-01", "2026-09-02", "2026-09-03"]

    for d, w in zip(dates, weights):
        await client.post("/api/v1/weight", json={
            "date": d,
            "weight_kg": w,
        }, cookies=cookies)

    summary_res = await client.get("/api/v1/weight", cookies=cookies)
    summary = summary_res.json()
    assert summary["days_tracked"] == 3
    # Moving average of [70.0, 71.0, 72.0] is 71.0 for latest entry
    assert summary["logs"][0]["moving_average"] == 71.0


@pytest.mark.asyncio
async def test_delete_weight_entry(client: AsyncClient):
    """Test deleting a weight log removes it from trajectory."""
    cookies = await get_auth_cookies(client, "delete_weight@poshancare.in")

    log_res = await client.post("/api/v1/weight", json={
        "date": "2026-09-06",
        "weight_kg": 68.4,
    }, cookies=cookies)
    raw_id = log_res.json()["raw_id"]

    del_res = await client.delete(f"/api/v1/weight/{raw_id}", cookies=cookies)
    assert del_res.status_code == 200

    summary_res = await client.get("/api/v1/weight", cookies=cookies)
    assert summary_res.json()["days_tracked"] == 0


@pytest.mark.asyncio
async def test_invalid_weight_rejected(client: AsyncClient):
    """Test validation errors for zero or negative weight values."""
    cookies = await get_auth_cookies(client, "invalid_weight@poshancare.in")

    response = await client.post("/api/v1/weight", json={
        "date": "2026-09-06",
        "weight_kg": -10.0,
    }, cookies=cookies)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_cross_user_weight_isolation(client: AsyncClient):
    """Test user B cannot delete user A's weight entry."""
    cookies_a = await get_auth_cookies(client, "user_a_weight@poshancare.in")
    cookies_b = await get_auth_cookies(client, "user_b_weight@poshancare.in")

    log_a = await client.post("/api/v1/weight", json={
        "date": "2026-09-06",
        "weight_kg": 65.0,
    }, cookies=cookies_a)
    raw_id_a = log_a.json()["raw_id"]

    # User B attempts to delete User A's log -> 404
    del_res = await client.delete(f"/api/v1/weight/{raw_id_a}", cookies=cookies_b)
    assert del_res.status_code == 404
