from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.diary import Meal, MealEntry
from app.models.food import Food
from app.models.recipe import Recipe, RecipeIngredient
from app.schemas.recipe import (
    RecipeCreate,
    RecipeLogToMealRequest,
    RecipeResponse,
    RecipeUpdate,
)


def _build_recipe_response(recipe: Recipe) -> RecipeResponse:
    """Helper to calculate composite batch & per-serving totals and format RecipeResponse."""
    servings = max(1, recipe.servings)
    ingredients = recipe.ingredients or []

    batch_calories = round(sum(ing.calories for ing in ingredients), 1)
    batch_protein = round(sum(ing.protein_g for ing in ingredients), 1)
    batch_carbs = round(sum(ing.carbs_g for ing in ingredients), 1)
    batch_fat = round(sum(ing.fat_g for ing in ingredients), 1)
    batch_fiber = round(sum(ing.fiber_g for ing in ingredients), 1)

    calories_per_serving = round(batch_calories / servings, 1)
    protein_per_serving = round(batch_protein / servings, 1)
    carbs_per_serving = round(batch_carbs / servings, 1)
    fat_per_serving = round(batch_fat / servings, 1)
    fiber_per_serving = round(batch_fiber / servings, 1)

    return RecipeResponse(
        id=recipe.id,
        user_id=recipe.user_id,
        title=recipe.title,
        description=recipe.description,
        servings=recipe.servings,
        portion_weight_grams=recipe.portion_weight_grams,
        prep_time_minutes=recipe.prep_time_minutes,
        image_url=recipe.image_url,
        batch_calories=batch_calories,
        batch_protein=batch_protein,
        batch_carbs=batch_carbs,
        batch_fat=batch_fat,
        batch_fiber=batch_fiber,
        calories_per_serving=calories_per_serving,
        protein_per_serving=protein_per_serving,
        carbs_per_serving=carbs_per_serving,
        fat_per_serving=fat_per_serving,
        fiber_per_serving=fiber_per_serving,
        created_at=recipe.created_at,
        updated_at=recipe.updated_at,
        ingredients=ingredients,
    )


async def get_user_recipes_service(db: AsyncSession, user_id: int) -> List[RecipeResponse]:
    """Retrieve all custom recipes for the current user."""
    stmt = (
        select(Recipe)
        .where(Recipe.user_id == user_id)
        .order_by(Recipe.created_at.desc())
    )
    res = await db.execute(stmt)
    recipes = list(res.scalars().all())
    return [_build_recipe_response(r) for r in recipes]


async def get_recipe_by_id_service(db: AsyncSession, user_id: int, recipe_id: int) -> RecipeResponse:
    """Retrieve single custom recipe by ID for current user."""
    stmt = select(Recipe).where(Recipe.id == recipe_id)
    res = await db.execute(stmt)
    recipe = res.scalar_one_or_none()

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found",
        )
    if recipe.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not own this recipe",
        )
    return _build_recipe_response(recipe)


async def create_recipe_service(db: AsyncSession, user_id: int, payload: RecipeCreate) -> RecipeResponse:
    """Create new custom recipe with ingredients."""
    new_recipe = Recipe(
        user_id=user_id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        servings=payload.servings,
        portion_weight_grams=payload.portion_weight_grams,
        prep_time_minutes=payload.prep_time_minutes,
        image_url=payload.image_url,
    )
    db.add(new_recipe)
    await db.flush()  # Generate new_recipe.id

    for ing in payload.ingredients:
        recipe_ing = RecipeIngredient(
            recipe_id=new_recipe.id,
            food_id=ing.food_id,
            name=ing.name.strip(),
            code=ing.code.strip() if ing.code else None,
            subtext=ing.subtext.strip() if ing.subtext else None,
            batch_measure=ing.batch_measure.strip(),
            calories=ing.calories,
            protein_g=ing.protein_g,
            carbs_g=ing.carbs_g,
            fat_g=ing.fat_g,
            fiber_g=ing.fiber_g,
        )
        db.add(recipe_ing)

    await db.commit()
    await db.refresh(new_recipe)
    return _build_recipe_response(new_recipe)


