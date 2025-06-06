// Use Firebase Auth REST API to get idToken and userId
export async function getSettleUpTokenFromEnv() {
  const email = import.meta.env.VITE_SETTLEUP_EMAIL;
  const password = import.meta.env.VITE_SETTLEUP_PASSWORD;
  const apiKey = "AIzaSyCfMEZut1bOgu9d1NHrJiZ7ruRdzfKEHbk";
  if (!email || !password) throw new Error("Settle Up credentials not set in .env");
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  if (!res.ok) throw new Error("Failed to authenticate with Settle Up: " + res.statusText);
  const data = await res.json();
  return { token: data.idToken, userId: data.localId };
}
