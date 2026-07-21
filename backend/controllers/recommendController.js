const MenuItem = require("../models/MenuItem");
const { getMenuRecommendations } = require("../utils/geminiClient");

// POST /api/recommend (public, rate-limited)
async function recommend(req, res) {
  try {
    const { preferenceText } = req.body;
    if (!preferenceText || typeof preferenceText !== "string" || !preferenceText.trim()) {
      return res.status(400).json({ error: "preferenceText is required" });
    }
    if (preferenceText.length > 300) {
      return res.status(400).json({ error: "preferenceText is too long (max 300 characters)" });
    }

    const menuItems = await MenuItem.find({ available: true });
    if (menuItems.length === 0) {
      return res.json({ suggestions: [] });
    }

    const suggestedNames = await getMenuRecommendations(preferenceText, menuItems);

    // Cross-check Gemini's suggestions against the real menu to avoid
    // returning hallucinated dish names that don't actually exist.
    const menuNameSet = new Map(
      menuItems.map((m) => [m.name.trim().toLowerCase(), m])
    );

    const validMatches = suggestedNames
      .map((name) => menuNameSet.get(String(name).trim().toLowerCase()))
      .filter(Boolean);

    res.json({ suggestions: validMatches });
  } catch (err) {
    console.error("Recommend error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to get recommendations", details: err.message });
  }
}

module.exports = { recommend };
