// Firebase Auth REST API login for Settle Up
// Returns both idToken and userId (localId)
export async function getSettleUpTokenFromEnv() {
  const email = import.meta.env.VITE_SETTLEUP_EMAIL;
  const password = import.meta.env.VITE_SETTLEUP_PASSWORD;
  const apiKey = import.meta.env.VITE_SETTLEUP_API_KEY;
  if (!email || !password || !apiKey)
    throw new Error("Settle Up credentials not set in .env");
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!res.ok)
    throw new Error("Failed to authenticate with Settle Up: " + res.statusText);
  const data = await res.json();
  return { token: data.idToken, userId: data.localId };
}

const SETTLEUP_API_BASE = "https://settle-up-sandbox.firebaseio.com";

// Centralized SettleUp API dummy bypass (for development/testing)
const SETTLEUP_DUMMY_MODE = import.meta.env.VITE_SETTLEUP_DUMMY === "true";

/**
 * Build SettleUp API URL
 * @param {string} endpoint - API endpoint
 * @param {string} token - Firebase auth token
 * @returns {string} - Full API URL
 */
function buildSettleUpUrl(endpoint, token) {
  if (!token) throw new Error("Missing token for SettleUp API call");
  return `${SETTLEUP_API_BASE}${endpoint}?auth=${token}`;
}

/**
 * Handle fetch response and throw on error
 * @param {Response} res - fetch response
 * @returns {Promise<any>} - parsed JSON
 */
async function handleSettleUpResponse(res) {
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const err = await res.json();
      if (err && err.error) msg = err.error;
    } catch (error) {
      throw new Error(
        "Failed to parse error response from Settle Up: " + error.message,
      );
    }
    throw new Error(msg || "Unknown error");
  }
  return res.json();
}

function dummyResponse(endpoint, method = "GET") {
  // You can expand this with more realistic dummy data as needed
  if (endpoint.startsWith("/userGroups/")) {
    return Promise.resolve({
      dummyGroupId: { name: "Test Group", convertedToCurrency: "EUR" },
    });
  }
  if (endpoint.startsWith("/groups/")) {
    return Promise.resolve({
      groupId: "dummyGroupId",
      name: "Test Group",
      convertedToCurrency: "EUR",
    });
  }
  if (endpoint.startsWith("/members/")) {
    return Promise.resolve({
      member1: { id: "member1", name: "Alice", active: true },
      member2: { id: "member2", name: "Bob", active: true },
    });
  }
  if (endpoint.startsWith("/transactions/") && method === "GET") {
    return Promise.resolve({
      tx1: { category: "🍕", purpose: "Pizza night", dateTime: Date.now() },
      tx2: { category: "🍔", purpose: "Burger lunch", dateTime: Date.now() },
    });
  }
  if (endpoint.startsWith("/transactions/") && method === "POST") {
    return Promise.resolve({ name: "dummyTxId" });
  }
  if (endpoint.startsWith("/permissions/")) {
    return Promise.resolve({ member1: { level: 30 }, member2: { level: 20 } });
  }
  if (endpoint.startsWith("/userGroups/") && endpoint.split("/").length === 5) {
    // /userGroups/{userId}/{groupId}.json
    return Promise.resolve({ joined: true });
  }
  return Promise.resolve({});
}

/**
 * Generic SettleUp API call
 * @param {string} endpoint
 * @param {string} token
 * @param {object} [options] - fetch options (method, body, etc)
 * @returns {Promise<any>}
 */
async function settleUpApiCall(endpoint, token, options) {
  if (SETTLEUP_DUMMY_MODE) {
    const method = options?.method || "GET";
    const body = options?.body;
    return dummyResponse(endpoint, method, body);
  }
  const url = buildSettleUpUrl(endpoint, token);
  const res = await fetch(url, options);
  return handleSettleUpResponse(res);
}

/**
 * Fetch SettleUp user groups from Firebase REST API
 * @param {string} token - Firebase auth token
 * @param {string} userId - SettleUp user ID
 * @returns {Promise<object>} - User groups object (or empty object)
 */
export async function fetchSettleUpUserGroups(token, userId) {
  if (!token || !userId)
    throw new Error("Missing token or userId for SettleUp user groups fetch");
  const data = await settleUpApiCall(`/userGroups/${userId}.json`, token);
  return data || {};
}

/**
 * Fetch SettleUp group details by groupId
 */
export async function fetchSettleUpGroup(token, groupId) {
  if (!token || !groupId)
    throw new Error("Missing token or groupId for SettleUp group fetch");
  return settleUpApiCall(`/groups/${groupId}.json`, token);
}

/**
 * Fetch SettleUp group members
 */
export async function fetchSettleUpMembers(token, groupId) {
  if (!token || !groupId)
    throw new Error("Missing token or groupId for Settle Up members fetch");
  return settleUpApiCall(`/members/${groupId}.json`, token);
}

/**
 * Fetch SettleUp transactions for a group
 */
export async function fetchSettleUpTransactions(token, groupId) {
  if (!token || !groupId)
    throw new Error("Missing token or groupId for SettleUp transactions fetch");
  return settleUpApiCall(`/transactions/${groupId}.json`, token);
}

/**
 * Add a SettleUp transaction to a group
 */
export async function addSettleUpTransaction(token, groupId, tx) {
  if (!token || !groupId || !tx)
    throw new Error(
      "Missing token, groupId, or tx for SettleUp add transaction",
    );
  return settleUpApiCall(`/transactions/${groupId}.json`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
}

/**
 * Fetch SettleUp permissions for a group
 */
export async function fetchSettleUpPermissions(token, groupId) {
  if (!token || !groupId)
    throw new Error("Missing token or groupId for SettleUp permissions fetch");
  return settleUpApiCall(`/permissions/${groupId}.json`, token);
}

/**
 * Fetch SettleUp userGroup node for a user and group
 */
export async function fetchSettleUpUserGroupNode(token, userId, groupId) {
  if (!token || !userId || !groupId)
    throw new Error(
      "Missing token, userId, or groupId for SettleUp userGroup node fetch",
    );
  return settleUpApiCall(`/userGroups/${userId}/${groupId}.json`, token);
}

// If you need to use the Firebase JS SDK for other advanced features, you can initialize it here.
// But for authentication and REST API usage, always use getSettleUpTokenFromEnv above.
