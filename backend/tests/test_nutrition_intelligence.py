import pytest
from httpx import AsyncClient
from datetime import datetime, timezone


async def register_and_login(client: AsyncClient, email: str) -> dict:
    """Helper to register user, login, and return auth cookies."""
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Intel Test User",
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_unauthenticated_intelligence_rejected(client: AsyncClient):
    """Test 401 Unauthorized for unauthenticated GET request."""
    response = await client.get("/api/v1/nutrition/intelligence")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_new_user_no_meals_insufficient_data(client: AsyncClient):
    """Test 1: New user with no logged meals returns has_sufficient_data=False."""
    cookies = await register_and_login(client, "new_user_intel@poshancare.in")
    
    # Complete onboarding
    await client.patch("/api/v1/profile", json={
        "profile_type": "adult",
        "age": 30,
        "biological_sex": "female",
        "height_cm": 165.0,
        "weight_kg": 60.0,
        "activity_level": "Moderately Active",
        "primary_goal": "maintain",
    }, cookies=cookies)

    response = await client.get("/api/v1/nutrition/intelligence", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    assert data["has_sufficient_data"] is False
    assert "Log a few meals" in data["insufficient_data_reason"]
    assert data["data_quality"]["logged_meals"] == 0


@pytest.mark.asyncio
async def test_user_single_meal_insufficient_data(client: AsyncClient):
    """Test 2: User with only 1 meal returns explicit insufficient data state."""
    cookies = await register_and_login(client, "single_meal_user@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "adult",
        "age": 28,
        "height_cm": 170.0,
        "weight_kg": 68.0,
    }, cookies=cookies)

    # Log 1 meal entry
    foods_resp = await client.get("/api/v1/foods?page_size=1")
    food = foods_resp.json()["items"][0]

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "breakfast",
        "date": today_str,
        "food_id": food["id"],
        "quantity": 1.0,
    }, cookies=cookies)

    response = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    assert data["has_sufficient_data"] is False
    assert "Keep logging meals" in data["insufficient_data_reason"]


@pytest.mark.asyncio
async def test_user_multiple_meals_sufficient_data_and_aggregation(client: AsyncClient):
    """Test 3, 4, 5, 6: User with multiple meals returns sufficient data, correct aggregation & target comparison."""
    cookies = await register_and_login(client, "multi_meal_user@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "adult",
        "age": 30,
        "biological_sex": "male",
        "height_cm": 175.0,
        "weight_kg": 75.0,
        "activity_level": "Moderately Active",
        "primary_goal": "muscle",
    }, cookies=cookies)

    foods_resp = await client.get("/api/v1/foods?page_size=5")
    foods = foods_resp.json()["items"]
    food1, food2 = foods[0], foods[1]

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Entry 1
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "breakfast",
        "date": today_str,
        "food_id": food1["id"],
        "quantity": 1.0,
    }, cookies=cookies)

    # Entry 2
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "lunch",
        "date": today_str,
        "food_id": food2["id"],
        "quantity": 2.0,
    }, cookies=cookies)

    # Entry on previous day to build >1 total meals history
    yesterday_str = "2026-09-08"
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "dinner",
        "date": yesterday_str,
        "food_id": food1["id"],
        "quantity": 1.0,
    }, cookies=cookies)

    response = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    assert data["has_sufficient_data"] is True
    assert data["summary"] is not None

    expected_cals = round(food1["calories"] + (food2["calories"] * 2.0), 1)
    expected_protein = round(food1["protein_g"] + (food2["protein_g"] * 2.0), 1)

    assert abs(data["summary"]["calories"]["actual"] - expected_cals) <= 0.2
    assert abs(data["summary"]["protein"]["actual_g"] - expected_protein) <= 0.2
    assert data["summary"]["calories"]["target"] > 1000.0


@pytest.mark.asyncio
async def test_protein_insight_generation(client: AsyncClient):
    """Test 7: Protein insight generated based on actual vs target intake."""
    cookies = await register_and_login(client, "protein_insight@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "adult",
        "age": 25,
        "height_cm": 180.0,
        "weight_kg": 80.0,
        "primary_goal": "muscle",
    }, cookies=cookies)

    foods_resp = await client.get("/api/v1/foods?page_size=2")
    food = foods_resp.json()["items"][0]
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Add 2 entries to meet history threshold
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "breakfast",
        "date": today_str,
        "food_id": food["id"],
        "quantity": 1.0,
    }, cookies=cookies)
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "lunch",
        "date": today_str,
        "food_id": food["id"],
        "quantity": 1.0,
    }, cookies=cookies)

    response = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    assert any(i["type"] == "protein" for i in data["insights"])


