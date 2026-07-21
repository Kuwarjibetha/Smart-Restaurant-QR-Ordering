const rateLimit = require("express-rate-limit");

// Protects /api/recommend from abuse since every call costs a Gemini API request
const recommendLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 8, // 8 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many recommendation requests. Please wait a moment and try again.",
  },
});

// General light protection for public ordering endpoints
const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

module.exports = { recommendLimiter, orderLimiter };
