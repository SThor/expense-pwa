import React, { useState, useEffect } from "react";
import axios from "axios";
import GroupedAutocomplete from "./GroupedAutocomplete";

const BASE_URL = "https://api.ynab.com/v1";
const token = import.meta.env.VITE_YNAB_TOKEN;

export default function YnabApiTestForm() {
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
  const [result, setResult] = useState("");
  const [suggestedCategoryIds, setSuggestedCategoryIds] = useState([]);

  // Fetch budgets on mount
  useEffect(() => {
    async function fetchBudgets() {
      setResult("");
      try {
        const res = await axios.get(`${BASE_URL}/budgets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBudgets(res.data.data.budgets);
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
      } catch {
        setSuggestedCategoryIds([]);
      }
    }
    fetchPayeeTrans();
  }, [payeeId, budgetId]);

  // Helper for category name lookup
  function catName(id) {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : id;
  }

  // Prepare grouped payees for autocomplete
  const groupedPayees = [
    {
      label: "Saved Payees",
      items: payees.filter(p => !p.transfer_account_id).map(p => ({
        value: p.id,
        label: p.name,
      })),
    },
    {
      label: "Payments and Transfers",
      items: payees.filter(p => p.transfer_account_id).map(p => ({
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
      await axios.post(
        `${BASE_URL}/budgets/${budgetId}/transactions`,
        { transaction },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResult("✅ Transaction sent!");
      setAmount("");
      setDesc("");
      setPayee("");
      setPayeeId("");
      setCategory("");
      setCategoryId("");
      setSuggestedCategoryIds([]);
    } catch (e) {
      setResult("Error adding transaction: " + (e.response?.data?.error?.detail || e.message));
    }
  }

  return (
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
          <div className="text-xs text-gray-500 mb-1">Suggested categories:</div>
          <div className="flex flex-wrap gap-2 mb-1">
            {suggestedCategoryIds.map(catId => (
              <button
                key={catId}
                type="button"
                onClick={() => {
                  const cat = categories.find(c => c.id === catId);
                  setCategory(cat ? cat.name : "");
                  setCategoryId(catId);
                }}
                className={`px-2 py-1 rounded text-xs border ${categoryId === catId ? "bg-blue-200 border-blue-500" : "bg-gray-100 border-gray-300"}`}
              >
                {catName(catId)}
              </button>
            ))}
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
      {result && <div className="mt-2 text-sm">{result}</div>}
    </form>
  );
}