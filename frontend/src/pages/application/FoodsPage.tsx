import React, { useEffect, useState } from 'react';
import {
  Search,
  PlusCircle,
  History,
  Calculator,
  FlaskConical,
  Activity,
  Utensils,
  Loader2,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import { FoodItem, MOCK_FOOD_DATABASE } from '../../data/mockFoods';
import { fetchCategoriesFromApi, fetchFoodsFromApi } from '../../services/foodService';

export const FoodsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>([
    'All',
    'Snacks & Street Food',
    'Rice & Millets',
    'Dal & Pulses',
    'Curries & Dairy',
    'Egg & Poultry',
    'Fruits & Nuts',
  ]);

  const [foods, setFoods] = useState<FoodItem[]>(MOCK_FOOD_DATABASE);
  const [selectedFood, setSelectedFood] = useState<FoodItem>(MOCK_FOOD_DATABASE[0]);
  const [batchQuantity, setBatchQuantity] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  // Load Categories on Mount
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      const apiCategories = await fetchCategoriesFromApi();
      if (isMounted && apiCategories && apiCategories.length > 0) {
        setCategories(['All', ...apiCategories]);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Foods from Backend API when search or category changes
  useEffect(() => {
    let isMounted = true;

    async function loadFoods() {
      setIsLoading(true);
      try {
        const result = await fetchFoodsFromApi({
          search: searchQuery,
          category: selectedCategory,
          page_size: 50,
        });

        if (isMounted) {
          setFoods(result.items);
          if (result.items.length > 0) {
            setSelectedFood((prev) => {
              const existingMatch = result.items.find((f) => f.name === prev?.name);
              return existingMatch || result.items[0];
            });
          }
          setIsOfflineFallback(result.rawItems.length === 0 && result.items.length > 0);
        }
      } catch (err) {
        console.warn('Food query error:', err);
        if (isMounted) {
          setIsOfflineFallback(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      loadFoods();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory]);

  // Portion Batch Math for Selected Food
  const baseCalPer100g =
    selectedFood && selectedFood.servingGram > 0
      ? Math.round((selectedFood.calories / selectedFood.servingGram) * 100)
      : 0;

  const totalBatchGram = selectedFood ? selectedFood.servingGram * batchQuantity : 0;
  const scaleFactor = (totalBatchGram / 100).toFixed(2);
  const totalBatchKcal = selectedFood ? Math.round(selectedFood.calories * batchQuantity) : 0;
  const totalBatchProtein = selectedFood ? (selectedFood.protein * batchQuantity).toFixed(1) : '0.0';
  const totalBatchCarbs = selectedFood ? (selectedFood.carbs * batchQuantity).toFixed(1) : '0.0';
  const totalBatchFat = selectedFood ? (selectedFood.fat * batchQuantity).toFixed(1) : '0.0';

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title & Search Header */}
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Indian Food Database &amp; Clinical Catalog
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              Calibrated strictly against ICMR-NIN Indian Food Composition Tables (IFCT 2024).
            </p>
          </div>

          {isOfflineFallback && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
              <WifiOff className="w-4 h-4 text-tertiary" />
              <span>Offline Reference Mode</span>
            </div>
          )}
        </div>

        {/* Search Input & Category Pills */}
        <div className="flex flex-col gap-y-3">
          <div className="relative w-full max-w-2xl">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian dish, ingredient (e.g. Potato Bonda, Sona Masoori, Paneer)..."
              className="w-full h-11 pl-11 pr-10 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl border border-surface-container-low shadow-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            {isLoading && (
              <Loader2 className="w-5 h-5 absolute right-3.5 top-3 text-primary animate-spin" />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-on-primary font-semibold shadow-sm'
                    : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dish Main Summary Split */}
      {selectedFood && (
        <div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex gap-4 items-center">
              {selectedFood.imageUrl ? (
                <img
                  src={selectedFood.imageUrl}
                  alt={selectedFood.name}
                  className="w-24 h-24 rounded-xl object-cover shadow-sm shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                  <Utensils className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                  {selectedFood.name}
                </span>
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {selectedFood.alternateName || selectedFood.category}
                </span>
                <span className="font-body-sm text-body-sm text-secondary font-medium mt-1">
                  {selectedFood.servingSize}: {selectedFood.calories} kcal
                </span>
              </div>
            </div>

            {/* Micro Macro Strip */}
            <div className="md:col-span-5 grid grid-cols-4 gap-2 bg-surface-container-low p-3 rounded-lg">
              <div className="flex flex-col text-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Calories</span>
                <span className="font-title-md text-title-md text-on-surface mt-0.5">
                  {selectedFood.calories} <span className="text-xs font-normal">kcal</span>
                </span>
                <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-primary h-full w-[45%]"></div>
                </div>
              </div>
              <div className="flex flex-col text-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Protein</span>
                <span className="font-title-md text-title-md text-on-surface mt-0.5">
                  {selectedFood.protein} <span className="text-xs font-normal">g</span>
                </span>
                <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-primary h-full w-[25%]"></div>
                </div>
              </div>
              <div className="flex flex-col text-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Carbs</span>
                <span className="font-title-md text-title-md text-on-surface mt-0.5">
                  {selectedFood.carbs} <span className="text-xs font-normal">g</span>
                </span>
                <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-secondary-container h-full w-[60%]"></div>
                </div>
              </div>
              <div className="flex flex-col text-center">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Fat</span>
                <span className="font-title-md text-title-md text-on-surface mt-0.5">
                  {selectedFood.fat} <span className="text-xs font-normal">g</span>
                </span>
                <div className="w-full bg-surface-container-highest h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-secondary h-full w-[50%]"></div>
                </div>
              </div>
            </div>

            {/* Action Cluster */}
            <div className="md:col-span-3 flex md:flex-col justify-end gap-2">
              <button className="h-10 px-4 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label-md text-label-md font-medium transition-colors flex items-center justify-center gap-2 shadow-sm">
                <PlusCircle className="w-4 h-4" />
                <span>+ Add to Diary</span>
              </button>
              <button
                onClick={() => setBatchQuantity((q) => (q >= 10 ? 1 : q + 1))}
                className="h-10 px-4 bg-surface-container text-on-surface hover:bg-surface-container-high rounded-lg font-label-md text-label-md transition-colors flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" />
                <span>Log Portion Batch ({batchQuantity}x)</span>
              </button>
            </div>
          </div>

          {/* NUTRITION CALCULATION TRANSPARENCY CARD */}
          <div className="bg-surface-container-low rounded-xl p-6 flex flex-col gap-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary-container text-on-primary-container">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-semibold tracking-tight">
                    How is this calculated?
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Scientific transparency algorithm for portion batch scaling
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                <FlaskConical className="w-4 h-4 text-primary" />
                ICMR-NIN IFCT Algorithm
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-container-lowest p-4 rounded-lg flex flex-col justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Reference Nutrition
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-1">
                    {baseCalPer100g} kcal
                  </span>
                </div>
                <div className="mt-3 flex items-center text-body-sm font-body-sm text-on-surface-variant">
                  <span>Per 100 g standard edible mass</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-lg flex flex-col justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Standard Serving Size
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-1">
                    {selectedFood.servingGram} g
                  </span>
                </div>
                <div className="mt-3 flex items-center text-body-sm font-body-sm text-on-surface-variant">
                  <span>{selectedFood.servingSize}</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-lg flex flex-col justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                    Active Consumption
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold">
                      {batchQuantity} units
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">({totalBatchGram} g net)</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-body-sm font-body-sm text-on-surface-variant">
                  <span>Adjusted meal intake batch</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-5 rounded-lg flex flex-col gap-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary" />
                  Exact Mathematical Formula Applied
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Normalized across Indian culinary preparations
                </span>
              </div>
              <div className="bg-surface-container-low px-4 py-3 rounded-lg flex flex-wrap items-center justify-between gap-4 font-mono text-on-surface">
                <div className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                  <span className="text-primary">{baseCalPer100g} kcal</span>
                  <span className="text-outline">×</span>
                  <span>({selectedFood.servingGram} / 100)</span>
                  <span className="text-outline">×</span>
                  <span className="text-secondary font-bold">{batchQuantity} units</span>
                  <span className="text-outline">=</span>
                  <span className="text-primary font-headline-sm text-headline-sm">{totalBatchKcal} kcal</span>
                </div>
                <span className="font-label-sm text-label-sm px-2.5 py-1 bg-surface-container-high rounded text-on-surface-variant font-sans">
                  Scale Factor: {scaleFactor}x
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-surface-container-low rounded-lg flex flex-col">
                  <div className="flex justify-between items-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Protein Batch</span>
                    <span className="font-title-md text-title-md text-primary font-bold">{totalBatchProtein} g</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {selectedFood.protein}g × {batchQuantity}
                  </span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg flex flex-col">
                  <div className="flex justify-between items-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Carbohydrates</span>
                    <span className="font-title-md text-title-md text-secondary font-bold">{totalBatchCarbs} g</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {selectedFood.carbs}g × {batchQuantity}
                  </span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-lg flex flex-col">
                  <div className="flex justify-between items-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total Fat Intake</span>
                    <span className="font-title-md text-title-md text-error font-bold">{totalBatchFat} g</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {selectedFood.fat}g × {batchQuantity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indian Food Database Catalog Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Indian Culinary Catalog ({foods.length} items)
            </h2>
            {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">ICMR-NIN Reference Norms</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-3 px-5">Dish Name &amp; Region</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Serving Size</th>
                <th className="py-3 px-4 text-right">Calories</th>
                <th className="py-3 px-4 text-right">Protein (g)</th>
                <th className="py-3 px-4 text-right">Carbs (g)</th>
                <th className="py-3 px-4 text-right">Fat (g)</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-body-md text-body-md">
              {foods.map((food) => (
                <tr
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className={`cursor-pointer transition-colors ${
                    selectedFood && selectedFood.id === food.id
                      ? 'bg-surface-container/60 font-medium'
                      : 'hover:bg-surface-container-low/40'
                  }`}
                >
                  <td className="py-3.5 px-5">
                    <div className="font-medium text-on-surface">{food.name}</div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      {food.alternateName || food.region} {food.ifctCode && `• ${food.ifctCode}`}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-body-sm text-body-sm text-on-surface-variant">{food.category}</td>
                  <td className="py-3.5 px-4 font-body-sm text-body-sm text-on-surface-variant">{food.servingSize}</td>
                  <td className="py-3.5 px-4 text-right font-medium text-on-surface">{food.calories}</td>
                  <td className="py-3.5 px-4 text-right text-primary font-medium">{food.protein}</td>
                  <td className="py-3.5 px-4 text-right text-on-surface-variant">{food.carbs}</td>
                  <td className="py-3.5 px-4 text-right text-secondary">{food.fat}</td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFood(food);
                      }}
                      className="px-3 py-1 rounded bg-surface-container hover:bg-primary-container hover:text-on-primary text-primary font-label-sm text-label-sm transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && foods.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-on-surface-variant font-body-md">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-on-surface-variant" />
                      <span>No Indian dishes found matching "{searchQuery}". Try another keyword or reset filter.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FoodsPage;
