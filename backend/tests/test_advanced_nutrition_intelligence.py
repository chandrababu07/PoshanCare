import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient


async def register_and_login(client: AsyncClient, email: str) -> dict:
    """Helper to register user, login, and return auth cookies."""
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Adv Intel Test User",
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_data_availability_progression(client: AsyncClient):
    """Test data availability statuses: insufficient_data -> limited_data -> moderate_data."""
    cookies = await register_and_login(client, "data_avail_user@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "adult",
        "age": 28,
        "biological_sex": "female",
        "height_cm": 165.0,
        "weight_kg": 58.0,
        "activity_level": "Moderately Active",
        "primary_goal": "maintain",
    }, cookies=cookies)

    # 1. Zero meals -> insufficient_data
    res = await client.get("/api/v1/nutrition/intelligence?period=7d", cookies=cookies)
    assert res.status_code == 200
    d = res.json()
    assert d["data_availability"]["sufficiency_level"] == "insufficient_data"
    assert d["data_availability"]["logged_days"] == 0
    assert d["data_availability"]["total_meals_logged"] == 0
    assert d["has_sufficient_data"] is False

    # Get sample foods
    foods_resp = await client.get("/api/v1/foods?page_size=5")
    foods = foods_resp.json()["items"]
    food1 = foods[0]

    today = datetime.now(timezone.utc).date()
    today_str = today.strftime("%Y-%m-%d")

    # 2. Log 2 meals on 1 day -> limited_data
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "breakfast",
        "date": today_str,
        "food_id": food1["id"],
        "quantity": 1.0,
    }, cookies=cookies)
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "lunch",
        "date": today_str,
        "food_id": food1["id"],
        "quantity": 1.0,
    }, cookies=cookies)

    res = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}&period=7d", cookies=cookies)
    assert res.status_code == 200
    d = res.json()
    assert d["data_availability"]["sufficiency_level"] == "limited_data"
    assert d["data_availability"]["logged_days"] == 1
    assert d["data_availability"]["total_meals_logged"] == 2

    # 3. Log meals across 3 distinct days -> moderate_data
    for i in range(1, 4):
        d_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        await client.post("/api/v1/diary/entries", json={
            "meal_type": "breakfast",
            "date": d_str,
            "food_id": food1["id"],
            "quantity": 1.0,
        }, cookies=cookies)
        await client.post("/api/v1/diary/entries", json={
            "meal_type": "dinner",
            "date": d_str,
            "food_id": food1["id"],
            "quantity": 1.0,
        }, cookies=cookies)

    res = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}&period=7d", cookies=cookies)
    assert res.status_code == 200
    d = res.json()
    assert d["data_availability"]["sufficiency_level"] == "moderate_data"
    assert d["data_availability"]["logged_days"] >= 3


@pytest.mark.asyncio
async def test_nutrient_gaps_and_actions_generation(client: AsyncClient):
    """Test identification of nutrient gaps (e.g. low protein, low fiber) and action items."""
    cookies = await register_and_login(client, "gaps_user@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "adult",
        "age": 30,
        "biological_sex": "male",
        "height_cm": 180.0,
        "weight_kg": 80.0,
        "activity_level": "Very Active",
        "primary_goal": "muscle",
    }, cookies=cookies)

    foods_resp = await client.get("/api/v1/foods?page_size=20")
    foods = foods_resp.json()["items"]
    
    # Find low protein, low fiber food
    simple_food = None
    for f in foods:
        if f["protein_g"] < 5 and f["fiber_g"] < 2:
            simple_food = f
            break
    if not simple_food:
        simple_food = foods[0]

    today = datetime.now(timezone.utc).date()
    today_str = today.strftime("%Y-%m-%d")

    # Log several portions of low protein food
    for meal in ["breakfast", "lunch", "dinner"]:
        await client.post("/api/v1/diary/entries", json={
            "meal_type": meal,
            "date": today_str,
            "food_id": simple_food["id"],
            "quantity": 1.0,
        }, cookies=cookies)

    res = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}&period=today", cookies=cookies)
    assert res.status_code == 200
    d = res.json()

    assert "nutrient_gaps" in d
    assert isinstance(d["nutrient_gaps"], list)
    # Nutrient gaps should be populated
    assert len(d["nutrient_gaps"]) > 0
    # Daily actions should be generated
    assert len(d["daily_actions"]) > 0


@pytest.mark.asyncio
async def test_smart_substitutions_database_backed(client: AsyncClient):
    """Test smart food substitutions are pulled from database foods with explainable deltas."""
    cookies = await register_and_login(client, "subst_user@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "adult",
        "age": 35,
        "biological_sex": "female",
        "height_cm": 160.0,
        "weight_kg": 65.0,
        "activity_level": "Moderately Active",
        "primary_goal": "fat-loss",
    }, cookies=cookies)

    foods_resp = await client.get("/api/v1/foods?page_size=30")
    foods = foods_resp.json()["items"]

    # Log 3 different foods
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for f in foods[:3]:
        await client.post("/api/v1/diary/entries", json={
            "meal_type": "lunch",
            "date": today_str,
            "food_id": f["id"],
            "quantity": 1.0,
        }, cookies=cookies)

    res = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}&period=today", cookies=cookies)
    assert res.status_code == 200
    d = res.json()

    assert "substitutions" in d
    for sub in d["substitutions"]:
        assert sub["current_food_name"] != ""
        assert sub["suggested_food_name"] != ""
        assert sub["food_id"] > 0
        assert sub["measurable_reason"] != ""


