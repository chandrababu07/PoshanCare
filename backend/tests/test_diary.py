import pytest
from httpx import AsyncClient


async def get_authenticated_headers(client: AsyncClient, email: str = "diary_user@poshancare.in") -> dict:
    """Helper to register and log in a test user, returning auth cookies/headers."""
    register_payload = {
        "email": email,
        "password": "Password123!",
        "full_name": "Diary Test User",
    }
    await client.post("/api/v1/auth/register", json=register_payload)
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_resp.cookies


@pytest.mark.asyncio
async def test_empty_diary_returns_structure(client: AsyncClient):
    """Test retrieving diary for user with zero entries returns clean 5-meal structure."""
    cookies = await get_authenticated_headers(client, "empty_diary@poshancare.in")
    response = await client.get("/api/v1/diary?date=2026-09-06", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == "2026-09-06"
    assert data["grand_total_calories"] == 0.0
    assert len(data["meals"]) == 5
    for meal_sec in data["meals"]:
        assert meal_sec["total_calories"] == 0.0
        assert len(meal_sec["items"]) == 0


@pytest.mark.asyncio
async def test_unauthenticated_diary_access_rejected(client: AsyncClient):
    """Test accessing diary without auth cookie returns 401."""
    response = await client.get("/api/v1/diary")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_diary_entry_success(client: AsyncClient):
    """Test creating a valid food diary entry."""
    cookies = await get_authenticated_headers(client, "create_entry@poshancare.in")

    # Get a valid food ID
    foods_resp = await client.get("/api/v1/foods?page_size=1")
    food = foods_resp.json()["items"][0]

    entry_payload = {
        "meal_type": "breakfast",
        "date": "2026-09-06",
        "food_id": food["id"],
        "quantity": 2.0,
    }
    response = await client.post("/api/v1/diary/entries", json=entry_payload, cookies=cookies)
    assert response.status_code == 201
    data = response.json()
    assert data["food_id"] == food["id"]
    assert data["quantity"] == 2.0
    assert data["calories"] == round(food["calories"] * 2.0, 1)


@pytest.mark.asyncio
async def test_retrieve_daily_diary(client: AsyncClient):
    """Test retrieving daily diary after logging meals."""
    cookies = await get_authenticated_headers(client, "retrieve_diary@poshancare.in")

    foods_resp = await client.get("/api/v1/foods?page_size=2")
    food_items = foods_resp.json()["items"]

    # Log entry in breakfast
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "breakfast",
        "date": "2026-09-06",
        "food_id": food_items[0]["id"],
        "quantity": 1.0,
    }, cookies=cookies)

    # Log entry in lunch
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "lunch",
        "date": "2026-09-06",
        "food_id": food_items[1]["id"],
        "quantity": 1.0,
    }, cookies=cookies)

    diary_resp = await client.get("/api/v1/diary?date=2026-09-06", cookies=cookies)
    assert diary_resp.status_code == 200
    data = diary_resp.json()
    assert data["grand_total_calories"] > 0
    breakfast_sec = next(m for m in data["meals"] if m["id"] == "breakfast")
    lunch_sec = next(m for m in data["meals"] if m["id"] == "lunch")
    assert len(breakfast_sec["items"]) == 1
    assert len(lunch_sec["items"]) == 1


@pytest.mark.asyncio
async def test_retrieve_diary_by_specific_date(client: AsyncClient):
    """Test date filtering returns isolated entries per date."""
    cookies = await get_authenticated_headers(client, "date_filter@poshancare.in")

    foods_resp = await client.get("/api/v1/foods?page_size=1")
    food_id = foods_resp.json()["items"][0]["id"]

    # Log on Sep 5
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "dinner",
        "date": "2026-09-05",
        "food_id": food_id,
        "quantity": 1.0,
    }, cookies=cookies)

    # Sep 5 should have entries, Sep 6 should be empty
    sep5_resp = await client.get("/api/v1/diary?date=2026-09-05", cookies=cookies)
    assert sep5_resp.json()["grand_total_calories"] > 0

    sep6_resp = await client.get("/api/v1/diary?date=2026-09-06", cookies=cookies)
    assert sep6_resp.json()["grand_total_calories"] == 0.0


