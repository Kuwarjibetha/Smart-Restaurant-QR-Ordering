
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const Table = require("../models/Table");
const { estimateWaitTime } = require("../utils/waitTime");
const { emitNewOrder, emitOrderStatusUpdate } = require("../socket/socketHandler");
const { findOrCreateTable } = require("../utils/generateQR");

async function createOrder(req, res) {
  try {
    const { tableNumber, tableCode, items, customerName, customerMobile } = req.body;
    const identifier = String(tableCode || tableNumber || "").trim();

    if (!identifier || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "table identifier and a non-empty items array are required" });
    }

    const table = await findOrCreateTable(identifier);

    if (!table) {
      return res.status(404).json({ error: "Invalid or inactive table QR code." });
    }

    // Saare requested menu items ek hi query se fetch kari
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
    const menuItemMap = new Map(menuItems.map((m) => [m._id.toString(), m]));

    const orderItems = [];
    let totalAmount = 0;

    for (const requested of items) {
      const menuItem = menuItemMap.get(String(requested.menuItemId));
      if (!menuItem) {
        return res.status(400).json({ error: `Menu item ${requested.menuItemId} not found` });
      }
      if (!menuItem.available) {
        return res.status(400).json({ error: `${menuItem.name} is currently out of stock` });
      }

      const quantity = Math.max(1, parseInt(requested.quantity, 10) || 1);
      const linePrice = menuItem.price; // server-authoritative price
      totalAmount += linePrice * quantity;

      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity,
        price: linePrice,
      });
    }

    const estimatedWaitTime = await estimateWaitTime(
      orderItems.map((oi) => ({
        ...oi,
        avgPrepTimeMinutes: menuItemMap.get(String(oi.menuItemId))?.avgPrepTimeMinutes,
      }))
    );

    const order = await Order.create({
      tableNumber: table.tableNumber,
      tableCode: table.tableCode,
      customerName: (customerName || "").trim().slice(0, 80),
      customerMobile: (customerMobile || "").trim().slice(0, 20),
      items: orderItems,
      status: "placed",
      totalAmount,
      estimatedWaitTime,
    });

    const io = req.app.get("io");
    if (io) emitNewOrder(io, order);

    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to place order", details: err.message });
  }
}

// PATCH /api/orders/:id (admin)
async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ["placed", "preparing", "served"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    const io = req.app.get("io");
    if (io) emitOrderStatusUpdate(io, order.tableNumber, order);

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status", details: err.message });
  }
}

// GET /api/orders/table/:tableIdentifier (public) — live status for a table Code or Number
async function getOrdersForTable(req, res) {
  try {
    const identifier = String(req.params.tableNumber).trim();
    const table = await findOrCreateTable(identifier);

    if (!table) {
      return res.status(404).json({ error: "Invalid table QR code", orders: [] });
    }

    const orders = await Order.find({
      $or: [
        { tableCode: table.tableCode },
        { tableNumber: table.tableNumber }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ orders, tableNumber: table.tableNumber, tableCode: table.tableCode });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders", details: err.message });
  }
}

// GET /api/orders (admin ) - all orders, optionally filtered by status, for the dashboard
async function getAllOrders(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter)
      .select("tableNumber tableCode customerName customerMobile items status totalAmount estimatedWaitTime createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders", details: err.message });
  }
}

module.exports = {
  createOrder,
  updateOrderStatus,
  getOrdersForTable,
  getAllOrders,
};
