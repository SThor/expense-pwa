import { renderHook, act } from "@testing-library/react";
import { describe, test, beforeEach, afterEach, expect, vi } from "vitest";

import { AppProvider, useAppContext } from "./AppContext.jsx";

// Mock window.ynab.API
Object.defineProperty(window, "ynab", {
  value: {
    API: vi.fn().mockImplementation(() => ({
      budgets: {
        getBudgets: vi.fn().mockResolvedValue({
          data: {
            budgets: [
              { id: "budget-1", name: "Test Budget 1" },
              { id: "budget-2", name: "Test Budget 2" },
            ],
          },
        }),
      },
    })),
  },
  writable: true,
});

const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

describe("AppContext YNAB Token Management", () => {
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs(); // Clean up environment variable mocks
  });

  describe("Token Initialization", () => {
    test("initializes with empty token when localStorage is empty", () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });
      expect(result.current.ynabToken).toBe("");
    });

    test("loads token from localStorage on initialization", () => {
      localStorage.setItem("ynab_api_key", "saved-token");
      const { result } = renderHook(() => useAppContext(), { wrapper });
      expect(result.current.ynabToken).toBe("saved-token");
    });

    test("handles localStorage read errors gracefully", () => {
      // Mock localStorage.getItem to throw an error
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn().mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const { result } = renderHook(() => useAppContext(), { wrapper });
      expect(result.current.ynabToken).toBe("");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to load YNAB token from localStorage:",
        expect.any(Error),
      );

      // Restore original method
      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe("Token Setting and Persistence", () => {
    test("saves token to localStorage when set", () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.setYnabToken("new-token");
      });

      expect(localStorage.getItem("ynab_api_key")).toBe("new-token");
      expect(result.current.ynabToken).toBe("new-token");
    });

    test("removes token from localStorage when cleared", () => {
      localStorage.setItem("ynab_api_key", "existing-token");
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.setYnabToken("");
      });

      expect(localStorage.getItem("ynab_api_key")).toBeNull();
      expect(result.current.ynabToken).toBe("");
    });

    test("removes token from localStorage when set to null or undefined", () => {
      localStorage.setItem("ynab_api_key", "existing-token");
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.setYnabToken(null);
      });

      expect(localStorage.getItem("ynab_api_key")).toBeNull();
      expect(result.current.ynabToken).toBeNull();
    });

    test("handles localStorage write errors gracefully", () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      // Mock localStorage.setItem to throw an error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn().mockImplementation(() => {
        throw new Error("localStorage write error");
      });

      act(() => {
        result.current.setYnabToken("test-token");
      });

      expect(result.current.ynabToken).toBe("test-token"); // State should still update
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to save YNAB token to localStorage:",
        expect.any(Error),
      );

      // Restore original method
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe("YNAB API Integration", () => {
    test("creates ynabAPI instance when token is present", () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.setYnabToken("valid-token");
      });

      expect(result.current.ynabAPI).toBeTruthy();
      expect(window.ynab.API).toHaveBeenCalledWith("valid-token");
    });

    test("ynabAPI is null when token is empty", () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });
      expect(result.current.ynabAPI).toBeNull();
    });

    test("ynabAPI updates when token changes", () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.setYnabToken("token-1");
      });
      expect(window.ynab.API).toHaveBeenCalledWith("token-1");

      act(() => {
        result.current.setYnabToken("token-2");
      });
      expect(window.ynab.API).toHaveBeenCalledWith("token-2");
    });
  });

  describe("Budget ID Management", () => {
    test("initializes with empty budget ID when environment variable is not set", () => {
      // Mock empty environment variable
      vi.stubEnv("VITE_YNAB_BUDGET_ID", "");

      const { result } = renderHook(() => useAppContext(), { wrapper });
      expect(result.current.budgetId).toBe("");
    });

    test("initializes with budget ID from environment variable when set", () => {
      // Mock environment variable with a test value
      vi.stubEnv("VITE_YNAB_BUDGET_ID", "fd738043-abc2-4310-9d9c-3432c48a3c19");

      const { result } = renderHook(() => useAppContext(), { wrapper });
      expect(result.current.budgetId).toBe(
        "fd738043-abc2-4310-9d9c-3432c48a3c19",
      );
    });

    test("can update budget ID", () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.setBudgetId("new-budget-id");
      });

      expect(result.current.budgetId).toBe("new-budget-id");
    });
  });

  describe("Context Value Memoization", () => {
    test("context value is memoized correctly", () => {
      const { result, rerender } = renderHook(() => useAppContext(), {
        wrapper,
      });
      const firstValue = result.current;

      // Rerender without changing any dependencies
      rerender();
      expect(result.current).toBe(firstValue);

      // Change token and verify new object
      act(() => {
        result.current.setYnabToken("new-token");
      });
      expect(result.current).not.toBe(firstValue);
    });
  });
});
