const express = require("express");
const router = express.Router();
const { getSalesReport } = require("../controllers/analyticsController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Only owner role can view analytics and sales
router.get("/sales", requireAuth, requireRole("owner"), getSalesReport);

module.exports = router;
