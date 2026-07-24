const mongoose = require("mongoose");

const sessionItemSchema = new mongoose.Schema(
    {
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MenuItem",
            required: true,
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        }, // snapshot, re-verified at confirm time
        quantity: {
            type: Number,
            required:
                true,
            min: 1
        },
        addedByDeviceId: {
            type: String,
            required: true
        },
        addedByName: {
            type: String,
            default: "Guest"
        },
    },
    { timestamps: true }
);

const groupSessionSchema = new mongoose.Schema(
    {
        tableNumber: {
            type: Number,
            required: true,
            index: true,
        },
        sessionCode: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        hostToken: {
            type: String,
            required: true, // only ever returned to the creator, never exposed to guests
        },
        hostDeviceId: {
            type: String,
            required: true,
        },
        items: {
            type: [sessionItemSchema],
            default: [],
        },
        status: {
            type: String,
            enum: ["open", "confirmed", "cancelled"],
            default: "open",
            index: true,
        },
        confirmedOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
        },
    },
    { timestamps: true }
);

// Auto-delete stale/abandoned sessions from MongoDB once expiresAt passes
groupSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


groupSessionSchema.methods.toPublicJSON = function () { // Never send hostToken down to guest devices
    const obj = this.toObject();
    delete obj.hostToken;
    return obj;
};

module.exports = mongoose.model("GroupSession", groupSessionSchema);