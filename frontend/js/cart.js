function getTableIdentifierFromUrl() {
  const match = window.location.pathname.match(/table\/([a-zA-Z0-9_-]+)/) ||
                window.location.search.match(/[?&]table=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function getTableNumberFromUrl() {
  return getTableIdentifierFromUrl();
}

function cartKey(tableNumber) {
  return `cart:table:${tableNumber}`;
}

function getCart(tableNumber) {
  try {
    const raw = localStorage.getItem(cartKey(tableNumber));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(tableNumber, cart) {
  localStorage.setItem(cartKey(tableNumber), JSON.stringify(cart));
}

function addToCart(tableNumber, menuItem, quantity = 1) {
  const cart = getCart(tableNumber);
  const existing = cart.find((c) => c.menuItemId === menuItem._id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
    });
  }
  saveCart(tableNumber, cart);
  return cart;
}

function updateCartQuantity(tableNumber, menuItemId, quantity) {
  let cart = getCart(tableNumber);
  if (quantity <= 0) {
    cart = cart.filter((c) => c.menuItemId !== menuItemId);
  } else {
    const item = cart.find((c) => c.menuItemId === menuItemId);
    if (item) item.quantity = quantity;
  }
  saveCart(tableNumber, cart);
  return cart;
}

function clearCart(tableNumber) {
  localStorage.removeItem(cartKey(tableNumber));
}

function cartTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getMyOrderIds() {
  try {
    const raw = localStorage.getItem("myOrderIds");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function addMyOrderId(orderId) {
  if (!orderId) return;
  const ids = getMyOrderIds();
  if (!ids.includes(orderId)) {
    ids.push(orderId);
    localStorage.setItem("myOrderIds", JSON.stringify(ids));
  }
}

function filterCustomerOrders(orders) {
  if (!Array.isArray(orders)) return [];
  const myIds = getMyOrderIds();
  const savedName = (localStorage.getItem("customerName") || "").trim().toLowerCase();
  const savedMobile = (localStorage.getItem("customerMobile") || "").trim();

  if (myIds.length === 0 && !savedName && !savedMobile) {
    return [];
  }

  return orders.filter((o) => {
    if (!o) return false;
    if (o._id && myIds.includes(o._id)) return true;
    if (savedMobile && o.customerMobile && o.customerMobile.trim() === savedMobile) {
      if (o._id) addMyOrderId(o._id);
      return true;
    }
    if (savedName && o.customerName && o.customerName.trim().toLowerCase() === savedName) {
      if (o._id) addMyOrderId(o._id);
      return true;
    }
    return false;
  });
}

