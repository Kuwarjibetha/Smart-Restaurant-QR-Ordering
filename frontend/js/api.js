// api.js — thin wrapper around fetch for talking to the backend.
// Change API_BASE if your backend runs somewhere other than localhost:5000.

const API_BASE = "http://localhost:5000/api";

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
  placeOrder: (tableNumber, items) => apiRequest("/orders", { method: "POST", body: { tableNumber, items } }),
  getOrdersForTable: (tableNumber) => apiRequest(`/orders/table/${tableNumber}`),
  getAllOrders: (status) => apiRequest(`/orders${status ? `?status=${status}` : ""}`, { auth: true }),
  updateOrderStatus: (id, status) => apiRequest(`/orders/${id}`, { method: "PATCH", body: { status }, auth: true }),

  // Recommend
  recommend: (preferenceText) => apiRequest("/recommend", { method: "POST", body: { preferenceText } }),

  // Dietary / allergen Q&A
  askMenu: (question) => apiRequest("/menu/ask", { method: "POST", body: { question } }),

  // Tables
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
