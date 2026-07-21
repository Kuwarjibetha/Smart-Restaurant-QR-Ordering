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

/**
 * Answers a customer's dietary/allergen question using ONLY the verified
 * allergens/dietaryTags stored on each menu item. Never lets the model
 * guess ingredients it wasn't given - this matters because a wrong answer
 * here is a safety issue, not just a bad suggestion.
 *
 * @param {string} question - e.g. "does the Butter Chicken have nuts?"
 * @param {Array} menuItems - array of { name, category, isVeg, allergens, dietaryTags }
 * @returns {Promise<string>} a short plain-text answer
 */
async function getDietaryAnswer(question, menuItems) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const menuSummary = menuItems
    .map((item) => {
      const allergens = item.allergens && item.allergens.length ? item.allergens.join(", ") : "not recorded";
      const tags = item.dietaryTags && item.dietaryTags.length ? item.dietaryTags.join(", ") : "none";
      return `- ${item.name} | ${item.category} | ${item.isVeg ? "Veg" : "Non-Veg"} | Allergens: ${allergens} | Dietary tags: ${tags}`;
    })
    .join("\n");

  const prompt = `You are a restaurant dietary assistant. Here is the menu with VERIFIED allergen and dietary data:
${menuSummary}

A customer asks: "${question}"

Rules you MUST follow:
1. Answer ONLY using the allergen/dietary data given above. Never guess or infer ingredients that aren't listed.
2. If a dish's allergen info is "not recorded", say you don't have that confirmed and recommend asking staff directly - do not guess either way.
3. Keep the answer to 1-2 short sentences, plain text, no markdown.
4. If the question isn't about food/dietary/allergen topics, politely say you can only help with menu dietary questions.`;

  const response = await axios.post(
    `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 200,
      },
    },
    { timeout: 15000 }
  );

  const rawText =
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "I'm not able to answer that right now - please ask staff to confirm.";

  return rawText.trim();
}

module.exports = { getMenuRecommendations, getDietaryAnswer };
