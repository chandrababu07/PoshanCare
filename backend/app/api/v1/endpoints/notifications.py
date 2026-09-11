from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationGenerateResponse,
    NotificationListResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    NotificationResponse,
    UnreadCountResponse,
)
from app.services.notifications import (
    generate_user_notifications,
    get_unread_count,
    get_user_notification_preferences,
    get_user_notifications,
    mark_all_as_read,
    mark_as_read,
    update_user_notification_preferences,
)

router = APIRouter()


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    unread_only: bool = Query(False),
    notification_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves health notifications for the authenticated user."""
    items = await get_user_notifications(
        db,
        user_id=current_user.id,
        unread_only=unread_only,
        notification_type=notification_type,
        limit=limit,
    )
    unread_count = await get_unread_count(db, user_id=current_user.id)
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in items],
        total_count=len(items),
        unread_count=unread_count,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def fetch_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the current count of unread notifications for the authenticated user."""
    count = await get_unread_count(db, user_id=current_user.id)
    return UnreadCountResponse(count=count)


@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the notification and reminder preferences for the authenticated user."""
    prefs = await get_user_notification_preferences(db, user_id=current_user.id)
    return NotificationPreferenceResponse.model_validate(prefs)


@router.put("/preferences", response_model=NotificationPreferenceResponse)
async def update_preferences(
    payload: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates notification and reminder preferences for the authenticated user."""
    updated_prefs = await update_user_notification_preferences(
        db, user_id=current_user.id, update_data=payload.model_dump(exclude_unset=True)
    )
    return NotificationPreferenceResponse.model_validate(updated_prefs)


from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from app.core.config import settings
from app.core.rate_limiter import enforce_rate_limit

@router.post("/generate", response_model=NotificationGenerateResponse)
async def generate_notifications(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Triggers telemetry evaluation and generates any new meaningful health notifications for the user."""
    enforce_rate_limit(request, limit=settings.RATE_LIMIT_GENERATE_PER_MINUTE, prefix="notif_gen")
    new_notifs = await generate_user_notifications(db, user_id=current_user.id)
    return NotificationGenerateResponse(
        generated_count=len(new_notifs),
        notifications=[NotificationResponse.model_validate(n) for n in new_notifs],
        message=(
            f"Successfully evaluated telemetry. Generated {len(new_notifs)} new notification(s)."
            if new_notifs
            else "Evaluated telemetry. No new notifications generated."
        ),
    )


@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_single_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marks a single notification as read for the authenticated user."""
    notif = await mark_as_read(db, user_id=current_user.id, notification_id=notification_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied.",
        )
    return NotificationResponse.model_validate(notif)


@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marks all unread notifications as read for the authenticated user."""
    count = await mark_all_as_read(db, user_id=current_user.id)
    return {"count": count, "message": f"Marked {count} notification(s) as read."}
