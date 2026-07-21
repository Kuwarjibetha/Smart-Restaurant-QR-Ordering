const express = require("express");
const router = express.Router();
const {
  getMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");
const { requireAuth } = require("../middleware/authMiddleware");

router.get("/", getMenu); // public
router.get("/:id", getMenuItem); // public
router.post("/", requireAuth, createMenuItem); // admin
router.patch("/:id", requireAuth, updateMenuItem); // admin
router.delete("/:id", requireAuth, deleteMenuItem); // admin

module.exports = router;
