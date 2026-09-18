import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Sunrise,
  Sun,
  Coffee,
  Moon,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Utensils,
  RefreshCw,
  Info,
  Calendar,
  Zap,
  Flame,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import {
  mealPlanService,
  MealPlanResponse,
  RecommendationsResponse,
  MealRecommendationItem,
  MealGroup,
} from '../../services/mealPlanService';
import { fetchUserProfile, BackendProfileResponse } from '../../services/profileService';
import { fetchFoodsFromApi, BackendFoodItem } from '../../services/foodService';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: Sunrise, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200' },
  { id: 'lunch', label: 'Lunch', icon: Sun, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' },
  { id: 'dinner', label: 'Dinner', icon: Moon, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' },
  { id: 'snack', label: 'Snacks', icon: Coffee, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200' },
];

export const MealPlanningPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [userProfile, setUserProfile] = useState<BackendProfileResponse | null>(null);

  const [loadingPlan, setLoadingPlan] = useState<boolean>(true);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [loggingMeal, setLoggingMeal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Add Item Modal / Popover state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addMealType, setAddMealType] = useState<string>('breakfast');
  const [foodSearchQuery, setFoodSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<BackendFoodItem[]>([]);
  const [searchingFoods, setSearchingFoods] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async (dateStr: string) => {
    setLoadingPlan(true);
    setLoadingRecs(true);

    const [planRes, recsRes, profRes] = await Promise.all([
      mealPlanService.getTodayMealPlan(dateStr),
      mealPlanService.getRecommendations(),
      fetchUserProfile(),
    ]);

    setMealPlan(planRes);
    setRecommendations(recsRes);
    setUserProfile(profRes);
    setLoadingPlan(false);
    setLoadingRecs(false);
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    const res = await mealPlanService.generateMealPlan({
      plan_date: selectedDate,
      meal_types: ['breakfast', 'lunch', 'dinner', 'snack'],
    });
    setGenerating(false);
    if (res) {
      setMealPlan(res);
      showToast('Smart meal plan generated successfully based on your profile & targets!');
    } else {
      showToast('Failed to generate meal plan. Please try again.');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!mealPlan) return;
    const updated = await mealPlanService.removeMealPlanItem(mealPlan.id, itemId);
    if (updated) {
      setMealPlan(updated);
      showToast('Item removed from meal plan.');
    }
  };

  const handleAddRecommendationToPlan = async (
    rec: MealRecommendationItem,
    mealType: string
  ) => {
    if (!mealPlan) {
      // Auto-generate plan first if none exists
      const newPlan = await mealPlanService.generateMealPlan({
        plan_date: selectedDate,
      });
      if (!newPlan) {
        showToast('Error creating meal plan container.');
        return;
      }
      const updated = await mealPlanService.addMealPlanItem(newPlan.id, {
        meal_type: mealType,
        food_id: rec.food_id,
        servings: 1,
      });
      if (updated) {
        setMealPlan(updated);
        showToast(`Added ${rec.food_name} to ${mealType}!`);
      }
    } else {
      const updated = await mealPlanService.addMealPlanItem(mealPlan.id, {
        meal_type: mealType,
        food_id: rec.food_id,
        servings: 1,
      });
      if (updated) {
        setMealPlan(updated);
        showToast(`Added ${rec.food_name} to ${mealType}!`);
      }
    }
  };

  const handleLogMealGroup = async (mealType: string) => {
    if (!mealPlan) return;
    setLoggingMeal(mealType);
    const res = await mealPlanService.logMealPlanGroupToDiary(mealPlan.id, mealType, selectedDate);
    setLoggingMeal(null);
    if (res) {
      showToast(res.message);
    } else {
      showToast('Failed to log meal group to food diary.');
    }
  };

  const handleSearchFoods = async (query: string) => {
    setFoodSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchingFoods(true);
    const res = await fetchFoodsFromApi({ search: query, page_size: 10 });
    setSearchResults(res.rawItems || []);
    setSearchingFoods(false);
  };

  const handleAddSearchedFood = async (food: BackendFoodItem) => {
    if (!mealPlan) {
      const newPlan = await mealPlanService.generateMealPlan({ plan_date: selectedDate });
      if (newPlan) {
        const updated = await mealPlanService.addMealPlanItem(newPlan.id, {
          meal_type: addMealType,
          food_id: food.id,
          servings: 1,
        });
        if (updated) setMealPlan(updated);
      }
    } else {
      const updated = await mealPlanService.addMealPlanItem(mealPlan.id, {
        meal_type: addMealType,
        food_id: food.id,
        servings: 1,
      });
      if (updated) setMealPlan(updated);
    }
    setShowAddModal(false);
    setFoodSearchQuery('');
    setSearchResults([]);
    showToast(`Added ${food.name} to ${addMealType}!`);
  };

  const profileType = userProfile?.profile_type || 'adult';
  const isChildOrTeen = profileType === 'child' || profileType === 'teen';
  const isOlderAdult = profileType === 'older_adult';

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-primary text-on-primary rounded-xl shadow-lg animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-body-md text-body-md">{toastMessage}</span>
        </div>
      )}

      {/* Header & Date Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Smart Meal Planning
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              AI Recommendations
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Personalized meal suggestions matching your dietary preferences, RDA goals, and real intake gaps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest border border-surface-container-low rounded-xl shadow-sm">
            <Calendar className="w-4 h-4 text-on-surface-variant" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-on-surface font-body-sm focus:outline-none"
            />
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-label-md transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Auto-Generate Plan'}
          </button>
        </div>
      </div>

      {/* Persona Guidance Banner */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-low flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-title-sm text-title-sm text-on-surface capitalize">
                {profileType.replace('_', ' ')} Profile Context
              </span>
              {userProfile?.diet_type && (
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs font-medium">
                  {userProfile.diet_type}
                </span>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              {isChildOrTeen
                ? 'Proteins and micronutrients are structured for active growth and development without restrictive dieting targets.'
                : isOlderAdult
                ? 'High-protein and nutrient-dense options are prioritized for muscle maintenance and joint vitality.'
                : 'Balanced macronutrients tailored to your activity level and RDA goals.'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Planned vs Target Nutrition Summary */}
      {mealPlan && (
        <div className="p-6 rounded-xl bg-surface-container-lowest border border-surface-container-low shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-title-md text-title-md text-on-surface">Daily Planned Nutrition Summary</h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Plan Date: <strong className="text-on-surface">{mealPlan.plan_date}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Calories */}
            <div className="p-4 rounded-xl bg-surface-container-low/50 border border-surface-container-low space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Calories</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="font-title-lg text-title-lg text-on-surface">
                {mealPlan.nutrition_summary.total_calories}{' '}
                <span className="text-xs text-on-surface-variant font-normal">
                  / {mealPlan.nutrition_summary.target_calories} kcal
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (mealPlan.nutrition_summary.total_calories /
                        (mealPlan.nutrition_summary.target_calories || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Protein */}
            <div className="p-4 rounded-xl bg-surface-container-low/50 border border-surface-container-low space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Protein</span>
                <Zap className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="font-title-lg text-title-lg text-on-surface">
                {mealPlan.nutrition_summary.total_protein_g}g{' '}
                <span className="text-xs text-on-surface-variant font-normal">
                  / {mealPlan.nutrition_summary.target_protein_g}g
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (mealPlan.nutrition_summary.total_protein_g /
                        (mealPlan.nutrition_summary.target_protein_g || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="p-4 rounded-xl bg-surface-container-low/50 border border-surface-container-low space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Carbs</span>
                <Utensils className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="font-title-lg text-title-lg text-on-surface">
                {mealPlan.nutrition_summary.total_carbs_g}g{' '}
                <span className="text-xs text-on-surface-variant font-normal">
                  / {mealPlan.nutrition_summary.target_carbs_g}g
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (mealPlan.nutrition_summary.total_carbs_g /
                        (mealPlan.nutrition_summary.target_carbs_g || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="p-4 rounded-xl bg-surface-container-low/50 border border-surface-container-low space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Fat</span>
                <Heart className="w-4 h-4 text-purple-500" />
              </div>
              <div className="font-title-lg text-title-lg text-on-surface">
                {mealPlan.nutrition_summary.total_fat_g}g{' '}
                <span className="text-xs text-on-surface-variant font-normal">
                  / {mealPlan.nutrition_summary.target_fat_g}g
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (mealPlan.nutrition_summary.total_fat_g /
                        (mealPlan.nutrition_summary.target_fat_g || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Meal Plan Grid (Breakfast, Lunch, Dinner, Snack) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-title-md text-title-md text-on-surface">Today's Planned Meals</h2>
          <button
            onClick={() => {
              setAddMealType('breakfast');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
          >
            <PlusCircle className="w-4 h-4" /> Custom Add Item
          </button>
        </div>

        {loadingPlan ? (
          <div className="p-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-surface-container-low animate-pulse">
            Loading meal plan details...
          </div>
        ) : !mealPlan || mealPlan.meals.every((m) => m.items.length === 0) ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-xl border border-surface-container-low space-y-4">
            <Utensils className="w-12 h-12 text-on-surface-variant mx-auto stroke-1" />
            <div>
              <h3 className="font-title-md text-title-md text-on-surface">No Meal Plan Found for {selectedDate}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-md mx-auto">
                Generate an intelligent meal plan tailored to your profile preferences or select items from our smart recommendations below.
              </p>
            </div>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label-md inline-flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Generate Today's Meal Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MEAL_TYPES.map((typeMeta) => {
              const group: MealGroup | undefined = mealPlan.meals.find(
                (m) => m.meal_type === typeMeta.id
              );
              const Icon = typeMeta.icon;
              const items = group?.items || [];
              const isLogging = loggingMeal === typeMeta.id;

              return (
                <div
                  key={typeMeta.id}
                  className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container-low shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Meal Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${typeMeta.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-title-md text-title-md text-on-surface capitalize">
                            {typeMeta.label}
                          </h3>
                          <span className="font-body-xs text-body-xs text-on-surface-variant">
                            {group ? `${group.total_calories} kcal • ${group.total_protein_g}g Protein` : '0 kcal'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setAddMealType(typeMeta.id);
                          setShowAddModal(true);
                        }}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
                        title={`Add food to ${typeMeta.label}`}
                      >
                        <PlusCircle className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Meal Items */}
                    {items.length === 0 ? (
                      <div className="py-6 text-center text-xs text-on-surface-variant italic bg-surface-container-low/30 rounded-lg">
                        No items planned for {typeMeta.label.toLowerCase()} yet.
                      </div>
                    ) : (
                      <ul className="divide-y divide-surface-container-low">
                        {items.map((item) => (
                          <li key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="font-body-sm font-semibold text-on-surface truncate">
                                {item.food_name}
                              </div>
                              <div className="font-body-xs text-body-xs text-on-surface-variant">
                                {item.servings} x {item.serving_size_name} ({item.serving_size_g}g) •{' '}
                                <span className="font-medium text-on-surface">{item.calories} kcal</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                                P: {item.protein_g}g
                              </span>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Meal Group Action */}
                  {items.length > 0 && (
                    <button
                      onClick={() => handleLogMealGroup(typeMeta.id)}
                      disabled={isLogging}
                      className="w-full py-2 bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 rounded-xl font-label-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isLogging ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-secondary" />
                      )}
                      Log {typeMeta.label} to Food Diary
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Smart Recommendations Engine */}
      <div className="p-6 rounded-xl bg-surface-container-lowest border border-surface-container-low shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-title-md text-title-md text-on-surface">Personalized Recommendations</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                Real-Data Driven
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Suggestions optimized for your RDA gaps, dietary restrictions, and food favorites.
            </p>
          </div>
        </div>

        {/* Data Quality Notice */}
        {recommendations?.data_quality && (
          <div className="p-3 rounded-lg bg-surface-container-low/70 border border-surface-container-low flex items-start gap-2.5 text-xs text-on-surface-variant">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{recommendations.data_quality.note}</span>
          </div>
        )}

        {loadingRecs ? (
          <div className="p-8 text-center text-on-surface-variant animate-pulse">
            Analyzing nutrient gaps & ranking food options...
          </div>
        ) : !recommendations || recommendations.recommendations.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant">
            No recommendations available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.recommendations.map((rec) => (
              <div
                key={rec.food_id}
                className="p-5 rounded-xl bg-surface-container-low/30 border border-surface-container-low hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                        {rec.category}
                      </span>
                      <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
                        {rec.food_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg text-xs font-bold shrink-0">
                      <span>{Math.round(rec.confidence_score)}% Match</span>
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-4 gap-1 p-2 rounded-lg bg-surface-container-lowest text-center text-xs">
                    <div>
                      <div className="text-[10px] text-on-surface-variant">Cals</div>
                      <div className="font-semibold text-on-surface">{rec.calories}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-on-surface-variant">Prot</div>
                      <div className="font-semibold text-on-surface">{rec.protein_g}g</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-on-surface-variant">Carbs</div>
                      <div className="font-semibold text-on-surface">{rec.carbs_g}g</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-on-surface-variant">Fat</div>
                      <div className="font-semibold text-on-surface">{rec.fat_g}g</div>
                    </div>
                  </div>

                  {/* Reason Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {rec.reasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-medium"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add to Meal Buttons */}
                <div className="pt-2 border-t border-surface-container-low flex items-center justify-between gap-2">
                  <span className="text-xs text-on-surface-variant font-medium">Add to:</span>
                  <div className="flex items-center gap-1">
                    {['breakfast', 'lunch', 'dinner', 'snack'].map((mType) => (
                      <button
                        key={mType}
                        onClick={() => handleAddRecommendationToPlan(rec, mType)}
                        className="px-2 py-1 rounded bg-surface-container hover:bg-primary hover:text-on-primary text-[11px] font-semibold text-on-surface transition-colors capitalize"
                      >
                        {mType[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-low space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-on-surface">
                Add Item to {addMealType.toUpperCase()}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search food database..."
                value={foodSearchQuery}
                onChange={(e) => handleSearchFoods(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-surface-container rounded-xl text-on-surface focus:outline-none focus:border-primary"
              />

              {searchingFoods && (
                <div className="text-center text-xs text-on-surface-variant py-4">
                  Searching foods...
                </div>
              )}

              <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-surface-container-low">
                {searchResults.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => handleAddSearchedFood(food)}
                    className="p-2.5 hover:bg-surface-container-low rounded-lg cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-body-sm font-semibold text-on-surface">{food.name}</div>
                      <div className="font-body-xs text-body-xs text-on-surface-variant">
                        {food.serving_size_name} ({food.serving_size_g}g) • {food.calories} kcal
                      </div>
                    </div>
                    <PlusCircle className="w-5 h-5 text-primary" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanningPage;

