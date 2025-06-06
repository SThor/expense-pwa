import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Firebase config for Settle Up sandbox
const firebaseConfig = {
  apiKey: "AIzaSyCfMEZut1bOgu9d1NHrJiZ7ruRdzfKEHbk",
  authDomain: "settle-up-sandbox.firebaseapp.com",
  databaseURL: "https://settle-up-sandbox.firebaseio.com",
  projectId: "settle-up-sandbox",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Sign in to Firebase and get an ID token for Settle Up API
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} Firebase ID token
 */
export async function getSettleUpIdToken(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user.getIdToken();
}
