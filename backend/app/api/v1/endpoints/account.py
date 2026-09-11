from datetime import datetime, timezone
import json
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.api.v1.endpoints.auth import clear_auth_cookies
from app.db.session import get_db
from app.models.user import User
from app.schemas.account import (
    AccountDeleteResponse,
    AccountSummaryResponse,
    HealthDataExportResponse,
)
from app.services.account import (
    delete_user_account,
    export_account_data,
    get_account_summary,
)

router = APIRouter(prefix="/account", tags=["Account & Privacy Controls"])


from fastapi import APIRouter, Depends, Request, Response, status
from app.core.config import settings
from app.core.rate_limiter import enforce_rate_limit

@router.get(
    "/summary",
    response_model=AccountSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated user account summary & record counts",
)
async def get_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AccountSummaryResponse:
    """Return real account statistics and category record counts for the authenticated user."""
    return await get_account_summary(db, current_user)


@router.get(
    "/export",
    response_model=HealthDataExportResponse,
    status_code=status.HTTP_200_OK,
    summary="Export authenticated user health data as JSON download",
)
async def export_data(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Generate a structured, downloadable JSON export containing all personal health data for current_user."""
    enforce_rate_limit(request, limit=settings.RATE_LIMIT_ACCOUNT_PER_MINUTE, prefix="account_export")
    export_payload = await export_account_data(db, current_user)
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    filename = f"poshancare-health-data-{date_str}.json"

    json_str = export_payload.model_dump_json(indent=2)

    return Response(
        content=json_str,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    )


@router.delete(
    "",
    response_model=AccountDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Permanently delete authenticated user account & personal health records",
)
async def delete_account(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AccountDeleteResponse:
    """Delete authenticated user account, purge personal health data, and invalidate session cookies."""
    enforce_rate_limit(request, limit=settings.RATE_LIMIT_ACCOUNT_PER_MINUTE, prefix="account_delete")
    await delete_user_account(db, current_user)
    clear_auth_cookies(response)
    return AccountDeleteResponse(
        status="success",
        message="Your PoshanCare account and associated personal health data have been permanently deleted.",
    )
