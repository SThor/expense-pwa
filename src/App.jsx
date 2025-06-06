import { useState, useEffect } from "react";
import ToggleButton from "./components/ToggleButton";
import AmountInput from "./components/AmountInput";
import GroupedAutocomplete from "./components/GroupedAutocomplete";
import SuggestedCategoryPill from "./components/SuggestedCategoryPill";
import { useYnab } from "./YnabContext";
import { getAccountIdByName } from "./utils/ynabUtils";

export default function App() {
  const [amountMilliunits, setAmountMilliunits] = useState(0); // YNAB format
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState({ ynab: true, settleup: false });
  const [account, setAccount] = useState({ bourso: false, swile: false });
  const { ynabAPI, budgetId } = useYnab();
  const [accounts, setAccounts] = useState([]);
  const [payees, setPayees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [payee, setPayee] = useState("");
  const [payeeId, setPayeeId] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [suggestedCategoryIds, setSuggestedCategoryIds] = useState([]);

  // Fetch accounts, payees, and categories dynamically when budgetId or ynabAPI changes
  useEffect(() => {
    if (!ynabAPI || !budgetId) return;
    // Fetch accounts
    ynabAPI.accounts.getAccounts(budgetId).then((res) => {
      setAccounts(res.data.accounts);
    });
    // Fetch payees and categories
    Promise.all([
      ynabAPI.payees.getPayees(budgetId),
      ynabAPI.categories.getCategories(budgetId),
    ]).then(([payeesRes, catRes]) => {
      setPayees(payeesRes.data.payees);
      const allGroups = catRes.data.category_groups;
      setCategoryGroups(allGroups);
      setCategories(allGroups.flatMap((g) => g.categories));
    });
  }, [ynabAPI, budgetId]);

  // When payeeId changes, fetch their transactions and suggest categories
  useEffect(() => {
    if (!ynabAPI || !payeeId || !budgetId) {
      setSuggestedCategoryIds([]);
      return;
    }
    ynabAPI.transactions.getTransactionsByPayee(budgetId, payeeId).then((res) => {
      const transactions = res.data.transactions;
      const counts = {};
      transactions.forEach((tx) => {
        if (tx.category_id) {
          counts[tx.category_id] = (counts[tx.category_id] || 0) + 1;
        }
      });
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([catId]) => catId);
      setSuggestedCategoryIds(sorted);
    });
  }, [ynabAPI, payeeId, budgetId]);

  // Memoized grouped payees for autocomplete (sorted, simple alpha)
  const groupedPayees = [
    {
      label: "Payees",
      items: payees.map((p) => ({ value: p.id, label: p.name })),
    },
  ];
  // Memoized grouped categories for autocomplete
  const groupedCategories = categoryGroups
    .filter((g) => g.categories && g.categories.length > 0)
    .map((group) => ({
      label: group.name,
      items: group.categories
        .filter((cat) => !cat.deleted && !cat.hidden)
        .map((cat) => ({ value: cat.id, label: cat.name })),
    }))
    .filter((group) => group.items.length > 0);

  // Handlers for payee/category selection
  const handlePayeeChange = (val, item) => {
    setPayee(val);
    setPayeeId(item && item.value ? item.value : "");
  };
  const handleCategoryChange = (val, item) => {
    setCategory(val);
    setCategoryId(item && item.value ? item.value : "");
  };

  function handleSubmit(e) {
    e.preventDefault();
    // Format for display (for alert only)
    const sign = amountMilliunits < 0 ? "-" : "+";
    const absMilli = Math.abs(amountMilliunits);
    alert(
      `Would submit: ${sign}${absMilli} milli€ "${description}" to: ${[
        target.ynab && "YNAB",
        target.settleup && "SettleUp",
      ]
        .filter(Boolean)
        .join(", ")}`
    );
    // --- YNAB API integration example ---
    if (target.ynab && ynabAPI && budgetId) {
      // Dynamically select accountId based on toggles and fetched accounts
      let accountId = null;
      if (account.bourso) accountId = getAccountIdByName(accounts, "Boursorama");
      else if (account.swile) accountId = getAccountIdByName(accounts, "Swile");
      else accountId = getAccountIdByName(accounts, "Boursorama"); // fallback
      if (!accountId) {
        alert("No matching YNAB account found for the selected button.");
        return;
      }
      const transaction = {
        account_id: accountId,
        date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
        amount: amountMilliunits, // already in milliunits
        payee_id: payeeId || null,
        payee_name: !payeeId ? payee : undefined,
        category_id: categoryId,
        memo: description,
        cleared: "cleared",
        approved: true,
      };
      ynabAPI.transactions
        .createTransaction(budgetId, { transaction })
        .then(() => {
          // Optionally show a success message or update UI
          console.log("Transaction added to YNAB");
        })
        .catch((err) => {
          // Handle error
          console.error("YNAB API error:", err);
        });
    }
    // TODO: Add logic to call SettleUp API here, using amountMilliunits
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50">
      <div className="bg-white shadow rounded p-8 w-full max-w-md mb-10">
        <h1 className="text-2xl font-bold mb-4 text-sky-700">
          Quick Expense Entry
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AmountInput
            value={amountMilliunits}
            onChange={setAmountMilliunits}
          />
          <div className="flex gap-4">
            <ToggleButton
              active={target.ynab}
              color="#5C6CFA"
              label="YNAB"
              icon="/ynab-icon.png"
              onClick={() => setTarget((t) => ({ ...t, ynab: !t.ynab }))}
            />
            <ToggleButton
              active={target.settleup}
              color="#f2774a"
              label="SettleUp"
              icon="/settleup-icon.png"
              onClick={() =>
                setTarget((t) => ({ ...t, settleup: !t.settleup }))
              }
            />
            <ToggleButton
              active={account.bourso}
              color="#d20073"
              label="BoursoBank"
              icon="/boursobank-icon.png"
              onClick={() => setAccount((a) => ({ ...a, bourso: !a.bourso }))}
            />
            <ToggleButton
              active={account.swile}
              gradientColors={[
                "#FF0080",
                "#7928CA",
                "#007AFF",
                "#00FFE7",
                "#00FF94",
                "#FFD600",
                "#FF4B1F",
                "#FF0080",
              ]}
              label="Swile"
              icon="/swile-icon.png"
              onClick={() => setAccount((a) => ({ ...a, swile: !a.swile }))}
            />
          </div>
          <GroupedAutocomplete
            value={payee}
            onChange={handlePayeeChange}
            groupedItems={groupedPayees}
            placeholder="Payee"
            onCreate={(val) => {
              setPayee(val);
              setPayeeId("");
            }}
          />
          {suggestedCategoryIds.length > 0 && (
            <div>
              <div className="text-sm text-gray-600 mb-2 font-semibold">Suggested categories:</div>
              <div className="flex flex-wrap gap-2 mb-1">
                {suggestedCategoryIds
                  .map((catId) => {
                    const cat = categories.find((c) => c.id === catId);
                    if (!cat) return null;
                    const group = categoryGroups.find((g) => g.categories.some((c) => c.id === catId));
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
          <input
            className="input input-bordered w-full px-3 py-2 border rounded"
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded w-full"
            type="submit"
          >
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  );
}