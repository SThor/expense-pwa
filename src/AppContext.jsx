import PropTypes from "prop-types";
import { createContext, useContext, useMemo, useState } from "react";
import * as ynab from "ynab";

const AppContext = createContext();

export function AppProvider({ children }) {
  // YNAB
  const defaultYnabToken = import.meta.env.VITE_YNAB_TOKEN || "";
  const defaultBudgetId = localStorage.getItem("ynab_budget_id") || "";
  const [ynabToken, setYnabToken] = useState(defaultYnabToken);
  const [budgetId, setBudgetId] = useState(defaultBudgetId);
  const [accounts, setAccounts] = useState([]);
  const ynabAPI = useMemo(
    () => (ynabToken ? new ynab.API(ynabToken) : null),
    [ynabToken],
  );
  const setBudgetIdPersist = (id) => {
    setBudgetId(id);
    localStorage.setItem("ynab_budget_id", id);
  };

  const contextValue = useMemo(
    () => ({
      // YNAB
      ynabToken,
      setYnabToken,
      ynabAPI,
      budgetId,
      setBudgetId: setBudgetIdPersist,
      accounts,
      setAccounts,
    }),
    [
      ynabToken,
      ynabAPI,
      budgetId,
      accounts,
    ],
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
