import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import * as ynab from "ynab";
import { getSettleUpTokenFromEnv } from "./api/settleupTokenFromEnv";

const AppContext = createContext();

export function AppProvider({ children }) {
  // YNAB
  const defaultYnabToken = import.meta.env.VITE_YNAB_TOKEN || "";
  const defaultBudgetId = localStorage.getItem("ynab_budget_id") || "";
  const [ynabToken, setYnabToken] = useState(defaultYnabToken);
  const [budgetId, setBudgetId] = useState(defaultBudgetId);
  const ynabAPI = useMemo(() => (ynabToken ? new ynab.API(ynabToken) : null), [ynabToken]);
  const setBudgetIdPersist = (id) => {
    setBudgetId(id);
    localStorage.setItem("ynab_budget_id", id);
  };

  // Settle Up
  const [settleUpToken, setSettleUpToken] = useState("");
  const [settleUpUserId, setSettleUpUserId] = useState("");
  const [settleUpLoading, setSettleUpLoading] = useState(true);
  const [settleUpError, setSettleUpError] = useState("");

  useEffect(() => {
    async function loadToken() {
      setSettleUpLoading(true);
      setSettleUpError("");
      try {
        const t = await getSettleUpTokenFromEnv();
        setSettleUpToken(t);
        const payload = JSON.parse(atob(t.split(".")[1]));
        setSettleUpUserId(payload.sub);
      } catch (err) {
        setSettleUpError("Settle Up token error: " + err.message);
      } finally {
        setSettleUpLoading(false);
      }
    }
    loadToken();
  }, []);

  const contextValue = useMemo(() => ({
    // YNAB
    ynabToken,
    setYnabToken,
    ynabAPI,
    budgetId,
    setBudgetId: setBudgetIdPersist,
    // Settle Up
    settleUpToken,
    setSettleUpToken,
    settleUpUserId,
    setSettleUpUserId,
    settleUpLoading,
    settleUpError,
  }), [ynabToken, ynabAPI, budgetId, settleUpToken, settleUpUserId, settleUpLoading, settleUpError]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
