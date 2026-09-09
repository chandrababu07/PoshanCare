import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  List,
  Apple,
  X,
  Calculator,
  Plus,
  Copy,
  Utensils,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { CustomRecipe, MOCK_RECIPE_BUILDER, MOCK_SAVED_RECIPES, RecipeIngredient } from '../../data/mockRecipes';
import { recipeService } from '../../services/recipeService';

export const RecipesPage: React.FC = () => {
  const [savedRecipes, setSavedRecipes] = useState<CustomRecipe[]>(MOCK_SAVED_RECIPES);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(MOCK_RECIPE_BUILDER.id);
  const [recipeTitle, setRecipeTitle] = useState(MOCK_RECIPE_BUILDER.title);
  const [recipeDescription, setRecipeDescription] = useState(MOCK_RECIPE_BUILDER.description);
  const [servings, setServings] = useState(MOCK_RECIPE_BUILDER.servings);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(MOCK_RECIPE_BUILDER.ingredients);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    recipeService.getRecipes().then((data) => {
      if (isMounted && data && data.length > 0) {
        setSavedRecipes(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live batch totals
  const batchKcal = ingredients.reduce((sum, i) => sum + i.calories, 0);
  const batchProtein = ingredients.reduce((sum, i) => sum + i.protein, 0).toFixed(1);
  const batchCarbs = ingredients.reduce((sum, i) => sum + i.carbs, 0).toFixed(1);
  const batchFat = ingredients.reduce((sum, i) => sum + i.fat, 0).toFixed(1);

  const safeServings = Math.max(1, servings);
  const perServingKcal = Math.round(batchKcal / safeServings);
  const perServingP = (parseFloat(batchProtein) / safeServings).toFixed(1);
  const perServingC = (parseFloat(batchCarbs) / safeServings).toFixed(1);
  const perServingF = (parseFloat(batchFat) / safeServings).toFixed(1);

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((item) => item.id !== id));
  };

  const handleAddSampleIngredient = () => {
    const newIng: RecipeIngredient = {
      id: `ing-${Date.now()}`,
      name: 'Fresh Curd / Dahi Tempering',
      code: 'IFCT-D012',
      subtext: 'Whole cow milk curd',
      batchMeasure: '100g',
      calories: 65,
      protein: 3.5,
      carbs: 4.5,
      fat: 3.2,
    };
    setIngredients([...ingredients, newIng]);
  };

  const handleSaveRecipe = async () => {
    setIsSaving(true);
    try {
      const saved = await recipeService.createRecipe({
        title: recipeTitle,
        description: recipeDescription,
        servings: safeServings,
        ingredients: ingredients,
      });
      setActiveRecipeId(saved.id);
      setSavedRecipes((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
      setStatusMessage(`Recipe "${saved.title}" saved successfully!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch {
      setStatusMessage('Error saving recipe.');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogToLunch = async () => {
    const targetId = activeRecipeId || (savedRecipes[0] ? savedRecipes[0].id : '1');
    const result = await recipeService.logRecipeToMeal(targetId, 'lunch', 1.0);
    setStatusMessage(result.message || `Logged 1 serving of "${recipeTitle}" to Lunch!`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDuplicate = () => {
    const dupTitle = `${recipeTitle} (Copy)`;
    setRecipeTitle(dupTitle);
    setActiveRecipeId(null);
    setStatusMessage(`Duplicated recipe workbench as "${dupTitle}". Click Save to persist.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleLoadRecipe = (recipe: CustomRecipe) => {
    setActiveRecipeId(recipe.id);
    setRecipeTitle(recipe.title);
    setRecipeDescription(recipe.description);
    setServings(recipe.servings);
    setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : MOCK_RECIPE_BUILDER.ingredients);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Custom Recipe Builder & Workbench
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Formulate multi-ingredient recipes with batch scaling and moisture loss adjustment.
          </p>
        </div>
        <button
          onClick={() => {
            setActiveRecipeId(null);
            setRecipeTitle('New Custom Indian Recipe');
            setRecipeDescription('Custom homemade formulation with balanced macro distribution.');
            setServings(2);
            setIngredients([]);
          }}
          className="flex items-center gap-x-2 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md rounded-xl shadow-sm transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Create New Recipe</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-primary-container/20 border border-primary/30 flex items-center gap-x-3 text-primary font-body-md font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Active Recipe Workbench */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden space-y-6">
        {/* Workbench Banner */}
        <div className="p-6 bg-surface-container-low/40 border-b border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-y-1 max-w-xl">
            <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Active Recipe Workbench</span>
            <input
              type="text"
              value={recipeTitle}
              onChange={(e) => setRecipeTitle(e.target.value)}
              className="font-headline-md text-headline-md text-on-surface bg-transparent border-b border-transparent hover:border-surface-container-high focus:border-primary focus:outline-none font-semibold transition-colors"
            />
            <input
              type="text"
              value={recipeDescription}
              onChange={(e) => setRecipeDescription(e.target.value)}
              className="font-body-sm text-body-sm text-on-surface-variant mt-1 bg-transparent border-b border-transparent hover:border-surface-container-high focus:border-primary focus:outline-none"
            />
          </div>

          {/* Per Portion Metric Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col items-center min-w-[100px]">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Serving Yield</span>
              <div className="flex items-center gap-x-1 mt-1">
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="w-6 h-6 rounded bg-surface-container text-on-surface font-bold text-xs"
                >
                  -
                </button>
                <span className="font-numeric-metric text-[20px] text-on-surface font-bold px-1">{servings}</span>
                <button
                  type="button"
                  onClick={() => setServings((s) => s + 1)}
                  className="w-6 h-6 rounded bg-surface-container text-on-surface font-bold text-xs"
                >
                  +
                </button>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">portions</span>
            </div>

            <div className="p-3 bg-primary-container text-on-primary-container rounded-xl shadow-sm flex flex-col items-center min-w-[110px]">
              <span className="font-label-sm text-label-sm text-primary-fixed uppercase">Per Portion</span>
              <span className="font-numeric-metric text-[22px] text-on-primary font-bold mt-0.5">{perServingKcal}</span>
              <span className="font-body-sm text-body-sm text-primary-fixed">kcal / 185g</span>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm flex items-center gap-4 text-body-sm">
              <div className="flex flex-col">
                <span className="text-primary font-bold">{perServingP}g</span>
                <span className="text-on-surface-variant">Protein</span>
              </div>
              <div className="flex flex-col">
                <span className="text-secondary font-bold">{perServingC}g</span>
                <span className="text-on-surface-variant">Carbs</span>
              </div>
              <div className="flex flex-col">
                <span className="text-on-secondary-fixed-variant font-bold">{perServingF}g</span>
                <span className="text-on-surface-variant">Fat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredient Composition Table */}
        <div className="p-6 flex flex-col gap-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              <List className="w-5 h-5 text-primary" />
              <h3 className="font-title-md text-title-md text-on-surface">Formula & Raw Batch Composition</h3>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-semibold">
              ICMR Moisture Retention: -10.4% mass
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase">
                  <th className="py-3 px-4 rounded-l-lg">Raw Food Ingredient (IFCT Standard)</th>
                  <th className="py-3 px-3">Batch Measure</th>
                  <th className="py-3 px-3 text-right">Calories</th>
                  <th className="py-3 px-3 text-right">Protein</th>
                  <th className="py-3 px-3 text-right">Carbs</th>
                  <th className="py-3 px-3 text-right">Fat</th>
                  <th className="py-3 px-3 text-right rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low font-body-md text-body-md text-on-surface">
                {ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-surface-container/40 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-x-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                        <Apple className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{ing.name}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Code: {ing.code} • {ing.subtext}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-label-md text-label-md text-on-surface">{ing.batchMeasure}</td>
                    <td className="py-3.5 px-3 text-right font-medium">{ing.calories} kcal</td>
                    <td className="py-3.5 px-3 text-right text-primary font-semibold">{ing.protein}g</td>
                    <td className="py-3.5 px-3 text-right text-on-surface-variant">{ing.carbs}g</td>
                    <td className="py-3.5 px-3 text-right text-secondary">{ing.fat}g</td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleRemoveIngredient(ing.id)}
                        className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors"
                        title="Remove ingredient"
                        aria-label={`Remove ${ing.name}`}
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {ingredients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-on-surface-variant font-body-md">
                      No ingredients in workbench. Click below to add.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Formula Audit Card */}
          <div className="p-4 rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-x-3">
              <Calculator className="w-6 h-6 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Calculation Transparency Formula
                </span>
                <span className="font-title-md text-title-md text-on-surface">
                  Batch Total ({batchKcal} kcal & {batchProtein}g P) ÷ {servings} portions ={' '}
                  <span className="text-primary font-bold">
                    {perServingKcal} kcal & {perServingP}g protein
                  </span>{' '}
                  / portion
                </span>
              </div>
            </div>
          </div>

          {/* Workbench Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddSampleIngredient}
                className="inline-flex items-center gap-x-1.5 px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Ingredient</span>
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                className="inline-flex items-center gap-x-1.5 px-3.5 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicate</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogToLunch}
                className="inline-flex items-center gap-x-1.5 px-4 py-2 rounded-lg bg-secondary text-on-secondary hover:bg-on-secondary-container transition-colors font-label-md text-label-md shadow-sm"
              >
                <Utensils className="w-4 h-4" />
                <span>Log 1 Serving to Lunch</span>
              </button>
              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={isSaving}
                className="inline-flex items-center gap-x-1.5 px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md text-label-md shadow-sm font-semibold disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Recipe Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Saved Custom Recipes Grid */}
      <section className="flex flex-col gap-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <h2 className="font-headline-md text-headline-md text-on-surface">Saved Custom Recipes</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-medium">
              {savedRecipes.length} Active Curations
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="p-5 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">
                    {recipe.servings} Servings • {recipe.prepTimeMinutes} mins
                  </span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-primary font-semibold">
                    {recipe.caloriesPerServing} kcal / serv
                  </span>
                </div>
                <h3 className="font-title-md text-title-md text-on-surface font-semibold">{recipe.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{recipe.description}</p>
              </div>

              <div className="pt-3 border-t border-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-x-3 text-body-sm font-body-sm">
                  <span className="text-primary font-bold">P {recipe.proteinPerServing}g</span>
                  <span className="text-secondary">C {recipe.carbsPerServing}g</span>
                  <span className="text-on-secondary-fixed-variant">F {recipe.fatPerServing}g</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadRecipe(recipe)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-primary-container hover:text-on-primary text-primary font-label-md text-label-md transition-colors"
                >
                  Edit / Load
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RecipesPage;
