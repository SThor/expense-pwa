import PropTypes from "prop-types";
import { createContext, useContext, useMemo, useState, useEffect } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  // Set default budgetId if missing and ynabAPI is available
  const defaultBudgetId = import.meta.env.VITE_YNAB_BUDGET_ID || "";

  // Load YNAB token from localStorage
  const getStoredYnabToken = () => {
    try {
      return localStorage.getItem("ynab_api_key") || "";
    } catch (error) {
      console.warn("Failed to load YNAB token from localStorage:", error);
      return "";
    }
  };

  const [ynabToken, setYnabTokenState] = useState(getStoredYnabToken);
  const [budgetId, setBudgetId] = useState(defaultBudgetId);

  // Custom setter that also saves to localStorage
  const setYnabToken = (token) => {
    try {
      if (token) {
        localStorage.setItem("ynab_api_key", token);
      } else {
        localStorage.removeItem("ynab_api_key");
      }
    } catch (error) {
      console.warn("Failed to save YNAB token to localStorage:", error);
    }
    setYnabTokenState(token);
  };
  const [accounts, setAccounts] = useState([]);
  const ynabAPI = useMemo(
    () => (ynabToken ? new window.ynab.API(ynabToken) : null),
    [ynabToken],
  );
  useEffect(() => {
    if (budgetId) {
      return;
    }
    if (!ynabAPI) {
      console.warn(
        "[AppContext] ynabAPI not available, skipping budgets fetch",
      );
      return;
    }
    // No budgetId: log available budgets for manual configuration
    ynabAPI.budgets
      .getBudgets()
      .then((res) => {
        const budgets = res.data.budgets;
        if (budgets && budgets.length > 0) {
          console.warn(
            "[AppContext] No YNAB budget id configured. Available budgets:",
          );
          budgets.forEach((b) => {
            console.warn(`  - ${b.name}: ${b.id}`);
          });
        } else {
          console.warn("[AppContext] No budgets found for this YNAB account");
        }
      })
      .catch((err) => {
        console.error("[AppContext] Error fetching budgets:", err);
      });
  }, [ynabAPI, budgetId]);

  const contextValue = useMemo(
    () => ({
      // YNAB
      ynabToken,
      setYnabToken,
      ynabAPI,
      budgetId,
      setBudgetId,
      accounts,
      setAccounts,
    }),
    [ynabToken, ynabAPI, budgetId, accounts],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAppContext() {
  return useContext(AppContext);
}
