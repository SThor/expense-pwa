import { useState, useEffect, useMemo, useRef } from "react";
import { getAccountIdByName } from "./utils/ynabUtils";
import { useAppContext } from "./AppContext";
import { getMostCommonCategoryFromTransactions } from "./utils/settleupUtils";
import { getClosestLocation } from "./utils/ynabUtils";
import { useGeolocation } from "./hooks/useGeolocation";
import AppToggles from "./components/AppToggles";
import AccountToggles from "./components/AccountToggles";
import AmountSection from "./components/AmountSection";
import SwileAmountSection from "./components/SwileAmountSection";
import DetailsSection from "./components/DetailsSection";
import ReviewSection from "./components/ReviewSection";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "./index.css";

// Default value for SettleUp emoji category
const DEFAULT_SETTLEUP_CATEGORY = "∅";
// Default Swile paid amount (in milliunits, -25€)
const DEFAULT_SWILE_MILLIUNITS = -25000;

export default function App() {
  const [amountMilliunits, setAmountMilliunits] = useState(0); // YNAB format
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState({ ynab: true, settleup: false });
  const [account, setAccount] = useState({ bourso: false, swile: false });
  const { ynabAPI, budgetId } = useAppContext();
  const [accounts, setAccounts] = useState([]);
  const [payees, setPayees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [payee, setPayee] = useState("");
  const [payeeId, setPayeeId] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [suggestedCategoryIds, setSuggestedCategoryIds] = useState([]);
  const [payeeLocations, setPayeeLocations] = useState([]);
  const userPosition = useGeolocation();

  // SettleUp integration state
  const { settleUpToken, settleUpUserId, settleUpLoading, settleUpError } =
    useAppContext();
  const [settleUpCategory, setSettleUpCategory] = useState(DEFAULT_SETTLEUP_CATEGORY);
  const [settleUpGroups, setSettleUpGroups] = useState(null);
  const [settleUpTestGroup, setSettleUpTestGroup] = useState(null);
  const [settleUpMembers, setSettleUpMembers] = useState([]);
  const [settleUpPayerId, setSettleUpPayerId] = useState("");
  const [settleUpForWhomIds, setSettleUpForWhomIds] = useState([]);
  const [settleUpCurrency, setSettleUpCurrency] = useState("");
  const [settleUpResult, setSettleUpResult] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useState(null);
  const [swileMilliunits, setSwileMilliunits] = useState(DEFAULT_SWILE_MILLIUNITS); // 25€ default

  // Section reveal state
  const [showAccounts, setShowAccounts] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Section refs for CSSTransition to avoid findDOMNode warning
  const amountRef = useRef(null);
  const accountsRef = useRef(null);
  const swileRef = useRef(null);
  const detailsRef = useRef(null);
  const reviewRef = useRef(null);

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
    ynabAPI.transactions
      .getTransactionsByPayee(budgetId, payeeId)
      .then((res) => {
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

  // Sort payees: by proximity, then alpha
  function sortPayees(payeeList) {
    return [...payeeList].sort((a, b) => {
      const locA = getClosestLocation(a.id, payeeLocations, userPosition);
      const locB = getClosestLocation(b.id, payeeLocations, userPosition);
      if (userPosition && locA && locB) {
        if (locA.distance !== locB.distance) return locA.distance - locB.distance;
      } else if (userPosition && (locA || locB)) {
        return locA ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  // Memoized closest payees (top 3 by proximity)
  const closestPayees = useMemo(() => {
    if (!userPosition || !payeeLocations.length) return [];
    const payeesWithLoc = payees.filter(p => getClosestLocation(p.id, payeeLocations, userPosition));
    const sorted = sortPayees(payeesWithLoc);
    return sorted.slice(0, 3);
  }, [payees, userPosition, payeeLocations]);

  // Memoized grouped payees for autocomplete (with proximity group)
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
    // If SettleUp emoji is unset and YNAB category starts with emoji, set it
    if (
      settleUpCategory === DEFAULT_SETTLEUP_CATEGORY &&
      item && item.label
    ) {
      // Regex to match emoji at the start
      const emojiMatch = item.label.match(/^\p{Emoji}/u);
      if (emojiMatch) {
        setSettleUpCategory(emojiMatch[0]);
      }
    }
  };

  // Fetch SettleUp groups on mount if token/userId available
  useEffect(() => {
    if (!settleUpLoading && !settleUpError && settleUpToken && settleUpUserId) {
      setSettleUpResult("Loading groups...");
      fetch(
        `https://settle-up-sandbox.firebaseio.com/userGroups/${settleUpUserId}.json?auth=${settleUpToken}`
      )
        .then((res) => res.json())
        .then((data) => {
          setSettleUpGroups(data || {});
          setSettleUpResult("");
        })
        .catch((err) =>
          setSettleUpResult("Error fetching groups: " + err.message)
        );
    }
  }, [settleUpLoading, settleUpError, settleUpToken, settleUpUserId]);

  // Find test group or fallback to first group
  useEffect(() => {
    if (!settleUpGroups || !settleUpToken || !settleUpUserId) return;
    const groupIds = Object.keys(settleUpGroups);
    (async () => {
      let found = null;
      for (const groupId of groupIds) {
        const res = await fetch(
          `https://settle-up-sandbox.firebaseio.com/groups/${groupId}.json?auth=${settleUpToken}`
        );
        const data = await res.json();
        if (
          data &&
          data.name &&
          data.name.trim().toLowerCase() === "test group"
        ) {
          found = { groupId, ...data };
          break;
        }
      }
      if (!found && groupIds.length > 0) {
        const groupId = groupIds[0];
        const res = await fetch(
          `https://settle-up-sandbox.firebaseio.com/groups/${groupId}.json?auth=${settleUpToken}`
        );
        const data = await res.json();
        found = { groupId, ...data };
        setSettleUpResult(
          "No group named 'test group' found. Using your first group instead."
        );
      } else {
        setSettleUpResult(found ? "" : "No group named 'test group' found.");
      }
      setSettleUpTestGroup(found);
    })();
  }, [settleUpGroups, settleUpToken, settleUpUserId]);

  // Fetch members when testGroup changes
  useEffect(() => {
    if (!settleUpTestGroup || !settleUpTestGroup.groupId || !settleUpToken)
      return;
    fetch(
      `https://settle-up-sandbox.firebaseio.com/members/${settleUpTestGroup.groupId}.json?auth=${settleUpToken}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const arr = Object.entries(data).map(([id, m]) => ({ id, ...m }));
          setSettleUpMembers(arr);
          setSettleUpForWhomIds(
            arr.filter((m) => m.active !== false).map((m) => m.id)
          );
          setSettleUpPayerId(arr[0]?.id || "");
        }
      });
    setSettleUpCurrency(settleUpTestGroup?.convertedToCurrency || "EUR");
  }, [settleUpTestGroup, settleUpToken]);

  // Autofill SettleUp category (emoji) based on previous transactions with same payee/description
  useEffect(() => {
    if (!payee || !settleUpTestGroup?.groupId || !settleUpToken) return;
    // Debounce: only fetch after user stops typing for 500ms
    const handler = setTimeout(async () => {
      try {
        const url = `https://settle-up-sandbox.firebaseio.com/transactions/${settleUpTestGroup.groupId}.json?auth=${settleUpToken}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data) return;
        const transactions = Object.values(data);
        // Use shared utility with 'contains' match
        const mostCommon = getMostCommonCategoryFromTransactions(transactions, payee, 'purpose', 'contains');
        if (mostCommon) {
          setSettleUpCategory(mostCommon);
        }
      } catch (e) {
        // ignore autofill errors
      }
    }, 500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line
  }, [payee, settleUpTestGroup?.groupId, settleUpToken]);

  // --- YNAB transaction submit logic ---
  async function handleYnabSubmit() {
    if (!ynabAPI || !budgetId) return;
    // Split transaction logic
    if (account.swile && account.bourso) {
      // Swile account is the main account for the split
      const swileAccountId = getAccountIdByName(accounts, "Swile");
      const boursoAccountId = getAccountIdByName(accounts, "Boursorama");
      if (!swileAccountId || !boursoAccountId) {
        alert("No matching YNAB account found for Swile or Bourso.");
        return;
      }
      // Calculate transfer inflow for Bourso (should be positive)
      const transferInflowMilliunits = swileMilliunits - amountMilliunits; // This will be positive if swileMilliunits > amountMilliunits
      // Compose split transaction
      const boursoTransferPayeeId = "eabe1e60-fa92-40f7-8636-5c8bcbf1404a"; // Transfer : Boursorama
      const transaction = {
        account_id: swileAccountId,
        date: new Date().toISOString().slice(0, 10),
        amount: swileMilliunits, // Parent amount must equal sum of subtransactions
        payee_id: payeeId || null, // User's payee for the main outflow
        payee_name: !payeeId ? payee : undefined,
        category_id: null, // Split transactions must not have a category at the parent level
        memo: description,
        approved: true,
        subtransactions: [
          {
            amount: amountMilliunits, // Outflow (total spent, negative)
            category_id: categoryId,
            memo: description,
            payee_id: payeeId || null, // User's payee for the main outflow
          },
          {
            amount: transferInflowMilliunits, // Inflow (transfer from Bourso, positive)
            payee_id: boursoTransferPayeeId, // Use the transfer payee id for Boursorama
            transfer_account_id: boursoAccountId, // This will use the transfer payee for Bourso
            memo: "Bourso completion",
          },
        ],
      };
      try {
        console.log('[YNAB] Split Request:', transaction);
        const res = await ynabAPI.transactions.createTransaction(budgetId, { transaction });
        console.log('[YNAB] Split Response:', res);
        setSettleUpResult('✅ YNAB split transaction sent!');
        setAmountMilliunits(0);
        setDescription("");
        setSwileMilliunits(DEFAULT_SWILE_MILLIUNITS);
      } catch (err) {
        console.error('[YNAB] API error:', err);
        setSettleUpResult('YNAB API error: ' + (err?.message || err));
      }
      return;
    }
    // ...existing code for single-account transaction...
    let accountId = null;
    if (account.bourso)
      accountId = getAccountIdByName(accounts, "Boursorama");
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
      approved: true,
    };
    try {
      console.log('[YNAB] Request:', transaction);
      const res = await ynabAPI.transactions.createTransaction(budgetId, { transaction });
      console.log('[YNAB] Response:', res);
      setSettleUpResult('✅ YNAB transaction sent!');
      setAmountMilliunits(0);
      setDescription("");
    } catch (err) {
      console.error('[YNAB] API error:', err);
      setSettleUpResult('YNAB API error: ' + (err?.message || err));
    }
  }

  // --- SettleUp transaction submit logic ---
  async function handleSettleUpSubmit() {
    setSettleUpResult("");
    if (
      !settleUpToken ||
      !settleUpTestGroup?.groupId ||
      amountMilliunits === 0 ||
      !settleUpPayerId ||
      settleUpForWhomIds.length === 0
    ) {
      setSettleUpResult("❌ Please fill all required fields before submitting.");
      return;
    }
    const amount = (-amountMilliunits / 1000).toFixed(2);
    const now = Date.now();
    const tx = {
      category: settleUpCategory === "∅" ? "" : settleUpCategory,
      currencyCode: settleUpCurrency || "EUR",
      dateTime: now,
      items: [
        {
          amount: amount,
          forWhom: settleUpForWhomIds.map((id) => ({ memberId: id, weight: "1" })),
        },
      ],
      purpose: payee + (description ? ` - ${description}` : ""),
      type: "expense",
      whoPaid: [{ memberId: settleUpPayerId, weight: "1" }],
      fixedExchangeRate: false,
      exchangeRates: undefined,
      receiptUrl: undefined,
    };
    try {
      const url = `https://settle-up-sandbox.firebaseio.com/transactions/${settleUpTestGroup.groupId}.json?auth=${settleUpToken}`;
      console.log('[SettleUp] Request:', tx);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      });
      const data = await res.json();
      console.log('[SettleUp] Response:', data);
      if (data && data.name) {
        setSettleUpResult("✅ SettleUp transaction sent!");
        setAmountMilliunits(0);
        setDescription("");
      } else {
        setSettleUpResult("Error adding transaction: " + JSON.stringify(data));
      }
    } catch (e) {
      setSettleUpResult("Error adding transaction: " + e.message);
    }
  }

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
    if (target.ynab) {
      handleYnabSubmit();
    }
    if (target.settleup) {
      handleSettleUpSubmit();
    }
  }

  // Reset swileMilliunits to default when toggles change
  useEffect(() => {
    if (account.swile && account.bourso) {
      setSwileMilliunits(DEFAULT_SWILE_MILLIUNITS);
    }
  }, [account.swile, account.bourso]);

  // Reveal logic
  useEffect(() => {
    if (target.ynab && amountMilliunits !== 0) setShowAccounts(true);
    if (amountMilliunits !== 0 && (!target.ynab || (account.bourso || account.swile))) setShowDetails(true);
    if (amountMilliunits !== 0 && (!target.ynab || (account.bourso || account.swile))) setShowReview(true);
    if (amountMilliunits === 0) {
      setShowAccounts(false);
      setShowDetails(false);
      setShowReview(false);
    }
  }, [amountMilliunits, target.ynab, account.bourso, account.swile]);

  // Preload toggle button images
  useEffect(() => {
    const icons = [
      "/ynab-icon.png",
      "/settleup-icon.png",
      "/boursobank-icon.png",
      "/swile-icon.png",
    ];
    icons.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50">
      <div className="bg-white shadow rounded p-8 w-full max-w-md mb-10">
        <h1 className="text-2xl font-bold mb-4 text-sky-700">
          Quick Expense Entry
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AppToggles target={target} setTarget={setTarget} />

          <TransitionGroup component={null}>
            <CSSTransition key="amount" timeout={300} classNames="fade-slide" nodeRef={amountRef}>
              <AmountSection ref={amountRef} amountMilliunits={amountMilliunits} setAmountMilliunits={setAmountMilliunits} />
            </CSSTransition>

            {showAccounts && (
              <CSSTransition key="accounts" timeout={300} classNames="fade-slide" nodeRef={accountsRef}>
                <AccountToggles ref={accountsRef} account={account} setAccount={setAccount} />
              </CSSTransition>
            )}

            {target.ynab && amountMilliunits !== 0 && account.swile && (
              <CSSTransition key="swile" timeout={300} classNames="fade-slide" nodeRef={swileRef}>
                <SwileAmountSection ref={swileRef} swileMilliunits={swileMilliunits} setSwileMilliunits={setSwileMilliunits} max={amountMilliunits} />
              </CSSTransition>
            )}

            {showDetails && (
              <CSSTransition key="details" timeout={300} classNames="fade-slide" nodeRef={detailsRef}>
                <DetailsSection
                  ref={detailsRef}
                  payee={payee}
                  setPayee={setPayee}
                  payeeId={payeeId}
                  setPayeeId={setPayeeId}
                  groupedPayees={groupedPayees}
                  settleUpCategory={settleUpCategory}
                  setSettleUpCategory={setSettleUpCategory}
                  DEFAULT_SETTLEUP_CATEGORY={DEFAULT_SETTLEUP_CATEGORY}
                  suggestedCategoryIds={suggestedCategoryIds}
                  categories={categories}
                  categoryGroups={categoryGroups}
                  category={category}
                  setCategory={setCategory}
                  categoryId={categoryId}
                  setCategoryId={setCategoryId}
                  groupedCategories={groupedCategories}
                  handleCategoryChange={handleCategoryChange}
                  description={description}
                  setDescription={setDescription}
                />
              </CSSTransition>
            )}

            {showReview && (
              <CSSTransition key="review" timeout={300} classNames="fade-slide" nodeRef={reviewRef}>
                <ReviewSection
                  ref={reviewRef}
                  amountMilliunits={amountMilliunits}
                  swileMilliunits={swileMilliunits}
                  payee={payee}
                  category={category}
                  description={description}
                  target={target}
                  account={account}
                  settleUpCategory={settleUpCategory}
                />
              </CSSTransition>
            )}
          </TransitionGroup>

          {settleUpResult && (
            <div
              className="text-sm mt-2"
              style={{
                color: settleUpResult.startsWith("✅") ? "green" : "red",
              }}
            >
              {settleUpResult}
            </div>
          )}
          <button
            className={`bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded w-full ${
              (!target.ynab && !target.settleup) || (target.ynab && !account.bourso && !account.swile)
                ? ' opacity-50 cursor-not-allowed' : ''
            }`}
            type="submit"
            disabled={
              (!target.ynab && !target.settleup) ||
              (target.ynab && !account.bourso && !account.swile)
            }
            title={
              !target.ynab && !target.settleup
                ? 'Enable YNAB and/or SettleUp to add a transaction.'
                : target.ynab && !account.bourso && !account.swile
                ? 'Enable either BoursoBank or Swile account to add a YNAB transaction.'
                : undefined
            }
          >
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  );
}