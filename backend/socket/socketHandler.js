const jwt = require("jsonwebtoken");

function initSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    
    socket.on("joinTable", (tableNumber) => {   // Customer joins their own table's room to receive live status updates
      const num = Number(tableNumber);
      if (!Number.isInteger(num) || num <= 0) {
        return socket.emit("error", { message: "Invalid table number" });
      }
      
      // Leave any previously joined table rooms first
      Array.from(socket.rooms)
        .filter((r) => r.startsWith("table-"))
        .forEach((r) => socket.leave(r));

      socket.join(`table-${num}`);
      socket.emit("joinedTable", { tableNumber: num });
    });

    // Kitchen/admin dashboard joins the kitchen room, but must present a valid JWT
    socket.on("joinKitchen", (token) => {
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        socket.join("kitchen");
        socket.emit("joinedKitchen", { ok: true });
      } catch (err) {
        socket.emit("error", { message: "Unauthorized: invalid token" });
      }
    });

    // Every phone viewing a group order joins that session's own room, so
    // shared-cart updates only broadcast to that group, not the whole restaurant.
    socket.on("joinSession", (sessionCode) => {
      if (!sessionCode || typeof sessionCode !== "string") {
        return socket.emit("error", { message: "Invalid session code" });
      }

      // Leave any previously joined session rooms first
      Array.from(socket.rooms)
        .filter((r) => r.startsWith("session-"))
        .forEach((r) => socket.leave(r));

      socket.join(`session-${sessionCode}`);
      socket.emit("joinedSession", { sessionCode });
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}


function emitNewOrder(io, order) {
  io.to("kitchen").emit("newOrder", order);
}


function emitOrderStatusUpdate(io, tableNumber, order) {
  io.to(`table-${tableNumber}`).emit("orderStatusUpdate", order);
  io.to("kitchen").emit("orderStatusUpdate", order); // keep kitchen dashboard in sync too
}

// Broadcasts the shared cart's new state to everyone currently viewing this group order
function emitSessionUpdate(io, sessionCode, session) {
  io.to(`session-${sessionCode}`).emit("sessionUpdate", session);
}

// Tells everyone in the group the host confirmed - their screens should
// switch over to tracking the real order (order-status.html)
function emitSessionConfirmed(io, sessionCode, order) {
  io.to(`session-${sessionCode}`).emit("sessionConfirmed", order);
}

// ── Waiter Call System ──────────────────────────────────────────────────
// Called by waiterCallController right after a new call is saved to the DB.
// Pushes the new call to every connected kitchen/admin dashboard.
function emitNewWaiterCall(io, call) {
  io.to("kitchen").emit("newWaiterCall", call);
}

// Called by waiterCallController right after a call is marked resolved.
// Tells the kitchen dashboards to remove it, and tells the originating
// table's customer socket(s) their request was handled.
function emitWaiterCallResolved(io, call) {
  io.to("kitchen").emit("waiterCallResolvedBroadcast", { callId: call._id });
  io.to(`table-${call.tableNumber}`).emit("waiterCallResolved", { callId: call._id });
}
// ──────────────────────────────────────────────────────────────────────────

module.exports = {
  initSocket,
  emitNewOrder,
  emitOrderStatusUpdate,
  emitSessionUpdate,
  emitSessionConfirmed,
  emitNewWaiterCall,
  emitWaiterCallResolved,
};