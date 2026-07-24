const express = require("express");
const router = express.Router();
const { createTable, getTables, resolveTable, updateTable } = require("../controllers/tableController");
const { requireAuth } = require("../middleware/authMiddleware");

router.get("/resolve/:identifier", resolveTable); // public
router.post("/", requireAuth, createTable); // admin
router.get("/", requireAuth, getTables); // admin
router.patch("/:id", requireAuth, updateTable); // admin

module.exports = router;