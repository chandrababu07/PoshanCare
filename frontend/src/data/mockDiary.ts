export interface DiaryEntryItem {
  id: string;
  foodName: string;
  subtext: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  categoryTag?: string;
}

export interface MealSection {
  id: string;
  name: string;
  time: string;
  subtitle: string;
  iconName: string;
  items: DiaryEntryItem[];
}

export const INITIAL_MEALS_DATA: MealSection[] = [
  {
    id: 'breakfast',
    name: 'Breakfast',
    time: '08:30 AM',
    subtitle: 'Morning Glycemic & Protein Kick',
    iconName: 'wb_twilight',
    items: [
      {
        id: 'entry-1',
        foodName: '3 Boiled Eggs (Large)',
        subtext: 'Whole hen eggs, hard boiled (~150g)',
        serving: '3 pcs (150g)',
        calories: 210,
        protein: 18.6,
        carbs: 1.2,
        fat: 15.3,
        categoryTag: 'Protein Rich',
      },
      {
        id: 'entry-2',
        foodName: 'Robusta Banana',
        subtext: '1 medium fresh fruit (120g)',
        serving: '1 pc (120g)',
        calories: 105,
        protein: 1.3,
        carbs: 27.0,
        fat: 0.3,
        categoryTag: 'Fruit',
      },
      {
        id: 'entry-3',
        foodName: 'Full Cream Buffalo Milk',
        subtext: 'Boiled, unsweetened (200ml)',
        serving: '1 glass (200ml)',
        calories: 150,
        protein: 8.6,
        carbs: 10.2,
        fat: 13.0,
        categoryTag: 'Dairy',
      },
    ],
  },
  {
    id: 'lunch',
    name: 'Lunch',
    time: '01:15 PM',
    subtitle: 'Main Refuel & Primary Micronutrient Anchor',
    iconName: 'sunny',
    items: [
      {
        id: 'entry-4',
        foodName: 'Steamed Sona Masoori Rice',
        subtext: 'Cooked plain rice (200g)',
        serving: '1.5 cup (200g)',
        calories: 260,
        protein: 5.2,
        carbs: 57.8,
        fat: 0.4,
        categoryTag: 'Rice & Millets',
      },
      {
        id: 'entry-5',
        foodName: 'Dal Tadka (Toor Dal with Ghee)',
        subtext: 'Cumin, garlic, hing, 5g ghee (150g)',
        serving: '1 bowl (150g)',
        calories: 215,
        protein: 10.4,
        carbs: 24.2,
        fat: 7.8,
        categoryTag: 'Dal & Pulses',
      },
      {
        id: 'entry-6',
        foodName: 'Paneer Bhurji',
        subtext: 'Home-style tossed with onions & capsicum (120g)',
        serving: '1 katori (120g)',
        calories: 290,
        protein: 16.5,
        carbs: 6.4,
        fat: 16.2,
        categoryTag: 'Curries & Dairy',
      },
      {
        id: 'entry-7',
        foodName: 'Fresh Cucumber & Tomato Salad',
        subtext: 'With lemon juice and black salt (100g)',
        serving: '1 plate (100g)',
        calories: 30,
        protein: 1.1,
        carbs: 5.8,
        fat: 0.2,
        categoryTag: 'Fresh Veg',
      },
      {
        id: 'entry-8',
        foodName: 'Roasted Urad Papad',
        subtext: 'Dry flame roasted, 1 medium disc (25g)',
        serving: '1 disc (25g)',
        calories: 90,
        protein: 6.2,
        carbs: 14.5,
        fat: 0.8,
        categoryTag: 'Snacks',
      },
    ],
  },
  {
    id: 'snack',
    name: 'Evening Snack',
    time: '05:00 PM',
    subtitle: 'Pre-Workout Lift & Metabolic Bridge',
    iconName: 'local_cafe',
    items: [
      {
        id: 'entry-9',
        foodName: 'Roasted Chana (With Husk)',
        subtext: 'Bengal gram, dry roasted without oil (50g)',
        serving: '1 bowl (50g)',
        calories: 180,
        protein: 9.3,
        carbs: 29.2,
        fat: 2.6,
        categoryTag: 'Snacks',
      },
      {
        id: 'entry-10',
        foodName: 'Masala Chai',
        subtext: 'Cow milk, half tsp raw jaggery (150ml)',
        serving: '1 cup (150ml)',
        calories: 95,
        protein: 2.8,
        carbs: 14.2,
        fat: 3.1,
        categoryTag: 'Beverage',
      },
      {
        id: 'entry-11',
        foodName: 'Marie Biscuits',
        subtext: '2 crisp biscuits (10g)',
        serving: '2 pcs (10g)',
        calories: 45,
        protein: 0.9,
        carbs: 8.2,
        fat: 0.9,
        categoryTag: 'Biscuits',
      },
    ],
  },
  {
    id: 'dinner',
    name: 'Dinner',
    time: '08:30 PM',
    subtitle: 'Recovery Feed & Evening Caloric Closure',
    iconName: 'bedtime',
    items: [
      {
        id: 'entry-12',
        foodName: '3 Whole Wheat Phulkas',
        subtext: 'Freshly rolled with 2g pure desi ghee brush (90g)',
        serving: '3 rotis (90g)',
        calories: 240,
        protein: 8.1,
        carbs: 48.0,
        fat: 3.8,
        categoryTag: 'Flatbread',
      },
      {
        id: 'entry-13',
        foodName: 'Methi Chicken Curry / Rajma',
        subtext: 'Slow-simmered onion-tomato gravy with fenugreek (180g)',
        serving: '1 bowl (180g)',
        calories: 340,
        protein: 24.2,
        carbs: 14.8,
        fat: 16.5,
        categoryTag: 'Curries',
      },
      {
        id: 'entry-14',
        foodName: 'Mixed Vegetable Poriyal',
        subtext: 'Beans, carrots, cabbage with mustard-coconut temper (120g)',
        serving: '1 bowl (120g)',
        calories: 130,
        protein: 3.2,
        carbs: 18.2,
        fat: 4.9,
        categoryTag: 'Side Dish',
      },
      {
        id: 'entry-15',
        foodName: 'Fresh Curd / Dahi',
        subtext: 'Whole cow milk probiotic curd (150g)',
        serving: '1 bowl (150g)',
        calories: 95,
        protein: 5.1,
        carbs: 6.8,
        fat: 4.8,
        categoryTag: 'Probiotic',
      },
      {
        id: 'entry-16',
        foodName: 'Warm Badam Milk',
        subtext: 'Crushed almonds, saffron, cardamom, warm milk (150ml)',
        serving: '1 cup (150ml)',
        calories: 225,
        protein: 6.2,
        carbs: 21.4,
        fat: 11.2,
        categoryTag: 'Recovery Milk',
      },
    ],
  },
];

export const DAILY_NUTRITION_TARGETS = {
  targetCalories: 2600,
  targetProtein: 140,
  targetCarbs: 325,
  targetFat: 75,
};
