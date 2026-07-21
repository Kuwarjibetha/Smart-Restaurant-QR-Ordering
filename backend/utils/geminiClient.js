const axios = require("axios");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Asks Gemini to recommend dishes from the restaurant's actual menu
 * based on the customer's free-text preference.
 *
 * @param {string} preferenceText - e.g. "something spicy and quick, veg, under 200 rupees"
 * @param {Array} menuItems - array of { name, category, price, isVeg, avgPrepTimeMinutes }
 * @returns {Promise<string[]>} array of dish names Gemini suggests (unvalidated - caller must cross-check against DB)
 */
async function getMenuRecommendations(preferenceText, menuItems) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const menuSummary = menuItems
    .map(
      (item) =>
        `- ${item.name} | ${item.category} | ₹${item.price} | ${
          item.isVeg ? "Veg" : "Non-Veg"
        } | ~${item.avgPrepTimeMinutes} min`
    )
    .join("\n");

  const prompt = `You are a restaurant menu assistant. Here is the current menu:
${menuSummary}

A customer says: "${preferenceText}"

Suggest up to 3 dishes from the menu above that best match their preference.
Respond ONLY with a JSON array of exact dish names as they appear in the menu, with no extra text, no markdown, no explanation. Example: ["Paneer Tikka", "Veg Fried Rice"]
If nothing matches well, respond with an empty array: []`;

  const response = await axios.post(
    `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 300,
      },
    },
    { timeout: 15000 }
  );

  const rawText =
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

  // Strip markdown code fences if Gemini adds them despite instructions
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to parse Gemini response:", rawText);
    return [];
  }
}

module.exports = { getMenuRecommendations };
