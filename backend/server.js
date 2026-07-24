require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const { initSocket } = require("./socket/socketHandler");

const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const recommendRoutes = require("./routes/recommendRoutes");
const tableRoutes = require("./routes/tableRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const groupSessionRoutes = require("./routes/groupSessionRoutes");
const waiterCallRoutes = require("./routes/waiterCallRoutes");
const mealPlannerRoutes = require("./routes/mealPlannerRoutes");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: true, credentials: true },
});
app.set("io", io); // makes io accessible in controllers via req.app.get("io")
initSocket(io);

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sessions", groupSessionRoutes);
app.use("/api/waiter-call", waiterCallRoutes);
app.use("/api/plan-meal", mealPlannerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();

module.exports = { app, server, io };