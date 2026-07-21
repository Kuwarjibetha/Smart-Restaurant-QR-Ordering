const express = require("express");
const router = express.Router();
const {
  createOrder,
  updateOrderStatus,
  getOrdersForTable,
  getAllOrders,
} = require("../controllers/orderController");
const { requireAuth } = require("../middleware/authMiddleware");
const { orderLimiter } = require("../middleware/rateLimiters");

router.post("/", orderLimiter, createOrder); // public
router.get("/", requireAuth, getAllOrders); // admin - dashboard feed
router.get("/table/:tableNumber", getOrdersForTable); // public - live status for a table
router.patch("/:id", requireAuth, updateOrderStatus); // admin

module.exports = router;
