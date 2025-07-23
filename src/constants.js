// src/constants.js
export const DEFAULT_SETTLEUP_CATEGORY = "∅"; // Default SettuleUp emoji category
export const DEFAULT_SWILE_MILLIUNITS = -25000; // Default Swile paid amount in milliunits (e.g., -25.00 €)

// Currency codes
export const DEFAULT_CURRENCY = "EUR";

// Hardcoded IDs (for dummy/dev)
export const TEST_GROUP_NAME = "test group";

// Firebase token refresh interval (ms)
export const FIREBASE_TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

// Timeout used in GroupedAutocomplete blur handler to allow dropdown click events to register before closing
export const AUTOCOMPLETE_BLUR_TIMEOUT_MS = 120;

// Bourso transfer payee ID (used for Bourso completion transactions)
export const BOURSO_TRANSFER_PAYEE_ID = "eabe1e60-fa92-40f7-8636-5c8bcbf1404a";