@pytest.mark.asyncio
async def test_pediatric_and_teen_safety_strict_suppression(client: AsyncClient):
    """Test child and teen personas strictly suppress calorie restriction, deficits, and dieting language."""
    for persona, email in [("child", "safe_child@poshancare.in"), ("teen", "safe_teen@poshancare.in")]:
        cookies = await register_and_login(client, email)
        await client.patch("/api/v1/profile", json={
            "profile_type": persona,
            "age": 10 if persona == "child" else 15,
            "biological_sex": "male",
            "height_cm": 140.0 if persona == "child" else 165.0,
            "weight_kg": 35.0 if persona == "child" else 55.0,
            "activity_level": "Moderately Active",
            "primary_goal": "fat-loss",
        }, cookies=cookies)

        foods_resp = await client.get("/api/v1/foods?page_size=5")
        food = foods_resp.json()["items"][0]
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        for meal in ["breakfast", "lunch", "dinner"]:
            await client.post("/api/v1/diary/entries", json={
                "meal_type": meal,
                "date": today_str,
                "food_id": food["id"],
                "quantity": 1.0,
            }, cookies=cookies)

        res = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}&period=today", cookies=cookies)
        assert res.status_code == 200
        d = res.json()

        # Verify no calorie deficit / restriction text anywhere in response
        forbidden_terms = ["calorie deficit", "cut calories", "restrict calories", "weight loss goal", "dieting", "deficit"]
        all_texts = []
        for rec in d["recommendations"]:
            all_texts.append(rec["message"].lower())
            all_texts.append(rec["title"].lower())
        for act in d["daily_actions"]:
            all_texts.append(act["description"].lower())
            all_texts.append(act["title"].lower())
        for pat in d["patterns"]:
            all_texts.append(pat["observation"].lower())
            all_texts.append(pat["title"].lower())
        for gap in d["nutrient_gaps"]:
            all_texts.append(gap["explanation"].lower())

        for text in all_texts:
            for term in forbidden_terms:
                assert term not in text, f"Forbidden term '{term}' found in {persona} intelligence output: {text}"


@pytest.mark.asyncio
async def test_older_adult_hydration_and_protein_distribution(client: AsyncClient):
    """Test older adult persona emphasizes hydration and protein distribution."""
    cookies = await register_and_login(client, "senior_intel@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "older_adult",
        "age": 70,
        "biological_sex": "female",
        "height_cm": 155.0,
        "weight_kg": 62.0,
        "activity_level": "Lightly Active",
        "primary_goal": "maintain",
    }, cookies=cookies)

    foods_resp = await client.get("/api/v1/foods?page_size=5")
    food = foods_resp.json()["items"][0]
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for meal in ["breakfast", "lunch"]:
        await client.post("/api/v1/diary/entries", json={
            "meal_type": meal,
            "date": today_str,
            "food_id": food["id"],
            "quantity": 1.0,
        }, cookies=cookies)

    res = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}&period=today", cookies=cookies)
    assert res.status_code == 200
    d = res.json()

    rec_titles = [r["title"].lower() for r in d["recommendations"]]
    action_titles = [a["title"].lower() for a in d["daily_actions"]]
    combined_titles = " ".join(rec_titles + action_titles)

    assert "hydration" in combined_titles or "protein" in combined_titles


@pytest.mark.asyncio
async def test_meal_variety_and_timing_analysis(client: AsyncClient):
    """Test variety scoring and timing analysis without causal claims."""
    cookies = await register_and_login(client, "variety_user@poshancare.in")
    await client.patch("/api/v1/profile", json={
        "profile_type": "adult",
        "age": 32,
        "height_cm": 172.0,
        "weight_kg": 70.0,
    }, cookies=cookies)

    foods_resp = await client.get("/api/v1/foods?page_size=10")
    foods = foods_resp.json()["items"]
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Log diverse meals
    for i, food in enumerate(foods[:4]):
        meal_type = ["breakfast", "lunch", "snack", "dinner"][i]
        await client.post("/api/v1/diary/entries", json={
            "meal_type": meal_type,
            "date": today_str,
            "food_id": food["id"],
            "quantity": 1.0,
        }, cookies=cookies)

    res = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}&period=today", cookies=cookies)
    assert res.status_code == 200
    d = res.json()

    assert d["variety_analysis"]["unique_foods_count"] >= 4
    assert d["variety_analysis"]["diversity_score"] in ["moderate_variety", "diverse_intake", "needs_variety"]
    assert d["meal_timing"] is not None


@pytest.mark.asyncio
async def test_user_data_isolation_advanced_intelligence(client: AsyncClient):
    """Test User A logs meals, User B cannot see any of User A's intelligence data."""
    cookies_a = await register_and_login(client, "adv_user_a@poshancare.in")
    cookies_b = await register_and_login(client, "adv_user_b@poshancare.in")

    foods_resp = await client.get("/api/v1/foods?page_size=5")
    food = foods_resp.json()["items"][0]
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # User A logs 3 meals
    for meal in ["breakfast", "lunch", "dinner"]:
        await client.post("/api/v1/diary/entries", json={
            "meal_type": meal,
            "date": today_str,
            "food_id": food["id"],
            "quantity": 1.0,
        }, cookies=cookies_a)

    # User A has meals
    res_a = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}&period=today", cookies=cookies_a)
    assert res_a.status_code == 200
    assert res_a.json()["data_availability"]["total_meals_logged"] == 3

    # User B has zero meals
    res_b = await client.get(f"/api/v1/nutrition/intelligence?date={today_str}&period=today", cookies=cookies_b)
    assert res_b.status_code == 200
    assert res_b.json()["data_availability"]["total_meals_logged"] == 0
    assert res_b.json()["data_availability"]["sufficiency_level"] == "insufficient_data"
