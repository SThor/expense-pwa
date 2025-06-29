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
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      ],
      callbacks: {
        signInSuccessWithAuthResult: async () => {
          // Let AuthProvider handle state, just prevent redirect
          return false;
        },
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
