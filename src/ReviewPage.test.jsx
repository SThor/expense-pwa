import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  addSettleUpTransaction,
  fetchSettleUpPermissions,
} from "./api/settleup";
import { BOURSO_TRANSFER_PAYEE_ID } from "./constants.js";
import ReviewPage from "./ReviewPage.jsx";

// Mock modules first
const mockCreateTransaction = vi.fn();

vi.mock("./AppContext.jsx", () => ({
  useAppContext: vi.fn(() => ({
    ynabAPI: {
      transactions: {
        createTransaction: mockCreateTransaction,
      },
    },
    budgetId: "test-budget-id",
    accounts: [
      { id: "swile-account-id", name: "Swile" },
      { id: "bourso-account-id", name: "Boursorama" },
    ],
  })),
}));

vi.mock("./AuthProvider.jsx", () => ({
  useAuth: vi.fn(() => ({
    token: "test-token",
    user: { uid: "test-user-id" },
  })),
}));

vi.mock("./api/settleup", () => ({
  addSettleUpTransaction: vi.fn(),
  fetchSettleUpPermissions: vi.fn(),
}));

// Mock props
const defaultProps = {
  formState: {
    account: { swile: true, bourso: true },
    amountMilliunits: -50000, // -50.00 €
    swileMilliunits: -50000, // Swile covers full amount
    date: new Date("2025-01-01T12:00:00"),
    payeeId: "test-payee-id",
    payee: "Test Payee",
    categoryId: "test-category-id",
    description: "Test description",
    target: { ynab: true },
  },
  onBack: vi.fn(),
  onSubmitted: vi.fn(),
};

function renderWithRouter(component) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe("ReviewPage - Bourso split logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates simple transaction when Swile covers full amount (no Bourso split)", async () => {
    mockCreateTransaction.mockResolvedValue({
      data: { transaction: { id: "test-transaction-id" } },
    });

    renderWithRouter(<ReviewPage {...defaultProps} />);

    const submitButton = screen.getByRole("button", {
      name: /confirm & submit/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalledWith("test-budget-id", {
        transaction: {
          account_id: "swile-account-id",
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          amount: -50000,
          payee_id: "test-payee-id",
          payee_name: undefined,
          category_id: "test-category-id",
          memo: "Test description",
          approved: true,
        },
      });
    });

    // Should not create a split transaction
    const call = mockCreateTransaction.mock.calls[0];
    expect(call[1].transaction.subtransactions).toBeUndefined();
  });

  it("creates split transaction when Swile does not cover full amount", async () => {
    const propsWithPartialSwile = {
      ...defaultProps,
      formState: {
        ...defaultProps.formState,
        swileMilliunits: -30000, // Swile covers only -30.00 €, -20.00 € remaining
      },
    };

    mockCreateTransaction.mockResolvedValue({
      data: { transaction: { id: "test-transaction-id" } },
    });

    renderWithRouter(<ReviewPage {...propsWithPartialSwile} />);

    const submitButton = screen.getByRole("button", {
      name: /confirm & submit/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalledWith("test-budget-id", {
        transaction: {
          account_id: "swile-account-id",
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          amount: -30000,
          payee_id: "test-payee-id",
          payee_name: undefined,
          category_id: null,
          memo: "Test description",
          approved: true,
          subtransactions: [
            {
              amount: -50000,
              category_id: "test-category-id",
              memo: "Test description",
              payee_id: "test-payee-id",
            },
            {
              amount: 20000, // transferInflowMilliunits = -30000 - (-50000) = 20000
              payee_id: BOURSO_TRANSFER_PAYEE_ID,
              transfer_account_id: "bourso-account-id",
              memo: "Bourso completion",
            },
          ],
        },
      });
    });
  });

  it("creates SettleUp transaction using selected date at local midday (12:00)", async () => {
    // Allow SettleUp permissions and return success on add
    fetchSettleUpPermissions.mockResolvedValue({
      "test-user-id": { level: 30 },
    });
    addSettleUpTransaction.mockResolvedValue({ name: "test-settleup-tx" });

    const selectedDate = new Date("2025-02-03T12:00:00");
    const settleupProps = {
      ...defaultProps,
      formState: {
        ...defaultProps.formState,
        target: { ynab: false, settleup: true },
        date: selectedDate,
        settleUpGroup: { groupId: "g1" },
        settleUpMembers: [{ id: "m1", active: true }],
        settleUpPayerId: "m1",
        settleUpCurrency: "EUR",
        payee: "Cafe de Paris",
        description: "Lunch",
      },
    };

    renderWithRouter(<ReviewPage {...settleupProps} />);
    const submitButton = screen.getByRole("button", {
      name: /confirm & submit/i,
    });
    // Submit and validate epoch ms built from selected date at local midday (12:00)
    const expectedDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      12,
      0,
      0,
      0,
    ).getTime();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(addSettleUpTransaction).toHaveBeenCalled();
    });

    const call = addSettleUpTransaction.mock.calls[0];
    expect(call[1]).toBe("g1");
    const tx = call[2];
    expect(tx).toMatchObject({
      currencyCode: "EUR",
      purpose: expect.stringContaining("Cafe de Paris"),
      type: "expense",
    });
    const actualMs = Number(tx.dateTime);
    expect(Number.isFinite(actualMs)).toBe(true);
    expect(actualMs).toBe(expectedDateTime);
  });
});
