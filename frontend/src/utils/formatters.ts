/**
 * PoshanCare — Pure Locale-Aware & Unit-Aware Formatting Utilities
 *
 * CRITICAL ARCHITECTURAL PRINCIPLE:
 * These formatters strictly transform presentation at the view boundary.
 * Internal calculations and database models remain 100% canonical:
 * - Weight: kg
 * - Height: cm
 * - Volume: ml
 * - Energy: kcal
 * - Macros: g
 * - Timestamp: UTC ISO-8601
 */

export type UnitSystem = 'metric' | 'imperial';

/**
 * Get device/browser IANA timezone identifier with fallback
 */
export function getUserBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

/**
 * Format date string or Date object with locale and timezone awareness
 */
export function formatDate(
  dateInput: Date | string | number,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions,
  timeZone?: string
): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';

    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: timeZone || getUserBrowserTimezone(),
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch (err) {
    console.warn('formatDate failed:', err);
    return String(dateInput);
  }
}

/**
 * Format time with locale and timezone awareness
 */
export function formatTime(
  dateInput: Date | string | number,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions,
  timeZone?: string
): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';

    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timeZone || getUserBrowserTimezone(),
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch (err) {
    console.warn('formatTime failed:', err);
    return String(dateInput);
  }
}

/**
 * Format relative elapsed time (e.g. "2 hours ago", "yesterday", "in 3 days")
 */
export function formatRelativeTime(
  dateInput: Date | string | number,
  locale: string = 'en'
): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '';

    const now = Date.now();
    const diffSec = Math.round((d.getTime() - now) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffSec) < 60) {
      return rtf.format(diffSec, 'second');
    }
    const diffMin = Math.round(diffSec / 60);
    if (Math.abs(diffMin) < 60) {
      return rtf.format(diffMin, 'minute');
    }
    const diffHours = Math.round(diffMin / 60);
    if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour');
    }
    const diffDays = Math.round(diffHours / 24);
    if (Math.abs(diffDays) < 30) {
      return rtf.format(diffDays, 'day');
    }
    const diffMonths = Math.round(diffDays / 30);
    if (Math.abs(diffMonths) < 12) {
      return rtf.format(diffMonths, 'month');
    }
    const diffYears = Math.round(diffDays / 365);
    return rtf.format(diffYears, 'year');
  } catch (err) {
    console.warn('formatRelativeTime failed:', err);
    return formatDate(dateInput, locale);
  }
}

/**
 * Format numbers according to locale
 */
export function formatNumber(
  value: number,
  locale: string = 'en',
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Format percentage (e.g. 75% or 75.5%)
 */
export function formatPercentage(
  fractionOrPercent: number,
  locale: string = 'en',
  isFraction: boolean = false,
  decimals: number = 0
): string {
  try {
    const val = isFraction ? fractionOrPercent : fractionOrPercent / 100;
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  } catch {
    return `${Math.round(fractionOrPercent)}%`;
  }
}

/**
 * Format energy (Calories / kcal)
 */
export function formatEnergy(
  calories: number,
  locale: string = 'en'
): string {
  const formatted = formatNumber(Math.round(calories), locale);
  return `${formatted} kcal`;
}

/**
 * Format macronutrient grams
 */
export function formatMacro(
  grams: number,
  locale: string = 'en',
  decimals: number = 1
): string {
  const formatted = formatNumber(grams, locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatted} g`;
}

/**
 * Format body weight according to unit system (metric kg vs imperial lbs)
 * Canonical storage is ALWAYS kg.
 */
export function formatWeight(
  weightKg: number,
  unitSystem: UnitSystem = 'metric',
  locale: string = 'en'
): string {
  if (unitSystem === 'imperial') {
    const lbs = weightKg * 2.20462;
    const formatted = formatNumber(lbs, locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${formatted} lbs`;
  }

  const formatted = formatNumber(weightKg, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${formatted} kg`;
}

/**
 * Format body height according to unit system (metric cm vs imperial ft in)
 * Canonical storage is ALWAYS cm.
 */
export function formatHeight(
  heightCm: number,
  unitSystem: UnitSystem = 'metric',
  locale: string = 'en'
): string {
  if (unitSystem === 'imperial') {
    const totalInches = Math.round(heightCm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}' ${inches}"`;
  }

  const formatted = formatNumber(Math.round(heightCm), locale);
  return `${formatted} cm`;
}

/**
 * Format fluid volume according to unit system (metric ml / L vs imperial fl oz)
 * Canonical storage is ALWAYS ml.
 */
export function formatVolume(
  volumeMl: number,
  unitSystem: UnitSystem = 'metric',
  locale: string = 'en'
): string {
  if (unitSystem === 'imperial') {
    const flOz = volumeMl / 29.5735;
    const formatted = formatNumber(flOz, locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${formatted} fl oz`;
  }

  if (volumeMl >= 1000) {
    const liters = volumeMl / 1000;
    const formatted = formatNumber(liters, locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return `${formatted} L`;
  }

  const formatted = formatNumber(Math.round(volumeMl), locale);
  return `${formatted} ml`;
}
