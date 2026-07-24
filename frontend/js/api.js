// api.js — thin wrapper around fetch for talking to the backend.
// Change API_BASE if your backend runs somewhere other than localhost:5000.

const API_BASE = "https://smart-restaurant-qr-ordering.onrender.com/api";

async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem("adminToken");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

const api = {
  // Menu
  getMenu: () => apiRequest("/menu"),
  createMenuItem: (item) => apiRequest("/menu", { method: "POST", body: item, auth: true }),
  updateMenuItem: (id, updates) => apiRequest(`/menu/${id}`, { method: "PATCH", body: updates, auth: true }),
  deleteMenuItem: (id) => apiRequest(`/menu/${id}`, { method: "DELETE", auth: true }),

  // Orders
  placeOrder: (tableIdentifier, items, customerName, customerMobile) =>
    apiRequest("/orders", { method: "POST", body: { tableCode: tableIdentifier, tableNumber: tableIdentifier, items, customerName, customerMobile } }),
  getOrdersForTable: (tableIdentifier) => apiRequest(`/orders/table/${tableIdentifier}`),
  getAllOrders: (status) => apiRequest(`/orders${status ? `?status=${status}` : ""}`, { auth: true }),
  updateOrderStatus: (id, status) => apiRequest(`/orders/${id}`, { method: "PATCH", body: { status }, auth: true }),

  // Recommend
  recommend: (preferenceText) => apiRequest("/recommend", { method: "POST", body: { preferenceText } }),

  // Dietary / allergen Q&A
  askMenu: (question) => apiRequest("/menu/ask", { method: "POST", body: { question } }),

  // Group ordering
  createGroupSession: (tableIdentifier, hostDeviceId, hostName) =>
    apiRequest("/sessions", { method: "POST", body: { tableCode: tableIdentifier, tableNumber: tableIdentifier, hostDeviceId, hostName } }),
  getGroupSession: (code) => apiRequest(`/sessions/${code}`),
  addSessionItem: (code, menuItemId, quantity, deviceId, name) =>
    apiRequest(`/sessions/${code}/items`, { method: "POST", body: { menuItemId, quantity, deviceId, name } }),
  removeSessionItem: (code, itemId, deviceId, hostToken) =>
    apiRequest(`/sessions/${code}/items/${itemId}`, { method: "DELETE", body: { deviceId, hostToken } }),
  confirmGroupSession: (code, hostToken) =>
    apiRequest(`/sessions/${code}/confirm`, { method: "PATCH", body: { hostToken } }),

  // Smart meal planner
  planMeal: (peopleCount, budget, mealType, dietPreference) =>
    apiRequest("/plan-meal", { method: "POST", body: { peopleCount, budget, mealType, dietPreference } }),

  // Waiter calls
  createWaiterCall: (tableIdentifier, requestType) =>
    apiRequest("/waiter-call", { method: "POST", body: { tableCode: tableIdentifier, tableNumber: tableIdentifier, requestType } }),
  getActiveWaiterCalls: () => apiRequest("/waiter-call", { auth: true }),
  resolveWaiterCall: (id) => apiRequest(`/waiter-call/${id}`, { method: "PATCH", auth: true }),

  // Tables
  resolveTable: (identifier) => apiRequest(`/tables/resolve/${identifier}`),
  getTables: () => apiRequest("/tables", { auth: true }),
  createTable: (tableNumber) => apiRequest("/tables", { method: "POST", body: { tableNumber }, auth: true }),

  // Feedback
  submitFeedback: (orderId, ratings) => apiRequest("/feedback", { method: "POST", body: { orderId, ratings } }),

  // Auth
  login: (email, password) => apiRequest("/auth/login", { method: "POST", body: { email, password } }),
  register: (name, email, password) => apiRequest("/auth/register", { method: "POST", body: { name, email, password, role: "owner" } }),
  me: () => apiRequest("/auth/me", { auth: true }),

  // Analytics
  getSalesReport: () => apiRequest("/analytics/sales", { auth: true }),
};