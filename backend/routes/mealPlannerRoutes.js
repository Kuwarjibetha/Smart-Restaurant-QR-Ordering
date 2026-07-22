const express = require("express");
const router = express.Router();
const { planMeal } = require("../controllers/mealPlannerController");
const { mealPlanLimiter } = require("../middleware/rateLimiters");

router.post("/", mealPlanLimiter, planMeal); // public, rate-limited (protects Gemini API cost)

module.exports = router;