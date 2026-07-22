const WaiterCall = require("../models/WaiterCall");
const { emitNewWaiterCall, emitWaiterCallResolved } = require("../socket/socketHandler");

// POST /api/waiter-call — public, called by the customer's "Call Waiter" button
exports.createWaiterCall = async (req, res) => {
  try {
    const { tableNumber, requestType } = req.body;

    if (!tableNumber || !requestType) {
      return res.status(400).json({ error: "tableNumber and requestType are required" });
    }
    if (!["water", "check", "help"].includes(requestType)) {
      return res.status(400).json({ error: "Invalid requestType" });
    }

    const call = await WaiterCall.create({ tableNumber, requestType });

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