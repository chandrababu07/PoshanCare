from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.analytics import DashboardAnalyticsResponse
from app.services.analytics import get_dashboard_analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardAnalyticsResponse, status_code=status.HTTP_200_OK)
async def get_dashboard_analytics(
    period: str = Query("30d", pattern="^(7d|14d|30d|90d|6m|1y)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve longitudinal clinical analytics, nutrition adherence metrics,
    trajectory trends, and observational health insights for current user.
    """
    return await get_dashboard_analytics_service(
        db=db, current_user=current_user, period_str=period
    )
