import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Trash2,
  Sunrise,
  Sun,
  Coffee,
  Moon,
  Utensils,
  Calendar as CalendarIcon,
  Loader2,
  WifiOff,
} from 'lucide-react';
import { MealSection, DAILY_NUTRITION_TARGETS } from '../../data/mockDiary';
import {
  addDiaryEntryToApi,
  deleteDiaryEntryFromApi,
  fetchDailyDiaryFromApi,
  mapBackendMealSectionToFrontend,
} from '../../services/diaryService';

// Helper to format Date object into YYYY-MM-DD
function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to format Date object into display string e.g. "Sunday, 6 September 2026"
function formatDateToDisplay(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const DiaryPage: React.FC = () => {
  const [currentDateObj, setCurrentDateObj] = useState<Date>(new Date());
  const [meals, setMeals] = useState<MealSection[]>([]);

  const [targets, setTargets] = useState({
    targetCalories: DAILY_NUTRITION_TARGETS.targetCalories,
    targetProtein: DAILY_NUTRITION_TARGETS.targetProtein,
    targetCarbs: DAILY_NUTRITION_TARGETS.targetCarbs,
    targetFat: DAILY_NUTRITION_TARGETS.targetFat,
  });

  const [caloricStatusText, setCaloricStatusText] = useState('0 kcal logged');

  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  const dateParamStr = formatDateToYYYYMMDD(currentDateObj);
  const dateDisplayStr = formatDateToDisplay(currentDateObj);

  // Fetch Daily Diary on mount or date change
  useEffect(() => {
    let isMounted = true;

    async function loadDiary() {
      setIsLoading(true);
      try {
        const { data, isFallback } = await fetchDailyDiaryFromApi(dateParamStr);

        if (isMounted) {
          if (data && !isFallback) {
            setIsOfflineFallback(false);
            setMeals(data.meals.map(mapBackendMealSectionToFrontend));
            setTargets({
              targetCalories: data.target_calories,
              targetProtein: data.target_protein,
              targetCarbs: data.target_carbs,
              targetFat: data.target_fat,
            });
            setCaloricStatusText(data.caloric_status_text);
          } else {
            setIsOfflineFallback(true);
            setMeals([]);
          }
        }
      } catch (err) {
        console.warn('Error loading diary from API:', err);
        if (isMounted) {
          setIsOfflineFallback(true);
          setMeals([]);
        }
      } finally {

        if (isMounted) setIsLoading(false);
      }
    }

    loadDiary();

    return () => {
      isMounted = false;
    };
  }, [dateParamStr]);

  // Compute grand totals dynamically
  const grandTotalKcal = meals.reduce(
    (sum, m) => sum + m.items.reduce((itemSum, item) => itemSum + item.calories, 0),
    0
  );
  const grandTotalP = meals
    .reduce((sum, m) => sum + m.items.reduce((itemSum, item) => itemSum + item.protein, 0), 0)
    .toFixed(1);
  const grandTotalC = meals
    .reduce((sum, m) => sum + m.items.reduce((itemSum, item) => itemSum + item.carbs, 0), 0)
    .toFixed(1);
  const grandTotalF = meals
    .reduce((sum, m) => sum + m.items.reduce((itemSum, item) => itemSum + item.fat, 0), 0)
    .toFixed(1);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    setCurrentDateObj((prev) => new Date(prev.getTime() - 86400000));
  };

  const handleNextDay = () => {
    setCurrentDateObj((prev) => new Date(prev.getTime() + 86400000));
  };

  const handleToday = () => {
    setCurrentDateObj(new Date('2026-09-06'));
  };

  // Delete Item Handler
  const handleDeleteItem = async (mealId: string, itemId: string) => {
    const rawId = parseInt(itemId, 10);

    if (!isNaN(rawId)) {
      await deleteDiaryEntryFromApi(rawId);
    }

    setMeals((prevMeals) =>
      prevMeals.map((meal) => {
        if (meal.id === mealId) {
          return {
            ...meal,
            items: meal.items.filter((item) => item.id !== itemId),
          };
        }
        return meal;
      })
    );
  };

  // Add Item Handler
  const handleAddItem = async (mealId: string) => {
    // Default food item (Potato Bonda food_id: 1 from backend seed)
    const newEntry = await addDiaryEntryToApi({
      meal_type: mealId,
      date: dateParamStr,
      food_id: 1,
      quantity: 1.0,
    });

    if (newEntry) {
      setMeals((prevMeals) =>
        prevMeals.map((meal) => {
          if (meal.id === mealId) {
            return {
              ...meal,
              items: [
                ...meal.items,
                {
                  id: String(newEntry.raw_id),
                  foodName: newEntry.food_name,
                  subtext: newEntry.subtext,
                  serving: newEntry.serving,
                  calories: Math.round(newEntry.calories),
                  protein: newEntry.protein,
                  carbs: newEntry.carbs,
                  fat: newEntry.fat,
                  categoryTag: newEntry.category_tag || 'Snacks',
                },
              ],
            };
          }
          return meal;
        })
      );
    } else {
      // Local fallback item if unauthenticated or offline
      const mockItem = {
        id: `custom-${Date.now()}`,
        foodName: 'Raw Paneer (Sample Log)',
        subtext: 'Fresh cottage cheese (50g)',
        serving: '1 portion (50g)',
        calories: 130,
        protein: 9.0,
        carbs: 2.0,
        fat: 10.0,
        categoryTag: 'Dairy',
      };

      setMeals((prevMeals) =>
        prevMeals.map((meal) => {
          if (meal.id === mealId) {
            return {
              ...meal,
              items: [...meal.items, mockItem],
            };
          }
          return meal;
        })
      );
    }
  };

  const getMealIcon = (iconName: string) => {
    switch (iconName) {
      case 'wb_twilight':
      case 'sunrise':
        return <Sunrise className="w-5 h-5 text-primary shrink-0" />;
      case 'sunny':
      case 'wb_sunny':
        return <Sun className="w-5 h-5 text-primary shrink-0" />;
      case 'local_cafe':
      case 'coffee':
        return <Coffee className="w-5 h-5 text-secondary shrink-0" />;
      case 'bedtime':
      case 'dark_mode':
        return <Moon className="w-5 h-5 text-tertiary shrink-0" />;
      default:
        return <Utensils className="w-5 h-5 text-primary shrink-0" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Food Diary &amp; Log
            </h1>
            {isLoading && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
            {isOfflineFallback && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                <WifiOff className="w-3.5 h-3.5 text-tertiary" />
                <span>Offline Reference Mode</span>
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Track daily meal entries, exact macro breakdown, and ICMR compliance.
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-2 bg-surface-container-lowest p-1.5 rounded-xl shadow-sm border border-surface-container-low">
          <button
            onClick={handlePrevDay}
            aria-label="Previous Day"
            className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-2 min-w-[210px] justify-center">
            <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
            <span className="font-title-md text-title-md text-on-surface">
              {dateDisplayStr}
            </span>
          </div>
          <button
            onClick={handleNextDay}
            aria-label="Next Day"
            className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md font-medium"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calorie & Macro Daily Summary Bar */}
      <div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-x-6">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Logged</span>
            <div className="flex items-baseline gap-x-1 mt-1">
              <span className="font-numeric-metric text-numeric-metric text-primary font-bold">{grandTotalKcal}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">/ {targets.targetCalories} kcal</span>
            </div>
          </div>
          <div className="h-10 w-px bg-surface-container-low hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Caloric Status</span>
            <span className="px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed font-semibold mt-1 self-start">
              {caloricStatusText}
            </span>
          </div>
        </div>

        {/* Macro Pill Summaries */}
        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="p-3 bg-surface-container-low rounded-xl flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Protein</span>
            <span className="font-title-md text-title-md text-primary font-bold mt-0.5">{grandTotalP}g</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Target: {targets.targetProtein}g</span>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Carbs</span>
            <span className="font-title-md text-title-md text-secondary font-bold mt-0.5">{grandTotalC}g</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Target: {targets.targetCarbs}g</span>
          </div>
          <div className="p-3 bg-surface-container-low rounded-xl flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Fat</span>
            <span className="font-title-md text-title-md text-on-secondary-fixed-variant font-bold mt-0.5">{grandTotalF}g</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Target: {targets.targetFat}g</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Meal Tables (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-y-6">
          {meals.map((meal) => {
            const mealKcal = meal.items.reduce((sum, item) => sum + item.calories, 0);
            const mealP = meal.items.reduce((sum, item) => sum + item.protein, 0).toFixed(1);
            const mealC = meal.items.reduce((sum, item) => sum + item.carbs, 0).toFixed(1);
            const mealF = meal.items.reduce((sum, item) => sum + item.fat, 0).toFixed(1);

            return (
              <div key={meal.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                {/* Meal Header */}
                <div className="p-5 flex items-center justify-between bg-surface-container-low/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      {getMealIcon(meal.iconName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">{meal.name}</h3>
                        <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                          {meal.time}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{meal.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-numeric-metric text-numeric-metric text-primary">{mealKcal}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">kcal</span>
                  </div>
                </div>

                {/* Meal Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                        <th className="py-3 px-5">Food Item &amp; Category</th>
                        <th className="py-3 px-4">Serving</th>
                        <th className="py-3 px-4 text-right">Calories</th>
                        <th className="py-3 px-4 text-right">P (g)</th>
                        <th className="py-3 px-4 text-right">C (g)</th>
                        <th className="py-3 px-4 text-right">F (g)</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-body-md text-body-md">
                      {meal.items.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-medium text-on-surface">{item.foodName}</div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant">{item.subtext}</div>
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant font-body-sm text-body-sm">{item.serving}</td>
                          <td className="py-3.5 px-4 text-right font-medium text-on-surface">{item.calories}</td>
                          <td className="py-3.5 px-4 text-right text-primary font-medium">{item.protein}</td>
                          <td className="py-3.5 px-4 text-right text-on-surface-variant">{item.carbs}</td>
                          <td className="py-3.5 px-4 text-right text-secondary">{item.fat}</td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1 text-on-surface-variant">
                              <button
                                onClick={() => handleDeleteItem(meal.id, item.id)}
                                className="p-1.5 hover:text-error hover:bg-surface-container rounded-lg transition-colors"
                                title="Delete Entry"
                                aria-label={`Delete ${item.foodName}`}
                              >
                                <Trash2 className="w-4 h-4 text-on-surface-variant hover:text-error" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {meal.items.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-on-surface-variant font-body-sm">
                            No food items logged for this meal yet. Click below to add.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal & Add item bar */}
                <div className="px-5 py-3 bg-surface-container-low/20 flex items-center justify-between">
                  <button
                    onClick={() => handleAddItem(meal.id)}
                    className="text-primary hover:text-primary-container font-label-md text-label-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-primary" />
                    <span>Add item to {meal.name}</span>
                  </button>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Subtotal: P: {mealP}g • C: {mealC}g • F: {mealF}g
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Guidelines & Notes (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* ICMR Guidelines Card */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title-md text-title-md text-on-surface">Clinical Guidelines (NIN)</h3>
              <span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded font-medium">
                Optimal
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
              Daily sodium retention is within recommended safety levels (&lt; 2,000mg). Saturated to unsaturated fatty acid ratio stands at 1:1.8.
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface mb-1">
                  <span>Micronutrient: Calcium</span>
                  <span className="font-semibold">780 / 1000 mg</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-label-sm text-label-sm text-on-surface mb-1">
                  <span>Micronutrient: Iron</span>
                  <span className="font-semibold">14.2 / 19 mg</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary-container h-full rounded-full" style={{ width: '74%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Dietitian Note Card */}
          <div className="bg-surface-container-low rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-md">
                DR
              </div>
              <div>
                <span className="font-title-md text-title-md text-on-surface block">Dr. Sunita Raman</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Clinical Nutrition Specialist</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant italic">
              "High bioavailability pulses consumed during Lunch provide an optimal leucine threshold. Maintain current fiber intake for steady digestion."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryPage;
