const Table = require("../models/Table");
const { generateTableQR, generateTableCode } = require("../utils/generateQR");

// POST /api/tables (admin) — creates a table with an unguessable tableCode and QR code
async function createTable(req, res) {
  try {
    const { tableNumber } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ error: "tableNumber is required" });
    }

    const existing = await Table.findOne({ tableNumber: Number(tableNumber) });
    if (existing) {
      return res.status(409).json({ error: "Table already exists" });
    }

    const { tableCode, qrCodeUrl, tableUrl } = await generateTableQR(tableNumber);
    const table = await Table.create({ tableNumber: Number(tableNumber), tableCode, qrCodeUrl, tableUrl });
    res.status(201).json({ table });
  } catch (err) {
    res.status(500).json({ error: "Failed to create table", details: err.message });
  }
}

// GET /api/tables (admin) — fetch all tables with tableCode and QR urls
async function getTables(req, res) {
  try {
    let tables = await Table.find().sort({ tableNumber: 1 });
    
    // Ensure any legacy tables have tableCode and updated tableUrl/qrCodeUrl
    for (let t of tables) {
      if (!t.tableCode) {
        const { tableCode, qrCodeUrl, tableUrl } = await generateTableQR(t.tableNumber);
        t.tableCode = tableCode;
        t.qrCodeUrl = qrCodeUrl;
        t.tableUrl = tableUrl;
        await t.save();
      }
    }

    res.json({ tables });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tables", details: err.message });
  }
}

// GET /api/tables/resolve/:identifier (public) — validates tableCode or tableNumber
async function resolveTable(req, res) {
  try {
    const identifier = String(req.params.identifier).trim();
    const isNum = !isNaN(Number(identifier));
    
    let table = await Table.findOne({
      $or: [
        { tableCode: identifier },
        ...(isNum ? [{ tableNumber: Number(identifier) }] : [])
      ],
      isActive: true,
    });

    if (!table) {
      return res.status(404).json({ error: "Invalid or inactive table QR code." });
    }

    // Auto-generate code if legacy table record missing tableCode
    if (!table.tableCode) {
      const { tableCode, qrCodeUrl, tableUrl } = await generateTableQR(table.tableNumber);
      table.tableCode = tableCode;
      table.qrCodeUrl = qrCodeUrl;
      table.tableUrl = tableUrl;
      await table.save();
    }

    res.json({
      tableNumber: table.tableNumber,
      tableCode: table.tableCode,
      isActive: table.isActive,
      tableUrl: table.tableUrl,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve table", details: err.message });
  }
}

// PATCH /api/tables/:id (admin)
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

module.exports = { createTable, getTables, resolveTable, updateTable };