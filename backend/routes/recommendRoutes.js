const express = require("express");
const router = express.Router();
const { recommend } = require("../controllers/recommendController");
const { recommendLimiter } = require("../middleware/rateLimiters");

router.post("/", recommendLimiter, recommend); // public, rate-limited (protects Gemini API cost)

module.exports = router;
