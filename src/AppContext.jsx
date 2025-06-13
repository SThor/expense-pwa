import PropTypes from "prop-types";
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import * as ynab from "ynab";

import { getSettleUpTokenFromEnv } from "./api/settleup";

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
        // Check for token in local storage
        let token = localStorage.getItem("settleUp_token");
        let userId = localStorage.getItem("settleUp_userId");

        if (!token || !userId) {
          if (import.meta.env.VITE_SETTLEUP_DUMMY === "true") {
            // Set default dummy token and user ID
            token = "dummy_token_12345";
            userId = "dummy_user_12345";
          } else {
            ({ token, userId } = await getSettleUpTokenFromEnv());
          }
        }

        localStorage.setItem("settleUp_token", token);
        localStorage.setItem("settleUp_userId", userId);
        setSettleUpToken(token);
        setSettleUpUserId(userId);
        console.log("[AppContext] Dummy Settle Up token and user ID used:", {
          token,
          userId,
        });
      } catch (err) {
        setSettleUpError("Settle Up token error: " + err.message);
        console.error("[AppContext] Error retrieving Settle Up token:", err);
      } finally {
        setSettleUpLoading(false);
      }
    }
    loadToken();
  }, []);

  // --- Auth logic using Settle Up token ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    // Set isLoggedIn to true if Settle Up token and user ID are present
    const loggedIn = !!settleUpToken && !!settleUpUserId;
    setIsLoggedIn(loggedIn);
    console.log("[AppContext] isLoggedIn recalculated:", loggedIn, {
      settleUpToken,
      settleUpUserId,
    });
  }, [settleUpToken, settleUpUserId]);

  const login = () => {
    // For your current logic, just set isLoggedIn to true.
    // You might want to add more logic here if needed.
    setIsLoggedIn(true);
    // Optionally, set dummy Settle Up token/userId if not present
    if (!settleUpToken || !settleUpUserId) {
      setSettleUpToken("dummy_token_12345");
      setSettleUpUserId("dummy_user_12345");
      localStorage.setItem("settleUp_token", "dummy_token_12345");
      localStorage.setItem("settleUp_userId", "dummy_user_12345");
    }
    console.log("[AppContext] login called");
  };

  const logout = () => {
    setSettleUpToken("");
    setSettleUpUserId("");
    setIsLoggedIn(false);
    localStorage.removeItem("settleUp_token");
    localStorage.removeItem("settleUp_userId");
    console.log("[AppContext] logout called, Settle Up token/user ID cleared");
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
      // Settle Up
      settleUpToken,
      setSettleUpToken,
      settleUpUserId,
      setSettleUpUserId,
      settleUpLoading,
      settleUpError,
      // Auth
      isLoggedIn,
      login,
      logout,
    }),
    [
      ynabToken,
      ynabAPI,
      budgetId,
      accounts,
      settleUpToken,
      settleUpUserId,
      settleUpLoading,
      settleUpError,
      isLoggedIn,
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
