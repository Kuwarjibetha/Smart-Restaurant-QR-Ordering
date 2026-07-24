const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    tableCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qrCodeUrl: {
      type: String, 
      required: true,
    },
    tableUrl: {
      type: String, 
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