async def update_recipe_service(
    db: AsyncSession, user_id: int, recipe_id: int, payload: RecipeUpdate
) -> RecipeResponse:
    """Update an existing recipe and optionally replace its ingredients."""
    stmt = select(Recipe).where(Recipe.id == recipe_id)
    res = await db.execute(stmt)
    recipe = res.scalar_one_or_none()

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found",
        )
    if recipe.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not own this recipe",
        )

    if payload.title is not None:
        recipe.title = payload.title.strip()
    if payload.description is not None:
        recipe.description = payload.description.strip() if payload.description else None
    if payload.servings is not None:
        recipe.servings = payload.servings
    if payload.portion_weight_grams is not None:
        recipe.portion_weight_grams = payload.portion_weight_grams
    if payload.prep_time_minutes is not None:
        recipe.prep_time_minutes = payload.prep_time_minutes
    if payload.image_url is not None:
        recipe.image_url = payload.image_url

    if payload.ingredients is not None:
        # Delete existing ingredients
        for ing in list(recipe.ingredients):
            await db.delete(ing)
        await db.flush()

        # Add new ingredients
        for ing in payload.ingredients:
            recipe_ing = RecipeIngredient(
                recipe_id=recipe.id,
                food_id=ing.food_id,
                name=ing.name.strip(),
                code=ing.code.strip() if ing.code else None,
                subtext=ing.subtext.strip() if ing.subtext else None,
                batch_measure=ing.batch_measure.strip(),
                calories=ing.calories,
                protein_g=ing.protein_g,
                carbs_g=ing.carbs_g,
                fat_g=ing.fat_g,
                fiber_g=ing.fiber_g,
            )
            db.add(recipe_ing)

    await db.commit()
    await db.refresh(recipe)
    return _build_recipe_response(recipe)


async def delete_recipe_service(db: AsyncSession, user_id: int, recipe_id: int) -> dict:
    """Delete a custom recipe."""
    stmt = select(Recipe).where(Recipe.id == recipe_id)
    res = await db.execute(stmt)
    recipe = res.scalar_one_or_none()

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found",
        )
    if recipe.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not own this recipe",
        )

    await db.delete(recipe)
    await db.commit()
    return {"message": "Recipe deleted successfully", "recipe_id": recipe_id}


async def log_recipe_to_meal_service(
    db: AsyncSession, user_id: int, recipe_id: int, payload: RecipeLogToMealRequest
) -> dict:
    """Log a portion yield of a custom recipe directly into a meal in the food diary."""
    stmt = select(Recipe).where(Recipe.id == recipe_id)
    res = await db.execute(stmt)
    recipe = res.scalar_one_or_none()

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found",
        )
    if recipe.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not own this recipe",
        )

    # Re-calculate recipe per-serving yield
    recipe_summary = _build_recipe_response(recipe)
    servings_logged = payload.servings_logged

    # Scaling multiplier
    cal = round(recipe_summary.calories_per_serving * servings_logged, 1)
    p = round(recipe_summary.protein_per_serving * servings_logged, 1)
    c = round(recipe_summary.carbs_per_serving * servings_logged, 1)
    f = round(recipe_summary.fat_per_serving * servings_logged, 1)
    fib = round(recipe_summary.fiber_per_serving * servings_logged, 1)

    # Ensure a default baseline food exists in system for custom recipe entries
    food_stmt = select(Food).order_by(Food.id.asc())
    food_res = await db.execute(food_stmt)
    first_food = food_res.scalar_one_or_none()
    food_id = first_food.id if first_food else 1

    # Normalize date
    consumed_at_normalized = payload.consumed_at.replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # Find or create meal for user, date, meal_type
    meal_stmt = select(Meal).where(
        Meal.user_id == user_id,
        Meal.consumed_at == consumed_at_normalized,
        Meal.meal_type == payload.meal_type,
    )
    meal_res = await db.execute(meal_stmt)
    meal = meal_res.scalar_one_or_none()

    if not meal:
        meal = Meal(
            user_id=user_id,
            meal_type=payload.meal_type,
            consumed_at=consumed_at_normalized,
            notes=f"Logged from custom recipe: {recipe.title}",
        )
        db.add(meal)
        await db.flush()

    portion_wt = recipe.portion_weight_grams or 150.0
    entry = MealEntry(
        meal_id=meal.id,
        food_id=food_id,
        quantity=servings_logged,
        serving_name=f"{recipe.title} ({servings_logged} serving{'s' if servings_logged > 1 else ''})",
        serving_gram=portion_wt * servings_logged,
        calories=cal,
        protein_g=p,
        carbs_g=c,
        fat_g=f,
        fiber_g=fib,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(meal)

    return {
        "message": f"Successfully logged {servings_logged} serving(s) of '{recipe.title}' to {payload.meal_type}",
        "meal_id": meal.id,
        "entry_id": entry.id,
        "calories": cal,
        "protein_g": p,
        "carbs_g": c,
        "fat_g": f,
    }
