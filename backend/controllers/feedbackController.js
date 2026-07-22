const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");

async function submitFeedback(req, res) {
  try {
    const { orderId, ratings } = req.body;

    if (!orderId || !Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({ error: "orderId and a non-empty ratings array are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Sirf wahi dishes rate karne do jo is order mein hain
    const orderedItemIds = new Set(order.items.map((i) => i.menuItemId.toString()));

    const results = [];
    for (const r of ratings) {
      if (!orderedItemIds.has(String(r.menuItemId))) {
        continue; // skip dishes not in this order 
      }
      const stars = Math.min(5, Math.max(1, parseInt(r.stars, 10) || 0));
      if (!stars) continue;

      const menuItem = await MenuItem.findByIdAndUpdate(
        r.menuItemId,
        {
          $push: {
            ratings: {
              orderId: order._id,
              stars,
              comment: (r.comment || "").slice(0, 500),
            },
          },
        },
        { new: true }
      );
      if (menuItem) results.push({ menuItemId: menuItem._id, name: menuItem.name });
    }

    res.status(201).json({ message: "Feedback submitted", rated: results });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit feedback", details: err.message });
  }
}

module.exports = { submitFeedback };
