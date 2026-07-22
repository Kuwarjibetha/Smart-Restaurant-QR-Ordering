const express = require("express");
const router = express.Router();
const {
  createSession,
  getSession,
  addItem,
  removeItem,
  confirmSession,
} = require("../controllers/groupSessionController");
const { orderLimiter, sessionPollLimiter } = require("../middleware/rateLimiters");

router.post("/", orderLimiter, createSession); // public
router.get("/:code", sessionPollLimiter, getSession); // public, polled frequently as a socket fallback
router.post("/:code/items", orderLimiter, addItem); // public
router.delete("/:code/items/:itemId", orderLimiter, removeItem); // public
router.patch("/:code/confirm", orderLimiter, confirmSession); // public, requires hostToken

module.exports = router;