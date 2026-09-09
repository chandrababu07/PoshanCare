from fastapi import APIRouter
from app.api.v1.endpoints import analytics, auth, diary, foods, health, nutrition, profile, recipe, report, weight

api_v1_router = APIRouter(prefix="/v1")
api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(profile.router)
api_v1_router.include_router(foods.router)
api_v1_router.include_router(diary.router)
api_v1_router.include_router(nutrition.router)
api_v1_router.include_router(weight.router)
api_v1_router.include_router(recipe.router)
api_v1_router.include_router(report.router)
api_v1_router.include_router(analytics.router)



