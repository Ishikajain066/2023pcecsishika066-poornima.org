/**
 * Currency utilities for Indian Rupees (INR)
 * Handles safe rounding, floating-point stabilization, and clean formatting.
 */

export const EPSILON = 0.0001;

/**
 * Rounds a number safely to 2 decimal places, avoiding binary floating-point artifacts.
 */
export function roundCurrency(value: number): number {
  if (Math.abs(value) < EPSILON) {
    return 0;
  }
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a numeric value into an Indian Rupee string (e.g. ₹6,000, ₹1,250.50).
 * Never outputs -₹0 or fractional micro-cents.
 */
export function formatINR(value: number, includeDecimalsIfWhole = false): string {
  const rounded = roundCurrency(value);
  const normalized = Math.abs(rounded) < EPSILON ? 0 : rounded;

  const isWhole = Math.abs(normalized % 1) < EPSILON;
  const minimumFractionDigits = isWhole && !includeDecimalsIfWhole ? 0 : 2;
  const maximumFractionDigits = 2;

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Math.abs(normalized));

  if (normalized < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

/**
 * Cleanly formats a number without the currency symbol (for inputs or raw counts).
 */
export function formatNumber(value: number): string {
  const rounded = roundCurrency(value);
  const normalized = Math.abs(rounded) < EPSILON ? 0 : rounded;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(normalized);
}

/**
 * Parses user currency input string to a valid float. Returns null if invalid or <= 0.
 */
export function parseCurrencyInput(input: string): number | null {
  const sanitized = input.replace(/[₹, ]/g, '').trim();
  const parsed = parseFloat(sanitized);
  if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return roundCurrency(parsed);
}
