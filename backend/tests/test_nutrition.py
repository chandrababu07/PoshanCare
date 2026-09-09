import pytest
from httpx import AsyncClient

from app.services.nutrition import (
    calculate_bmr,
    calculate_goal_adjustment,
    calculate_macros_and_targets,
    get_pal_multiplier,
)


@pytest.mark.asyncio
async def test_bmr_mifflin_st_jeor_equations():
    """Test Mifflin-St Jeor equation for Male, Female, and Unspecified biological sex."""
    # Male: 10*(70) + 6.25*(175) - 5*(30) + 5 = 700 + 1093.75 - 150 + 5 = 1648.75 -> 1648.8
    bmr_male = calculate_bmr(70.0, 175.0, 30, "male")
    assert bmr_male == 1648.8

    # Female: 10*(60) + 6.25*(165) - 5*(25) - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345.2 or 1345.3
    bmr_female = calculate_bmr(60.0, 165.0, 25, "female")
    assert abs(bmr_female - 1345.2) <= 0.1

    # Unspecified: 10*(65) + 6.25*(170) - 5*(28) - 78 = 650 + 1062.5 - 140 - 78 = 1494.5
    bmr_unspecified = calculate_bmr(65.0, 170.0, 28, "unspecified")
    assert bmr_unspecified == 1494.5


@pytest.mark.asyncio
async def test_tdee_pal_multipliers():
    """Test Physical Activity Level multipliers for all supported categories."""
    assert get_pal_multiplier("Sedentary") == 1.20
    assert get_pal_multiplier("Lightly Active") == 1.375
    assert get_pal_multiplier("Moderately Active") == 1.55
    assert get_pal_multiplier("Very Active") == 1.725
    assert get_pal_multiplier("Extremely Active") == 1.90
    assert get_pal_multiplier("Unknown") == 1.55  # Default fallback


@pytest.mark.asyncio
async def test_goal_caloric_adjustments():
    """Test primary goal and progression pace caloric adjustments."""
    assert calculate_goal_adjustment("maintain", "gradual") == 0.0
    assert calculate_goal_adjustment("improve", "moderate") == 0.0
    assert calculate_goal_adjustment("fat-loss", "gradual") == -350.0
    assert calculate_goal_adjustment("fat-loss", "moderate") == -500.0
    assert calculate_goal_adjustment("muscle", "gradual") == 250.0
    assert calculate_goal_adjustment("muscle", "moderate") == 400.0


@pytest.mark.asyncio
async def test_safety_calorie_boundaries():
    """Test calorie floor (1200 female / 1500 male) and ceiling (4500) enforcement."""
    # Extremely low weight & BMR
    low_bmr = 800.0
    pal = 1.0
    # Female floor -> 1200
    _, target_cal_f, *_ = calculate_macros_and_targets(low_bmr, pal, 40.0, "female", "fat-loss", "moderate")
    assert target_cal_f == 1200.0

    # Male floor -> 1500
    _, target_cal_m, *_ = calculate_macros_and_targets(low_bmr, pal, 40.0, "male", "fat-loss", "moderate")
    assert target_cal_m == 1500.0

    # Extremely high BMR -> ceiling 4500
    high_bmr = 3000.0
    high_pal = 2.0
    _, target_cal_high, *_ = calculate_macros_and_targets(high_bmr, high_pal, 120.0, "male", "muscle", "moderate")
    assert target_cal_high == 4500.0


@pytest.mark.asyncio
async def test_macro_splits_and_fiber_calculations():
    """Test protein g/kg, 25% fat allocation, remaining carbs, and fiber calculation."""
    bmr = 1600.0
    pal = 1.55
    weight_kg = 70.0

    # muscle goal -> 2.0 g/kg protein
    (
        tdee,
        target_cal,
        protein_g,
        carbs_g,
        fat_g,
        fiber_g,
        goal_adj,
        protein_ratio,
    ) = calculate_macros_and_targets(bmr, pal, weight_kg, "male", "muscle", "gradual")

    assert tdee == 2480.0
    assert goal_adj == 250.0
    assert target_cal == 2730.0
    assert protein_ratio == 2.0
    assert protein_g == 140.0  # 70 * 2.0
    assert fat_g >= 40.0
    assert fiber_g >= 30.0  # Male fiber floor


