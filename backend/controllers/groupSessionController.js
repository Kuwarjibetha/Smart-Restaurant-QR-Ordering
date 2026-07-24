const crypto = require("crypto");
const GroupSession = require("../models/GroupSession");
const MenuItem = require("../models/MenuItem");
const Table = require("../models/Table");
const Order = require("../models/Order");
const { estimateWaitTime } = require("../utils/waitTime");
const { emitNewOrder, emitSessionUpdate, emitSessionConfirmed } = require("../socket/socketHandler");

function generateSessionCode() {
  return crypto.randomBytes(4).toString("hex"); // e.g. "a1b2c3d4" - unguessable, this IS the access control
}

function generateHostToken() {
  return crypto.randomBytes(16).toString("hex");
}

// POST /api/sessions (public) - a customer starts a group order for their table
async function createSession(req, res) {
  try {
    const { tableNumber, tableCode, hostDeviceId, hostName } = req.body;
    const identifier = String(tableCode || tableNumber || "").trim();
    if (!identifier || !hostDeviceId) {
      return res.status(400).json({ error: "table identifier and hostDeviceId are required" });
    }

    const isNum = !isNaN(Number(identifier));
    const table = await Table.findOne({
      $or: [
        { tableCode: identifier },
        ...(isNum ? [{ tableNumber: Number(identifier) }] : [])
      ],
      isActive: true,
    });
    if (!table) {
      return res.status(404).json({ error: "Invalid or inactive table QR code." });
    }

    const session = await GroupSession.create({
      tableNumber: table.tableNumber,
      sessionCode: generateSessionCode(),
      hostToken: generateHostToken(),
      hostDeviceId,
      items: [],
    });

    // hostToken is returned ONLY here, to the creator's device - never again
    res.status(201).json({
      session: session.toPublicJSON(),
      sessionCode: session.sessionCode,
      hostToken: session.hostToken,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create group session", details: err.message });
  }
}

// GET /api/sessions/:code (public) - fetch current shared cart state (join + polling fallback)
async function getSession(req, res) {
  try {
    const session = await GroupSession.findOne({ sessionCode: req.params.code });
    if (!session) return res.status(404).json({ error: "Group order not found or expired" });
    res.json({ session: session.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group session", details: err.message });
  }
}

// POST /api/sessions/:code/items (public) - add a dish to the shared cart
async function addItem(req, res) {
  try {
    const { menuItemId, quantity, deviceId, name } = req.body;
    if (!menuItemId || !deviceId) {
      return res.status(400).json({ error: "menuItemId and deviceId are required" });
    }

    const session = await GroupSession.findOne({ sessionCode: req.params.code });
    if (!session) return res.status(404).json({ error: "Group order not found or expired" });
    if (session.status !== "open") {
      return res.status(400).json({ error: "This group order is no longer open" });
    }

    // Server-authoritative price/name/availability - never trust the client for these
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem || !menuItem.available) {
      return res.status(400).json({ error: "That dish is not available" });
    }

    session.items.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      addedByDeviceId: deviceId,
      addedByName: (name || "Guest").slice(0, 40),
    });
    await session.save();

    const io = req.app.get("io");
    if (io) emitSessionUpdate(io, session.sessionCode, session.toPublicJSON());

    res.status(201).json({ session: session.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to add item", details: err.message });
  }
}

// DELETE /api/sessions/:code/items/:itemId (public)
// Only the guest who added the item, or the host, can remove it.
async function removeItem(req, res) {
  try {
    const { deviceId, hostToken } = req.body;
    const session = await GroupSession.findOne({ sessionCode: req.params.code });
    if (!session) return res.status(404).json({ error: "Group order not found or expired" });
    if (session.status !== "open") {
      return res.status(400).json({ error: "This group order is no longer open" });
    }

    const item = session.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const isOwner = deviceId && item.addedByDeviceId === deviceId;
    const isHost = hostToken && hostToken === session.hostToken;
    if (!isOwner && !isHost) {
      return res.status(403).json({ error: "You can only remove items you added yourself" });
    }

    item.deleteOne();
    await session.save();

    const io = req.app.get("io");
    if (io) emitSessionUpdate(io, session.sessionCode, session.toPublicJSON());

    res.json({ session: session.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item", details: err.message });
  }
}

// PATCH /api/sessions/:code/confirm (public, requires hostToken)
// Turns the shared cart into a real Order, exactly like a normal single-device order.
async function confirmSession(req, res) {
  try {
    const { hostToken } = req.body;
    const session = await GroupSession.findOne({ sessionCode: req.params.code });
    if (!session) return res.status(404).json({ error: "Group order not found or expired" });
    if (session.status !== "open") {
      return res.status(400).json({ error: "This group order was already confirmed or cancelled" });
    }
    if (!hostToken || hostToken !== session.hostToken) {
      return res.status(403).json({ error: "Only the person who started this group order can confirm it" });
    }
    if (session.items.length === 0) {
      return res.status(400).json({ error: "Add at least one item before confirming" });
    }

    // Re-verify every item against the live menu - prices/availability may
    // have changed since items were added to the shared cart earlier.
    const menuItemIds = session.items.map((i) => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
    const menuItemMap = new Map(menuItems.map((m) => [m._id.toString(), m]));

    const orderItems = [];
    let totalAmount = 0;

    for (const sessionItem of session.items) {
      const menuItem = menuItemMap.get(String(sessionItem.menuItemId));
      if (!menuItem || !menuItem.available) {
        return res.status(400).json({
          error: `${sessionItem.name} is no longer available - remove it and confirm again`,
        });
      }
      const linePrice = menuItem.price; // authoritative, not the earlier snapshot
      totalAmount += linePrice * sessionItem.quantity;
      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: sessionItem.quantity,
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
      tableNumber: session.tableNumber,
      items: orderItems,
      status: "placed",
      totalAmount,
      estimatedWaitTime,
    });

    session.status = "confirmed";
    session.confirmedOrderId = order._id;
    await session.save();

    const io = req.app.get("io");
    if (io) {
      emitNewOrder(io, order); // kitchen dashboard sees it exactly like a normal order
      emitSessionConfirmed(io, session.sessionCode, order); // everyone in the group gets redirected
    }

    res.json({ order, session: session.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ error: "Failed to confirm group order", details: err.message });
  }
}

module.exports = { createSession, getSession, addItem, removeItem, confirmSession };