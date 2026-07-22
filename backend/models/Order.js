const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // price snapshot at order time
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    status: {
      type: String,
      enum: ["placed", "preparing", "served"],
      default: "placed",
      index: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedWaitTime: {
      type: Number, // in minutes
      required: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("Order", orderSchema);
