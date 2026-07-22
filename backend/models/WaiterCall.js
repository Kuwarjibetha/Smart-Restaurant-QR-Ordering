const mongoose = require("mongoose");

const waiterCallSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
    },
    requestType: {
      type: String,
      enum: ["water", "check", "help"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WaiterCall", waiterCallSchema);