from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import PoshanCareException
from app.db.session import get_db
from app.models.health import HealthCheckRecord
from app.schemas.health import DatabaseHealthResponse, HealthResponse

router = APIRouter(prefix="/health", tags=["Health & Monitoring"])


@router.get(
    "",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Application Health Status",
)
async def get_health_status() -> HealthResponse:
    """Return basic health, version, environment, and server timestamp."""
    return HealthResponse(
        status="healthy",
        environment=settings.ENVIRONMENT,
        version="0.1.0",
        timestamp=datetime.now(timezone.utc),
    )


@router.get(
    "/db",
    response_model=DatabaseHealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Database Connection & Readiness Status",
)
async def get_database_health(
    db: AsyncSession = Depends(get_db),
) -> DatabaseHealthResponse:
    """Perform a database query check to verify connection and session pool health."""
    try:
        # Query total count of health records
        result = await db.execute(select(func.count()).select_from(HealthCheckRecord))
        count = result.scalar_one_or_none() or 0

        dialect_name = db.bind.dialect.name if db.bind else "unknown"

        return DatabaseHealthResponse(
            status="healthy",
            database="connected",
            dialect=dialect_name,
            record_count=count,
            timestamp=datetime.now(timezone.utc),
        )
    except Exception as err:
        raise PoshanCareException(
            message=f"Database connectivity health check failed: {str(err)}",
            code="DATABASE_UNAVAILABLE",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
