const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");


async function getSalesReport(req, res) {
  try {
    const match = { status: "served" };
    if (req.query.from || req.query.to) {
      match.createdAt = {};
      if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) match.createdAt.$lte = new Date(req.query.to);
    }

    const orders = await Order.find(match);

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;

    // item-by-item sales totals
    const dishSales = {};
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.name;
        if (!dishSales[key]) dishSales[key] = { name: key, quantitySold: 0, revenue: 0 };
        dishSales[key].quantitySold += item.quantity;
        dishSales[key].revenue += item.quantity * item.price;
      }
    }

    const topDishes = Object.values(dishSales)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    // customer feedback summary
    const menuItems = await MenuItem.find({ "ratings.0": { $exists: true } });
    const dishRatings = menuItems.map((item) => {
      const avg =
        item.ratings.reduce((s, r) => s + r.stars, 0) / item.ratings.length;
      return { name: item.name, averageRating: Number(avg.toFixed(2)), totalRatings: item.ratings.length };
    });

    res.json({
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders ? Number((totalRevenue / totalOrders).toFixed(2)) : 0,
      topDishes,
      dishRatings,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate sales report", details: err.message });
  }
}

module.exports = { getSalesReport };
