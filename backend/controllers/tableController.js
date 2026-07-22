const Table = require("../models/Table");
const { generateTableQR } = require("../utils/generateQR");

// POST /api/tables (admin)  naya table banaye aur uska QR code generate kare
// Simple: admin table number bhejega, backend check karega aur QR link banake table save karega
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

// GET /api/tables (admin )  saare tables ka list le aao
// Yeh route admin ke liye hai, table data retrieve karega aur tableNumber ke hisaab se sort karega
async function getTables(req, res) {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json({ tables });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tables", details: err.message });
  }
}

// PATCH /api/tables/:id (admin)  table ko deactivate ya reactivate kare
// Admin request bhejega jisme isActive true/false hoga, backend usi table ki state update karega
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

// Export functions so routes can use them
module.exports = { createTable, getTables, updateTable };
