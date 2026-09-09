import pytest
from httpx import AsyncClient


async def get_auth_cookies(client: AsyncClient, email: str) -> dict:
    """Helper to register user and return auth cookies."""
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Dr. Report User",
    })
    assert reg_res.status_code == 201
    login_res = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!",
    })
    return login_res.cookies


@pytest.mark.asyncio
async def test_unauthenticated_reports_access(client: AsyncClient):
    """Unauthenticated request to GET /api/v1/reports/metrics must return 401."""
    res = await client.get("/api/v1/reports/metrics")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_report_metrics(client: AsyncClient):
    """Test retrieving live report metrics for dossier preview."""
    cookies = await get_auth_cookies(client, "report_user@poshancare.in")

    res = await client.get("/api/v1/reports/metrics?report_type=7day", cookies=cookies)
    assert res.status_code == 200
    data = res.json()
    assert "documentId" in data
    assert "issueDate" in data
    assert data["patientName"] == "Dr. Report User"
    assert "weeklyCalorieHistory" in data
    assert len(data["weeklyCalorieHistory"]) == 7
    assert data["icmrTargetLine"] > 0


@pytest.mark.asyncio
async def test_get_report_metrics_anonymized(client: AsyncClient):
    """Test anonymize flag redacts patient full name."""
    cookies = await get_auth_cookies(client, "anonymized_user@poshancare.in")

    res = await client.get("/api/v1/reports/metrics?anonymize=true", cookies=cookies)
    assert res.status_code == 200
    data = res.json()
    assert data["patientName"].startswith("Patient #")


@pytest.mark.asyncio
async def test_generate_report_and_history(client: AsyncClient):
    """Test generating a clinical report audit record and listing history."""
    cookies = await get_auth_cookies(client, "generate_report@poshancare.in")

    payload = {
        "report_type": "7day",
        "attach_letterhead": True,
        "anonymize": False,
    }
    gen_res = await client.post("/api/v1/reports/generate", json=payload, cookies=cookies)
    assert gen_res.status_code == 201
    gen_data = gen_res.json()
    assert "document_id" in gen_data
    assert gen_data["report_type"] == "7day"
    assert gen_data["attach_letterhead"] is True

    # List history
    hist_res = await client.get("/api/v1/reports/history", cookies=cookies)
    assert hist_res.status_code == 200
    reports = hist_res.json()
    assert len(reports) >= 1
    assert reports[0]["id"] == gen_data["id"]


@pytest.mark.asyncio
async def test_cross_user_report_isolation(client: AsyncClient):
    """Verify strict user isolation so User B cannot view User A's generated report history."""
    cookies_a = await get_auth_cookies(client, "user_a_report@poshancare.in")
    cookies_b = await get_auth_cookies(client, "user_b_report@poshancare.in")

    # User A generates report
    gen_res_a = await client.post(
        "/api/v1/reports/generate",
        json={"report_type": "7day"},
        cookies=cookies_a,
    )
    assert gen_res_a.status_code == 201
    id_a = gen_res_a.json()["id"]

    # User B checks history -> should NOT contain User A's report
    hist_b = await client.get("/api/v1/reports/history", cookies=cookies_b)
    assert hist_b.status_code == 200
    reports_b = hist_b.json()
    assert not any(r["id"] == id_a for r in reports_b)


@pytest.mark.asyncio
async def test_invalid_report_type_rejected(client: AsyncClient):
    """Verify invalid report_type parameter returns 422 Unprocessable Entity."""
    cookies = await get_auth_cookies(client, "invalid_report@poshancare.in")

    res = await client.get("/api/v1/reports/metrics?report_type=invalid_range", cookies=cookies)
    assert res.status_code == 422
