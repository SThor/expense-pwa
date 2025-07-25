import PropTypes from "prop-types";
import { useState, useEffect, useMemo, useRef } from "react";

import {
  fetchSettleUpUserGroups,
  fetchSettleUpGroup,
  fetchSettleUpMembers,
} from "./api/settleup.js";
import { useAppContext } from "./AppContext.jsx";
import { useAuth } from "./AuthProvider.jsx";
import AccountToggles from "./components/AccountToggles.jsx";
import AmountSection from "./components/AmountSection.jsx";
import AppToggles from "./components/AppToggles.jsx";
import Collapsible from "./components/Collapsible.jsx";
import DetailsSection from "./components/DetailsSection.jsx";
import SwileAmountSection from "./components/SwileAmountSection.jsx";
import { DEFAULT_SWILE_MILLIUNITS, DEFAULT_CURRENCY } from "./constants";
import { useGeolocation } from "./hooks/useGeolocation";
import { formStatePropType } from "./propTypes.js";
import { getClosestLocation } from "./utils/ynabUtils.js";
import "./index.css";

export default function App({ onSubmit, formState, setFormState }) {
  const { ynabAPI, budgetId, setAccounts } = useAppContext();
  const { token: settleUpToken, user: settleUpUser } = useAuth();
  const [payees, setPayees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [suggestedCategoryIds, setSuggestedCategoryIds] = useState([]);
  const [payeeLocations, setPayeeLocations] = useState([]);
  const userPosition = useGeolocation();

  // SettleUp integration state
  const [settleUpResult, setSettleUpResult] = useState("");

  // Section reveal state
  const [showSwile, setShowSwile] = useState(false);

  // Section refs for CSSTransition to avoid findDOMNode warning
  const amountRef = useRef(null);
  const accountsRef = useRef(null);
  const swileRef = useRef(null);
  const detailsRef = useRef(null);

  // Fetch accounts, payees, and categories dynamically when budgetId or ynabAPI changes
  useEffect(() => {
    if (!ynabAPI || !budgetId) {
      console.warn("[YNAB] Skipping fetch: ynabAPI or budgetId missing", {
        ynabAPI,
        budgetId,
      });
      return;
    }
    // Fetch accounts
    ynabAPI.accounts
      .getAccounts(budgetId)
      .then((res) => {
        setAccounts(res.data.accounts);
      })
      .catch((err) => {
        console.error("[YNAB] Error fetching accounts:", err);
      });
    // Fetch payees and categories
    Promise.all([
      ynabAPI.payees.getPayees(budgetId),
      ynabAPI.categories.getCategories(budgetId),
    ])
      .then(([payeesRes, catRes]) => {
        setPayees(payeesRes.data.payees);
        const allGroups = catRes.data.category_groups;
        setCategoryGroups(allGroups);
        setCategories(allGroups.flatMap((g) => g.categories));
      })
      .catch((err) => {
        console.error("[YNAB] Error fetching payees or categories:", err);
      });
  }, [ynabAPI, budgetId]);

  // When payeeId changes, fetch their transactions and suggest categories
  useEffect(() => {
    if (!ynabAPI || !formState.payeeId || !budgetId) {
      setSuggestedCategoryIds([]);
      return;
    }
    ynabAPI.transactions
      .getTransactionsByPayee(budgetId, formState.payeeId)
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
  }, [ynabAPI, formState.payeeId, budgetId]);

  // Fetch payee locations after payees are loaded
  useEffect(() => {
    if (!ynabAPI || !budgetId || payees.length === 0) return;
    ynabAPI.payeeLocations.getPayeeLocations(budgetId).then((res) => {
      setPayeeLocations(res.data.payee_locations);
    });
  }, [ynabAPI, budgetId, payees.length]);

  // Sort payees: by proximity, then alpha
  function sortPayees(payeeList) {
    return [...payeeList].sort((a, b) => {
      const locA = getClosestLocation(a.id, payeeLocations, userPosition);
      const locB = getClosestLocation(b.id, payeeLocations, userPosition);
      if (userPosition && locA && locB) {
        if (locA.distance !== locB.distance)
          return locA.distance - locB.distance;
      } else if (userPosition && (locA || locB)) {
        return locA ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  // Memoized closest payees (top 3 by proximity)
  const closestPayees = useMemo(() => {
    if (!userPosition || !payeeLocations.length) return [];
    const payeesWithLoc = payees.filter((p) =>
      getClosestLocation(p.id, payeeLocations, userPosition),
    );
    const sorted = sortPayees(payeesWithLoc);
    return sorted.slice(0, 3);
  }, [payees, userPosition, payeeLocations]);

  // Memoized grouped payees for autocomplete (with proximity group)
  const groupedPayees = useMemo(() => {
    const groups = [];
    if (closestPayees.length > 0) {
      groups.push({
        label: "Closest to you",
        items: closestPayees.map((p) => ({ value: p.id, label: p.name })),
      });
    }
    groups.push({
      label: "Saved Payees",
      items: sortPayees(
        payees.filter(
          (p) =>
            !p.transfer_account_id &&
            !closestPayees.some((cp) => cp.id === p.id),
        ),
      ).map((p) => ({
        value: p.id,
        label: p.name,
      })),
    });
    groups.push({
      label: "Payments and Transfers",
      items: sortPayees(payees.filter((p) => p.transfer_account_id)).map(
        (p) => ({
          value: p.id,
          label: p.name,
        }),
      ),
    });
    return groups.filter((g) => g.items.length > 0);
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

  // Fetch SettleUp groups on mount if token/userId available
  useEffect(() => {
    if (!settleUpToken || !settleUpUser?.uid) return;
    setSettleUpResult("Loading groups...");
    fetchSettleUpUserGroups(settleUpToken, settleUpUser.uid)
      .then((data) => {
        console.log("[SettleUp] Groups fetched:", data);
        setFormState((prev) => ({ ...prev, settleUpGroups: data }));
        setSettleUpResult("");
      })
      .catch((err) => {
        console.error("[SettleUp] Error fetching groups:", err);
        setSettleUpResult("Error fetching groups: " + err.message);
      });
  }, [settleUpUser?.uid]); // Find test group or fallback to first group
  useEffect(() => {
    if (!formState.settleUpGroups || !settleUpToken || !settleUpUser.uid)
      return;
    const groupIds = Object.keys(formState.settleUpGroups);
    const targetGroupName = import.meta.env.VITE_SETTLEUP_GROUP_NAME;

    (async () => {
      let found = null;
      let shouldSearchForSpecificGroup =
        targetGroupName && targetGroupName.trim() !== "";

      if (!shouldSearchForSpecificGroup) {
        console.warn(
          "[SettleUp] VITE_SETTLEUP_GROUP_NAME is not defined or empty, skipping group search and using first group",
        );
        setSettleUpResult(
          "No target group name configured. Using your first group.",
        );
      } else {
        // Search for the specific group
        for (const groupId of groupIds) {
          try {
            const data = await fetchSettleUpGroup(settleUpToken, groupId);
            if (
              data &&
              data.name &&
              data.name.trim().toLowerCase() === targetGroupName.toLowerCase()
            ) {
              found = { groupId, ...data };
              break;
            }
          } catch (err) {
            setSettleUpResult("Error fetching group: " + err.message);
          }
        }

        if (found) {
          setSettleUpResult(""); // Clear any previous messages on success
        } else {
          setSettleUpResult(
            "No group named '" +
              targetGroupName +
              "' found. Using your first group instead.",
          );
        }
      }

      // If no specific group found (or we skipped the search), use first group
      if (!found && groupIds.length > 0) {
        const groupId = groupIds[0];
        const data = await fetchSettleUpGroup(settleUpToken, groupId);
        found = { groupId, ...data };
      }

      setFormState((prev) => ({
        ...prev,
        settleUpGroup: found,
      }));
    })();
  }, [formState.settleUpGroups, settleUpUser?.uid]);

  // Fetch members when group changes
  useEffect(() => {
    if (
      !formState.settleUpGroup ||
      !formState.settleUpGroup.groupId ||
      !settleUpToken
    )
      return;
    fetchSettleUpMembers(settleUpToken, formState.settleUpGroup.groupId)
      .then((data) => {
        if (data) {
          const arr = Object.entries(data).map(([id, m]) => ({ id, ...m }));
          setFormState((prev) => ({
            ...prev,
            settleUpMembers: arr.filter((m) => m.active !== false),
            settleUpPayerId: arr[0]?.id || "",
          }));
        }
      })
      .catch((err) => {
        setSettleUpResult("Error fetching members: " + err.message);
      });
    setFormState((prev) => ({
      ...prev,
      settleUpCurrency:
        formState.settleUpGroup?.convertedToCurrency || DEFAULT_CURRENCY,
    }));
  }, [formState.settleUpGroup, settleUpToken]);
  // Reset swileMilliunits to default when toggles change
  useEffect(() => {
    if (formState.account.swile && formState.account.bourso) {
      setFormState((prev) => ({
        ...prev,
        swileMilliunits: DEFAULT_SWILE_MILLIUNITS,
      }));
    }
  }, [formState.account.swile, formState.account.bourso]);

  // Reveal logic
  // accounts and details sections must stay visible once they've been shown
  // swile section is only shown if it makes sense
  useEffect(() => {
    if (formState.target.ynab && formState.amountMilliunits !== 0) {
      setFormState((prev) => ({ ...prev, showAccounts: true }));
    }
    if (
      formState.amountMilliunits !== 0 &&
      (formState.target.settleup ||
        formState.account.bourso ||
        formState.account.swile)
    ) {
      setFormState((prev) => ({ ...prev, showDetails: true }));
    }
    setShowSwile(
      formState.target.ynab &&
        formState.amountMilliunits !== 0 &&
        formState.account.swile,
    );
  }, [
    formState.amountMilliunits,
    formState.target.ynab,
    formState.account.bourso,
    formState.account.swile,
  ]);

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
    <form onSubmit={onSubmit} className="space-y-4">
      <AppToggles
        target={formState.target}
        setTarget={(updater) =>
          setFormState((prev) => ({
            ...prev,
            target:
              typeof updater === "function" ? updater(prev.target) : updater,
          }))
        }
      />
      <AmountSection
        ref={amountRef}
        amountMilliunits={formState.amountMilliunits || 0}
        setAmountMilliunits={(val) =>
          setFormState((prev) => ({ ...prev, amountMilliunits: val }))
        }
      />

      <Collapsible isOpened={formState.showAccounts}>
        <AccountToggles
          ref={accountsRef}
          account={formState.account}
          setAccount={(updater) =>
            setFormState((prev) => ({
              ...prev,
              account:
                typeof updater === "function" ? updater(prev.account) : updater,
            }))
          }
        />
      </Collapsible>

      <Collapsible isOpened={showSwile}>
        <SwileAmountSection
          ref={swileRef}
          swileMilliunits={formState.swileMilliunits}
          setSwileMilliunits={(val) =>
            setFormState((prev) => ({ ...prev, swileMilliunits: val }))
          }
          min={formState.amountMilliunits}
        />
      </Collapsible>

      <Collapsible isOpened={formState.showDetails}>
        <DetailsSection
          ref={detailsRef}
          formState={formState}
          setFormState={setFormState}
          groupedPayees={groupedPayees}
          groupedCategories={groupedCategories}
          categories={categories}
          categoryGroups={categoryGroups}
          suggestedCategoryIds={suggestedCategoryIds}
        />
      </Collapsible>

      <div
        className="text-sm mt-2"
        style={{ color: settleUpResult.startsWith("✅") ? "green" : "red" }}
      >
        {settleUpResult}
      </div>
      <button
        className={`bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded w-full ${
          (!formState.target?.ynab && !formState.target?.settleup) ||
          (formState.target?.ynab &&
            !formState.account?.bourso &&
            !formState.account?.swile)
            ? " opacity-50 cursor-not-allowed"
            : ""
        }`}
        type="submit"
        disabled={
          (!formState.target?.ynab && !formState.target?.settleup) ||
          (formState.target?.ynab &&
            !formState.account?.bourso &&
            !formState.account?.swile)
        }
        title={
          !formState.target?.ynab && !formState.target?.settleup
            ? "Enable YNAB and/or SettleUp to add a transaction."
            : formState.target?.ynab &&
                !formState.account?.bourso &&
                !formState.account?.swile
              ? "Enable either BoursoBank or Swile account to add a YNAB transaction."
              : undefined
        }
      >
        Add Transaction
      </button>
    </form>
  );
}

App.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  formState: formStatePropType.isRequired,
  setFormState: PropTypes.func.isRequired,
};
