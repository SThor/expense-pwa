import axios from "axios";

const BASE_URL = "https://api.ynab.com/v1";

export function getBudgets(token) {
  return axios.get(`${BASE_URL}/budgets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAccounts(token, budgetId) {
  return axios.get(`${BASE_URL}/budgets/${budgetId}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createTransaction(token, budgetId, transaction) {
  return axios.post(
    `${BASE_URL}/budgets/${budgetId}/transactions`,
    { transaction },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}