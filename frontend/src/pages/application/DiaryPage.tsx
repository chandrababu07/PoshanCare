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
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Star,
  History,
} from 'lucide-react';
import { MealSection } from '../../data/mockDiary';
import { FoodItem } from '../../data/mockFoods';
import {
  addDiaryEntryToApi,
  deleteDiaryEntryFromApi,
  fetchDailyDiaryFromApi,
  mapBackendMealSectionToFrontend,
} from '../../services/diaryService';
import {
  fetchFavoriteFoodsFromApi,
  fetchFoodsFromApi,
  fetchRecentFoodsFromApi,
} from '../../services/foodService';
import { fetchUserProfile, BackendProfileResponse } from '../../services/profileService';

function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  const [profile, setProfile] = useState<BackendProfileResponse | null>(null);

  const [targets, setTargets] = useState({
    targetCalories: 2100,
    targetProtein: 75,
    targetCarbs: 275,
    targetFat: 60,
    targetFiber: 30,
  });

  const [caloricStatusText, setCaloricStatusText] = useState('0 kcal logged');
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  // Add Food Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetMealId, setTargetMealId] = useState<string>('breakfast');
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [modalTab, setModalTab] = useState<'all' | 'recent' | 'favorites'>('all');
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([]);
  const [selectedFoodForLog, setSelectedFoodForLog] = useState<FoodItem | null>(null);
  const [logQuantity, setLogQuantity] = useState<number>(1.0);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [logSuccessMsg, setLogSuccessMsg] = useState<string | null>(null);
  const [logErrorMsg, setLogErrorMsg] = useState<string | null>(null);

  const dateParamStr = formatDateToYYYYMMDD(currentDateObj);
  const dateDisplayStr = formatDateToDisplay(currentDateObj);

  // Load User Profile for Persona Adaptation
  useEffect(() => {
    async function loadProfile() {
      try {
        const p = await fetchUserProfile();
        setProfile(p);
      } catch (err) {
        console.warn('Profile fetch error in DiaryPage:', err);
      }
    }
    loadProfile();
  }, []);

  // Fetch Daily Diary on date change
  const loadDiaryData = async () => {
    setIsLoading(true);
    try {
      const { data, isFallback } = await fetchDailyDiaryFromApi(dateParamStr);
      if (data && !isFallback) {
        setIsOfflineFallback(false);
        setMeals(data.meals.map(mapBackendMealSectionToFrontend));
        setTargets({
          targetCalories: data.target_calories,
          targetProtein: data.target_protein,
          targetCarbs: data.target_carbs,
          targetFat: data.target_fat,
          targetFiber: data.target_fiber || 30,
        });
        setCaloricStatusText(data.caloric_status_text);
      } else {
        setIsOfflineFallback(true);
        setMeals([]);
      }
    } catch (err) {
      console.warn('Error loading diary from API:', err);
      setIsOfflineFallback(true);
      setMeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiaryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateParamStr]);

  // Load Foods in Add Modal when query/tab changes
  useEffect(() => {
    if (!isAddModalOpen) return;

    let isMounted = true;
    async function fetchModalFoods() {
      try {
        if (modalTab === 'recent') {
          const recents = await fetchRecentFoodsFromApi();
          if (isMounted) setAvailableFoods(recents);
        } else if (modalTab === 'favorites') {
          const favs = await fetchFavoriteFoodsFromApi();
          if (isMounted) setAvailableFoods(favs);
        } else {
          const res = await fetchFoodsFromApi({ search: modalSearchQuery, page_size: 20 });
          if (isMounted) setAvailableFoods(res.items);
        }
      } catch (err) {
        console.warn('Error fetching modal foods:', err);
      }
    }

    const timer = setTimeout(() => {
      fetchModalFoods();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isAddModalOpen, modalSearchQuery, modalTab]);

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
    setCurrentDateObj(new Date());
  };

  // Delete Entry Handler
  const handleDeleteItem = async (_mealId: string, itemId: string) => {
    const rawId = parseInt(itemId, 10);
    if (!isNaN(rawId)) {
      await deleteDiaryEntryFromApi(rawId);
    }
    await loadDiaryData();
  };

  // Open Add Food Modal preselected to meal
  const handleOpenAddModal = (mealId: string) => {
    setTargetMealId(mealId);
    setSelectedFoodForLog(null);
    setLogQuantity(1.0);
    setLogSuccessMsg(null);
    setLogErrorMsg(null);
    setIsAddModalOpen(true);
  };

  // Confirm Log Entry
  const handleConfirmLogFood = async () => {
    if (!selectedFoodForLog || !selectedFoodForLog.rawId) return;
    setIsSubmittingLog(true);
    setLogErrorMsg(null);

    try {
      const result = await addDiaryEntryToApi({
        meal_type: targetMealId,
        date: dateParamStr,
        food_id: selectedFoodForLog.rawId,
        quantity: logQuantity,
      });

      if (result) {
        setLogSuccessMsg(`Added ${selectedFoodForLog.name} to ${targetMealId.toUpperCase()}!`);
        await loadDiaryData();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setLogSuccessMsg(null);
        }, 1000);
      } else {
        setLogErrorMsg('Failed to log food item. Please check login session.');
      }
    } catch {
      setLogErrorMsg('Error adding diary entry.');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const getMealIcon = (iconName: string) => {
    switch (iconName) {
      case 'wb_twilight':
      case 'sunrise':
        return <Sunrise className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'sunny':
      case 'wb_sunny':
        return <Sun className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'local_cafe':
      case 'coffee':
        return <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'bedtime':
      case 'dark_mode':
        return <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      default:
        return <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
  };

  // Persona UX Terminology
  const isChild = profile?.profile_type === 'child';
  const isSenior = profile?.profile_type === 'older_adult';

  const caloriesLabel = isChild ? 'Daily Energy' : 'Total Calories';
  const statusLabel = isChild ? 'Growing Strong' : 'Caloric Status';

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isChild ? 'My Food & Energy Diary 🍎' : 'Food Diary & Daily Log'}
            </h1>
            {isLoading && <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />}
            {isOfflineFallback && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                <span>Offline Reference Mode</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isChild
              ? 'Track your tasty meals and daily energy to grow healthy and strong!'
              : 'Track actual logged daily intake against calculated nutrition targets.'}
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={handlePrevDay}
            aria-label="Previous Day"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-2 min-w-[190px] justify-center">
            <CalendarIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {dateDisplayStr}
            </span>
          </div>
          <button
            type="button"
            onClick={handleNextDay}
            aria-label="Next Day"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* Daily Nutrition Summary Card */}
      <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-x-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {caloriesLabel}
            </span>
            <div className="flex items-baseline gap-x-1 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {grandTotalKcal.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                / {targets.targetCalories} kcal
              </span>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {statusLabel}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 mt-1 self-start">
              {caloricStatusText}
            </span>
          </div>
        </div>

        {/* Macro Summary Pills */}
        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col min-w-[100px]">
            <span className="text-xs font-bold text-slate-400 uppercase">Protein</span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {grandTotalP}g
            </span>
            <span className="text-xs text-slate-500">Goal: {targets.targetProtein}g</span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col min-w-[100px]">
            <span className="text-xs font-bold text-slate-400 uppercase">Carbs</span>
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {grandTotalC}g
            </span>
            <span className="text-xs text-slate-500">Goal: {targets.targetCarbs}g</span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col min-w-[100px]">
            <span className="text-xs font-bold text-slate-400 uppercase">Fat</span>
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {grandTotalF}g
            </span>
            <span className="text-xs text-slate-500">Goal: {targets.targetFat}g</span>
          </div>
        </div>
      </div>

      {/* Meal Sections */}
      <div className="space-y-6">
        {meals.map((meal) => {
          const mealKcal = meal.items.reduce((sum, item) => sum + item.calories, 0);
          const mealP = meal.items.reduce((sum, item) => sum + item.protein, 0).toFixed(1);
          const mealC = meal.items.reduce((sum, item) => sum + item.carbs, 0).toFixed(1);
          const mealF = meal.items.reduce((sum, item) => sum + item.fat, 0).toFixed(1);

          return (
            <div
              key={meal.id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden"
            >
              {/* Meal Section Header */}
              <div className="p-5 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {getMealIcon(meal.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                        {meal.name}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {meal.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{meal.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {mealKcal}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">kcal</span>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {meal.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-base truncate">
                        {item.foodName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.serving}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {item.calories} kcal
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(meal.id, item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {meal.items.length === 0 && (
                  <div className="p-8 text-center space-y-1">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      No foods logged for {meal.name} yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Add item Action Bar */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(meal.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-all cursor-pointer ${
                    isSenior ? 'min-h-[48px] px-6 text-base' : ''
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Food to {meal.name}</span>
                </button>

                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Subtotal: P: {mealP}g • C: {mealC}g • F: {mealF}g
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Food Search & Logging Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Log Entry to {targetMealId.toUpperCase()}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Select Food Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {logSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{logSuccessMsg}</span>
              </div>
            )}

            {logErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>{logErrorMsg}</span>
              </div>
            )}

            {/* Modal Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <button
                type="button"
                onClick={() => setModalTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  modalTab === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                All Foods
              </button>
              <button
                type="button"
                onClick={() => setModalTab('recent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  modalTab === 'recent'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Recent</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('favorites')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  modalTab === 'favorites'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Favorites</span>
              </button>
            </div>

            {/* Search Bar */}
            {modalTab === 'all' && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="Search food by name..."
                  className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Available Foods List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {availableFoods.map((food) => (
                <div
                  key={food.id}
                  onClick={() => setSelectedFoodForLog(food)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedFoodForLog?.id === food.id
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {food.name}
                    </div>
                    <div className="text-xs text-slate-500">{food.servingSize}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {food.calories} kcal
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quantity Slider */}
            {selectedFoodForLog && (
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Quantity</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {logQuantity} x ({selectedFoodForLog.servingSize})
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.5"
                  value={logQuantity}
                  onChange={(e) => setLogQuantity(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center grid grid-cols-4 gap-2">
                  <div>
                    <div className="text-xs text-slate-400">Total Kcal</div>
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {Math.round(selectedFoodForLog.calories * logQuantity)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Protein</div>
                    <div className="font-extrabold text-emerald-600">
                      {(selectedFoodForLog.protein * logQuantity).toFixed(1)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Carbs</div>
                    <div className="font-extrabold text-amber-600">
                      {(selectedFoodForLog.carbs * logQuantity).toFixed(1)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Fat</div>
                    <div className="font-extrabold text-indigo-600">
                      {(selectedFoodForLog.fat * logQuantity).toFixed(1)}g
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFoodForLog || isSubmittingLog}
                onClick={handleConfirmLogFood}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingLog ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Confirm Log</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiaryPage;