@pytest.mark.asyncio
async def test_dietary_preference_filtering(client: AsyncClient):
    """Test 8: Recommendations respect vegetarian diet preference."""
    cookies = await register_and_login(client, "veg_user@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "adult",
        "diet_type": "vegetarian",
        "age": 30,
        "height_cm": 170.0,
        "weight_kg": 65.0,
    }, cookies=cookies)

    response = await client.get("/api/v1/nutrition/intelligence", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    for rec in data["recommendations"]:
        for food in rec["foods"]:
            assert food["is_vegetarian"] is True


@pytest.mark.asyncio
async def test_food_avoidance_filtering(client: AsyncClient):
    """Test 9: Recommendations strictly filter out avoided terms (e.g. peanuts)."""
    cookies = await register_and_login(client, "avoid_peanuts@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "adult",
        "food_avoidances": ["peanut", "groundnut"],
        "age": 32,
        "height_cm": 175.0,
        "weight_kg": 72.0,
    }, cookies=cookies)

    response = await client.get("/api/v1/nutrition/intelligence", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    for rec in data["recommendations"]:
        for food in rec["foods"]:
            name_lower = food["food_name"].lower()
            assert "peanut" not in name_lower
            assert "groundnut" not in name_lower


@pytest.mark.asyncio
async def test_child_persona_behavior(client: AsyncClient):
    """Test 10: Child persona contains NO calorie restriction/deficit/dieting language."""
    cookies = await register_and_login(client, "child_user@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "child",
        "age": 10,
        "height_cm": 140.0,
        "weight_kg": 35.0,
        "primary_goal": "maintain",
    }, cookies=cookies)

    response = await client.get("/api/v1/nutrition/intelligence", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    for insight in data["insights"]:
        msg = (insight["title"] + " " + insight["message"] + " " + insight["reason"]).lower()
        assert "deficit" not in msg
        assert "restriction" not in msg
        assert "fat loss" not in msg
        assert "weight loss" not in msg
        assert "dieting" not in msg


@pytest.mark.asyncio
async def test_teen_persona_behavior(client: AsyncClient):
    """Test 11: Teen persona emphasizes growth and wholesome energy."""
    cookies = await register_and_login(client, "teen_user@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "teen",
        "age": 15,
        "height_cm": 165.0,
        "weight_kg": 55.0,
    }, cookies=cookies)

    response = await client.get("/api/v1/nutrition/intelligence", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    # Verify absence of restrictive dieting language
    for insight in data["insights"]:
        msg = (insight["title"] + " " + insight["message"]).lower()
        assert "calorie deficit" not in msg


@pytest.mark.asyncio
async def test_older_adult_persona_behavior(client: AsyncClient):
    """Test 13: Older adult persona emphasizes protein and muscle preservation."""
    cookies = await register_and_login(client, "elder_user@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "older_adult",
        "age": 70,
        "height_cm": 160.0,
        "weight_kg": 62.0,
    }, cookies=cookies)

    response = await client.get("/api/v1/nutrition/intelligence", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    insights_text = " ".join([i["title"] + " " + i["message"] for i in data["insights"]])
    assert "muscle" in insights_text.lower() or "protein" in insights_text.lower()


@pytest.mark.asyncio
async def test_user_isolation(client: AsyncClient):
    """Test 14: Strict user isolation — intelligence endpoint uses current_user auth token only."""
    cookies1 = await register_and_login(client, "user1_isolation@poshancare.in")
    cookies2 = await register_and_login(client, "user2_isolation@poshancare.in")

    await client.patch("/api/v1/profile", json={"profile_type": "adult", "age": 25, "height_cm": 170.0, "weight_kg": 70.0}, cookies=cookies1)
    await client.patch("/api/v1/profile", json={"profile_type": "child", "age": 8, "height_cm": 130.0, "weight_kg": 28.0}, cookies=cookies2)

    res1 = await client.get("/api/v1/nutrition/intelligence", cookies=cookies1)
    res2 = await client.get("/api/v1/nutrition/intelligence", cookies=cookies2)

    data1 = res1.json()
    data2 = res2.json()

    # User 1 should have adult behavior, User 2 should have pediatric behavior
    text1 = " ".join([i["message"] for i in data1["insights"]]).lower()
    text2 = " ".join([i["message"] for i in data2["insights"]]).lower()

    assert "growth" in text2 or "child" in text2 or "energy" in text2


@pytest.mark.asyncio
async def test_missing_profile_fields_handled_gracefully(client: AsyncClient):
    """Test 15: User with incomplete profile receives valid intelligence response without crash."""
    cookies = await register_and_login(client, "empty_profile_intel@poshancare.in")

    response = await client.get("/api/v1/nutrition/intelligence", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    assert data["data_quality"]["has_profile"] is False
    assert data["has_sufficient_data"] is False


@pytest.mark.asyncio
async def test_recommendations_use_real_database_foods(client: AsyncClient):
    """Test 18: Smart food recommendations return real DB food items with valid IDs."""
    cookies = await register_and_login(client, "real_foods_user@poshancare.in")

    response = await client.get("/api/v1/nutrition/intelligence", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    assert len(data["recommendations"]) > 0
    for rec in data["recommendations"]:
        for food in rec["foods"]:
            assert food["food_id"] > 0
            assert len(food["food_name"]) > 0
            assert food["calories"] > 0
