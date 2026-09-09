from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.profile import UserProfile
from app.schemas.goal import (
    GoalCreateRequest,
    GoalUpdateRequest,
    GoalResponse,
    GoalProgressResponse,
    CoachingInsightResponse,
    GoalDashboardResponse,
)
from app.services.goals import (
    create_health_goal,
    get_user_health_goals,
    get_health_goal_by_id,
    update_health_goal,
    complete_health_goal,
    archive_health_goal,
    calculate_goal_progress,
)
from app.services.coaching import generate_adaptive_coaching_insights


router = APIRouter()


@router.get("", response_model=List[GoalResponse])
async def list_goals(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves all health goals for the authenticated user."""
    goals = await get_user_health_goals(db, current_user.id, status_filter=status_filter)
    return [GoalResponse.model_validate(g) for g in goals]


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    request: GoalCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new personal health goal with pediatric safety validation."""
    goal = await create_health_goal(db, current_user.id, request)
    return GoalResponse.model_validate(goal)


@router.get("/dashboard", response_model=GoalDashboardResponse)
async def get_goals_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns aggregated goals dashboard with active goal progress and adaptive coaching insights."""
    # 1. Fetch User Persona
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = prof_res.scalar_one_or_none()
    persona = profile.profile_type if profile else "adult"

    # 2. Fetch Active Goals & Evaluate Progress
    all_goals = await get_user_health_goals(db, current_user.id)
    active_goals = [g for g in all_goals if g.status == "active"]
    completed_goals = [g for g in all_goals if g.status == "completed"]

    active_progress: List[GoalProgressResponse] = []
    for goal in active_goals:
        prog = await calculate_goal_progress(db, current_user.id, goal)
        active_progress.append(prog)

    # 3. Generate Adaptive Coaching Insights
    insights = await generate_adaptive_coaching_insights(db, current_user.id)

    # 4. Summary Data Quality
    if not active_goals:
        summary_quality = "no_goals"
    elif any(p.has_data for p in active_progress):
        summary_quality = "sufficient_data"
    else:
        summary_quality = "no_data"

    return GoalDashboardResponse(
        active_goals=active_progress,
        completed_goals_count=len(completed_goals),
        total_goals_count=len(all_goals),
        coaching_insights=insights,
        data_quality_summary=summary_quality,
        persona=persona,
    )


@router.get("/coaching/insights", response_model=List[CoachingInsightResponse])
async def get_coaching_insights_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves current adaptive coaching insights for authenticated user."""
    return await generate_adaptive_coaching_insights(db, current_user.id)


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal_details(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves details for a single goal."""
    goal = await get_health_goal_by_id(db, current_user.id, goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return GoalResponse.model_validate(goal)


@router.get("/{goal_id}/progress", response_model=GoalProgressResponse)
async def get_goal_progress_endpoint(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculates real-data progress evaluation for a single goal."""
    goal = await get_health_goal_by_id(db, current_user.id, goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return await calculate_goal_progress(db, current_user.id, goal)


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal_endpoint(
    goal_id: int,
    request: GoalUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates fields or status of an existing health goal."""
    goal = await update_health_goal(db, current_user.id, goal_id, request)
    return GoalResponse.model_validate(goal)


@router.post("/{goal_id}/complete", response_model=GoalResponse)
async def complete_goal_endpoint(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marks a health goal as completed."""
    goal = await complete_health_goal(db, current_user.id, goal_id)
    return GoalResponse.model_validate(goal)


@router.delete("/{goal_id}", response_model=GoalResponse)
async def archive_goal_endpoint(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Archives a health goal."""
    goal = await archive_health_goal(db, current_user.id, goal_id)
    return GoalResponse.model_validate(goal)
