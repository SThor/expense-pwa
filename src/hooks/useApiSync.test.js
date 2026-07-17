import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_STATUS, useApiSync } from "./useApiSync";

const { createTransaction, fetchSettleUpPermissions, addSettleUpTransaction } =
  vi.hoisted(() => ({
    createTransaction: vi.fn(),
    fetchSettleUpPermissions: vi.fn(),
    addSettleUpTransaction: vi.fn(),
  }));

vi.mock("../api/settleup", () => ({
  fetchSettleUpPermissions: (...args) => fetchSettleUpPermissions(...args),
  addSettleUpTransaction: (...args) => addSettleUpTransaction(...args),
}));

describe("useApiSync", () => {
  const formState = {
    target: { ynab: true, settleup: true },
    date: new Date("2026-07-18T12:00:00.000Z"),
    payeeId: "",
    payee: "Lunch",
    categoryId: "cat-1",
    description: "Team lunch",
    account: { swile: false, bourso: true },
    swileMilliunits: 20000,
    amountMilliunits: 10000,
    settleUpGroup: { groupId: "group-1" },
    settleUpPayerId: "member-1",
    settleUpMembers: [{ id: "member-1", defaultWeight: "1" }],
    settleUpCategory: "∅",
    settleUpCurrency: "EUR",
  };

  const ynabAPI = {
    transactions: {
      createTransaction,
    },
  };

  beforeEach(() => {
    createTransaction.mockImplementation(() => new Promise(() => {}));
    fetchSettleUpPermissions.mockImplementation(() => new Promise(() => {}));
    addSettleUpTransaction.mockImplementation(() => new Promise(() => {}));
  });

  it("marks both APIs in-flight immediately when syncing starts", async () => {
    const { result } = renderHook(() =>
      useApiSync({
        ynabAPI,
        budgetId: "budget-1",
        accounts: [
          { id: "acc-1", name: "Boursorama", closed: false },
          { id: "acc-2", name: "Swile", closed: false },
        ],
        token: "token-1",
        user: { uid: "user-1" },
      }),
    );

    await act(async () => {
      void result.current.startSync(formState);
    });

    expect(result.current.ynab.status).toBe(API_STATUS.ENTERING);
    expect(result.current.settleup.status).toBe(API_STATUS.FETCHING);
    expect(result.current.anyInFlight).toBe(true);
  });
});
