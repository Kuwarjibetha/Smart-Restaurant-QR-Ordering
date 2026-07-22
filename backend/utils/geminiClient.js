const axios = require("axios");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;


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

  
  const cleaned = rawText.replace(/```json|```/g, "").trim(); // Strip markdown code

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to parse Gemini response:", rawText);
    return [];
  }
}


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
