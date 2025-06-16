import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useState } from "react";

import { FIREBASE_TOKEN_REFRESH_INTERVAL } from "./constants";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
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
    const unsubscribe = firebase.auth().onAuthStateChanged(async () => {
      const firebaseUser = firebase.auth().currentUser;
      console.log("[AuthProvider] Auth state changed:", firebaseUser);
      setUser(firebaseUser);
      if (firebaseUser) {
        const t = await firebaseUser.getIdToken();
        setToken(t);
      } else {
        setToken(null);
      }
      setLoading(false);
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
