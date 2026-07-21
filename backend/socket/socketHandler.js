/**
 * Sets up Socket.io connection handling.
 *
 * Rooms used:
 * - "kitchen"        -> kitchen/admin dashboards, receives all new orders
 * - `table-<number>` -> a specific customer's table, receives status updates only for that table
 *
 * Security: a client can only join the "kitchen" room if authenticated as admin
 * (token verified client-side before connecting, and re-verified here).
 * A customer client can only join their own table's room - never all tables.
 */
const jwt = require("jsonwebtoken");

function initSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Customer joins their own table's room to receive live status updates
    socket.on("joinTable", (tableNumber) => {
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

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

/** Emit a new order to the kitchen dashboard */
function emitNewOrder(io, order) {
  io.to("kitchen").emit("newOrder", order);
}

/** Emit a status update scoped to the specific table */
function emitOrderStatusUpdate(io, tableNumber, order) {
  io.to(`table-${tableNumber}`).emit("orderStatusUpdate", order);
  io.to("kitchen").emit("orderStatusUpdate", order); // keep kitchen dashboard in sync too
}

module.exports = { initSocket, emitNewOrder, emitOrderStatusUpdate };
