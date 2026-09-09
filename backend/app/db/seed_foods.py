"""
Deterministic Seed Script for PoshanCare Food Database.
Seeds initial ICMR-NIN IFCT reference food items if the database table is empty.
"""
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.food import Food, FoodPortion

INITIAL_FOOD_SEED_DATA = [
    {
        "ifct_code": "IFCT-S014",
        "name": "Potato Bonda",
        "alternate_name": "Batata Vada / Aloo Bonda",
        "category": "Snacks & Street Food",
        "region": "South / West",
        "is_vegetarian": True,
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuDT_0yGq64uTnyt7zkCF5ZGHqkpEr_JPXoGVwR_Xw2yXj1ryi24A2riJN63IDmM67BIx9P4JogWtpTA7EbskvdiKCOB_HZwA7ThtkBzbD5Pd8l_mOpo-VESxJ63C7dHHXyuNZ3rhrSNiwJBiYp67q395Jt3U-GmHhDJgKgLLvxBhaSBiBpW460UGxaD8_awg3_KW7tNQP_oObvmydcR-w-DnVX4s9AFV2sB3tsZ45Fpa0EpcTBIeaQ",
        "serving_size_name": "1 piece (35g)",
        "serving_size_g": 35.0,
        "calories": 98.0,
        "protein_g": 2.0,
        "carbs_g": 12.0,
        "fat_g": 5.0,
        "fiber_g": 1.2,
        "portions": [
            {"portion_name": "1 piece", "gram_weight": 35.0, "is_default": True},
            {"portion_name": "Plate of 2", "gram_weight": 70.0, "is_default": False},
        ],
    },
    {
        "ifct_code": "IFCT-G002",
        "name": "Steamed Sona Masoori Rice",
        "alternate_name": "Cooked White Rice",
        "category": "Rice & Millets",
        "region": "South India",
        "is_vegetarian": True,
        "image_url": None,
        "serving_size_name": "1.5 cup (200g)",
        "serving_size_g": 200.0,
        "calories": 260.0,
        "protein_g": 5.2,
        "carbs_g": 57.8,
        "fat_g": 0.4,
        "fiber_g": 1.8,
        "portions": [
            {"portion_name": "1.5 cup", "gram_weight": 200.0, "is_default": True},
            {"portion_name": "1 cup", "gram_weight": 135.0, "is_default": False},
            {"portion_name": "Half cup", "gram_weight": 70.0, "is_default": False},
        ],
    },
    {
        "ifct_code": "IFCT-L005",
        "name": "Dal Tadka (Toor Dal with Ghee)",
        "alternate_name": "Arhar Dal Fry",
        "category": "Dal & Pulses",
        "region": "Pan-India",
        "is_vegetarian": True,
        "image_url": None,
        "serving_size_name": "1 bowl (150g)",
        "serving_size_g": 150.0,
        "calories": 215.0,
        "protein_g": 10.4,
        "carbs_g": 24.2,
        "fat_g": 7.8,
        "fiber_g": 4.5,
        "portions": [
            {"portion_name": "1 bowl", "gram_weight": 150.0, "is_default": True},
            {"portion_name": "1 katori", "gram_weight": 120.0, "is_default": False},
        ],
    },
    {
        "ifct_code": "IFCT-D041",
        "name": "Paneer Bhurji",
        "alternate_name": "Spiced Crumbled Cottage Cheese",
        "category": "Curries & Dairy",
        "region": "North India",
        "is_vegetarian": True,
        "image_url": None,
        "serving_size_name": "1 katori (120g)",
        "serving_size_g": 120.0,
        "calories": 290.0,
        "protein_g": 16.5,
        "carbs_g": 6.4,
        "fat_g": 16.2,
        "fiber_g": 1.1,
        "portions": [
            {"portion_name": "1 katori", "gram_weight": 120.0, "is_default": True},
            {"portion_name": "1 bowl", "gram_weight": 180.0, "is_default": False},
        ],
    },
    {
        "ifct_code": "IFCT-E001",
        "name": "Boiled Eggs (Large)",
        "alternate_name": "Hard Boiled Hen Egg",
        "category": "Egg & Poultry",
        "region": "Pan-India",
        "is_vegetarian": False,
        "image_url": None,
        "serving_size_name": "3 eggs (150g)",
        "serving_size_g": 150.0,
        "calories": 210.0,
        "protein_g": 18.6,
        "carbs_g": 1.2,
        "fat_g": 15.3,
        "fiber_g": 0.0,
        "portions": [
            {"portion_name": "3 eggs", "gram_weight": 150.0, "is_default": True},
            {"portion_name": "1 egg", "gram_weight": 50.0, "is_default": False},
            {"portion_name": "2 eggs", "gram_weight": 100.0, "is_default": False},
        ],
    },
    {
        "ifct_code": "IFCT-F012",
        "name": "Robusta Banana",
        "alternate_name": "Fresh Yellow Banana",
        "category": "Fruits & Nuts",
        "region": "Pan-India",
        "is_vegetarian": True,
        "image_url": None,
        "serving_size_name": "1 medium fruit (120g)",
        "serving_size_g": 120.0,
        "calories": 105.0,
        "protein_g": 1.3,
        "carbs_g": 27.0,
        "fat_g": 0.3,
        "fiber_g": 3.1,
        "portions": [
            {"portion_name": "1 medium fruit", "gram_weight": 120.0, "is_default": True},
            {"portion_name": "1 large fruit", "gram_weight": 150.0, "is_default": False},
        ],
    },
    {
        "ifct_code": "IFCT-D001",
        "name": "Full Cream Buffalo Milk",
        "alternate_name": "Boiled Unsweetened Milk",
        "category": "Dairy",
        "region": "Pan-India",
        "is_vegetarian": True,
        "image_url": None,
        "serving_size_name": "1 glass (200ml)",
        "serving_size_g": 200.0,
        "calories": 150.0,
        "protein_g": 8.6,
        "carbs_g": 10.2,
        "fat_g": 13.0,
        "fiber_g": 0.0,
        "portions": [
            {"portion_name": "1 glass", "gram_weight": 200.0, "is_default": True},
            {"portion_name": "1 cup", "gram_weight": 150.0, "is_default": False},
        ],
    },
    {
        "ifct_code": "IFCT-G022",
        "name": "Whole Wheat Phulka (Roti)",
        "alternate_name": "Desi Ghee Rotis",
        "category": "Breads & Flatbreads",
        "region": "Pan-India",
        "is_vegetarian": True,
        "image_url": None,
        "serving_size_name": "3 rotis (90g)",
        "serving_size_g": 90.0,
        "calories": 240.0,
        "protein_g": 8.1,
        "carbs_g": 48.0,
        "fat_g": 3.8,
        "fiber_g": 5.2,
        "portions": [
            {"portion_name": "3 rotis", "gram_weight": 90.0, "is_default": True},
            {"portion_name": "1 roti", "gram_weight": 30.0, "is_default": False},
            {"portion_name": "2 rotis", "gram_weight": 60.0, "is_default": False},
        ],
    },
    {
        "ifct_code": "IFCT-L011",
        "name": "Roasted Chana (With Husk)",
        "alternate_name": "Bhuna Chana",
        "category": "Snacks & Legumes",
        "region": "North / West",
        "is_vegetarian": True,
        "image_url": None,
        "serving_size_name": "1 bowl (50g)",
        "serving_size_g": 50.0,
        "calories": 180.0,
        "protein_g": 9.3,
        "carbs_g": 29.2,
        "fat_g": 2.6,
        "fiber_g": 6.1,
        "portions": [
            {"portion_name": "1 bowl", "gram_weight": 50.0, "is_default": True},
            {"portion_name": "Handful", "gram_weight": 25.0, "is_default": False},
        ],
    },
    {
        "ifct_code": "IFCT-B004",
        "name": "Masala Chai",
        "alternate_name": "Indian Spiced Tea with Jaggery",
        "category": "Beverages",
        "region": "Pan-India",
        "is_vegetarian": True,
        "image_url": None,
        "serving_size_name": "1 cup (150ml)",
        "serving_size_g": 150.0,
        "calories": 95.0,
        "protein_g": 2.8,
        "carbs_g": 14.2,
        "fat_g": 3.1,
        "fiber_g": 0.0,
        "portions": [
            {"portion_name": "1 cup", "gram_weight": 150.0, "is_default": True},
            {"portion_name": "Kulhad", "gram_weight": 200.0, "is_default": False},
        ],
    },
    {
        "ifct_code": "IFCT-M008",
        "name": "Methi Chicken Curry",
        "alternate_name": "Fenugreek Chicken",
        "category": "Poultry & Meat",
        "region": "North India",
        "is_vegetarian": False,
        "image_url": None,
        "serving_size_name": "1 bowl (180g)",
        "serving_size_g": 180.0,
        "calories": 340.0,
        "protein_g": 24.2,
        "carbs_g": 14.8,
        "fat_g": 16.5,
        "fiber_g": 2.0,
        "portions": [
            {"portion_name": "1 bowl", "gram_weight": 180.0, "is_default": True},
            {"portion_name": "Half portion", "gram_weight": 100.0, "is_default": False},
        ],
    },
    {
        "ifct_code": "IFCT-L030",
        "name": "Sprouted Moong Khichdi",
        "alternate_name": "Moong Dal & Rice Porridge",
        "category": "Rice & Pulses",
        "region": "Pan-India",
        "is_vegetarian": True,
        "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuCF5ORY65h828zsLdf2L-RBXFAFesjLib-dzmVroprxLHk9E7ZncGO5gCa1GlBdUqDPKvIpYRRzyrNBwApb4z8vvrmC4RqCZf2AeJBqwQccwhuYQulakNRWCdg79FNJ-Ww4pO6pjLe2ydvgNM2KO6kZuEttl_uZG6J5_FSYaLP2KFyr8pfF9kwYWhzl_8gfIuHZaK5gkgIYVNUVM8xoerCFBNmPuY0oCE2to1I_Wi4Ke2PBM2ycyuA",
        "serving_size_name": "1 bowl (220g)",
        "serving_size_g": 220.0,
        "calories": 340.0,
        "protein_g": 18.0,
        "carbs_g": 52.0,
        "fat_g": 6.5,
        "fiber_g": 7.2,
        "portions": [
            {"portion_name": "1 bowl", "gram_weight": 220.0, "is_default": True},
            {"portion_name": "Plate", "gram_weight": 300.0, "is_default": False},
        ],
    },
]


async def seed_foods_table(db: AsyncSession) -> int:
    """Seeds the foods table if it currently contains 0 records."""
    existing_result = await db.execute(select(Food.id).limit(1))
    if existing_result.first() is not None:
        return 0

    count = 0
    for raw_data in INITIAL_FOOD_SEED_DATA:
        food_data = dict(raw_data)
        portions_data = food_data.pop("portions", [])
        food = Food(**food_data)
        db.add(food)
        await db.flush()

        for p in portions_data:
            portion = FoodPortion(food_id=food.id, **p)
            db.add(portion)

        count += 1

    await db.commit()
    return count


async def main():
    async with AsyncSessionLocal() as session:
        added = await seed_foods_table(session)
        print(f"Seeded {added} food items into the database.")


if __name__ == "__main__":
    asyncio.run(main())
