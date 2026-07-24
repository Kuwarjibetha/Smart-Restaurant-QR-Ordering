
const SOCKET_URL = "https://smart-restaurant-qr-ordering.onrender.com";


function connectAsCustomer(tableNumber, onStatusUpdate, onWaiterCallResolved) {
  if (typeof io === "undefined") {
    console.warn("Socket.io not available - live updates disabled, falling back to manual refresh.");
    return null;
  }

  try {
    const socket = io(SOCKET_URL, { reconnectionAttempts: 5, timeout: 5000 });

    socket.on("connect", () => {
      socket.emit("joinTable", tableNumber);
    });

    socket.on("orderStatusUpdate", (order) => {
      if (String(order.tableCode) === String(tableNumber) || String(order.tableNumber) === String(tableNumber)) {
        onStatusUpdate(order);
      }
    });

    if (onWaiterCallResolved) {
      socket.on("waiterCallResolved", onWaiterCallResolved);
    }

    socket.on("connect_error", (err) => {
      console.warn("Socket connection failed:", err.message);
    });

    return socket;
  } catch (err) {
    console.warn("Could not set up live updates:", err.message);
    return null;
  }
}

function connectAsKitchen({ onNewOrder, onStatusUpdate, onNewWaiterCall, onWaiterCallResolved }) {
  if (typeof io === "undefined") {
    console.warn("Socket.io not available - live updates disabled, falling back to manual refresh.");
    return null;
  }

  try {
    const socket = io(SOCKET_URL, { reconnectionAttempts: 5, timeout: 5000 });
    const token = localStorage.getItem("adminToken");

    socket.on("connect", () => {
      socket.emit("joinKitchen", token);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err.message);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection failed:", err.message);
    });

    if (onNewOrder) socket.on("newOrder", onNewOrder);
    if (onStatusUpdate) socket.on("orderStatusUpdate", onStatusUpdate);
    if (onNewWaiterCall) socket.on("newWaiterCall", onNewWaiterCall);
    if (onWaiterCallResolved) socket.on("waiterCallResolvedBroadcast", onWaiterCallResolved);

    return socket;
  } catch (err) {
    console.warn("Could not set up live updates:", err.message);
    return null;
  }
}


function connectToGroupSession(sessionCode, { onSessionUpdate, onSessionConfirmed }) {
  if (typeof io === "undefined") {
    console.warn("Socket.io not available - falling back to manual polling for this group order.");
    return null;
  }

  try {
    const socket = io(SOCKET_URL, { reconnectionAttempts: 5, timeout: 5000 });

    socket.on("connect", () => {
      socket.emit("joinSession", sessionCode);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection failed:", err.message);
    });

    if (onSessionUpdate) socket.on("sessionUpdate", onSessionUpdate);
    if (onSessionConfirmed) socket.on("sessionConfirmed", onSessionConfirmed);

    return socket;
  } catch (err) {
    console.warn("Could not set up live updates:", err.message);
    return null;
  }
}