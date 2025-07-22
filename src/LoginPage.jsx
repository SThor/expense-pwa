import { signInWithEmailAndPassword } from "firebase/auth";
import { useState, useEffect } from "react";
import {
  FaGoogle,
  FaEnvelope,
  FaLock,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useAppContext } from "./AppContext.jsx";
import { useAuth } from "./AuthProvider.jsx";
import CenteredCardLayout from "./components/CenteredCardLayout.jsx";

export default function LoginPage() {
  const { user, signInWithGoogle, auth } = useAuth();
  const { ynabToken, setYnabToken } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showYnabApiKey, setShowYnabApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle navigation when user is authenticated
  // Only redirect after render, not during
  // Require both user AND YNAB token for full authentication
  useEffect(() => {
    if (user && ynabToken) {
      navigate("/", { replace: true });
    }
  }, [user, ynabToken, navigate]);

  // Prevent rendering if user is authenticated (prevents flicker)
  if (user && ynabToken) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithGoogle(true); // Use popup
      // Navigation will be handled by useEffect when both user and YNAB token are present
    } catch (error) {
      console.error("Google sign in error:", error);
      setError(error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation will be handled by useEffect when both user and YNAB token are present
    } catch (error) {
      console.error("Email sign in error:", error);
      setError(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CenteredCardLayout>
      <h1 className="text-2xl font-bold mb-6 text-sky-700">Sign In</h1>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
        >
          {error}
        </div>
      )}

      {/* Email Sign In Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-6">
        {/* Settle Up Authentication Section */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Settle Up Account
            </h3>
            <p className="text-sm text-gray-600">
              Sign in to your Settle Up account
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGoogle className="text-red-500" />
            <span className="text-gray-700 font-medium">
              {isLoading ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-600 text-white py-2 px-4 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        {/* YNAB Configuration Section */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              YNAB Integration
            </h3>
            <p className="text-sm text-gray-600">
              Connect your YNAB account for expense tracking
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="ynabApiKey"
                className="block text-sm font-medium text-gray-700"
              >
                YNAB API Key
              </label>
              {ynabToken && (
                <button
                  type="button"
                  onClick={() => setYnabToken("")}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-transparent border-none cursor-pointer p-0"
                  title="Clear YNAB API key from local storage"
                >
                  <FaTimes className="text-xs" />
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="ynabApiKey"
                type={showYnabApiKey ? "text" : "password"}
                value={ynabToken}
                onChange={(e) => setYnabToken(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Enter your YNAB API key"
              />
              <button
                type="button"
                onClick={() => setShowYnabApiKey(!showYnabApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title={showYnabApiKey ? "Hide API key" : "Show API key"}
              >
                {showYnabApiKey ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Get your API key from{" "}
              <a
                href="https://app.ynab.com/settings/developer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:text-sky-800 underline"
              >
                YNAB Developer Settings
              </a>
            </p>
          </div>
        </div>
      </form>
    </CenteredCardLayout>
  );
}
