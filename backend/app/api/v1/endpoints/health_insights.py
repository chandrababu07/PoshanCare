from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.health_insights import HealthInsightsResponse
from app.services.health_insights import get_health_insights_service

router = APIRouter(prefix="/health-insights", tags=["Health Insights"])


@router.get("", response_model=HealthInsightsResponse, status_code=status.HTTP_200_OK)
async def get_health_insights(
    period: str = Query("7d", pattern="^(7d|14d|30d|90d)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves production Health Insights & Action Center payload aggregating REAL database telemetry
    (nutrition, hydration, activity, weight, goals, meal plans).
    
    GUARANTEE: Strictly authenticated and scoped to current_user.id. ZERO fabricated metrics.
    """
    return await get_health_insights_service(
        db=db, current_user=current_user, period_str=period
    )
