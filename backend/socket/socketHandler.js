const jwt = require("jsonwebtoken");

function initSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    
    socket.on("joinTable", (identifier) => {
      const idStr = String(identifier || "").trim();
      if (!idStr) {
        return socket.emit("error", { message: "Invalid table identifier" });
      }
      
     
      Array.from(socket.rooms)     // Leave any previously joined table rooms first
        .filter((r) => r.startsWith("table-"))
        .forEach((r) => socket.leave(r));

      socket.join(`table-${idStr}`);
      socket.emit("joinedTable", { tableIdentifier: idStr });
    });


    socket.on("joinKitchen", (token) => {     // Kitchen/admin dashboard joins the kitchen room
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        socket.join("kitchen");
        socket.emit("joinedKitchen", { ok: true });
      } catch (err) {
        socket.emit("error", { message: "Unauthorized: invalid token" });
      }
    });

    // Every phone viewing a group order joins that session
    socket.on("joinSession", (sessionCode) => {
      if (!sessionCode || typeof sessionCode !== "string") {
        return socket.emit("error", { message: "Invalid session code" });
      }

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
  if (order.tableCode) {
    io.to(`table-${order.tableCode}`).emit("orderStatusUpdate", order);
  }
  io.to("kitchen").emit("orderStatusUpdate", order);
}


function emitSessionUpdate(io, sessionCode, session) {
  io.to(`session-${sessionCode}`).emit("sessionUpdate", session);
}


function emitSessionConfirmed(io, sessionCode, order) {     // Tells everyone in the group the host confirmed 
  io.to(`session-${sessionCode}`).emit("sessionConfirmed", order);
}

//  Waiter Call System 

function emitNewWaiterCall(io, call) {
  io.to("kitchen").emit("newWaiterCall", call);
}


function emitWaiterCallResolved(io, call) {     // Called by waiterCallController right after a call is marked resolved. 
  io.to("kitchen").emit("waiterCallResolvedBroadcast", { callId: call._id });
  io.to(`table-${call.tableNumber}`).emit("waiterCallResolved", { callId: call._id });
}



module.exports = {
  initSocket,
  emitNewOrder,
  emitOrderStatusUpdate,
  emitSessionUpdate,
  emitSessionConfirmed,
  emitNewWaiterCall,
  emitWaiterCallResolved,
};