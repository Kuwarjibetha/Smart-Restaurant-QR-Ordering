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

// Protects /api/menu/ask from abuse since every call costs a Gemini API request
const askMenuLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many questions. Please wait a moment and try again.",
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

// Higher limit for GET /api/sessions/:code - this gets polled every few
// seconds per device as a fallback if a phone's socket connection drops,
// so it needs more headroom than the mutating session endpoints.
const sessionPollLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

module.exports = { recommendLimiter, askMenuLimiter, orderLimiter, sessionPollLimiter };