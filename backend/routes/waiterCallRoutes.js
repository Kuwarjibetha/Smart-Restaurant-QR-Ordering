const express = require("express");
const router = express.Router();
const {
  createWaiterCall,
  getActiveWaiterCalls,
  resolveWaiterCall,
} = require("../controllers/waiterCallController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/", createWaiterCall); // public - customer taps "Call Waiter"
router.get("/", requireAuth, getActiveWaiterCalls); // admin - dashboard feed
router.patch("/:id", requireAuth, resolveWaiterCall); // admin - resolve a call

module.exports = router;