import PropTypes from "prop-types";
import { useState, useEffect, StrictMode } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { AppProvider, useAppContext } from "./AppContext.jsx";
import {
  DEFAULT_SETTLEUP_CATEGORY,
  DEFAULT_SWILE_MILLIUNITS,
} from "./constants";
import DevApp from "./DevApp.jsx";
import LoginPage from "./LoginPage.jsx";
import MainFormPage from "./MainFormPage.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import "./index.css";

function RequireAuth({ children }) {
  const { isLoggedIn } = useAppContext();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RouterApp() {
  const { isLoggedIn, login } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  // Default form state for all shared fields
  const DEFAULT_FORM_STATE = {
    amountMilliunits: 0,
    description: "",
    target: { ynab: true, settleup: false },
    account: { bourso: false, swile: false },
    payee: "",
    payeeId: "",
    category: "",
    categoryId: "",
    settleUpCategory: DEFAULT_SETTLEUP_CATEGORY,
    settleUpGroups: null,
    settleUpTestGroup: null,
    settleUpPayerId: "",
    settleUpForWhomIds: [],
    settleUpCurrency: "",
    swileMilliunits: DEFAULT_SWILE_MILLIUNITS,
  };
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
  useEffect(() => {
    // If logged in and on /login, redirect to /
    if (isLoggedIn && location.pathname === "/login") {
      console.log("[RouterApp] Auto-redirecting to / after login");
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={login} />} />
      <Route path="/dev" element={<DevApp />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <MainFormPage
              formState={formState}
              setFormState={setFormState}
              onSubmit={() => {
                setFormState((prevState) => ({
                  ...prevState,
                  canReview: true,
                }));
              }}
              resetFormState={() => {
                setFormState(DEFAULT_FORM_STATE);
              }}
            />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProvider>
      <BrowserRouter>
        <RouterApp />
      </BrowserRouter>
    </AppProvider>
  </StrictMode>,
);

RequireAuth.propTypes = {
  children: PropTypes.node.isRequired,
};
