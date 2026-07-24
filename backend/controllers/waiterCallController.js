const WaiterCall = require("../models/WaiterCall");
const Table = require("../models/Table");
const { emitNewWaiterCall, emitWaiterCallResolved } = require("../socket/socketHandler");

// POST /api/waiter-call — public, called by customer
exports.createWaiterCall = async (req, res) => {
  try {
    const { tableNumber, tableCode, requestType } = req.body;
    const identifier = String(tableCode || tableNumber || "").trim();

    if (!identifier || !requestType) {
      return res.status(400).json({ error: "table identifier and requestType are required" });
    }
    if (!["water", "check", "help"].includes(requestType)) {
      return res.status(400).json({ error: "Invalid requestType" });
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

    const call = await WaiterCall.create({ tableNumber: table.tableNumber, requestType });

    const io = req.app.get("io");
    emitNewWaiterCall(io, call);

    res.status(201).json({ call });
  } catch (err) {
    res.status(500).json({ error: "Failed to create waiter call" });
  }
};

// GET /api/waiter-call — admin, active (pending) calls for dashboard initial load + polling fallback
exports.getActiveWaiterCalls = async (req, res) => {
  try {
    const calls = await WaiterCall.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json({ calls });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch waiter calls" });
  }
};

// PATCH /api/waiter-call/:id — admin, marks a call resolved
exports.resolveWaiterCall = async (req, res) => {
  try {
    const updated = await WaiterCall.findByIdAndUpdate(
      req.params.id,
      { status: "resolved", resolvedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Call not found" });

    const io = req.app.get("io");
    emitWaiterCallResolved(io, updated);

    res.json({ call: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve waiter call" });
  }
};