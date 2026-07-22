// socketClient.js — wraps Socket.io connection logic.
// Requires the Socket.io client script to be loaded on the page first:
// <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>

const SOCKET_URL = "http://localhost:5000";

// Live updates are a nice-to-have layer on top of the REST API - if the
// socket.io library didn't load (blocked network, slow CDN, etc.) the rest
// of the page must keep working via plain fetch + manual refresh, not crash.
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
      if (Number(order.tableNumber) === Number(tableNumber)) {
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

function connectAsKitchen({ onNewOrder, onStatusUpdate }) {
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

    return socket;
  } catch (err) {
    console.warn("Could not set up live updates:", err.message);
    return null;
  }
}

// Every phone viewing a group order connects here - joins that session's
// own room so shared-cart updates only reach that group, not everyone.
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