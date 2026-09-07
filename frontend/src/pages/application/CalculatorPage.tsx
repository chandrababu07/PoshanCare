import React, { useState } from 'react';
import { Sliders, RefreshCw, Moon, Zap } from 'lucide-react';

export const CalculatorPage: React.FC = () => {
  const [age, setAge] = useState(32);
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = useState(178.0);
  const [weightKg, setWeightKg] = useState(56.4);
  const [pal, setPal] = useState(1.55);
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain' | 'health'>('gain');
  const [targetWeight, setTargetWeight] = useState(68.0);

  // Calculations for demonstration
  const bmr = sex === 'male'
    ? Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5)
    : Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);

  const tdee = Math.round(bmr * pal);

  let surplusOrDeficit = 0;
  if (goal === 'gain') surplusOrDeficit = 300;
  else if (goal === 'lose') surplusOrDeficit = -500;

  const targetIntake = tdee + surplusOrDeficit;

  const proteinGrams = Math.round((targetIntake * 0.20) / 4);
  const carbsGrams = Math.round((targetIntake * 0.50) / 4);
  const fatGrams = Math.round((targetIntake * 0.30) / 9);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
          Precision Nutrition & Target Calculator
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          Calibrated via clinical Mifflin-St Jeor equation and Indian Physical Activity Multipliers.
        </p>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-y-6">
          <div className="p-6 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-y-5">
            <div className="flex items-center justify-between border-b border-surface-container-low pb-4">
              <div className="flex items-center gap-x-2">
                <Sliders className="w-5 h-5 text-primary" />
                <h2 className="font-title-md text-title-md text-on-surface">Biometrics & Parameters</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Step 1 of 2</span>
            </div>

            {/* Age & Sex */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-y-1.5">
                <label htmlFor="input-age" className="font-label-md text-label-md text-on-surface">
                  Age (Years)
                </label>
                <input
                  id="input-age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="h-11 px-3.5 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-y-1.5">
                <label className="font-label-md text-label-md text-on-surface">Biological Sex</label>
                <div className="grid grid-cols-2 gap-1.5 h-11 p-1 bg-surface-container-low rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSex('male')}
                    className={`rounded-md font-label-md text-label-md transition-all ${
                      sex === 'male' ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setSex('female')}
                    className={`rounded-md font-label-md text-label-md transition-all ${
                      sex === 'female' ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm' : 'text-on-surface-variant'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-y-1.5">
                <label htmlFor="input-height" className="font-label-md text-label-md text-on-surface">
                  Height (cm)
                </label>
                <div className="relative flex items-center">
                  <input
                    id="input-height"
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm"
                  />
                  <span className="absolute right-3.5 font-label-sm text-label-sm text-outline pointer-events-none">cm</span>
                </div>
              </div>

              <div className="flex flex-col gap-y-1.5">
                <label htmlFor="input-weight" className="font-label-md text-label-md text-on-surface">
                  Current Weight (kg)
                </label>
                <div className="relative flex items-center">
                  <input
                    id="input-weight"
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm"
                  />
                  <span className="absolute right-3.5 font-label-sm text-label-sm text-outline pointer-events-none">kg</span>
                </div>
              </div>
            </div>

            {/* Physical Activity Multiplier (PAL) */}
            <div className="flex flex-col gap-y-2">
              <label className="font-label-md text-label-md text-on-surface">Physical Activity Level (PAL)</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 1.2, label: 'Sedentary', sub: 'Little or no exercise' },
                  { value: 1.375, label: 'Light Active', sub: 'Exercise 1–3 days/week' },
                  { value: 1.55, label: 'Moderately Active', sub: 'Strength training 4–5x/week' },
                  { value: 1.725, label: 'High Active', sub: 'Hard workout 6–7 days/week' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPal(p.value)}
                    className={`p-3 rounded-lg flex items-center justify-between transition-all ${
                      pal === p.value
                        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-label-md text-label-md">{p.label}</span>
                      <span className="font-body-sm text-body-sm opacity-80">{p.sub}</span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface font-semibold">
                      {p.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Selection */}
            <div className="flex flex-col gap-y-2 pt-2">
              <label className="font-label-md text-label-md text-on-surface">Metabolic Goal & Caloric Modulator</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'lose', label: 'Lose Fat', desc: '-500 kcal/day' },
                  { id: 'maintain', label: 'Maintain', desc: 'Energy balance' },
                  { id: 'gain', label: 'Gain Muscle', desc: 'Lean Hypertrophy (+300 kcal)' },
                  { id: 'health', label: 'General Health', desc: 'Longevity focus' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id as 'lose' | 'maintain' | 'gain' | 'health')}
                    className={`p-3 rounded-lg flex flex-col text-left transition-all ${
                      goal === g.id
                        ? 'bg-secondary text-on-secondary shadow-sm font-semibold'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="font-label-md text-label-md">{g.label}</span>
                    <span className={`font-body-sm text-body-sm mt-0.5 ${goal === g.id ? 'text-secondary-fixed' : 'text-on-surface-variant'}`}>
                      {g.desc}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-y-1.5 mt-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-target-weight" className="font-label-md text-label-md text-on-surface">
                    Target Weight
                  </label>
                  <span className="font-body-sm text-body-sm text-primary font-medium">
                    {(targetWeight - weightKg > 0 ? '+' : '') + (targetWeight - weightKg).toFixed(1)} kg projection
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="input-target-weight"
                    type="number"
                    step="0.5"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm"
                  />
                  <span className="absolute right-3.5 font-label-sm text-label-sm text-outline pointer-events-none">kg</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-title-md text-title-md rounded-lg shadow-md flex items-center justify-center gap-x-2 transition-transform active:scale-[0.99]"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Calculate Targets</span>
              </button>
            </div>
          </div>

          {/* Supportive Visual Insight Card */}
          <div className="bg-surface-container-low p-5 rounded-xl flex items-center gap-x-4">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwxCIAYxcQ7IhdcLgL5JYv9Wu6o3tJrVxq3jYbCT1vy7LXTIRhfPLFZ0kEgdAo2Lvzn3Vi8WxnBQTsZEOKPDCMId4YQBx3hnmoKXTAZPvHV1iYGrY7wqfGe9i9CKGwgt6T8k_2yjUkkvLHpqp1LmOPlajoQxt0CVeAmLorpXmgTwSXNCJRs0KlrTZ4SNOS93ylNh-7HctSl7AoWWgQ2MBW7xfDmvpAVchLNnAkQuuAfYx9L3apNbQ"
              alt="Indian staples"
              className="w-20 h-20 rounded-lg object-cover shadow-sm shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Dietary Principle</span>
              <h3 className="font-title-md text-title-md text-on-surface truncate">High Satiety Indian Staples</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
                Protein targets leverage pulses and paneer matrices to enhance leucine threshold for muscle protein synthesis.
              </p>
            </div>
          </div>
        </section>

        {/* Right Column: Calculation Results Mosaic (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-y-6">
          {/* Primary Output Cards Mosaic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* BMR Card */}
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">BMR</span>
                  <Moon className="w-4 h-4 text-outline" />
                </div>
                <div className="flex items-baseline gap-x-1.5 mt-2">
                  <span className="font-numeric-metric text-numeric-metric text-on-surface tracking-tight">
                    {bmr.toLocaleString()}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">kcal/d</span>
                </div>
              </div>
              <div className="mt-4 pt-3 flex flex-col gap-y-0.5 bg-surface-container-low -mx-5 -mb-5 px-5 py-2.5">
                <span className="font-label-sm text-label-sm text-on-surface font-medium">Basal Metabolic Rate</span>
                <span className="font-body-sm text-body-sm text-outline">Mifflin-St Jeor equation</span>
              </div>
            </div>

            {/* TDEE Card */}
            <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">TDEE</span>
                  <Zap className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex items-baseline gap-x-1.5 mt-2">
                  <span className="font-numeric-metric text-numeric-metric text-on-surface tracking-tight">
                    {tdee.toLocaleString()}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">kcal/d</span>
                </div>
              </div>
              <div className="mt-4 pt-3 flex flex-col gap-y-0.5 bg-surface-container-low -mx-5 -mb-5 px-5 py-2.5">
                <span className="font-label-sm text-label-sm text-on-surface font-medium">Total Daily Expenditure</span>
                <span className="font-body-sm text-body-sm text-outline">{pal} × BMR maintenance</span>
              </div>
            </div>

            {/* Daily Target Card */}
            <div className="bg-primary-container text-on-primary-container p-5 rounded-xl shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="flex flex-col gap-y-1 z-10">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">
                    Target Intake
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold">
                    {surplusOrDeficit >= 0 ? `+${surplusOrDeficit}` : surplusOrDeficit} kcal
                  </span>
                </div>
                <div className="flex items-baseline gap-x-1.5 mt-2">
                  <span className="font-numeric-metric text-numeric-metric text-on-primary tracking-tight font-bold">
                    {targetIntake.toLocaleString()}
                  </span>
                  <span className="font-body-sm text-body-sm text-primary-fixed font-medium">kcal/d</span>
                </div>
              </div>
              <div className="mt-4 pt-3 flex flex-col gap-y-0.5 z-10">
                <span className="font-label-sm text-label-sm text-on-primary font-semibold">
                  {goal === 'gain' ? 'Lean Hypertrophy Target' : 'Caloric Prescription Target'}
                </span>
                <span className="font-body-sm text-body-sm text-on-primary-container">Exact: {targetIntake} kcal</span>
              </div>
            </div>
          </div>

          {/* Recommended Macronutrient Allocation */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Recommended Macronutrients</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Calibrated for lean tissue synthesis and sustained metabolic velocity
                </p>
              </div>
              <span className="font-label-sm text-label-sm px-2.5 py-1 bg-surface-container-high rounded-md text-on-surface-variant font-medium">
                Iso-caloric Matrix
              </span>
            </div>

            {/* Split Visual Progress Bar */}
            <div className="flex flex-col gap-y-2">
              <div className="h-3 w-full rounded-full bg-surface-container flex overflow-hidden p-0.5">
                <div className="h-full bg-primary rounded-l-full transition-all duration-500" style={{ width: '20%' }} title="Protein 20%"></div>
                <div className="h-full bg-secondary-container transition-all duration-500" style={{ width: '50%' }} title="Carbs 50%"></div>
                <div className="h-full bg-secondary rounded-r-full transition-all duration-500" style={{ width: '30%' }} title="Fats 30%"></div>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant px-1">
                <span className="flex items-center gap-x-1.5"><span className="w-2 h-2 rounded-full bg-primary"></span> Protein 20%</span>
                <span className="flex items-center gap-x-1.5"><span className="w-2 h-2 rounded-full bg-secondary-container"></span> Carbs 50%</span>
                <span className="flex items-center gap-x-1.5"><span className="w-2 h-2 rounded-full bg-secondary"></span> Dietary Fat 30%</span>
              </div>
            </div>

            {/* Macro Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-primary font-semibold">Protein</span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-primary font-semibold">20%</span>
                </div>
                <div className="flex items-baseline gap-x-1">
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">{proteinGrams}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">g</span>
                </div>
                <div className="flex flex-col gap-y-1 pt-2">
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Energy Value</span>
                    <span className="font-medium text-on-surface">{proteinGrams * 4} kcal</span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Ratio</span>
                    <span className="font-medium text-on-surface">{(proteinGrams / weightKg).toFixed(1)} g/kg body wt</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-secondary font-semibold">Carbohydrates</span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-secondary font-semibold">50%</span>
                </div>
                <div className="flex items-baseline gap-x-1">
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">{carbsGrams}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">g</span>
                </div>
                <div className="flex flex-col gap-y-1 pt-2">
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Energy Value</span>
                    <span className="font-medium text-on-surface">{carbsGrams * 4} kcal</span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>GI Priority</span>
                    <span className="font-medium text-on-surface">Complex / Low GI</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-secondary-fixed-variant font-semibold">Dietary Fat</span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-on-secondary-fixed-variant font-semibold">30%</span>
                </div>
                <div className="flex items-baseline gap-x-1">
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">{fatGrams}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">g</span>
                </div>
                <div className="flex flex-col gap-y-1 pt-2">
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Energy Value</span>
                    <span className="font-medium text-on-surface">{fatGrams * 9} kcal</span>
                  </div>
                  <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>MUFA/PUFA Ratio</span>
                    <span className="font-medium text-on-surface">2:1 Optimal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CalculatorPage;
