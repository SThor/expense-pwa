import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useState } from "react";

import { FIREBASE_TOKEN_REFRESH_INTERVAL } from "./constants";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "settle-up-live",
  storageBucket: "settle-up-live.appspot.com",
  messagingSenderId: "817191222688",
  appId: "1:817191222688:web:6f1f6d1e01f53454aff8c5",
  measurementId: "G-V5MLGBC0T9"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set auth persistence to LOCAL (default, but explicit)
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    
    let isInitialized = false;
    
    // Check for redirect result first
    const checkRedirectResult = async () => {
      try {
        const result = await firebase.auth().getRedirectResult();
        console.log("[AuthProvider] Redirect result:", result);
        if (result.user) {
          console.log("[AuthProvider] Redirect result user:", result.user);
          setUser(result.user);
          const t = await result.user.getIdToken();
          setToken(t);
          setLoading(false);
          isInitialized = true;
          return;
        }
      } catch (error) {
        console.error("[AuthProvider] Redirect result error:", error);
      }
    };

    checkRedirectResult();

    const unsubscribe = firebase.auth().onAuthStateChanged(async (firebaseUser) => {
      console.log("[AuthProvider] Auth state changed:", firebaseUser);
      
      // Don't override user if we already got it from redirect result
      if (isInitialized && firebaseUser) {
        return;
      }
      
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const t = await firebaseUser.getIdToken();
          setToken(t);
        } catch (error) {
          console.error("[AuthProvider] Token error:", error);
        }
      } else {
        setToken(null);
      }
      
      // Add a small delay before setting loading to false to ensure auth state is stable
      if (!isInitialized) {
        setTimeout(() => {
          setLoading(false);
        }, 100);
      }
    });
    return unsubscribe;
  }, []);

  // Refresh token automatically every 50 minutes
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const t = await user.getIdToken(true);
      setToken(t);
    }, FIREBASE_TOKEN_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [user]);

  const logout = () => firebase.auth().signOut();

  return (
    <AuthContext.Provider value={{ user, token, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  return useContext(AuthContext);
}
