const express = require("express");
const router = express.Router();
const {
  getMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  askMenu,
} = require("../controllers/menuController");
const { requireAuth } = require("../middleware/authMiddleware");
const { askMenuLimiter } = require("../middleware/rateLimiters");

router.get("/", getMenu); // public
router.post("/ask", askMenuLimiter, askMenu); // public, rate-limited (dietary/allergen Q&A)
router.get("/:id", getMenuItem); // public
router.post("/", requireAuth, createMenuItem); // admin
router.patch("/:id", requireAuth, updateMenuItem); // admin
router.delete("/:id", requireAuth, deleteMenuItem); // admin

module.exports = router;
