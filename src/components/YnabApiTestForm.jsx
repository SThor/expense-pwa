import { useState, useEffect, useMemo, useCallback } from "react";
import GroupedAutocomplete from "./GroupedAutocomplete";
import SuggestedCategoryPill from "./SuggestedCategoryPill";
import { getClosestLocation } from "../utils/ynabUtils";
import { useGeolocation } from "../hooks/useGeolocation";
import { useAppContext } from "../AppContext";
import AmountInput from "./AmountInput";

export default function YnabApiTestForm({ setResult }) {
  const {
    ynabAPI,
    ynabToken: token,
    setYnabToken: setToken,
    budgetId,
    setBudgetId,
  } = useAppContext();
  const [budgets, setBudgets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [payee, setPayee] = useState(""); // free text or payee name
  const [payeeId, setPayeeId] = useState(""); // selected payee id, or "" if custom
  const [payees, setPayees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [category, setCategory] = useState(""); // visible name
  const [categoryId, setCategoryId] = useState(""); // selected category id
  const [amountMilliunits, setAmountMilliunits] = useState(0);
  const [desc, setDesc] = useState("");
  const [suggestedCategoryIds, setSuggestedCategoryIds] = useState([]);
  const [payeeLocations, setPayeeLocations] = useState([]);
  const userPosition = useGeolocation();

  // Fetch budgets on mount
  useEffect(() => {
    if (!ynabAPI) return;
    async function fetchBudgets() {
      //setResult("");
      try {
        const res = await ynabAPI.budgets.getBudgets();
        setBudgets(res.data.budgets);
        // setResult(
        //   <div>
        //     <div className="text-green-700 font-semibold">Fetched budgets</div>
        //     <pre className="mt-2 bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-40">{JSON.stringify(res.data, null, 2)}</pre>
        //   </div>
        // );
        if (!budgetId) {
          const found = res.data.budgets.find(b => b.name === "Starting anew");
          if (found) {
            setBudgetId(found.id);
            localStorage.setItem("ynab_budget_id", found.id);
          }
        }
      } catch (e) {
        setResult("Error fetching budgets: " + (e.message || e.toString()));
      }
    }
    fetchBudgets();
    // eslint-disable-next-line
  }, [ynabAPI]);

  // Fetch accounts/payees/categories when budgetId changes
  useEffect(() => {
    if (!ynabAPI || !budgetId) return;
    async function fetchAll() {
      //setResult("");
      try {
        const [accountsRes, payeesRes, catRes] = await Promise.all([
          ynabAPI.accounts.getAccounts(budgetId),
          ynabAPI.payees.getPayees(budgetId),
          ynabAPI.categories.getCategories(budgetId),
        ]);
        setAccounts(accountsRes.data.accounts);
        setPayees(payeesRes.data.payees);
        const allGroups = catRes.data.category_groups;
        setCategoryGroups(allGroups);
        const allCats = allGroups.flatMap(g => g.categories);
        setCategories(allCats);
        // setResult(
        //   <div>
        //     <div className="text-green-700 font-semibold">Fetched accounts, payees, and categories</div>
        //     <div className="text-xs text-gray-500">Accounts:</div>
        //     <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-32">{JSON.stringify(accountsRes.data, null, 2)}</pre>
        //     <div className="text-xs text-gray-500 mt-2">Payees:</div>
        //     <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-32">{JSON.stringify(payeesRes.data, null, 2)}</pre>
        //     <div className="text-xs text-gray-500 mt-2">Categories:</div>
        //     <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-32">{JSON.stringify(catRes.data, null, 2)}</pre>
        //   </div>
        // );
      } catch (e) {
        setResult("Error fetching accounts/payees/categories: " + (e.message || e.toString()));
      }
    }
    fetchAll();
  }, [ynabAPI, budgetId]);

  // When payeeId changes, fetch their transactions and suggest categories
  useEffect(() => {
    if (!ynabAPI || !payeeId || !budgetId) {
      setSuggestedCategoryIds([]);
      return;
    }
    async function fetchPayeeTrans() {
      try {
        // Correct YNAB API method for payee transactions
        const res = await ynabAPI.transactions.getTransactionsByPayee(budgetId, payeeId);
        const transactions = res.data.transactions;
        const counts = {};
        transactions.forEach(tx => {
          if (tx.category_id) {
            counts[tx.category_id] = (counts[tx.category_id] || 0) + 1;
          }
        });
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([catId]) => catId);
        setSuggestedCategoryIds(sorted);
        // setResult(
        //   <div>
        //     <div className="text-green-700 font-semibold">Fetched payee transactions</div>
        //     <pre className="mt-2 bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-40">{JSON.stringify(res.data, null, 2)}</pre>
        //   </div>
        // );
      } catch (e) {
        setSuggestedCategoryIds([]);
        setResult("Error fetching payee transactions: " + (e.message || e.toString()));
      }
    }
    fetchPayeeTrans();
  }, [ynabAPI, payeeId, budgetId]);

  // Fetch payee locations after payees are loaded
  useEffect(() => {
    if (!ynabAPI || !budgetId || payees.length === 0) return;
    async function fetchLocations() {
      try {
        const res = await ynabAPI.payeeLocations.getPayeeLocations(budgetId);
        setPayeeLocations(res.data.payee_locations);
      } catch (e) {
        // Ignore location errors for now
      }
    }
    fetchLocations();
  }, [ynabAPI, budgetId, payees.length]);

  // Sort payees: by proximity, then last tx date, then alpha
  function sortPayees(payeeList) {
    return [...payeeList].sort((a, b) => {
      // 1. Proximity
      const locA = getClosestLocation(a.id, payeeLocations, userPosition);
      const locB = getClosestLocation(b.id, payeeLocations, userPosition);
      if (userPosition && locA && locB) {
        if (locA.distance !== locB.distance) return locA.distance - locB.distance;
      } else if (userPosition && (locA || locB)) {
        return locA ? -1 : 1;
      }
      // 2. Last transaction date (not implemented, fallback to alpha)
      // 3. Alphabetical
      return a.name.localeCompare(b.name);
    });
  }

  // Memoized grouped payees for autocomplete (sorted)
  const closestPayees = useMemo(() => {
    if (!userPosition || !payeeLocations.length) return [];
    // Only payees with a location
    const payeesWithLoc = payees.filter(p => getClosestLocation(p.id, payeeLocations, userPosition));
    // Sort by distance
    const sorted = sortPayees(payeesWithLoc);
    return sorted.slice(0, 3);
  }, [payees, userPosition, payeeLocations]);

  const groupedPayees = useMemo(() => {
    const groups = [];
    if (closestPayees.length > 0) {
      groups.push({
        label: 'Closest to you',
        items: closestPayees.map(p => ({ value: p.id, label: p.name })),
      });
    }
    groups.push({
      label: "Saved Payees",
      items: sortPayees(payees.filter(p => !p.transfer_account_id && !closestPayees.some(cp => cp.id === p.id))).map(p => ({
        value: p.id,
        label: p.name,
      })),
    });
    groups.push({
      label: "Payments and Transfers",
      items: sortPayees(payees.filter(p => p.transfer_account_id)).map(p => ({
        value: p.id,
        label: p.name,
      })),
    });
    return groups.filter(g => g.items.length > 0);
  }, [payees, userPosition, payeeLocations, closestPayees]);

  // Memoized grouped categories for autocomplete
  const groupedCategories = useMemo(() =>
    categoryGroups
      .filter(g => g.categories && g.categories.length > 0)
      .map(group => ({
        label: group.name,
        items: group.categories
          .filter(cat => !cat.deleted && !cat.hidden)
          .map(cat => ({
            value: cat.id,
            label: cat.name,
          })),
      }))
      .filter(group => group.items.length > 0),
    [categoryGroups]
  );

  // Memoized: When payee is selected from autocomplete, set both payee and payeeId
  const handlePayeeChange = useCallback((val, item) => {
    setPayee(val);
    setPayeeId(item && item.value ? item.value : "");
  }, []);

  // Memoized: When category is selected from autocomplete, set both category (name) and categoryId
  const handleCategoryChange = useCallback((val, item) => {
    setCategory(val);
    setCategoryId(item && item.value ? item.value : "");
  }, []);

  // Submit
  async function handleSubmit(e) {
    e.preventDefault();
    // setResult("");
    if (!ynabAPI) {
      setResult("YNAB API not initialized.");
      return;
    }
    // Validation debug
    if (!accountId || amountMilliunits === 0 || (!payee && !payeeId) || !categoryId) {
      setResult("❌ Please fill all required fields before submitting.");
      return;
    }
    try {
      const transaction = {
        account_id: accountId,
        date: new Date().toISOString().slice(0, 10),
        amount: amountMilliunits,
        payee_id: payeeId || null, // null if custom payee (free text)
        payee_name: !payeeId ? payee : undefined, // Send free text if no id
        category_id: categoryId,
        memo: desc,
        cleared: "cleared",
        approved: true,
      };
      const response = await ynabAPI.transactions.createTransaction(budgetId, { transaction });
      setResult(
        <div>
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <span>✅ Transaction sent!</span>
            <span className="text-xs text-gray-500">(ID: {response.data.transaction.id})</span>
          </div>
          <pre className="mt-2 bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-40">{JSON.stringify(response.data, null, 2)}</pre>
        </div>
      );
      setAmountMilliunits(0);
      setDesc("");
      setPayee("");
      setPayeeId("");
      setCategory("");
      setCategoryId("");
      setSuggestedCategoryIds([]);
    } catch (e) {
      let errorMsg = "Error adding transaction: ";
      if (e.response) {
        errorMsg += e.response.data?.error?.detail || e.response.statusText;
        errorMsg += ` (HTTP ${e.response.status})`;
      } else if (e.request) {
        errorMsg += "No response from server. Network or CORS error.";
      } else {
        errorMsg += e.message;
      }
      setResult(errorMsg);
    }
  }

  // Show result below the form for debug/UX clarity
  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        autoComplete="off"
      >
        <h2 className="text-xl font-bold mb-2 text-sky-700">YNAB API Test Form</h2>
        <select
          className="input input-bordered w-full px-3 py-2 border rounded"
          value={budgetId}
          onChange={e => {
            setBudgetId(e.target.value);
            localStorage.setItem("ynab_budget_id", e.target.value);
          }}
          required
        >
          <option value="">Select Budget</option>
          {budgets.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          className="input input-bordered w-full px-3 py-2 border rounded"
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          required
        >
          <option value="">Select Account</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <GroupedAutocomplete
          value={payee}
          onChange={handlePayeeChange}
          groupedItems={groupedPayees}
          placeholder="Payee"
          onCreate={val => {
            setPayee(val);
            setPayeeId("");
          }}
        />
        {suggestedCategoryIds.length > 0 && (
          <div>
            <div className="text-sm text-gray-600 mb-2 font-semibold">Suggested categories:</div>
            <div className="flex flex-wrap gap-2 mb-1">
              {suggestedCategoryIds
                .map(catId => {
                  const cat = categories.find(c => c.id === catId);
                  if (!cat) return null; // Filter out not found
                  const group = categoryGroups.find(g => g.categories.some(c => c.id === catId));
                  return (
                    <SuggestedCategoryPill
                      key={catId}
                      cat={cat}
                      group={group}
                      selected={categoryId === catId}
                      onClick={() => {
                        setCategory(cat.name);
                        setCategoryId(catId);
                      }}
                    />
                  );
                })
                .filter(Boolean)}
            </div>
          </div>
        )}
        <GroupedAutocomplete
          value={category}
          onChange={handleCategoryChange}
          groupedItems={groupedCategories}
          placeholder="Category"
        />
        <AmountInput
          value={amountMilliunits}
          onChange={setAmountMilliunits}
        />
        <input
          className="input input-bordered w-full px-3 py-2 border rounded"
          type="text"
          placeholder="Description"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <button
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded w-full"
          type="submit"
          disabled={!accountId || amountMilliunits === 0 || (!payee && !payeeId) || !categoryId}
        >
          Add Transaction
        </button>
      </form>
    </>
  );
}