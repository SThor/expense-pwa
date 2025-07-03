import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Set auth persistence to LOCAL (default, but explicit)
      setPersistence(auth, browserLocalPersistence);
      
      let isInitialized = false;
      
      // Check for redirect result first
      try {
        const result = await getRedirectResult(auth);
        console.log("[AuthProvider] Redirect result:", result);
        if (result?.user) {
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

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
        
        if (!isInitialized) {
          setLoading(false);
        }
      });
      return unsubscribe;
    })();
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

  const logout = () => signOut(auth);

  const signInWithGoogle = async (usePopup = true) => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
      if (usePopup) {
        const result = await signInWithPopup(auth, provider);
        return result;
      } else {
        await signInWithRedirect(auth, provider);
        return null; // Will be handled by redirect result
      }
    } catch (error) {
      console.error("[AuthProvider] Google sign in error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, logout, loading, signInWithGoogle, auth }}>
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