@pytest.mark.asyncio
async def test_update_diary_entry_quantity(client: AsyncClient):
    """Test updating quantity of existing entry recalculates nutrition."""
    cookies = await get_authenticated_headers(client, "update_entry@poshancare.in")
    foods_resp = await client.get("/api/v1/foods?page_size=1")
    food = foods_resp.json()["items"][0]

    create_resp = await client.post("/api/v1/diary/entries", json={
        "meal_type": "lunch",
        "date": "2026-09-06",
        "food_id": food["id"],
        "quantity": 1.0,
    }, cookies=cookies)
    raw_id = create_resp.json()["raw_id"]

    # Update quantity to 3x
    update_resp = await client.patch(f"/api/v1/diary/entries/{raw_id}", json={
        "quantity": 3.0,
    }, cookies=cookies)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["quantity"] == 3.0
    assert updated_data["calories"] == round(food["calories"] * 3.0, 1)


@pytest.mark.asyncio
async def test_delete_diary_entry(client: AsyncClient):
    """Test deleting entry removes it from daily summary."""
    cookies = await get_authenticated_headers(client, "delete_entry@poshancare.in")
    foods_resp = await client.get("/api/v1/foods?page_size=1")
    food_id = foods_resp.json()["items"][0]["id"]

    create_resp = await client.post("/api/v1/diary/entries", json={
        "meal_type": "evening_snack",
        "date": "2026-09-06",
        "food_id": food_id,
        "quantity": 1.0,
    }, cookies=cookies)
    raw_id = create_resp.json()["raw_id"]

    del_resp = await client.delete(f"/api/v1/diary/entries/{raw_id}", cookies=cookies)
    assert del_resp.status_code == 200

    diary_resp = await client.get("/api/v1/diary?date=2026-09-06", cookies=cookies)
    snack_sec = next(m for m in diary_resp.json()["meals"] if m["id"] == "evening_snack")
    assert len(snack_sec["items"]) == 0


@pytest.mark.asyncio
async def test_invalid_food_id_returns_404(client: AsyncClient):
    """Test 404 when adding non-existent food ID."""
    cookies = await get_authenticated_headers(client, "invalid_food@poshancare.in")
    response = await client.post("/api/v1/diary/entries", json={
        "meal_type": "breakfast",
        "date": "2026-09-06",
        "food_id": 99999,
        "quantity": 1.0,
    }, cookies=cookies)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_invalid_portion_id_returns_404(client: AsyncClient):
    """Test 404 when adding non-existent food portion ID."""
    cookies = await get_authenticated_headers(client, "invalid_portion@poshancare.in")
    foods_resp = await client.get("/api/v1/foods?page_size=1")
    food_id = foods_resp.json()["items"][0]["id"]

    response = await client.post("/api/v1/diary/entries", json={
        "meal_type": "breakfast",
        "date": "2026-09-06",
        "food_id": food_id,
        "food_portion_id": 88888,
        "quantity": 1.0,
    }, cookies=cookies)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_food_portion_mismatch_rejected(client: AsyncClient):
    """Test 400 rejection when portion ID does not belong to the selected food."""
    cookies = await get_authenticated_headers(client, "mismatch@poshancare.in")
    foods_resp = await client.get("/api/v1/foods?page_size=2")
    items = foods_resp.json()["items"]
    food1 = items[0]
    food2 = items[1]

    if food2["portions"]:
        mismatched_portion_id = food2["portions"][0]["id"]
        response = await client.post("/api/v1/diary/entries", json={
            "meal_type": "breakfast",
            "date": "2026-09-06",
            "food_id": food1["id"],
            "food_portion_id": mismatched_portion_id,
            "quantity": 1.0,
        }, cookies=cookies)
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_invalid_quantity_rejected(client: AsyncClient):
    """Test validation errors for zero or negative quantities."""
    cookies = await get_authenticated_headers(client, "invalid_qty@poshancare.in")
    foods_resp = await client.get("/api/v1/foods?page_size=1")
    food_id = foods_resp.json()["items"][0]["id"]

    response = await client.post("/api/v1/diary/entries", json={
        "meal_type": "breakfast",
        "date": "2026-09-06",
        "food_id": food_id,
        "quantity": 0.0,
    }, cookies=cookies)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_cross_user_diary_isolation(client: AsyncClient):
    """Test user B cannot mutate or delete user A's diary entry."""
    cookies_a = await get_authenticated_headers(client, "user_a@poshancare.in")
    cookies_b = await get_authenticated_headers(client, "user_b@poshancare.in")

    foods_resp = await client.get("/api/v1/foods?page_size=1")
    food_id = foods_resp.json()["items"][0]["id"]

    # User A creates entry
    create_resp = await client.post("/api/v1/diary/entries", json={
        "meal_type": "lunch",
        "date": "2026-09-06",
        "food_id": food_id,
        "quantity": 1.0,
    }, cookies=cookies_a)
    entry_id_a = create_resp.json()["raw_id"]

    # User B attempts to delete User A's entry -> 404 Not Found / Unauthorized
    del_resp = await client.delete(f"/api/v1/diary/entries/{entry_id_a}", cookies=cookies_b)
    assert del_resp.status_code == 404

    # User B attempts to update User A's entry -> 404 Not Found / Unauthorized
    patch_resp = await client.patch(f"/api/v1/diary/entries/{entry_id_a}", json={"quantity": 5.0}, cookies=cookies_b)
    assert patch_resp.status_code == 404


