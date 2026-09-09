import pytest
from httpx import AsyncClient


async def get_auth_cookies(client: AsyncClient, email: str) -> dict:
    """Helper to register user and return auth cookies."""
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Recipe Test User",
    })
    assert reg_res.status_code == 201
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_get_recipes_unauthenticated(client: AsyncClient):
    """Unauthenticated request to GET /api/v1/recipes must return 401 Unauthorized."""
    res = await client.get("/api/v1/recipes")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_create_and_get_recipe(client: AsyncClient):
    """Test creating a custom recipe and verifying composite nutrient calculations."""
    cookies = await get_auth_cookies(client, "recipe_creator@poshancare.in")

    payload = {
        "title": "High-Protein Paneer Soya Bhurji",
        "description": "Slow-tossed low-fat cottage cheese with defatted soya minced scramble.",
        "servings": 4,
        "portion_weight_grams": 185.0,
        "prep_time_minutes": 20,
        "ingredients": [
            {
                "name": "Low-fat Paneer",
                "code": "IFCT-D041",
                "subtext": "Moisture 58%",
                "batch_measure": "250g",
                "calories": 435.0,
                "protein_g": 45.0,
                "carbs_g": 6.0,
                "fat_g": 25.0,
                "fiber_g": 0.0,
            },
            {
                "name": "Defatted Soya Chunks",
                "code": "IFCT-L019",
                "subtext": "100g dry yield",
                "batch_measure": "100g",
                "calories": 345.0,
                "protein_g": 52.0,
                "carbs_g": 33.0,
                "fat_g": 0.5,
                "fiber_g": 12.0,
            },
        ],
    }

    # Create recipe
    res = await client.post("/api/v1/recipes", json=payload, cookies=cookies)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "High-Protein Paneer Soya Bhurji"
    assert data["servings"] == 4
    assert data["batch_calories"] == 780.0
    assert data["batch_protein"] == 97.0
    assert data["calories_per_serving"] == 195.0
    assert data["protein_per_serving"] == 24.2 or data["protein_per_serving"] == 24.3
    assert len(data["ingredients"]) == 2
    recipe_id = data["id"]

    # List recipes
    list_res = await client.get("/api/v1/recipes", cookies=cookies)
    assert list_res.status_code == 200
    recipes = list_res.json()
    assert len(recipes) >= 1
    assert any(r["id"] == recipe_id for r in recipes)

    # Get single recipe
    get_res = await client.get(f"/api/v1/recipes/{recipe_id}", cookies=cookies)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == recipe_id


@pytest.mark.asyncio
async def test_update_recipe(client: AsyncClient):
    """Test updating a custom recipe title, servings, and ingredients."""
    cookies = await get_auth_cookies(client, "recipe_updater@poshancare.in")

    create_payload = {
        "title": "Sprouted Moong Khichdi",
        "servings": 2,
        "prep_time_minutes": 15,
        "ingredients": [
            {
                "name": "Sprouted Moong",
                "batch_measure": "150g",
                "calories": 200.0,
                "protein_g": 14.0,
                "carbs_g": 30.0,
                "fat_g": 1.0,
                "fiber_g": 6.0,
            }
        ],
    }
    create_res = await client.post("/api/v1/recipes", json=create_payload, cookies=cookies)
    assert create_res.status_code == 201
    recipe_id = create_res.json()["id"]

    # Update recipe servings to 4
    update_payload = {
        "title": "Sprouted Moong Dal Khichdi (Updated)",
        "servings": 4,
    }
    update_res = await client.put(f"/api/v1/recipes/{recipe_id}", json=update_payload, cookies=cookies)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["title"] == "Sprouted Moong Dal Khichdi (Updated)"
    assert updated_data["servings"] == 4
    assert updated_data["calories_per_serving"] == 50.0


