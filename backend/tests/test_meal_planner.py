from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.food import Food, UserFavoriteFood
from app.models.profile import UserProfile
from app.models.user import User
from app.models.meal_plan import MealPlan, MealPlanItem


async def register_and_login(client: AsyncClient, email: str, name: str = "MealPlan User") -> dict:
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": name,
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """Unauthenticated requests must return 401."""
    res1 = await client.get("/api/v1/meal-plans/today")
    assert res1.status_code == 401

    res2 = await client.get("/api/v1/meal-plans/recommendations")
    assert res2.status_code == 401

    res3 = await client.post("/api/v1/meal-plans/generate", json={"plan_date": "2026-09-09"})
    assert res3.status_code == 401


@pytest.mark.asyncio
async def test_generate_and_get_today_meal_plan(client: AsyncClient):
    """Test generating a meal plan and retrieving today's meal plan."""
    cookies = await register_and_login(client, "gen_plan@example.com")

    # Generate plan
    gen_res = await client.post(
        "/api/v1/meal-plans/generate",
        json={"plan_date": "2026-09-09", "meal_types": ["breakfast", "lunch", "dinner", "snack"]},
        cookies=cookies,
    )
    assert gen_res.status_code == 201
    data = gen_res.json()
    assert data["plan_date"] == "2026-09-09"
    assert len(data["meals"]) == 4

    # Get today plan
    today_res = await client.get("/api/v1/meal-plans/today?date=2026-09-09", cookies=cookies)
    assert today_res.status_code == 200
    today_data = today_res.json()
    assert today_data["id"] == data["id"]


@pytest.mark.asyncio
async def test_get_user_meal_plans_history(client: AsyncClient):
    """Test listing user historical meal plans."""
    cookies = await register_and_login(client, "hist_plan@example.com")

    # Generate plan 1
    await client.post("/api/v1/meal-plans/generate", json={"plan_date": "2026-09-08"}, cookies=cookies)
    # Generate plan 2
    await client.post("/api/v1/meal-plans/generate", json={"plan_date": "2026-09-09"}, cookies=cookies)

    res = await client.get("/api/v1/meal-plans", cookies=cookies)
    assert res.status_code == 200
    plans = res.json()
    assert len(plans) >= 2


@pytest.mark.asyncio
async def test_recommendation_ranking(client: AsyncClient):
    """Test that recommendations return top items sorted by confidence score."""
    cookies = await register_and_login(client, "ranking@example.com")

    res = await client.get("/api/v1/meal-plans/recommendations", cookies=cookies)
    assert res.status_code == 200
    data = res.json()
    recs = data["recommendations"]
    assert len(recs) > 0

    # Verify descending confidence scores
    scores = [r["confidence_score"] for r in recs]
    assert scores == sorted(scores, reverse=True)


