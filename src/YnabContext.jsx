import React, { createContext, useContext, useMemo, useState } from "react";
import * as ynab from "ynab";

// Get token from env by default
const defaultToken = import.meta.env.VITE_YNAB_TOKEN || "";
const defaultBudgetId = localStorage.getItem("ynab_budget_id") || "";

const YnabContext = createContext();

export function YnabProvider({ children }) {
  const [token, setToken] = useState(defaultToken);
  const [budgetId, setBudgetId] = useState(defaultBudgetId);
  // Memoize API instance
  const ynabAPI = useMemo(() => (token ? new ynab.API(token) : null), [token]);

  // Persist budgetId to localStorage
  const setBudgetIdPersist = (id) => {
    setBudgetId(id);
    localStorage.setItem("ynab_budget_id", id);
  };

  return (
    <YnabContext.Provider value={{ token, setToken, ynabAPI, budgetId, setBudgetId: setBudgetIdPersist }}>
      {children}
    </YnabContext.Provider>
  );
}

export function useYnab() {
  return useContext(YnabContext);
}
