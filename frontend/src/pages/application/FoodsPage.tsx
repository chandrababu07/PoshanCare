import React, { useEffect, useState } from 'react';
import {
  Search,
  PlusCircle,
  History,
  Star,
  Utensils,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { FoodItem, MOCK_FOOD_DATABASE } from '../../data/mockFoods';
import {
  createCustomFoodInApi,
  fetchCategoriesFromApi,
  fetchFavoriteFoodsFromApi,
  fetchFoodsFromApi,
  fetchRecentFoodsFromApi,
  fetchRegionsFromApi,
  toggleFavoriteFoodInApi,
  CreateCustomFoodPayload,
} from '../../services/foodService';
import { addDiaryEntryToApi } from '../../services/diaryService';

export const FoodsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites' | 'custom'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  
  const [categories, setCategories] = useState<string[]>(['All']);
  const [regions, setRegions] = useState<string[]>(['All']);

  const [foods, setFoods] = useState<FoodItem[]>(MOCK_FOOD_DATABASE);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Logging Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logMealType, setLogMealType] = useState<string>('breakfast');
  const [logQuantity, setLogQuantity] = useState<number>(1.0);
  const [logDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [logNotes] = useState<string>('');
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);
  const [logErrorMessage, setLogErrorMessage] = useState<string | null>(null);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Custom Food Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState<CreateCustomFoodPayload>({
    name: '',
    alternate_name: '',
    description: '',
    category: 'Custom Foods',
    region: 'Custom',
    is_vegetarian: true,
    serving_size_name: '1 serving',
    serving_size_g: 100,
    calories: 150,
    protein_g: 5.0,
    carbs_g: 20.0,
    fat_g: 4.0,
    fiber_g: 2.0,
    sugar_g: 0.0,
    sodium_mg: 0.0,
  });
  const [customFormError, setCustomFormError] = useState<string | null>(null);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  // Load Categories & Regions on Mount
  useEffect(() => {
    let isMounted = true;
    async function loadMetadata() {
      const [apiCats, apiRegs] = await Promise.all([
        fetchCategoriesFromApi(),
        fetchRegionsFromApi(),
      ]);
      if (isMounted) {
        if (apiCats && apiCats.length > 0) setCategories(['All', ...apiCats]);
        if (apiRegs && apiRegs.length > 0) setRegions(['All', ...apiRegs]);
      }
    }
    loadMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Foods from Backend API
  useEffect(() => {
    let isMounted = true;

    async function loadFoods() {
      setIsLoading(true);
      try {
        if (activeTab === 'recent') {
          const recentItems = await fetchRecentFoodsFromApi();
          if (isMounted) {
            setFoods(recentItems);
          }
        } else if (activeTab === 'favorites') {
          const favoriteItems = await fetchFavoriteFoodsFromApi();
          if (isMounted) {
            setFoods(favoriteItems);
          }
        } else {
          const result = await fetchFoodsFromApi({
            search: searchQuery,
            category: selectedCategory,
            region: selectedRegion,
            is_custom_only: activeTab === 'custom',
            page_size: 50,
          });

          if (isMounted) {
            setFoods(result.items);
          }
        }
      } catch (err) {
        console.warn('Food fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadFoods();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory, selectedRegion, activeTab]);

  // Open Log Modal
  const handleOpenLogModal = (food: FoodItem) => {
    setSelectedFood(food);
    setLogQuantity(1.0);
    setLogSuccessMessage(null);
    setLogErrorMessage(null);
    setIsLogModalOpen(true);
  };

  // Submit Log to API
  const handleConfirmLog = async () => {
    if (!selectedFood || !selectedFood.rawId) return;
    setIsSubmittingLog(true);
    setLogErrorMessage(null);

    try {
      const result = await addDiaryEntryToApi({
        meal_type: logMealType,
        date: logDate,
        food_id: selectedFood.rawId,
        quantity: logQuantity,
        notes: logNotes,
      });

      if (result) {
        setLogSuccessMessage(`Logged ${logQuantity} x ${selectedFood.name} to ${logMealType.toUpperCase()}!`);
        setTimeout(() => {
          setIsLogModalOpen(false);
          setLogSuccessMessage(null);
        }, 1200);
      } else {
        setLogErrorMessage('Failed to log food entry. Please check authentication.');
      }
    } catch {
      setLogErrorMessage('Error creating diary entry.');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Toggle Favorite Status
  const handleToggleFavorite = async (e: React.MouseEvent, food: FoodItem) => {
    e.stopPropagation();
    if (!food.rawId) return;

    const nextFavState = !food.isFavorite;
    setFoods((prev) =>
      prev.map((f) => (f.id === food.id ? { ...f, isFavorite: nextFavState } : f))
    );

    await toggleFavoriteFoodInApi(food.rawId, nextFavState);
  };

  // Custom Food Form Change Handler
  const handleCustomFormChange = (
    field: keyof CreateCustomFoodPayload,
    value: string | number | boolean
  ) => {
    setCustomForm((prev) => ({ ...prev, [field]: value }));
  };

  // Submit Custom Food
  const handleCreateCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomFormError(null);

    if (!customForm.name.trim()) {
      setCustomFormError('Food name is required.');
      return;
    }
    if (customForm.serving_size_g <= 0) {
      setCustomFormError('Serving size in grams must be greater than 0.');
      return;
    }
    if (
      customForm.calories < 0 ||
      customForm.protein_g < 0 ||
      customForm.carbs_g < 0 ||
      customForm.fat_g < 0 ||
      customForm.fiber_g < 0 ||
      (customForm.sugar_g ?? 0) < 0 ||
      (customForm.sodium_mg ?? 0) < 0
    ) {
      setCustomFormError('Nutrition values cannot be negative numbers.');
      return;
    }

    setIsSubmittingCustom(true);
    try {
      const createdFood = await createCustomFoodInApi(customForm);
      if (createdFood) {
        setFoods((prev) => [createdFood, ...prev]);
        setIsCustomModalOpen(false);
        setCustomForm({
          name: '',
          alternate_name: '',
          description: '',
          category: 'Custom Foods',
          region: 'Custom',
          is_vegetarian: true,
          serving_size_name: '1 serving',
          serving_size_g: 100,
          calories: 150,
          protein_g: 5.0,
          carbs_g: 20.0,
          fat_g: 4.0,
          fiber_g: 2.0,
          sugar_g: 0.0,
          sodium_mg: 0.0,
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create custom food.';
      setCustomFormError(errorMsg);
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Indian Food Database &amp; Clinical Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search verified Indian foods, create custom items, and log meals to your personal diary.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCustomModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Custom Food</span>
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Foods 🥗
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'recent'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Recent Foods</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'favorites'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Favorites</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            My Custom Foods ✏️
          </button>
        </div>

        {/* Search Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian dish, ingredient (e.g. Idli, Paneer Bonda, Dal)..."
              className="w-full h-11 pl-11 pr-10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {isLoading && (
              <Loader2 className="w-5 h-5 absolute right-3.5 top-3 text-emerald-600 animate-spin" />
            )}
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.filter((c) => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Region Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full h-11 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">All Cuisines &amp; Regions</option>
              {regions.filter((r) => r !== 'All').map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Foods Grid */}
      {foods.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Utensils className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No foods found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            We couldn't find any foods matching your search or filters. Try adjusting your search query or create a custom food.
          </p>
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Custom Food</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {foods.map((food) => (
            <div
              key={food.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                      {food.name}
                    </h3>
                    {food.alternateName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        {food.alternateName}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(e, food)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                    title={food.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        food.isFavorite ? 'fill-amber-400 text-amber-500' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    {food.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                    {food.region}
                  </span>
                  {food.isCustom && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold">
                      Custom
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Serving: <strong className="text-slate-700 dark:text-slate-300">{food.servingSize}</strong>
                </p>
              </div>

              {/* Macro Pills */}
              <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Calories</div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {food.calories}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Protein</div>
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {food.protein}g
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Carbs</div>
                  <div className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                    {food.carbs}g
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Fat</div>
                  <div className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                    {food.fat}g
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                type="button"
                onClick={() => handleOpenLogModal(food)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Log to Meal</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Log Food Modal */}
      {isLogModalOpen && selectedFood && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Log Meal Entry
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedFood.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {logSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{logSuccessMessage}</span>
              </div>
            )}

            {logErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>{logErrorMessage}</span>
              </div>
            )}

            <div className="space-y-4 text-sm">
              {/* Meal Selector */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Meal Section
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'breakfast', label: 'Breakfast 🌅' },
                    { key: 'lunch', label: 'Lunch ☀️' },
                    { key: 'dinner', label: 'Dinner 🌙' },
                    { key: 'evening_snack', label: 'Snack ☕' },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setLogMealType(m.key)}
                      className={`p-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                        logMealType === m.key
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Quantity / Servings
                  </label>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {logQuantity} x ({selectedFood.servingSize})
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
              </div>

              {/* Calculated Nutrition Preview */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Live Calculated Nutrition Preview
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-xs text-slate-400">Calories</div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-base">
                      {Math.round(selectedFood.calories * logQuantity)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Protein</div>
                    <div className="font-extrabold text-emerald-600 text-base">
                      {(selectedFood.protein * logQuantity).toFixed(1)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Carbs</div>
                    <div className="font-extrabold text-amber-600 text-base">
                      {(selectedFood.carbs * logQuantity).toFixed(1)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Fat</div>
                    <div className="font-extrabold text-indigo-600 text-base">
                      {(selectedFood.fat * logQuantity).toFixed(1)}g
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingLog}
                onClick={handleConfirmLog}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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

      {/* Create Custom Food Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Custom Recipe / Food Entry
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Create Custom Food
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {customFormError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>{customFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomFood} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  required
                  value={customForm.name}
                  onChange={(e) => handleCustomFormChange('name', e.target.value)}
                  placeholder="e.g., Grandma's Ragi Malt"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Serving Unit Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customForm.serving_size_name}
                    onChange={(e) => handleCustomFormChange('serving_size_name', e.target.value)}
                    placeholder="e.g. 1 bowl"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gram Weight (g) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={customForm.serving_size_g}
                    onChange={(e) =>
                      handleCustomFormChange('serving_size_g', parseFloat(e.target.value) || 0)
                    }
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Nutrition Inputs */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Nutritional Breakdown per Serving
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Calories (kcal) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={customForm.calories}
                      onChange={(e) =>
                        handleCustomFormChange('calories', parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={customForm.protein_g}
                      onChange={(e) =>
                        handleCustomFormChange('protein_g', parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Carbohydrates (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={customForm.carbs_g}
                      onChange={(e) =>
                        handleCustomFormChange('carbs_g', parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={customForm.fat_g}
                      onChange={(e) =>
                        handleCustomFormChange('fat_g', parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Dietary Fiber (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={customForm.fiber_g}
                      onChange={(e) =>
                        handleCustomFormChange('fiber_g', parseFloat(e.target.value) || 0)
                      }
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Vegetarian Food?
                    </label>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCustomFormChange('is_vegetarian', true)}
                        className={`flex-1 py-1.5 rounded-lg border font-semibold text-xs transition-all ${
                          customForm.is_vegetarian
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Veg 🥗
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCustomFormChange('is_vegetarian', false)}
                        className={`flex-1 py-1.5 rounded-lg border font-semibold text-xs transition-all ${
                          !customForm.is_vegetarian
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Non-Veg 🍗
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustom}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingCustom ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Custom Food</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodsPage;