@pytest.mark.asyncio
async def test_multiple_entries_same_meal(client: AsyncClient):
    """Test adding multiple entries to the same meal aggregates subtotals."""
    cookies = await get_authenticated_headers(client, "multi_entries@poshancare.in")
    foods_resp = await client.get("/api/v1/foods?page_size=2")
    items = foods_resp.json()["items"]

    await client.post("/api/v1/diary/entries", json={
        "meal_type": "breakfast",
        "date": "2026-09-06",
        "food_id": items[0]["id"],
        "quantity": 1.0,
    }, cookies=cookies)

    await client.post("/api/v1/diary/entries", json={
        "meal_type": "breakfast",
        "date": "2026-09-06",
        "food_id": items[1]["id"],
        "quantity": 1.0,
    }, cookies=cookies)

    diary_resp = await client.get("/api/v1/diary?date=2026-09-06", cookies=cookies)
    breakfast_sec = next(m for m in diary_resp.json()["meals"] if m["id"] == "breakfast")
    assert len(breakfast_sec["items"]) == 2
    expected_subtotal = round(items[0]["calories"] + items[1]["calories"], 1)
    assert breakfast_sec["total_calories"] == expected_subtotal


@pytest.mark.asyncio
async def test_fiber_g_calculation_and_aggregation(client: AsyncClient):
    """Test fiber_g is scaled by portion quantity and aggregated in totals."""
    cookies = await get_authenticated_headers(client, "fiber_test@poshancare.in")
    foods_resp = await client.get("/api/v1/foods?page_size=1")
    food = foods_resp.json()["items"][0]

    create_resp = await client.post("/api/v1/diary/entries", json={
        "meal_type": "lunch",
        "date": "2026-09-06",
        "food_id": food["id"],
        "quantity": 2.0,
    }, cookies=cookies)
    assert create_resp.status_code == 201
    entry_data = create_resp.json()
    assert "fiber" in entry_data
    assert entry_data["fiber"] == round(food["fiber_g"] * 2.0, 1)

    diary_resp = await client.get("/api/v1/diary?date=2026-09-06", cookies=cookies)
    diary_data = diary_resp.json()
    assert "grand_total_fiber" in diary_data
    assert "target_fiber" in diary_data
    assert diary_data["grand_total_fiber"] == entry_data["fiber"]

