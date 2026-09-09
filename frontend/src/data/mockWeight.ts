export interface WeightLogEntry {
  id: string;
  date: string;
  weight: number;
  note?: string;
  movingAverage: number;
}

export interface WeightMilestone {
  date: string;
  weight: number;
  title: string;
}

export const MOCK_WEIGHT_SUMMARY = {
  currentWeight: 56.4,
  targetWeight: 68.0,
  startWeight: 55.0,
  netAccretion: 1.4,
  weeklyVelocity: 0.25,
  progressPct: 10.8,
  daysTracked: 30,
};

export const MOCK_WEIGHT_MILESTONES: WeightMilestone[] = [
  { date: 'Oct 10', weight: 55.0, title: 'Milestone 1: 55.0 kg reached' },
  { date: 'Oct 24', weight: 56.4, title: 'Today: 56.4 kg' },
];

export const MOCK_WEIGHT_LOGS: WeightLogEntry[] = [
  { id: 'w-1', date: 'Sep 25, 2024', weight: 55.0, movingAverage: 55.0, note: 'Baseline starting weight' },
  { id: 'w-2', date: 'Sep 28, 2024', weight: 55.2, movingAverage: 55.1, note: 'Post morning workout' },
  { id: 'w-3', date: 'Oct 02, 2024', weight: 55.4, movingAverage: 55.3, note: 'Normal hydration' },
  { id: 'w-4', date: 'Oct 06, 2024', weight: 55.7, movingAverage: 55.5, note: 'Good sleep & high carbs' },
  { id: 'w-5', date: 'Oct 10, 2024', weight: 55.0, movingAverage: 55.6, note: 'Milestone 1 reached' },
  { id: 'w-6', date: 'Oct 14, 2024', weight: 56.0, movingAverage: 55.8, note: 'High sodium dinner variance' },
  { id: 'w-7', date: 'Oct 18, 2024', weight: 56.1, movingAverage: 56.0, note: 'Consistent surplus (+200 kcal)' },
  { id: 'w-8', date: 'Oct 22, 2024', weight: 56.5, movingAverage: 56.2, note: 'Sambar dal sodium retention' },
  { id: 'w-9', date: 'Oct 24, 2024', weight: 56.4, movingAverage: 56.3, note: 'Today active entry' },
];

export const MOCK_WEEKLY_CORRELATION = [
  { week: 'Sep 27 – Oct 03', avgCalories: 2580, weightDelta: '+0.20 kg', pct: 82 },
  { week: 'Oct 04 – Oct 10', avgCalories: 2640, weightDelta: '+0.30 kg', pct: 86 },
  { week: 'Oct 11 – Oct 17', avgCalories: 2680, weightDelta: '+0.25 kg', pct: 89 },
  { week: 'Oct 18 – Oct 24', avgCalories: 2700, weightDelta: '+0.20 kg', pct: 91 },
];