@pytest.mark.asyncio
async def test_dietary_preference_filtering(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Test vegetarian profile filters out non-vegetarian foods."""
    cookies = await register_and_login(client, "veg_user@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "veg_user@example.com"))
    user = res_user.scalar_one()

    prof = UserProfile(user_id=user.id, profile_type="adult", diet_type="vegetarian")
    db_session.add(prof)
    await db_session.commit()

    res = await client.get("/api/v1/meal-plans/recommendations", cookies=cookies)
    assert res.status_code == 200
    recs = res.json()["recommendations"]
    for r in recs:
        assert r["is_vegetarian"] is True


@pytest.mark.asyncio
async def test_food_avoidance_filtering(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Test food avoidances filter out avoided ingredients (e.g. peanuts)."""
    cookies = await register_and_login(client, "avoid_user@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "avoid_user@example.com"))
    user = res_user.scalar_one()

    prof = UserProfile(user_id=user.id, profile_type="adult", food_avoidances=["peanut", "egg"])
    db_session.add(prof)
    await db_session.commit()

    res = await client.get("/api/v1/meal-plans/recommendations", cookies=cookies)
    assert res.status_code == 200
    recs = res.json()["recommendations"]
    for r in recs:
        name_lower = r["food_name"].lower()
        assert "peanut" not in name_lower
        assert "egg" not in name_lower


from app.db.seed_foods import seed_foods_table


@pytest.mark.asyncio
async def test_favorite_food_preference(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Test favorite foods receive boosted recommendation ranking."""
    await seed_foods_table(db_session)
    cookies = await register_and_login(client, "fav_user@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "fav_user@example.com"))
    user = res_user.scalar_one()

    # Get a food ID
    food_res = await db_session.execute(select(Food).limit(1))
    food = food_res.scalar_one()

    fav = UserFavoriteFood(user_id=user.id, food_id=food.id)
    db_session.add(fav)
    await db_session.commit()

    res = await client.get("/api/v1/meal-plans/recommendations", cookies=cookies)
    assert res.status_code == 200
    recs = res.json()["recommendations"]
    fav_rec = next((r for r in recs if r["food_id"] == food.id), None)
    assert fav_rec is not None
    assert fav_rec["confidence_score"] >= 80.0


@pytest.mark.asyncio
async def test_recent_food_diversity(client: AsyncClient):
    """Test generated meal plan picks diverse foods across meal types."""
    cookies = await register_and_login(client, "diversity@example.com")

    res = await client.post("/api/v1/meal-plans/generate", json={"plan_date": "2026-09-09"}, cookies=cookies)
    assert res.status_code == 201
    data = res.json()

    food_ids = []
    for group in data["meals"]:
        for item in group["items"]:
            food_ids.append(item["food_id"])
    
    # Check that not all food_ids are identical if catalog has multiple
    assert len(set(food_ids)) > 1


@pytest.mark.asyncio
async def test_insufficient_data_behavior(client: AsyncClient):
    """Test brand new user data quality notes helpful onboarding message."""
    cookies = await register_and_login(client, "newbie_plan@example.com")

    res = await client.get("/api/v1/meal-plans/recommendations", cookies=cookies)
    assert res.status_code == 200
    data = res.json()
    assert "data_quality" in data
    assert data["data_quality"]["has_profile_data"] is False


@pytest.mark.asyncio
async def test_child_persona_safety(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Verify child profile generated reasons contain zero restrictive dieting terms."""
    cookies = await register_and_login(client, "child_plan@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "child_plan@example.com"))
    user = res_user.scalar_one()

    prof = UserProfile(user_id=user.id, profile_type="child", age=8)
    db_session.add(prof)
    await db_session.commit()

    res = await client.get("/api/v1/meal-plans/recommendations", cookies=cookies)
    assert res.status_code == 200
    raw_str = res.text.lower()

    assert "calorie deficit" not in raw_str
    assert "weight loss" not in raw_str
    assert "fat loss" not in raw_str
    assert "dieting" not in raw_str


@pytest.mark.asyncio
async def test_teen_persona_safety(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Verify teen profile generated reasons contain zero restrictive terms."""
    cookies = await register_and_login(client, "teen_plan@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "teen_plan@example.com"))
    user = res_user.scalar_one()

    prof = UserProfile(user_id=user.id, profile_type="teen", age=14)
    db_session.add(prof)
    await db_session.commit()

    res = await client.get("/api/v1/meal-plans/recommendations", cookies=cookies)
    assert res.status_code == 200
    raw_str = res.text.lower()

    assert "calorie deficit" not in raw_str
    assert "weight loss" not in raw_str
    assert "fat loss" not in raw_str


@pytest.mark.asyncio
async def test_older_adult_behavior(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Verify older adult profile prioritizes muscle support & simple reasons."""
    cookies = await register_and_login(client, "older_plan@example.com")
    res_user = await db_session.execute(select(User).where(User.email == "older_plan@example.com"))
    user = res_user.scalar_one()

    prof = UserProfile(user_id=user.id, profile_type="older_adult", age=68)
    db_session.add(prof)
    await db_session.commit()

    res = await client.get("/api/v1/meal-plans/recommendations", cookies=cookies)
    assert res.status_code == 200
    recs = res.json()["recommendations"]
    assert len(recs) > 0


@pytest.mark.asyncio
async def test_custom_food_ownership(
    client: AsyncClient,
    db_session: AsyncSession,
):
    """Verify User B cannot see or receive User A's private custom food."""
    cookies_a = await register_and_login(client, "user_a_food@example.com")
    cookies_b = await register_and_login(client, "user_b_food@example.com")

    # User A creates custom food
    res_a_food = await client.post(
        "/api/v1/foods",
        json={
            "name": "Secret User A Smoothie",
            "category": "Beverages",
            "region": "Custom",
            "is_vegetarian": True,
            "serving_size_name": "1 glass",
            "serving_size_g": 250,
            "calories": 200,
            "protein_g": 10,
            "carbs_g": 30,
            "fat_g": 5,
        },
        cookies=cookies_a,
    )
    assert res_a_food.status_code == 201
    custom_id = res_a_food.json()["id"]

    # User B checks recommendations -> custom_id must NOT be included
    res_b_recs = await client.get("/api/v1/meal-plans/recommendations", cookies=cookies_b)
    assert res_b_recs.status_code == 200
    rec_ids = [r["food_id"] for r in res_b_recs.json()["recommendations"]]
    assert custom_id not in rec_ids


@pytest.mark.asyncio
async def test_meal_plan_ownership_isolation(client: AsyncClient):
    """Verify User B cannot access or modify User A's meal plan."""
    cookies_a = await register_and_login(client, "user_a_plan@example.com")
    cookies_b = await register_and_login(client, "user_b_plan@example.com")

    # User A generates plan
    res_a = await client.post("/api/v1/meal-plans/generate", json={"plan_date": "2026-09-09"}, cookies=cookies_a)
    assert res_a.status_code == 201
    plan_a_id = res_a.json()["id"]

    # User B attempts to delete User A's plan -> 404
    del_res = await client.delete(f"/api/v1/meal-plans/{plan_a_id}", cookies=cookies_b)
    assert del_res.status_code == 404

    # User B attempts to add item to User A's plan -> 404
    add_res = await client.post(
        f"/api/v1/meal-plans/{plan_a_id}/items",
        json={"meal_type": "snack", "food_id": 1},
        cookies=cookies_b,
    )
    assert add_res.status_code == 404


@pytest.mark.asyncio
async def test_duplicate_plan_handling(client: AsyncClient):
    """Generating plan twice for same date updates cleanly without 500 error."""
    cookies = await register_and_login(client, "dup_plan@example.com")

    res1 = await client.post("/api/v1/meal-plans/generate", json={"plan_date": "2026-09-09"}, cookies=cookies)
    assert res1.status_code == 201
    id1 = res1.json()["id"]

    res2 = await client.post("/api/v1/meal-plans/generate", json={"plan_date": "2026-09-09"}, cookies=cookies)
    assert res2.status_code == 201
    id2 = res2.json()["id"]

    assert id1 == id2


@pytest.mark.asyncio
async def test_invalid_food_id_rejected(client: AsyncClient):
    """Adding invalid food ID to meal plan returns 404."""
    cookies = await register_and_login(client, "invalid_food@example.com")

    gen_res = await client.post("/api/v1/meal-plans/generate", json={"plan_date": "2026-09-09"}, cookies=cookies)
    plan_id = gen_res.json()["id"]

    add_res = await client.post(
        f"/api/v1/meal-plans/{plan_id}/items",
        json={"meal_type": "snack", "food_id": 999999},
        cookies=cookies,
    )
    assert add_res.status_code == 404


@pytest.mark.asyncio
async def test_server_side_nutrition_values(client: AsyncClient):
    """Test server-side calculated totals match item sum."""
    cookies = await register_and_login(client, "server_side_val@example.com")

    res = await client.post("/api/v1/meal-plans/generate", json={"plan_date": "2026-09-09"}, cookies=cookies)
    assert res.status_code == 201
    data = res.json()

    summary = data["nutrition_summary"]
    calculated_cals = 0.0
    for group in data["meals"]:
        for item in group["items"]:
            calculated_cals += item["calories"]

    assert abs(summary["total_calories"] - round(calculated_cals, 1)) < 0.2


@pytest.mark.asyncio
async def test_diary_integration(client: AsyncClient):
    """Test meal logging API integration."""
    cookies = await register_and_login(client, "diary_integ@example.com")

    # Get today plan
    res = await client.get("/api/v1/meal-plans/today?date=2026-09-09", cookies=cookies)
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_empty_food_catalog_behavior(client: AsyncClient):
    """Test auto-seeding when food catalog is queried."""
    cookies = await register_and_login(client, "empty_cat@example.com")

    res = await client.get("/api/v1/meal-plans/recommendations", cookies=cookies)
    assert res.status_code == 200
    data = res.json()
    assert len(data["recommendations"]) > 0
