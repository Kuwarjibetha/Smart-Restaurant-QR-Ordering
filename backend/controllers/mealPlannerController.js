const MenuItem = require("../models/MenuItem");
const { getMealPlan } = require("../utils/geminiClient");

const VALID_MEAL_TYPES = ["lunch", "dinner"];
const VALID_DIET = ["veg", "non-veg", "both"];

// POST /api/plan-meal (public, rate-limited)
async function planMeal(req, res) {
  try {
    const { peopleCount, budget, mealType, dietPreference } = req.body;

    const people = parseInt(peopleCount, 10);
    const totalBudget = parseFloat(budget);
    const meal = (mealType || "").toLowerCase();
    const diet = (dietPreference || "").toLowerCase();

    if (!Number.isInteger(people) || people < 1 || people > 50) {
      return res.status(400).json({ error: "peopleCount must be a whole number between 1 and 50" });
    }
    if (!totalBudget || totalBudget <= 0) {
      return res.status(400).json({ error: "budget must be a positive number" });
    }
    if (!VALID_MEAL_TYPES.includes(meal)) {
      return res.status(400).json({ error: `mealType must be one of: ${VALID_MEAL_TYPES.join(", ")}` });
    }
    if (!VALID_DIET.includes(diet)) {
      return res.status(400).json({ error: `dietPreference must be one of: ${VALID_DIET.join(", ")}` });
    }

    const filter = { available: true };
    if (diet === "veg") filter.isVeg = true;
   
    const menuItems = await MenuItem.find(filter);

    if (menuItems.length === 0) {
      return res.json({ items: [], estimatedTotal: 0, note: "No matching dishes are available right now." });
    }

    const suggestedNames = await getMealPlan({ people, totalBudget, meal, diet, menuItems });

    const menuMap = new Map(menuItems.map((m) => [m.name.trim().toLowerCase(), m]));
    const items = [];
    let estimatedTotal = 0;

    for (const suggestion of suggestedNames) {
      const menuItem = menuMap.get(String(suggestion.name).trim().toLowerCase());
      if (!menuItem) continue; // skip hallucinated dish names that aren't real

      const quantity = Math.max(1, Math.min(50, parseInt(suggestion.quantity, 10) || 1));
      const lineTotal = menuItem.price * quantity;
      estimatedTotal += lineTotal;

      items.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        lineTotal,
      });
    }

    res.json({
      items,
      estimatedTotal,
      peopleCount: people,
      budget: totalBudget,
      withinBudget: estimatedTotal <= totalBudget,
    });
  } catch (err) {
    console.error("Meal plan error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to plan meal", details: err.message });
  }
}

module.exports = { planMeal };