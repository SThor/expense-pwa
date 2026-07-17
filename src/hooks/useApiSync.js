import { useState, useCallback, useRef } from "react";

import {
  addSettleUpTransaction,
  fetchSettleUpPermissions,
} from "../api/settleup";
import { BOURSO_TRANSFER_PAYEE_ID } from "../constants";
import { formatYYYYMMDDLocal } from "../utils/dateUtils";
import { getAccountIdByName } from "../utils/ynabUtils";

// ─── Status constants ──────────────────────────────────────────────────────────

export const API_STATUS = {
  IDLE: "idle",
  SKIPPED: "skipped",
  FETCHING: "fetching",
  FETCH_ERROR: "fetch_error",
  READY: "ready",
  ENTERING: "entering",
  SUCCESS: "success",
  ENTER_ERROR: "enter_error",
};

const INITIAL = { status: API_STATUS.IDLE, error: null };

// ─── YNAB helpers ──────────────────────────────────────────────────────────────

function buildYnabTransaction(formState, accounts) {
  const { swileMilliunits, amountMilliunits, account } = formState;

  function base(accountId, amount) {
    return {
      account_id: accountId,
      date: formatYYYYMMDDLocal(formState.date),
      amount,
      payee_id: formState.payeeId || null,
      payee_name: !formState.payeeId ? formState.payee : undefined,
      category_id: formState.categoryId,
      memo: formState.description,
      approved: true,
    };
  }

  if (account.swile && account.bourso) {
    const swileId = getAccountIdByName(accounts, "Swile");
    const boursoId = getAccountIdByName(accounts, "Boursorama");
    if (!swileId || !boursoId)
      throw new Error("No matching YNAB account for Swile or Bourso.");

    const transferInflow = swileMilliunits - amountMilliunits;
    if (transferInflow === 0) {
      return base(swileId, amountMilliunits);
    }

    return {
      ...base(swileId, swileMilliunits),
      category_id: null,
      subtransactions: [
        {
          amount: amountMilliunits,
          category_id: formState.categoryId,
          memo: formState.description,
          payee_id: formState.payeeId || null,
        },
        {
          amount: transferInflow,
          payee_id: BOURSO_TRANSFER_PAYEE_ID,
          transfer_account_id: boursoId,
          memo: "Bourso completion",
        },
      ],
    };
  }

  const accountId = account.bourso
    ? getAccountIdByName(accounts, "Boursorama")
    : account.swile
      ? getAccountIdByName(accounts, "Swile")
      : getAccountIdByName(accounts, "Boursorama");

  if (!accountId)
    throw new Error("No matching YNAB account for the selected button.");
  return base(accountId, amountMilliunits);
}

async function runYnabEnter(formState, { ynabAPI, budgetId, accounts }) {
  if (!ynabAPI || !budgetId) throw new Error("YNAB not configured.");
  const transaction = buildYnabTransaction(formState, accounts);
  await ynabAPI.transactions.createTransaction(budgetId, { transaction });
}

// ─── SettleUp helpers ──────────────────────────────────────────────────────────

async function fetchAndValidateSettleup(formState, { token, user }) {
  const { settleUpGroup } = formState;
  if (
    !token ||
    !settleUpGroup?.groupId ||
    formState.amountMilliunits === 0 ||
    !formState.settleUpPayerId ||
    !formState.settleUpMembers?.length
  ) {
    throw new Error("Missing required fields for SettleUp.");
  }
  const permissions = await fetchSettleUpPermissions(
    token,
    settleUpGroup.groupId,
  );
  if (!permissions[user.uid] || permissions[user.uid].level < 20) {
    throw new Error("Insufficient SettleUp permissions.");
  }
  return permissions;
}

