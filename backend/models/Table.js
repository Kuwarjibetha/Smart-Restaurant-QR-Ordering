const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    qrCodeUrl: {
      type: String, // base64 data URL or hosted image URL of the QR code
      required: true,
    },
    tableUrl: {
      type: String, // the actual URL the QR code points to, e.g. /table/12
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
