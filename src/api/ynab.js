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

export function getPayees(token, budgetId) {
  return axios.get(`${BASE_URL}/budgets/${budgetId}/payees`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getCategories(token, budgetId) {
  return axios.get(`${BASE_URL}/budgets/${budgetId}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPayeeTransactions(token, budgetId, payeeId) {
  return axios.get(
    `${BASE_URL}/budgets/${budgetId}/payees/${payeeId}/transactions`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export function getPayeeLocations(token, budgetId) {
  return axios.get(`${BASE_URL}/budgets/${budgetId}/payee_locations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}