async def get_auth_cookies(client: AsyncClient, email: str) -> dict:
    """Helper to register user, complete onboarding, and return auth cookies."""
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Nutrition Test User",
    })
    assert reg_res.status_code == 201
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    cookies = login_res.cookies

    # Populate profile
    await client.patch("/api/v1/profile", json={
        "age": 30,
        "biological_sex": "male",
        "height_cm": 175.0,
        "weight_kg": 70.0,
        "activity_level": "Moderately Active",
        "primary_goal": "muscle",
        "progression_pace": "gradual",
    }, cookies=cookies)

    return cookies


@pytest.mark.asyncio
async def test_get_user_nutrition_targets_endpoint(client: AsyncClient):
    """Test authenticated GET /api/v1/nutrition/targets."""
    cookies = await get_auth_cookies(client, "nut_targets@poshancare.in")

    response = await client.get("/api/v1/nutrition/targets", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    assert data["bmr"] > 1000.0
    assert data["tdee"] > data["bmr"]
    assert data["target_calories"] > 0
    assert data["target_protein"] == 140.0
    assert data["pal_multiplier"] == 1.55
    assert data["methodology"] == "Mifflin-St Jeor (1990) & ICMR 2024 Guidelines"


@pytest.mark.asyncio
async def test_get_nutrition_targets_missing_profile_rejected(client: AsyncClient):
    """Test GET targets returns 400 Bad Request when user profile biometrics are incomplete."""
    # Register user without completing biometrics
    email = "incomplete_profile@poshancare.in"
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Incomplete User",
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })

    response = await client.get("/api/v1/nutrition/targets", cookies=login_res.cookies)
    assert response.status_code == 400
    res_data = response.json()
    error_msg = res_data.get("error", {}).get("message", "") or res_data.get("detail", "")
    assert "Incomplete user profile" in error_msg


@pytest.mark.asyncio
async def test_stateless_calculate_custom_nutrition(client: AsyncClient):
    """Test POST /api/v1/nutrition/calculate stateless preview endpoint."""
    payload = {
        "age": 28,
        "biological_sex": "female",
        "height_cm": 165.0,
        "weight_kg": 58.0,
        "activity_level": "Lightly Active",
        "primary_goal": "fat-loss",
        "progression_pace": "moderate",
    }
    response = await client.post("/api/v1/nutrition/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["target_calories"] > 1000.0
    assert data["goal_adjustment_calories"] == -500.0


@pytest.mark.asyncio
async def test_unauthenticated_nutrition_endpoints_rejected(client: AsyncClient):
    """Test 401 Unauthorized for unauthenticated GET requests to protected nutrition endpoints."""
    res1 = await client.get("/api/v1/nutrition/targets")
    assert res1.status_code == 401

    res2 = await client.get("/api/v1/nutrition/summary")
    assert res2.status_code == 401


@pytest.mark.asyncio
async def test_nutrition_summary_actual_vs_target(client: AsyncClient):
    """Test GET /api/v1/nutrition/summary returns adherence percentages and macro summaries."""
    cookies = await get_auth_cookies(client, "summary_test@poshancare.in")

    # Get a food item
    foods_resp = await client.get("/api/v1/foods?page_size=1")
    food = foods_resp.json()["items"][0]

    # Log food entry
    await client.post("/api/v1/diary/entries", json={
        "meal_type": "lunch",
        "date": "2026-09-06",
        "food_id": food["id"],
        "quantity": 1.0,
    }, cookies=cookies)

    response = await client.get("/api/v1/nutrition/summary?date=2026-09-06", cookies=cookies)
    assert response.status_code == 200
    data = response.json()

    assert data["date"] == "2026-09-06"
    assert data["consumed_calories"] == food["calories"]
    assert "protein" in data
    assert data["protein"]["consumed"] == food["protein_g"]
    assert data["protein"]["remaining"] == round(data["protein"]["target"] - food["protein_g"], 1)
