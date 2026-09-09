from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationGenerateResponse,
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.services.notifications import (
    generate_user_notifications,
    get_unread_count,
    get_user_notifications,
    mark_all_as_read,
    mark_as_read,
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


@router.post("/generate", response_model=NotificationGenerateResponse)
async def generate_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Triggers telemetry evaluation and generates any new meaningful health notifications for the user."""
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