async function runSettleupEnter(formState, { token }) {
  const amount = (-formState.amountMilliunits / 1000).toFixed(2);
  const tx = {
    category:
      formState.settleUpCategory === "∅"
        ? undefined
        : formState.settleUpCategory,
    currencyCode: formState.settleUpCurrency || "EUR",
    dateTime: formState.date.getTime(),
    items: [
      {
        amount,
        forWhom: formState.settleUpMembers.map((m) => ({
          memberId: m.id,
          weight: (m.defaultWeight || "1").toString(),
        })),
      },
    ],
    purpose:
      formState.payee +
      (formState.description ? ` - ${formState.description}` : ""),
    type: "expense",
    whoPaid: [{ memberId: formState.settleUpPayerId, weight: "1" }],
    exchangeRates: [],
    fixedExchangeRate: true,
  };
  const data = await addSettleUpTransaction(
    token,
    formState.settleUpGroup.groupId,
    tx,
  );
  if (!data?.name)
    throw new Error("Unexpected response: " + JSON.stringify(data));
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Tracks and orchestrates API sync status for YNAB and SettleUp independently.
 *
 * Execution model: both APIs run concurrently. YNAB has no fetch phase and goes
 * straight to entering. SettleUp fetches+validates permissions first.
 *
 * @param {{ ynabAPI, budgetId, accounts, token, user }} deps - Live context deps
 */
export function useApiSync({ ynabAPI, budgetId, accounts, token, user }) {
  const [ynab, setYnab] = useState(INITIAL);
  const [settleup, setSettleup] = useState(INITIAL);

  // Persisted across retries without triggering re-renders
  const lastFormStateRef = useRef(null);
  const settleupPermissionsRef = useRef(null);

  const anyInFlight =
    ynab.status === API_STATUS.FETCHING ||
    ynab.status === API_STATUS.ENTERING ||
    settleup.status === API_STATUS.FETCHING ||
    settleup.status === API_STATUS.ENTERING;

  // ── Internal runners ──────────────────────────────────────────────────────

  const _runYnabEnter = useCallback(
    async (formState) => {
      setYnab({ status: API_STATUS.ENTERING, error: null });
      try {
        await runYnabEnter(formState, { ynabAPI, budgetId, accounts });
        setYnab({ status: API_STATUS.SUCCESS, error: null });
        return API_STATUS.SUCCESS;
      } catch (err) {
        const msg = err?.message || String(err);
        setYnab({ status: API_STATUS.ENTER_ERROR, error: msg });
        return API_STATUS.ENTER_ERROR;
      }
    },
    [ynabAPI, budgetId, accounts],
  );

  const _runSettleupFetchThenEnter = useCallback(
    async (formState) => {
      setSettleup({ status: API_STATUS.FETCHING, error: null });
      let permissions;
      try {
        permissions = await fetchAndValidateSettleup(formState, {
          token,
          user,
        });
        settleupPermissionsRef.current = permissions;
        setSettleup({ status: API_STATUS.READY, error: null });
      } catch (err) {
        const msg = err?.message || String(err);
        setSettleup({ status: API_STATUS.FETCH_ERROR, error: msg });
        return API_STATUS.FETCH_ERROR;
      }
      // Enter phase
      setSettleup({ status: API_STATUS.ENTERING, error: null });
      try {
        await runSettleupEnter(formState, { token });
        setSettleup({ status: API_STATUS.SUCCESS, error: null });
        return API_STATUS.SUCCESS;
      } catch (err) {
        const msg = err?.message || String(err);
        setSettleup({ status: API_STATUS.ENTER_ERROR, error: msg });
        return API_STATUS.ENTER_ERROR;
      }
    },
    [token, user],
  );

  const _runSettleupEnterOnly = useCallback(
    async (formState) => {
      const permissions = settleupPermissionsRef.current;
      if (!permissions) {
        // No cached permissions — fall back to full fetch+enter
        return _runSettleupFetchThenEnter(formState);
      }
      setSettleup({ status: API_STATUS.ENTERING, error: null });
      try {
        await runSettleupEnter(formState, { token });
        setSettleup({ status: API_STATUS.SUCCESS, error: null });
        return API_STATUS.SUCCESS;
      } catch (err) {
        const msg = err?.message || String(err);
        setSettleup({ status: API_STATUS.ENTER_ERROR, error: msg });
        return API_STATUS.ENTER_ERROR;
      }
    },
    [token, _runSettleupFetchThenEnter],
  );

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Start a full sync for all targeted APIs concurrently.
   * Returns { ynab: finalStatus, settleup: finalStatus }.
   */
  const startSync = useCallback(
    async (formState) => {
      lastFormStateRef.current = formState;
      settleupPermissionsRef.current = null;

      const targets = formState.target;
      setYnab(
        targets.ynab
          ? { status: API_STATUS.ENTERING, error: null }
          : { status: API_STATUS.SKIPPED, error: null },
      );
      setSettleup(
        targets.settleup
          ? { status: API_STATUS.FETCHING, error: null }
          : { status: API_STATUS.SKIPPED, error: null },
      );

      const [ynabResult, settleupResult] = await Promise.allSettled([
        targets.ynab
          ? _runYnabEnter(formState)
          : Promise.resolve(API_STATUS.SKIPPED),
        targets.settleup
          ? _runSettleupFetchThenEnter(formState)
          : Promise.resolve(API_STATUS.SKIPPED),
      ]);

      return {
        ynab: ynabResult.value ?? API_STATUS.ENTER_ERROR,
        settleup: settleupResult.value ?? API_STATUS.ENTER_ERROR,
      };
    },
    [_runYnabEnter, _runSettleupFetchThenEnter],
  );

  /**
   * Retry from the fetch phase (for FETCH_ERROR).
   * For YNAB (no fetch phase), this is equivalent to retryEnter.
   */
  const retryFetch = useCallback(
    async (api) => {
      const formState = lastFormStateRef.current;
      if (!formState) return;
      if (api === "ynab") return _runYnabEnter(formState);
      if (api === "settleup") return _runSettleupFetchThenEnter(formState);
    },
    [_runYnabEnter, _runSettleupFetchThenEnter],
  );

  /**
   * Retry from the enter phase only (for ENTER_ERROR).
   * Reuses cached permissions for SettleUp to avoid re-fetching.
   */
  const retryEnter = useCallback(
    async (api) => {
      const formState = lastFormStateRef.current;
      if (!formState) return;
      if (api === "ynab") return _runYnabEnter(formState);
      if (api === "settleup") return _runSettleupEnterOnly(formState);
    },
    [_runYnabEnter, _runSettleupEnterOnly],
  );

  return {
    ynab,
    settleup,
    anyInFlight,
    startSync,
    retryFetch,
    retryEnter,
  };
}
