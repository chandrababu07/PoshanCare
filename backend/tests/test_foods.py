import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_foods_default_and_seeding(client: AsyncClient):
    """Test GET /api/v1/foods triggers auto-seeding and returns paginated list."""
    response = await client.get("/api/v1/foods")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] == 12
    assert data["page"] == 1
    assert data["page_size"] == 20
    assert len(data["items"]) == 12

    first_item = data["items"][0]
    assert "id" in first_item
    assert "name" in first_item
    assert "category" in first_item
    assert "calories_per_100g" in first_item


@pytest.mark.asyncio
async def test_search_foods(client: AsyncClient):
    """Test searching foods by query string."""
    response = await client.get("/api/v1/foods", params={"search": "Potato"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Potato" in item["name"] for item in data["items"])

    # Search by alternate name
    response_alt = await client.get("/api/v1/foods", params={"search": "Batata"})
    assert response_alt.status_code == 200
    data_alt = response_alt.json()
    assert data_alt["total"] >= 1
    assert any("Potato Bonda" in item["name"] for item in data_alt["items"])


@pytest.mark.asyncio
async def test_category_filter(client: AsyncClient):
    """Test filtering foods by category."""
    response = await client.get("/api/v1/foods", params={"category": "Snacks & Street Food"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["category"] == "Snacks & Street Food"


@pytest.mark.asyncio
async def test_region_filter(client: AsyncClient):
    """Test filtering foods by region."""
    response = await client.get("/api/v1/foods", params={"region": "South India"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert "South India" in item["region"]


@pytest.mark.asyncio
async def test_vegetarian_filter(client: AsyncClient):
    """Test filtering foods by vegetarian flag."""
    response = await client.get("/api/v1/foods", params={"is_vegetarian": "false"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["is_vegetarian"] is False


@pytest.mark.asyncio
async def test_get_food_by_id_success(client: AsyncClient):
    """Test retrieving single food by valid ID."""
    list_resp = await client.get("/api/v1/foods", params={"page_size": 1})
    food_id = list_resp.json()["items"][0]["id"]

    response = await client.get(f"/api/v1/foods/{food_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == food_id
    assert "portions" in data
    assert len(data["portions"]) >= 1


@pytest.mark.asyncio
async def test_get_food_by_id_not_found(client: AsyncClient):
    """Test 404 response for non-existent food ID."""
    response = await client.get("/api/v1/foods/99999")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "HTTP_404"


@pytest.mark.asyncio
async def test_get_categories(client: AsyncClient):
    """Test retrieving unique categories endpoint."""
    response = await client.get("/api/v1/foods/categories")
    assert response.status_code == 200
    categories = response.json()
    assert isinstance(categories, list)
    assert "Snacks & Street Food" in categories
    assert "Rice & Millets" in categories


@pytest.mark.asyncio
async def test_get_regions(client: AsyncClient):
    """Test retrieving unique regions endpoint."""
    response = await client.get("/api/v1/foods/regions")
    assert response.status_code == 200
    regions = response.json()
    assert isinstance(regions, list)
    assert len(regions) >= 1


@pytest.mark.asyncio
async def test_invalid_pagination_params(client: AsyncClient):
    """Test validation errors on invalid page/page_size parameters."""
    response = await client.get("/api/v1/foods", params={"page": 0})
    assert response.status_code == 422

    response_size = await client.get("/api/v1/foods", params={"page_size": 500})
    assert response_size.status_code == 422
