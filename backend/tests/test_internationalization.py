import pytest
from httpx import AsyncClient


async def register_and_login(client: AsyncClient, email: str) -> dict:
    """Helper to register user, login, and return auth cookies."""
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "I18n Test User",
    })
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_language_preference_update_and_whitelist(client: AsyncClient):
    """Test updating preferred_language to en, te, hi and rejecting invalid language codes."""
    cookies = await register_and_login(client, "lang_user@poshancare.in")

    # 1. Update to Hindi
    res = await client.patch("/api/v1/profile", json={"preferred_language": "hi"}, cookies=cookies)
    assert res.status_code == 200
    assert res.json()["preferred_language"] == "hi"

    # 2. Update to Telugu
    res = await client.patch("/api/v1/profile", json={"preferred_language": "te"}, cookies=cookies)
    assert res.status_code == 200
    assert res.json()["preferred_language"] == "te"

    # 3. Update to English
    res = await client.patch("/api/v1/profile", json={"preferred_language": "en"}, cookies=cookies)
    assert res.status_code == 200
    assert res.json()["preferred_language"] == "en"

    # 4. Reject arbitrary / invalid language code
    res_bad = await client.patch("/api/v1/profile", json={"preferred_language": "fr_XX_hacked"}, cookies=cookies)
    assert res_bad.status_code in [400, 422]


@pytest.mark.asyncio
async def test_unit_system_and_timezone_preference(client: AsyncClient):
    """Test unit_system (metric/imperial) and timezone preference update and retrieval."""
    cookies = await register_and_login(client, "units_tz_user@poshancare.in")

    # Update unit_system and timezone
    res = await client.patch("/api/v1/profile", json={
        "unit_system": "imperial",
        "timezone": "America/New_York",
    }, cookies=cookies)
    assert res.status_code == 200
    data = res.json()
    assert data["unit_system"] == "imperial"
    assert data["timezone"] == "America/New_York"

    # Verify retrieval
    get_res = await client.get("/api/v1/profile", cookies=cookies)
    assert get_res.status_code == 200
    assert get_res.json()["unit_system"] == "imperial"
    assert get_res.json()["timezone"] == "America/New_York"


@pytest.mark.asyncio
async def test_nutrition_calculations_unaffected_by_language_or_locale(client: AsyncClient):
    """CRITICAL PRINCIPLE: Nutrition calculations MUST NOT change when language or unit system changes."""
    cookies = await register_and_login(client, "calc_invariance@poshancare.in")

    # Complete baseline biometrics
    profile_payload = {
        "profile_type": "adult",
        "age": 30,
        "biological_sex": "male",
        "height_cm": 175.0,
        "weight_kg": 72.0,
        "activity_level": "Moderately Active",
        "primary_goal": "maintain",
        "preferred_language": "en",
        "unit_system": "metric",
    }
    await client.patch("/api/v1/profile", json=profile_payload, cookies=cookies)

    # Fetch baseline targets
    res_en = await client.get("/api/v1/nutrition/targets", cookies=cookies)
    assert res_en.status_code == 200
    targets_en = res_en.json()

    # Switch language to Hindi and unit system to Imperial
    await client.patch("/api/v1/profile", json={
        "preferred_language": "hi",
        "unit_system": "imperial",
        "timezone": "Asia/Kolkata",
    }, cookies=cookies)

    res_hi = await client.get("/api/v1/nutrition/targets", cookies=cookies)
    assert res_hi.status_code == 200
    targets_hi = res_hi.json()

    # Switch language to Telugu
    await client.patch("/api/v1/profile", json={
        "preferred_language": "te",
    }, cookies=cookies)

    res_te = await client.get("/api/v1/nutrition/targets", cookies=cookies)
    assert res_te.status_code == 200
    targets_te = res_te.json()

    # All nutritional calculations MUST BE EXACTLY IDENTICAL
    assert targets_en["bmr"] == targets_hi["bmr"] == targets_te["bmr"]
    assert targets_en["tdee"] == targets_hi["tdee"] == targets_te["tdee"]
    assert targets_en["target_calories"] == targets_hi["target_calories"] == targets_te["target_calories"]
    assert targets_en["target_protein"] == targets_hi["target_protein"] == targets_te["target_protein"]
    assert targets_en["target_carbs"] == targets_hi["target_carbs"] == targets_te["target_carbs"]
    assert targets_en["target_fat"] == targets_hi["target_fat"] == targets_te["target_fat"]


@pytest.mark.asyncio
async def test_user_isolation_locale_preferences(client: AsyncClient):
    """User A changing language does not change User B's language."""
    cookies_a = await register_and_login(client, "user_a_i18n@poshancare.in")
    cookies_b = await register_and_login(client, "user_b_i18n@poshancare.in")

    # User A sets Hindi
    await client.patch("/api/v1/profile", json={"preferred_language": "hi"}, cookies=cookies_a)

    # User B remains default English
    res_b = await client.get("/api/v1/profile", cookies=cookies_b)
    assert res_b.status_code == 200
    assert res_b.json()["preferred_language"] == "en"
