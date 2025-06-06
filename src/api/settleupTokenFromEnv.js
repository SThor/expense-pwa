import { getSettleUpIdToken } from "../api/settleup";

export async function getSettleUpTokenFromEnv() {
  const email = import.meta.env.VITE_SETTLEUP_EMAIL;
  const password = import.meta.env.VITE_SETTLEUP_PASSWORD;
  if (!email || !password) throw new Error("Settle Up credentials not set in .env");
  return getSettleUpIdToken(email, password);
}
