import React, { useState, useEffect } from "react";
import axios from "axios";
import GroupedAutocomplete from "./GroupedAutocomplete";

const BASE_URL = "https://api.ynab.com/v1";
const token = import.meta.env.VITE_YNAB_TOKEN;

export default function YnabApiTestForm({ result, setResult }) {
  const [budgets, setBudgets] = useState([]);
  const [budgetId, setBudgetId] = useState(() => localStorage.getItem("ynab_budget_id") || "");
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [payee, setPayee] = useState(""); // free text or payee name
  const [payeeId, setPayeeId] = useState(""); // selected payee id, or "" if custom
  const [payees, setPayees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [category, setCategory] = useState(""); // visible name
  const [categoryId, setCategoryId] = useState(""); // selected category id
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [suggestedCategoryIds, setSuggestedCategoryIds] = useState([]);
  const [payeeLocations, setPayeeLocations] = useState([]);
  const [userPosition, setUserPosition] = useState(null);

  // Fetch budgets on mount
  useEffect(() => {
    async function fetchBudgets() {
      setResult("");
      try {
        const res = await axios.get(`${BASE_URL}/budgets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBudgets(res.data.data.budgets);
        setResult(
          <div>
            <div className="text-green-700 font-semibold">Fetched budgets</div>
            <pre className="mt-2 bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-40">{JSON.stringify(res.data, null, 2)}</pre>
          </div>
        );
        if (!budgetId) {
          const found = res.data.data.budgets.find(b => b.name === "Starting anew");
          if (found) {
            setBudgetId(found.id);
            localStorage.setItem("ynab_budget_id", found.id);
          }
        }
      } catch (e) {
        setResult("Error fetching budgets: " + e.message);
      }
    }
    fetchBudgets();
    // eslint-disable-next-line
  }, [token]);

  // Fetch accounts/payees/categories when budgetId changes
  useEffect(() => {
    if (!budgetId) return;
    async function fetchAll() {
      setResult("");
      try {
        const [accountsRes, payeesRes, catRes] = await Promise.all([
          axios.get(`${BASE_URL}/budgets/${budgetId}/accounts`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/budgets/${budgetId}/payees`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/budgets/${budgetId}/categories`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setAccounts(accountsRes.data.data.accounts);
        setPayees(payeesRes.data.data.payees);
        const allGroups = catRes.data.data.category_groups;
        setCategoryGroups(allGroups);
        const allCats = allGroups.flatMap(g => g.categories);
        setCategories(allCats);
        setResult(
          <div>
            <div className="text-green-700 font-semibold">Fetched accounts, payees, and categories</div>
            <div className="text-xs text-gray-500">Accounts:</div>
            <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-32">{JSON.stringify(accountsRes.data, null, 2)}</pre>
            <div className="text-xs text-gray-500 mt-2">Payees:</div>
            <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-32">{JSON.stringify(payeesRes.data, null, 2)}</pre>
            <div className="text-xs text-gray-500 mt-2">Categories:</div>
            <pre className="bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-32">{JSON.stringify(catRes.data, null, 2)}</pre>
          </div>
        );
      } catch (e) {
        setResult("Error fetching accounts/payees/categories: " + e.message);
      }
    }
    fetchAll();
  }, [budgetId]);

  // When payeeId changes, fetch their transactions and suggest categories
  useEffect(() => {
    if (!payeeId || !budgetId) {
      setSuggestedCategoryIds([]);
      return;
    }
    async function fetchPayeeTrans() {
      try {
        const res = await axios.get(`${BASE_URL}/budgets/${budgetId}/payees/${payeeId}/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const transactions = res.data.data.transactions;
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
        setResult(
          <div>
            <div className="text-green-700 font-semibold">Fetched payee transactions</div>
            <pre className="mt-2 bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-40">{JSON.stringify(res.data, null, 2)}</pre>
          </div>
        );
      } catch (e) {
        setSuggestedCategoryIds([]);
        setResult("Error fetching payee transactions: " + e.message);
      }
    }
    fetchPayeeTrans();
  }, [payeeId, budgetId]);

  // Fetch payee locations after payees are loaded
  useEffect(() => {
    if (!budgetId || payees.length === 0) return;
    async function fetchLocations() {
      try {
        const res = await axios.get(`${BASE_URL}/budgets/${budgetId}/payee_locations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPayeeLocations(res.data.data.payee_locations);
      } catch (e) {
        // Ignore location errors for now
      }
    }
    fetchLocations();
  }, [budgetId, payees.length]);

  // Get user geolocation (ask once)
  useEffect(() => {
    if (userPosition !== null) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserPosition(null),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [userPosition]);

  // Helper: distance between two lat/lng points (Haversine)
  function haversine(lat1, lng1, lat2, lng2) {
    function toRad(x) { return (x * Math.PI) / 180; }
    const R = 6371e3; // meters
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Helper: get closest location for a payee
  function getClosestLocation(payeeId) {
    if (!userPosition) return null;
    const locs = payeeLocations.filter(l => l.payee_id === payeeId && l.latitude && l.longitude);
    if (locs.length === 0) return null;
    let minDist = Infinity, closest = null;
    for (const loc of locs) {
      const dist = haversine(userPosition.lat, userPosition.lng, loc.latitude, loc.longitude);
      if (dist < minDist) { minDist = dist; closest = loc; }
    }
    return closest ? { ...closest, distance: minDist } : null;
  }

  // Sort payees: by proximity, then last tx date, then alpha
  function sortPayees(payeeList) {
    return [...payeeList].sort((a, b) => {
      // 1. Proximity
      const locA = getClosestLocation(a.id);
      const locB = getClosestLocation(b.id);
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

  // Prepare grouped payees for autocomplete (sorted)
  const groupedPayees = [
    {
      label: "Saved Payees",
      items: sortPayees(payees.filter(p => !p.transfer_account_id)).map(p => ({
        value: p.id,
        label: p.name,
      })),
    },
    {
      label: "Payments and Transfers",
      items: sortPayees(payees.filter(p => p.transfer_account_id)).map(p => ({
        value: p.id,
        label: p.name,
      })),
    }
  ];

  // Prepare grouped categories for autocomplete
  const groupedCategories = categoryGroups
    .filter(g => g.categories && g.categories.length > 0)
    .map(group => ({
      label: group.name,
      items: group.categories
        .filter(cat => !cat.deleted && !cat.hidden) // Only active categories
        .map(cat => ({
          value: cat.id,
          label: cat.name,
        })),
    }))
    .filter(group => group.items.length > 0);

  // When payee is selected from autocomplete, set both payee and payeeId
  function handlePayeeChange(val, item) {
    setPayee(val);
    setPayeeId(item && item.value ? item.value : "");
  }

  // When category is selected from autocomplete, set both category (name) and categoryId
  function handleCategoryChange(val, item) {
    setCategory(val);
    setCategoryId(item && item.value ? item.value : "");
  }

  // Submit
  async function handleSubmit(e) {
    e.preventDefault();
    setResult("");
    // Validation debug
    if (!accountId || !amount || (!payee && !payeeId) || !categoryId) {
      setResult("❌ Please fill all required fields before submitting.");
      return;
    }
    try {
      const transaction = {
        account_id: accountId,
        date: new Date().toISOString().slice(0, 10),
        amount: Math.round(Number(amount) * 1000),
        payee_id: payeeId || null, // null if custom payee (free text)
        payee_name: !payeeId ? payee : undefined, // Send free text if no id
        category_id: categoryId,
        memo: desc,
        cleared: "cleared",
        approved: true,
      };
      const response = await axios.post(
        `${BASE_URL}/budgets/${budgetId}/transactions`,
        { transaction },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResult(
        <div>
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <span>✅ Transaction sent!</span>
            <span className="text-xs text-gray-500">(ID: {response.data.data.transaction.id})</span>
          </div>
          <pre className="mt-2 bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-40">{JSON.stringify(response.data, null, 2)}</pre>
        </div>
      );
      setAmount("");
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
                    <button
                      key={catId}
                      type="button"
                      onClick={() => {
                        setCategory(cat.name);
                        setCategoryId(catId);
                      }}
                      className={`px-3 py-1.5 rounded-full text-[1rem] font-medium border flex items-center gap-2 transition-colors duration-150 ${categoryId === catId ? "bg-blue-200 border-blue-500 text-blue-900" : "bg-gray-100 border-gray-300 text-gray-800"}`}
                      style={{ cursor: "pointer", minHeight: 36 }}
                    >
                      <span className="text-gray-600">{group ? group.name : "?"}</span>
                      <span className="mx-1">&gt;</span>
                      <span className="font-semibold">{cat.name}</span>
                    </button>
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
        <input
          className="input input-bordered w-full px-3 py-2 border rounded"
          type="number"
          placeholder="Amount (e.g. 12.34)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
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
          disabled={!accountId || !amount || (!payee && !payeeId) || !categoryId}
        >
          Add Transaction
        </button>
      </form>
    </>
  );
}