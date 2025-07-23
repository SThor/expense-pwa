import { render, screen } from "@testing-library/react";
import PropTypes from "prop-types";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { describe, test, beforeEach, expect, vi } from "vitest";

import { AppProvider, useAppContext } from "./AppContext.jsx";
import { AuthProvider, useAuth } from "./AuthProvider.jsx";
import LoginPage from "./LoginPage.jsx";

// Mock YNAB API globally (needed by AppProvider)
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

// Mock AuthProvider hooks
const mockAuth = {
  user: null,
  loading: false,
};

vi.mock("./AuthProvider.jsx", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuth,
}));

describe("Application Routing", () => {
  // Mock components that would be rendered on successful authentication
  const MockMainFormPage = () => <div>Main Form Page</div>;
  const MockLoadingScreen = () => <div>Loading...</div>;

  // Mock RequireAuth component that mimics the behavior from main.jsx
  const MockRequireAuth = ({ children }) => {
    const { user, loading } = useAuth();
    const { ynabToken } = useAppContext();

    if (loading) {
      return <MockLoadingScreen />;
    }

    if (!user || !ynabToken) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  MockRequireAuth.propTypes = {
    children: PropTypes.node.isRequired,
  };

  const renderWithRouter = (initialRoute = "/") => {
    window.history.pushState({}, "Test", initialRoute);

    return render(
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <MockRequireAuth>
                    <MockMainFormPage />
                  </MockRequireAuth>
                }
              />
            </Routes>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    localStorage.clear();
    mockAuth.user = null;
    mockAuth.loading = false;
  });

  describe("Root Route (/)", () => {
    test("redirects to login when user is not authenticated", () => {
      mockAuth.user = null; // Not authenticated

      renderWithRouter("/");

      // Should redirect to login page, not show main form
      expect(
        screen.getByRole("heading", { name: "Sign In" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Main Form Page")).not.toBeInTheDocument();
    });

    test("redirects to login when user is authenticated but missing YNAB token", () => {
      mockAuth.user = { uid: "test-user" }; // Authenticated
      // No YNAB token in localStorage

      renderWithRouter("/");

      // Should redirect to login page
      expect(
        screen.getByRole("heading", { name: "Sign In" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Main Form Page")).not.toBeInTheDocument();
    });

    test("shows main app when user is authenticated and has YNAB token", () => {
      mockAuth.user = { uid: "test-user" }; // Authenticated
      localStorage.setItem("ynab_api_key", "test-token"); // Has YNAB token

      renderWithRouter("/");

      // Should show main form page, not login
      expect(screen.getByText("Main Form Page")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Sign In" }),
      ).not.toBeInTheDocument();
    });

    test("shows loading screen while authentication is being checked", () => {
      mockAuth.loading = true; // Loading state

      renderWithRouter("/");

      // Should show loading screen, not login page or main form
      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Sign In" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Main Form Page")).not.toBeInTheDocument();
    });
  });

  describe("Login Route (/login)", () => {
    test("shows login page when accessed directly", () => {
      renderWithRouter("/login");

      expect(
        screen.getByRole("heading", { name: "Sign In" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Main Form Page")).not.toBeInTheDocument();
    });

    test("shows login page even when user is authenticated but missing YNAB token", () => {
      mockAuth.user = { uid: "test-user" }; // Authenticated but no YNAB token

      renderWithRouter("/login");

      expect(
        screen.getByRole("heading", { name: "Sign In" }),
      ).toBeInTheDocument();
    });
  });
});
