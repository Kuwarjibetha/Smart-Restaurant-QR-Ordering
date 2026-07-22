function getTableNumberFromUrl() {
  const match = window.location.pathname.match(/table\/(\d+)/) ||
                window.location.search.match(/[?&]table=(\d+)/);
  return match ? Number(match[1]) : null;
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
