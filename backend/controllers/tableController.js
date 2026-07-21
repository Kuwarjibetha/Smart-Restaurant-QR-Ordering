const Table = require("../models/Table");
const { generateTableQR } = require("../utils/generateQR");

// POST /api/tables (admin only) - generate a new table + QR code
async function createTable(req, res) {
  try {
    const { tableNumber } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ error: "tableNumber is required" });
    }

    const existing = await Table.findOne({ tableNumber });
    if (existing) {
      return res.status(409).json({ error: "Table already exists" });
    }

    const { qrCodeUrl, tableUrl } = await generateTableQR(tableNumber);

    const table = await Table.create({ tableNumber, qrCodeUrl, tableUrl });
    res.status(201).json({ table });
  } catch (err) {
    res.status(500).json({ error: "Failed to create table", details: err.message });
  }
}

// GET /api/tables (admin only) - list all tables
async function getTables(req, res) {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json({ tables });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tables", details: err.message });
  }
}

// PATCH /api/tables/:id (admin only) - deactivate/reactivate a table
async function updateTable(req, res) {
  try {
    const { isActive } = req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json({ table });
  } catch (err) {
    res.status(500).json({ error: "Failed to update table", details: err.message });
  }
}

module.exports = { createTable, getTables, updateTable };
