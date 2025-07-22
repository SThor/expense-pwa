import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { BrowserRouter } from "react-router-dom";
import { describe, test, beforeEach, expect, vi } from "vitest";

import { AppProvider } from "./AppContext.jsx";
import { AuthProvider } from "./AuthProvider.jsx";
import LoginPage from "./LoginPage.jsx";

// Mock YNAB API globally
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

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthProvider hooks
const mockAuth = {
  user: null,
  signInWithGoogle: vi.fn(),
  auth: {},
};

vi.mock("./AuthProvider.jsx", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuth,
}));

// Mock Firebase auth
vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>{component}</AppProvider>
      </AuthProvider>
    </BrowserRouter>,
  );
};

describe("LoginPage Authentication Requirements", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockAuth.user = null;
    console.warn = vi.fn();
    console.error = vi.fn();

    // Ensure the Firebase auth mock is properly reset
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({});
  });

  describe("YNAB API Key Field", () => {
    test("shows YNAB API key field as required", () => {
      renderWithProviders(<LoginPage />);
      const ynabField = screen.getByLabelText(/YNAB API Key/);
      expect(ynabField).toBeRequired();
    });

    test("loads saved YNAB token from localStorage", () => {
      localStorage.setItem("ynab_api_key", "test-token");
      renderWithProviders(<LoginPage />);
      const ynabField = screen.getByLabelText(/YNAB API Key/);
      expect(ynabField.value).toBe("test-token");
    });

    test("shows clear button when token is present", () => {
      localStorage.setItem("ynab_api_key", "test-token");
      renderWithProviders(<LoginPage />);

      const clearButton = screen.getByTitle(/Clear YNAB API key/);
      expect(clearButton).toBeInTheDocument();
    });

    test("hides clear button when token is empty", () => {
      renderWithProviders(<LoginPage />);

      const clearButton = screen.queryByTitle(/Clear YNAB API key/);
      expect(clearButton).not.toBeInTheDocument();
    });

    test("clears YNAB token from localStorage when clear button clicked", () => {
      localStorage.setItem("ynab_api_key", "test-token");
      renderWithProviders(<LoginPage />);

      const clearButton = screen.getByTitle(/Clear YNAB API key/);
      fireEvent.click(clearButton);

      expect(localStorage.getItem("ynab_api_key")).toBeNull();
    });

    test("shows/hides YNAB token with eye icon", () => {
      renderWithProviders(<LoginPage />);
      const ynabField = screen.getByLabelText(/YNAB API Key/);
      const eyeButton = screen.getByTitle(/Show API key/);

      expect(ynabField.type).toBe("password");
      fireEvent.click(eyeButton);
      expect(ynabField.type).toBe("text");

      const hideButton = screen.getByTitle(/Hide API key/);
      fireEvent.click(hideButton);
      expect(ynabField.type).toBe("password");
    });

    test("updates localStorage when YNAB token is typed", () => {
      renderWithProviders(<LoginPage />);
      const ynabField = screen.getByLabelText(/YNAB API Key/);

      fireEvent.change(ynabField, { target: { value: "new-token" } });

      expect(localStorage.getItem("ynab_api_key")).toBe("new-token");
      expect(ynabField.value).toBe("new-token");
    });
  });

  describe("Authentication Flow", () => {
    test("renders login page when no user and no token", () => {
      renderWithProviders(<LoginPage />);

      expect(
        screen.getByRole("heading", { name: "Sign In" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Settle Up Account")).toBeInTheDocument();
      expect(screen.getByText("YNAB Integration")).toBeInTheDocument();
    });

    test("does not render when user is authenticated and has YNAB token", () => {
      localStorage.setItem("ynab_api_key", "test-token");
      mockAuth.user = { uid: "test-user" };

      const { container } = renderWithProviders(<LoginPage />);
      expect(container.firstChild).toBeNull();
    });

    test("renders when user is authenticated but missing YNAB token", () => {
      mockAuth.user = { uid: "test-user" };

      renderWithProviders(<LoginPage />);
      expect(
        screen.getByRole("heading", { name: "Sign In" }),
      ).toBeInTheDocument();
    });

    test("renders when YNAB token exists but user is not authenticated", () => {
      localStorage.setItem("ynab_api_key", "test-token");

      renderWithProviders(<LoginPage />);
      expect(
        screen.getByRole("heading", { name: "Sign In" }),
      ).toBeInTheDocument();
    });

    test("navigates to home when both user and YNAB token are present", async () => {
      localStorage.setItem("ynab_api_key", "test-token");
      mockAuth.user = { uid: "test-user" };

      renderWithProviders(<LoginPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
      });
    });
  });

  describe("UI Structure and Sections", () => {
    test("displays Settle Up authentication section", () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByText("Settle Up Account")).toBeInTheDocument();
      expect(
        screen.getByText("Sign in to your Settle Up account"),
      ).toBeInTheDocument();
      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
      expect(screen.getByText("or")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    test("displays YNAB integration section", () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByText("YNAB Integration")).toBeInTheDocument();
      expect(
        screen.getByText("Connect your YNAB account for expense tracking"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/YNAB API Key/)).toBeInTheDocument();
      expect(screen.getByText(/Get your API key from/)).toBeInTheDocument();
    });

    test("displays YNAB Integration section", () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByText("YNAB Integration")).toBeInTheDocument();
    });

    test("has proper form structure", () => {
      renderWithProviders(<LoginPage />);

      // Check that a form exists
      const form = screen.getByLabelText("Email").closest("form");
      expect(form).toBeInTheDocument();

      // All input fields should be within the form
      const emailField = screen.getByLabelText("Email");
      const passwordField = screen.getByLabelText("Password");
      const ynabField = screen.getByLabelText(/YNAB API Key/);

      expect(form).toContainElement(emailField);
      expect(form).toContainElement(passwordField);
      expect(form).toContainElement(ynabField);
    });
  });

  describe("Google Sign In", () => {
    test("calls signInWithGoogle when Google button is clicked", async () => {
      renderWithProviders(<LoginPage />);

      const googleButton = screen.getByText("Continue with Google");
      fireEvent.click(googleButton);

      expect(mockAuth.signInWithGoogle).toHaveBeenCalledWith(true);
    });

    test("shows loading state during Google sign in", async () => {
      mockAuth.signInWithGoogle.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<LoginPage />);

      const googleButton = screen.getByText("Continue with Google");
      fireEvent.click(googleButton);

      expect(screen.getAllByText("Signing in...")).toHaveLength(2); // Both buttons show loading state
    });

    test("handles Google sign in errors", async () => {
      const error = new Error("Google sign in failed");
      mockAuth.signInWithGoogle.mockRejectedValue(error);

      renderWithProviders(<LoginPage />);

      const googleButton = screen.getByText("Continue with Google");
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText("Google sign in failed")).toBeInTheDocument();
      });
    });
  });

  describe("Email/Password Sign In", () => {
    test("requires email and password fields", () => {
      renderWithProviders(<LoginPage />);

      const emailField = screen.getByLabelText("Email");
      const passwordField = screen.getByLabelText("Password");

      expect(emailField).toBeRequired();
      expect(passwordField).toBeRequired();
    });

    test("submits form with email and password", async () => {
      renderWithProviders(<LoginPage />);

      const emailField = screen.getByLabelText("Email");
      const passwordField = screen.getByLabelText("Password");
      const ynabField = screen.getByLabelText(/YNAB API Key/);
      const submitButton = screen.getByRole("button", { name: "Sign In" });

      fireEvent.change(emailField, { target: { value: "test@example.com" } });
      fireEvent.change(passwordField, { target: { value: "password123" } });
      fireEvent.change(ynabField, { target: { value: "test-ynab-key" } });
      fireEvent.click(submitButton);

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth.auth,
        "test@example.com",
        "password123",
      );
    });
  });
});