@pytest.mark.asyncio
async def test_delete_recipe(client: AsyncClient):
    """Test deleting a custom recipe."""
    cookies = await get_auth_cookies(client, "recipe_deleter@poshancare.in")

    create_payload = {
        "title": "Recipe to Delete",
        "servings": 1,
        "ingredients": [
            {
                "name": "Sample Ingredient",
                "batch_measure": "100g",
                "calories": 100.0,
                "protein_g": 5.0,
                "carbs_g": 10.0,
                "fat_g": 2.0,
            }
        ],
    }
    create_res = await client.post("/api/v1/recipes", json=create_payload, cookies=cookies)
    assert create_res.status_code == 201
    recipe_id = create_res.json()["id"]

    # Delete recipe
    del_res = await client.delete(f"/api/v1/recipes/{recipe_id}", cookies=cookies)
    assert del_res.status_code == 200
    assert del_res.json()["recipe_id"] == recipe_id

    # Verify 404
    get_res = await client.get(f"/api/v1/recipes/{recipe_id}", cookies=cookies)
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_log_recipe_to_meal(client: AsyncClient):
    """Test logging a custom recipe serving directly into a food diary meal."""
    cookies = await get_auth_cookies(client, "recipe_logger@poshancare.in")

    create_payload = {
        "title": "Oats Ragi Dosa",
        "servings": 2,
        "portion_weight_grams": 160.0,
        "ingredients": [
            {
                "name": "Oats Flour",
                "batch_measure": "100g",
                "calories": 380.0,
                "protein_g": 14.0,
                "carbs_g": 66.0,
                "fat_g": 7.0,
            }
        ],
    }
    create_res = await client.post("/api/v1/recipes", json=create_payload, cookies=cookies)
    assert create_res.status_code == 201
    recipe_id = create_res.json()["id"]

    # Log 1 serving to lunch
    log_payload = {
        "meal_type": "lunch",
        "consumed_at": "2026-09-07T13:00:00Z",
        "servings_logged": 1.0,
    }
    log_res = await client.post(f"/api/v1/recipes/{recipe_id}/log", json=log_payload, cookies=cookies)
    assert log_res.status_code == 200
    log_data = log_res.json()
    assert "Successfully logged" in log_data["message"]
    assert log_data["calories"] == 190.0
    assert log_data["protein_g"] == 7.0


@pytest.mark.asyncio
async def test_cross_user_recipe_isolation(client: AsyncClient):
    """Verify strict user isolation so User B cannot access or modify User A's recipe."""
    cookies_a = await get_auth_cookies(client, "user_a_recipe@poshancare.in")
    cookies_b = await get_auth_cookies(client, "user_b_recipe@poshancare.in")

    # User A creates recipe
    create_payload = {
        "title": "User A Private Recipe",
        "servings": 1,
        "ingredients": [
            {
                "name": "Secret Ingredient",
                "batch_measure": "50g",
                "calories": 50.0,
                "protein_g": 1.0,
                "carbs_g": 5.0,
                "fat_g": 1.0,
            }
        ],
    }
    res_a = await client.post("/api/v1/recipes", json=create_payload, cookies=cookies_a)
    assert res_a.status_code == 201
    recipe_id = res_a.json()["id"]

    # User B attempts GET -> 403 Forbidden
    get_b = await client.get(f"/api/v1/recipes/{recipe_id}", cookies=cookies_b)
    assert get_b.status_code == 403

    # User B attempts DELETE -> 403 Forbidden
    del_b = await client.delete(f"/api/v1/recipes/{recipe_id}", cookies=cookies_b)
    assert del_b.status_code == 403


@pytest.mark.asyncio
async def test_invalid_recipe_payload_rejected(client: AsyncClient):
    """Verify invalid payloads (empty title, 0 servings) return 422 Unprocessable Entity."""
    cookies = await get_auth_cookies(client, "invalid_recipe@poshancare.in")

    invalid_payload = {
        "title": "",
        "servings": 0,
        "ingredients": [],
    }
    res = await client.post("/api/v1/recipes", json=invalid_payload, cookies=cookies)
    assert res.status_code == 422
