import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./AppContext";
import LoginPage from "./LoginPage";
import MainFormPage from "./MainFormPage";
import ReviewPage from "./ReviewPage";
import DevApp from "./DevApp";
import NotFoundPage from "./NotFoundPage";
import './index.css'

function RequireAuth({ children }) {
  const { isLoggedIn } = useAppContext();
  console.log("[RequireAuth] isLoggedIn:", isLoggedIn);
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RouterApp() {
  const { isLoggedIn, login } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  React.useEffect(() => {
    // If logged in and on /login, redirect to /
    if (isLoggedIn && location.pathname === "/login") {
      console.log("[RouterApp] Auto-redirecting to / after login");
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, location.pathname]);
  // Form state for review page (lifted up)
  const [formState, setFormState] = React.useState(null);
  const [result, setResult] = React.useState(""); // generic result
  const [canReview, setCanReview] = React.useState(false);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={login} />} />
      <Route path="/dev" element={<DevApp />} />
      <Route path="/review" element={
        <RequireAuth>
          {canReview ? (
            <ReviewPage
              formState={formState}
              onBack={() => window.history.back()}
              onSubmit={() => {
                setResult("Submitted!");
                setCanReview(false); // Reset after review
              }}
              result={result}
            />
          ) : (
            <Navigate to="/" replace />
          )}
        </RequireAuth>
      } />
      <Route path="/" element={
        <RequireAuth>
          <MainFormPage
            onSubmit={data => {
              setFormState(data);
              setCanReview(true);
              navigate("/review");
            }}
          />
        </RequireAuth>
      } />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <RouterApp />
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>
)