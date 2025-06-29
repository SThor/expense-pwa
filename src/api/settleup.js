import axios from "axios";

const SETTLEUP_API_BASE = import.meta.env.VITE_FIREBASE_DATABASE_URL;
const SETTLEUP_DUMMY_MODE = import.meta.env.VITE_SETTLEUP_DUMMY === "true";

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

const api = axios.create({
  baseURL: SETTLEUP_API_BASE,
  headers: { "Content-Type": "application/json" },
});

/**
 * Make a call to the SettleUp Firebase REST API
 * @param {string} endpoint - API endpoint to call (e.g. /userGroups/{userId}.json)
 * @param {string} token - Firebase auth token
 * @param {object} options - Additional axios options (method, headers, data)
 * @returns {Promise<object>} - API response data
 */
async function callApi(endpoint, token, options = {}) {
  if (SETTLEUP_DUMMY_MODE) {
    const method = options.method || "GET";
    return dummyResponse(endpoint, method, options.body);
  }
  if (!token) throw new Error("No auth token");
  try {
    const res = await api({ url: endpoint, params: { auth: token }, ...options });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || err.message);
  }
}

/**
 * Fetch SettleUp user groups from Firebase REST API
 * @param {string} token - Firebase auth token
 * @param {string} userId - SettleUp user ID
 * @returns {Promise<object>} - User groups object (or empty object)
 */
export function fetchSettleUpUserGroups(token, userId) {
  if (!token || !userId)
    throw new Error("Missing token or userId for SettleUp user groups fetch");
  return callApi(`/userGroups/${userId}.json`, token);
}

/**
 * Fetch SettleUp group details by groupId
 */
export function fetchSettleUpGroup(token, groupId) {
  if (!token || !groupId)
    throw new Error("Missing token or groupId for SettleUp group fetch");
  return callApi(`/groups/${groupId}.json`, token);
}

/**
 * Fetch SettleUp group members
 */
export function fetchSettleUpMembers(token, groupId) {
  if (!token || !groupId)
    throw new Error("Missing token or groupId for Settle Up members fetch");
  return callApi(`/members/${groupId}.json`, token);
}

/**
 * Fetch SettleUp transactions for a group
 */
export function fetchSettleUpTransactions(token, groupId) {
  if (!token || !groupId)
    throw new Error("Missing token or groupId for SettleUp transactions fetch");
  return callApi(`/transactions/${groupId}.json`, token);
}

/**
 * Add a SettleUp transaction to a group
 */
export function addSettleUpTransaction(token, groupId, tx) {
  if (!token || !groupId || !tx)
    throw new Error(
      "Missing token, groupId, or tx for SettleUp add transaction",
    );
  return callApi(`/transactions/${groupId}.json`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: tx,
  });
}

/**
 * Fetch SettleUp permissions for a group
 */
export function fetchSettleUpPermissions(token, groupId) {
  if (!token || !groupId)
    throw new Error("Missing token or groupId for SettleUp permissions fetch");
  return callApi(`/permissions/${groupId}.json`, token);
}

/**
 * Fetch SettleUp userGroup node for a user and group
 */
export function fetchSettleUpUserGroupNode(token, userId, groupId) {
  if (!token || !userId || !groupId)
    throw new Error(
      "Missing token, userId, or groupId for SettleUp userGroup node fetch",
    );
  return callApi(`/userGroups/${userId}/${groupId}.json`, token);
}

// If you need to use the Firebase JS SDK for other advanced features, you can initialize it here.
// But for authentication and REST API usage, always use getSettleUpTokenFromEnv above.
