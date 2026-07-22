const MenuItem = require("../models/MenuItem");
const { getDietaryAnswer } = require("../utils/geminiClient");

// get /api/menu (public) full menu, optionally filter by category or availability
async function getMenu(req, res) {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.available === "true") filter.available = true;

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu", details: err.message });
  }
}

// GET /api/menu/:id (public)  ek specific menu item le aao
async function getMenuItem(req, res) {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu item", details: err.message });
  }
}

// POST /api/menu (admin only) naya menu item add karo
async function createMenuItem(req, res) {
  try {
    const { name, category, price, isVeg, imageUrl, avgPrepTimeMinutes, allergens, dietaryTags } = req.body;
    if (!name || !category || price == null) {
      return res.status(400).json({ error: "name, category, and price are required" });
    }

    const item = await MenuItem.create({
      name,
      category,
      price,
      isVeg: isVeg !== undefined ? isVeg : true,
      imageUrl: imageUrl || "",
      avgPrepTimeMinutes: avgPrepTimeMinutes || 12,
      allergens: Array.isArray(allergens) ? allergens : [],
      dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : [],
    });

    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to create menu item", details: err.message });
  }
}

// PATCH /api/menu/:id (admin only)  item edit karo ya out-of-stock mark karo
async function updateMenuItem(req, res) {
  try {
    const allowedFields = [
      "name",
      "category",
      "price",
      "isVeg",
      "imageUrl",
      "available",
      "avgPrepTimeMinutes",
      "allergens",
      "dietaryTags",
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const item = await MenuItem.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to update menu item", details: err.message });
  }
}

// delete /api/menu/:id (admin)  menu item delete karo
async function deleteMenuItem(req, res) {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json({ message: "Menu item deleted", item });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete menu item", details: err.message });
  }
}

// POST /api/menu/ask (public, rate-limited)
// Is route ka purpose allergy/dietary questions ka jawab dena hai.
// Sirf verified menu data se hi answer deta hai, Gemini ko guess karne nahi deta.
async function askMenu(req, res) {
  try {
    const { question } = req.body;
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "question is required" });
    }
    if (question.length > 300) {
      return res.status(400).json({ error: "question is too long (max 300 characters)" });
    }

    const menuItems = await MenuItem.find({ available: true });
    if (menuItems.length === 0) {
      return res.json({
        answer: "The menu is empty right now, so I can't check that — please ask staff.",
      });
    }

    const answer = await getDietaryAnswer(question, menuItems);
    res.json({ answer });
  } catch (err) {
    console.error("Ask menu error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to answer question", details: err.message });
  }
}

module.exports = {
  getMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  askMenu,
};
