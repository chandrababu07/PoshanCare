import React, { useState } from 'react';
import { Sunrise, Sun, Coffee, Moon } from 'lucide-react';

export const NutritionPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | '7day' | '30day'>('today');

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Macronutrient & Micronutrient Breakdown
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Deep physiological analytics mapped against ICMR Recommended Dietary Allowances (RDA 2024).
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low">
          {[
            { id: 'today', label: 'Today (24 Oct)' },
            { id: '7day', label: '7-Day Avg' },
            { id: '30day', label: '30-Day Avg' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeRange(item.id as 'today' | '7day' | '30day')}
              className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                timeRange === item.id
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: Donut Chart & Sub-nutrients */}
      <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-title-md text-title-md text-on-surface">Caloric & Macro Distribution Overview</h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Proportional caloric density across logged energy sources
            </span>
          </div>
          <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-primary-fixed text-on-primary-fixed font-semibold">
            In Surplus (+3.8%)
          </span>
        </div>

        {/* Chart & Summary Stats */}
        <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
          {/* Donut Chart */}
          <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle className="text-surface-container" cx="50" cy="50" fill="transparent" r="38" stroke="currentColor" strokeWidth="13" />
              {/* Carbs 49% */}
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#fe932c" strokeDasharray="117 239" strokeDashoffset="0" strokeWidth="13" />
              {/* Fat 28% */}
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#904d00" strokeDasharray="67 239" strokeDashoffset="-117" strokeWidth="13" />
              {/* Protein 16% */}
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#004532" strokeDasharray="38 239" strokeDashoffset="-184" strokeWidth="13" />
              {/* Surplus 7% */}
              <circle cx="50" cy="50" fill="transparent" r="38" stroke="#00513b" strokeDasharray="17 239" strokeDashoffset="-222" strokeWidth="13" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="font-numeric-metric text-[22px] leading-tight text-on-surface font-semibold">2,700</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Kcal</span>
            </div>
          </div>

          {/* Legend Pills & Quantities */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="flex flex-col p-3 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-x-2">
                <span className="w-3 h-3 rounded-sm bg-secondary-container"></span>
                <span className="font-label-md text-label-md text-on-surface">Carbohydrates</span>
              </div>
              <span className="font-numeric-metric text-[20px] text-on-surface mt-1 font-semibold">49%</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">1,309 kcal (327.2g)</span>
            </div>

            <div className="flex flex-col p-3 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-x-2">
                <span className="w-3 h-3 rounded-sm bg-secondary"></span>
                <span className="font-label-md text-label-md text-on-surface">Dietary Fat</span>
              </div>
              <span className="font-numeric-metric text-[20px] text-on-surface mt-1 font-semibold">28%</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">754 kcal (83.8g)</span>
            </div>

            <div className="flex flex-col p-3 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-x-2">
                <span className="w-3 h-3 rounded-sm bg-primary"></span>
                <span className="font-label-md text-label-md text-on-surface">Protein</span>
              </div>
              <span className="font-numeric-metric text-[20px] text-on-surface mt-1 font-semibold">16%</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">419 kcal (104.8g)</span>
            </div>

            <div className="flex flex-col p-3 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-x-2">
                <span className="w-3 h-3 rounded-sm bg-primary-container"></span>
                <span className="font-label-md text-label-md text-on-surface">Surplus Buffer</span>
              </div>
              <span className="font-numeric-metric text-[20px] text-on-surface mt-1 font-semibold">7%</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">100 kcal (+3.8% over)</span>
            </div>
          </div>
        </div>

        {/* Sub-nutrients Table */}
        <div className="flex flex-col pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Sub-nutrient Hierarchy</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Target vs ICMR RDA</span>
          </div>
          <div className="divide-y divide-surface-container">
            <div className="py-3.5 flex items-center justify-between px-2 hover:bg-surface-container/40 rounded-md transition-colors">
              <div className="flex flex-col">
                <span className="font-body-md text-body-md text-on-surface font-medium">Complex Carbohydrates (Starches)</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Unrefined grains, Millets, Whole legumes</span>
              </div>
              <div className="flex items-center gap-x-6 text-right">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">245.0 g</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">74.8% of carbs</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary-container/10 text-primary font-label-sm text-label-sm font-semibold">Optimal</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between px-2 hover:bg-surface-container/40 rounded-md transition-colors">
              <div className="flex flex-col">
                <span className="font-body-md text-body-md text-on-surface font-medium">Dietary Soluble & Insoluble Fiber</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Gourd vegetables, greens, pulse skins</span>
              </div>
              <div className="flex items-center gap-x-6 text-right">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">38.4 g</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Target: 30-40g</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary-container/10 text-primary font-label-sm text-label-sm font-semibold">Target Met</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between px-2 hover:bg-surface-container/40 rounded-md transition-colors">
              <div className="flex flex-col">
                <span className="font-body-md text-body-md text-on-surface font-medium">Free & Natural Sugars</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Lactose from curd/milk, seasonal fruits</span>
              </div>
              <div className="flex items-center gap-x-6 text-right">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">43.8 g</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">&lt; 10% daily energy</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">Safe Window</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between px-2 hover:bg-surface-container/40 rounded-md transition-colors">
              <div className="flex flex-col">
                <span className="font-body-md text-body-md text-on-surface font-medium">Monounsaturated Fatty Acids (MUFA)</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Mustard oil, groundnut oil, almonds</span>
              </div>
              <div className="flex items-center gap-x-6 text-right">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">42.0 g</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">50.1% of fat intake</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary-container/10 text-primary font-label-sm text-label-sm font-semibold">Cardio-safe</span>
              </div>
            </div>

            <div className="py-3.5 flex items-center justify-between px-2 hover:bg-surface-container/40 rounded-md transition-colors">
              <div className="flex flex-col">
                <span className="font-body-md text-body-md text-on-surface font-medium">Saturated Lipids & Desi Ghee</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Whole milk curd, A2 cow ghee tempering</span>
              </div>
              <div className="flex items-center gap-x-6 text-right">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">21.8 g</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Within 8% limit</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">Balanced</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Meal-wise Chrono-Nutrition & Energy */}
      <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-title-md text-title-md text-on-surface">Meal-wise Chrono-Nutrition & Energy</h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Circadian distribution of caloric density across logged eating windows
            </span>
          </div>
          <span className="font-label-sm text-label-sm px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant">
            4 Meals Tracked
          </span>
        </div>

        <div className="flex flex-col gap-y-5">
          {/* Breakfast */}
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-on-secondary-fixed">
                  <Sunrise className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Breakfast (08:30 AM)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">3 Boiled Eggs, Banana, Buffalo Milk</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-x-1.5">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">465 kcal</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">(17.2%)</span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-medium">P: 28.5g • C: 38.4g • F: 28.6g</span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-secondary-container rounded-full" style={{ width: '17.2%' }}></div>
            </div>
          </div>

          {/* Lunch */}
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-on-primary-fixed">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Lunch (01:15 PM)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Rice, Dal Tadka, Paneer Bhurji, Salad, Papad</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-x-1.5">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">885 kcal</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">(32.8%)</span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-medium">P: 39.3g • C: 108.7g • F: 24.6g</span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-primary-container rounded-full" style={{ width: '32.8%' }}></div>
            </div>
          </div>

          {/* Evening Snack */}
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <Coffee className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Evening Snack (05:00 PM)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Roasted Chana, Masala Chai, Marie Biscuits</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-x-1.5">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">320 kcal</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">(11.8%)</span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-medium">P: 13.0g • C: 51.6g • F: 6.6g</span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: '11.8%' }}></div>
            </div>
          </div>

          {/* Dinner */}
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Dinner (08:30 PM)</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">3 Phulkas, Chicken Curry, Poriyal, Curd, Badam Milk</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-x-1.5">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">1,030 kcal</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">(38.2%)</span>
                </div>
                <span className="font-label-sm text-label-sm text-primary font-medium">P: 46.8g • C: 109.2g • F: 41.2g</span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-container overflow-hidden">
              <div className="h-full bg-tertiary-container rounded-full" style={{ width: '38.2%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Micronutrient Adherence Grid */}
      <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-title-md text-title-md text-on-surface">Essential Micronutrients (ICMR-NIN RDA)</h2>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Vitamins, Minerals, & Trace Electrolytes</span>
          </div>
          <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-surface-container text-primary font-semibold">
            18 of 19 Met
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Vitamin D3', val: '600 IU', rda: '600 IU', pct: 100, status: 'Met' },
            { name: 'Vitamin B12', val: '2.4 mcg', rda: '2.4 mcg', pct: 100, status: 'Met' },
            { name: 'Iron (Fe)', val: '14.2 mg', rda: '19.0 mg', pct: 75, status: '75% RDA' },
            { name: 'Calcium (Ca)', val: '780 mg', rda: '1000 mg', pct: 78, status: '78% RDA' },
            { name: 'Potassium (K)', val: '2,850 mg', rda: '3500 mg', pct: 81, status: '81% RDA' },
            { name: 'Zinc (Zn)', val: '11.2 mg', rda: '12.0 mg', pct: 93, status: '93% RDA' },
          ].map((m) => (
            <div key={m.name} className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface font-semibold">{m.name}</span>
                <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-primary font-semibold">
                  {m.status}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-numeric-metric text-[20px] text-on-surface font-bold">{m.val}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">RDA: {m.rda}</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${m.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NutritionPage;
