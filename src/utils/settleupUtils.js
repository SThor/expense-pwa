// src/utils/settleupUtils.js
// Utility for SettleUp autofill logic

/**
 * Find the most common category (emoji) from transactions where the given field contains the input (case-insensitive, trimmed).
 * @param {Array} transactions - Array of transaction objects
 * @param {string} input - The user input (payee or description)
 * @param {string} field - The field to match on (e.g., 'purpose')
 * @param {string} matchType - 'contains' | 'startsWith' | 'exact'
 * @returns {string|null} - Most common category or null if none
 */
export function getMostCommonCategoryFromTransactions(
  transactions,
  input,
  field = "purpose",
  matchType = "contains",
) {
  if (!input || !transactions || transactions.length === 0) return null;
  const normInput = input.trim().toLowerCase();
  let matches = [];
  for (const tx of transactions) {
    if (!tx[field] || !tx.category || tx.category.trim() === "") continue;
    const normField = tx[field].trim().toLowerCase();
    let isMatch = false;
    if (matchType === "contains") {
      isMatch = normField.includes(normInput);
    } else if (matchType === "startsWith") {
      isMatch = normField.startsWith(normInput);
    } else if (matchType === "exact") {
      isMatch = normField === normInput;
    }
    if (isMatch) matches.push(tx);
  }
  if (matches.length === 0) return null;
  const counts = {};
  for (const tx of matches) {
    const cat = tx.category.trim();
    if (cat) counts[cat] = (counts[cat] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}
