import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./AuthProvider.jsx";
import CenteredCardLayout from "./components/CenteredCardLayout.jsx";

export default function LoginPage() {
  const uiRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 10000);
      return () => clearTimeout(timer);
    }

    // FirebaseUI config
    const uiConfig = {
      signInFlow: 'redirect', // Force redirect flow
      signInOptions: [
        {
          provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
          requireDisplayName: false,
        },
        {
          provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          customParameters: {
            prompt: 'select_account'
          }
        },
      ],
      signInSuccessUrl: window.location.origin + '/', // Redirect to home after login
      callbacks: {
        signInSuccessWithAuthResult: async (authResult) => {
          console.log("[LoginPage] Sign in success:", authResult);
          // Let the redirect handle navigation
          return true;
        },
        signInFailure: (error) => {
          console.error("[LoginPage] Sign in failure:", error);
          return Promise.resolve();
        }
      },
    };

    // Initialize the FirebaseUI Widget using Firebase.
    const ui =
      firebaseui.auth.AuthUI.getInstance() ||
      new firebaseui.auth.AuthUI(firebase.auth());
    ui.start(uiRef.current, uiConfig);

    // Cleanup
    return () => {
      ui.reset();
    };
  }, [user, navigate]);

  if (user) {
    return (
      <CenteredCardLayout>
        <h1 className="text-2xl font-bold mb-4 text-sky-700">
          Already logged in
        </h1>
        <p className="mb-6 text-gray-600">
          You are already signed in. Redirecting to the app in 10 seconds...
        </p>
      </CenteredCardLayout>
    );
  }

  return (
    <CenteredCardLayout>
      <h1 className="text-2xl font-bold mb-4 text-sky-700">Login</h1>
      <p className="mb-6 text-gray-600">Sign in to continue with Settle Up.</p>
      <div ref={uiRef} />
    </CenteredCardLayout>
  );
}
