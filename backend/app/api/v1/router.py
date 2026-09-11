from fastapi import APIRouter
from app.api.v1.endpoints import (
    account,
    activity,
    analytics,
    auth,
    diary,
    foods,
    goals,
    health,
    health_insights,
    hydration,
    meal_plans,
    notifications,
    nutrition,
    profile,
    recipe,
    report,
    weight,
)

api_v1_router = APIRouter(prefix="/v1")
api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(account.router)
api_v1_router.include_router(profile.router)
api_v1_router.include_router(foods.router)
api_v1_router.include_router(diary.router)
api_v1_router.include_router(nutrition.router)
api_v1_router.include_router(weight.router)
api_v1_router.include_router(hydration.router)
api_v1_router.include_router(activity.router)
api_v1_router.include_router(recipe.router)
api_v1_router.include_router(report.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(meal_plans.router)
api_v1_router.include_router(health_insights.router)
api_v1_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_v1_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])




