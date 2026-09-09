export interface RecipeIngredient {
  id: string;
  name: string;
  code: string;
  subtext: string;
  batchMeasure: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CustomRecipe {
  id: string;
  title: string;
  description: string;
  servings: number;
  portionWeightGrams: number;
  batchCalories: number;
  batchProtein: number;
  batchCarbs: number;
  batchFat: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  prepTimeMinutes: number;
  imageUrl?: string;
  ingredients: RecipeIngredient[];
}

export const MOCK_RECIPE_BUILDER: CustomRecipe = {
  id: 'recipe-builder-1',
  title: 'High-Protein Paneer Soya Bhurji',
  description: 'Slow-tossed low-fat cottage cheese with defatted soya minced scramble in Indian aromatics.',
  servings: 4,
  portionWeightGrams: 185,
  batchCalories: 1180,
  batchProtein: 106.1,
  batchCarbs: 59.0,
  batchFat: 41.7,
  caloriesPerServing: 295,
  proteinPerServing: 26.5,
  carbsPerServing: 14.8,
  fatPerServing: 10.4,
  prepTimeMinutes: 20,
  ingredients: [
    {
      id: 'ing-1',
      name: 'Low-fat Paneer (Diced / Crumbled)',
      code: 'IFCT-D041',
      subtext: 'Moisture 58%',
      batchMeasure: '250g',
      calories: 435,
      protein: 45.0,
      carbs: 6.0,
      fat: 25.0,
    },
    {
      id: 'ing-2',
      name: 'Defatted Soya Chunks (Hydrated & Minced)',
      code: 'IFCT-L019',
      subtext: '100g dry yield 220g cooked',
      batchMeasure: '100g (dry)',
      calories: 345,
      protein: 52.0,
      carbs: 33.0,
      fat: 0.5,
    },
    {
      id: 'ing-3',
      name: 'Onions & Tomatoes (Finely Chopped)',
      code: 'IFCT-V012',
      subtext: 'Fresh Allium & Lycopene blend',
      batchMeasure: '200g',
      calories: 80,
      protein: 2.4,
      carbs: 16.0,
      fat: 0.4,
    },
    {
      id: 'ing-4',
      name: 'Mustard Oil / Desi Ghee Tempering',
      code: 'IFCT-O003',
      subtext: 'Cold-pressed culinary base (1 tbsp)',
      batchMeasure: '15 ml',
      calories: 135,
      protein: 0.0,
      carbs: 0.0,
      fat: 15.0,
    },
    {
      id: 'ing-5',
      name: 'Whole & Ground Spices',
      code: 'IFCT-S002',
      subtext: 'Turmeric, Cumin, Kasuri Methi, Chillies',
      batchMeasure: '20g',
      calories: 35,
      protein: 1.2,
      carbs: 4.0,
      fat: 0.8,
    },
  ],
};

export const MOCK_SAVED_RECIPES: CustomRecipe[] = [
  MOCK_RECIPE_BUILDER,
  {
    id: 'recipe-2',
    title: 'Sprouted Moong Dal Khichdi',
    description: 'High bioavailability protein source with lower glycemic index, ideal for recovery dinner.',
    servings: 3,
    portionWeightGrams: 220,
    batchCalories: 1020,
    batchProtein: 54.0,
    batchCarbs: 156.0,
    batchFat: 19.5,
    caloriesPerServing: 340,
    proteinPerServing: 18.0,
    carbsPerServing: 52.0,
    fatPerServing: 6.5,
    prepTimeMinutes: 30,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCF5ORY65h828zsLdf2L-RBXFAFesjLib-dzmVroprxLHk9E7ZncGO5gCa1GlBdUqDPKvIpYRRzyrNBwApb4z8vvrmC4RqCZf2AeJBqwQccwhuYQulakNRWCdg79FNJ-Ww4pO6pjLe2ydvgNM2KO6kZuEttl_uZG6J5_FSYaLP2KFyr8pfF9kwYWhzl_8gfIuHZaK5gkgIYVNUVM8xoerCFBNmPuY0oCE2to1I_Wi4Ke2PBM2ycyuA',
    ingredients: [],
  },
  {
    id: 'recipe-3',
    title: 'Oats & Ragi Protein Dosa',
    description: 'Fermented whole millet batter enriched with sattu flour and curry leaf temper.',
    servings: 2,
    portionWeightGrams: 160,
    batchCalories: 440,
    batchProtein: 16.4,
    batchCarbs: 72.0,
    batchFat: 9.6,
    caloriesPerServing: 220,
    proteinPerServing: 8.2,
    carbsPerServing: 36.0,
    fatPerServing: 4.8,
    prepTimeMinutes: 15,
    ingredients: [],
  },
  {
    id: 'recipe-4',
    title: 'Warm Badam Milk (Almond Saffron)',
    description: 'Crushed raw badam paste gently boiled in whole milk with cardamom and saffron.',
    servings: 2,
    portionWeightGrams: 150,
    batchCalories: 450,
    batchProtein: 12.4,
    batchCarbs: 42.8,
    batchFat: 22.4,
    caloriesPerServing: 225,
    proteinPerServing: 6.2,
    carbsPerServing: 21.4,
    fatPerServing: 11.2,
    prepTimeMinutes: 10,
    ingredients: [],
  },
];
