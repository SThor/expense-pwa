/**
 * Format a Date instance as YYYY-MM-DD using the local timezone.
 *
 * Contract:
 * - Input: Date instance (required)
 * - Output: string in the form YYYY-MM-DD
 * - Throws: TypeError if input is not a valid Date
 */
export function formatYYYYMMDDLocal(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new TypeError("formatYYYYMMDDLocal expects a valid Date");
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
