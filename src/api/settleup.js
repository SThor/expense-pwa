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

async function callApi(endpoint, token, options = {}) {
  if (SETTLEUP_DUMMY_MODE) {
    const method = options.method || "GET";
    return dummyResponse(endpoint, method, options.body);
  }
  if (!token) throw new Error("No auth token");
  const url = `${endpoint}?auth=${token}`;
  console.log("[SettleUp API] Making request:", {
    method: options.method || "GET",
    url: SETTLEUP_API_BASE + "" + url,
    hasData: !!options.data,
    dataSize: options.data ? JSON.stringify(options.data).length : 0,
  });
  try {
    const res = await api({ url, ...options });
    console.log("[SettleUp API] Response:", {
      status: res.status,
      data: res.data,
    });
    return res.data;
  } catch (err) {
    console.error("[SettleUp API] Error:", {
      endpoint,
      method: options.method || "GET",
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message,
      headers: err.response?.headers,
      // Check for rate limiting indicators
      rateLimitHeaders: {
        'x-ratelimit-limit': err.response?.headers?.['x-ratelimit-limit'],
        'x-ratelimit-remaining': err.response?.headers?.['x-ratelimit-remaining'],
        'x-ratelimit-reset': err.response?.headers?.['x-ratelimit-reset'],
        'retry-after': err.response?.headers?.['retry-after'],
      }
    });
    
    // Check if this might be rate limiting
    if (err.response?.status === 429) {
      throw new Error("Rate limited - too many requests. Please wait and try again.");
    } else if (err.response?.status === 401 && err.response?.headers?.['retry-after']) {
      throw new Error("Rate limited (401 with retry-after). Please wait and try again.");
    }
    
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
    data: JSON.stringify(tx),
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
