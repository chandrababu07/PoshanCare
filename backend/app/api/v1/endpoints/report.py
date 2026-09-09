from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.report import (
    ClinicalReportMetricsResponse,
    ClinicalReportSummaryResponse,
    GenerateReportRequest,
)
from app.services.report import (
    generate_clinical_report_service,
    get_clinical_report_metrics_service,
    get_user_report_history_service,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/metrics", response_model=ClinicalReportMetricsResponse, status_code=status.HTTP_200_OK)
async def get_clinical_report_metrics(
    report_type: str = Query("7day", pattern="^(7day|30day|custom)$"),
    anonymize: bool = Query(False),
    attach_letterhead: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve live clinical nutrition audit metrics for dossier preview."""
    return await get_clinical_report_metrics_service(
        db=db,
        current_user=current_user,
        report_type=report_type,
        anonymize=anonymize,
        attach_letterhead=attach_letterhead,
    )


@router.post("/generate", response_model=ClinicalReportSummaryResponse, status_code=status.HTTP_201_CREATED)
async def generate_clinical_report(
    request: GenerateReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate and record an official clinical nutrition report audit log."""
    return await generate_clinical_report_service(
        db=db, current_user=current_user, request=request
    )


@router.get("/history", response_model=List[ClinicalReportSummaryResponse], status_code=status.HTTP_200_OK)
async def get_user_report_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve list of generated clinical report audit records for current user."""
    return await get_user_report_history_service(db=db, user_id=current_user.id)
