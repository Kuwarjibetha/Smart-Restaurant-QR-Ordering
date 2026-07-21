const MenuItem = require("../models/MenuItem");

// GET /api/menu (public) - full menu, optionally filter by category/availability
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

// GET /api/menu/:id (public)
async function getMenuItem(req, res) {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu item", details: err.message });
  }
}

// POST /api/menu (admin only)
async function createMenuItem(req, res) {
  try {
    const { name, category, price, isVeg, imageUrl, avgPrepTimeMinutes } = req.body;
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
    });

    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to create menu item", details: err.message });
  }
}

// PATCH /api/menu/:id (admin only) - edit item or mark out-of-stock
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

// DELETE /api/menu/:id (admin only)
async function deleteMenuItem(req, res) {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json({ message: "Menu item deleted", item });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete menu item", details: err.message });
  }
}

module.exports = {
  getMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
