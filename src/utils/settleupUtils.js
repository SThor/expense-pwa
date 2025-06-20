/**
 * Find the most common category (emoji) from SettleUp transactions that match the given payee name.
 * @param {Array} transactions - Array of SettleUp transaction objects
 * @param {string} payeeName - The payee name to search for
 * @returns {string|null} - Most common category emoji or null if none found
 */
export function getMostCommonCategoryFromTransactions(transactions, payeeName) {
  if (!payeeName || !transactions || transactions.length === 0) return null;
  
  const normInput = payeeName.trim().toLowerCase();
  const matches = [];
  
  for (const tx of transactions) {
    if (!tx.purpose || !tx.category || tx.category.trim() === "") continue;
    
    const normPurpose = tx.purpose.trim().toLowerCase();
    if (normPurpose.includes(normInput)) {
      matches.push(tx);
    }
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
