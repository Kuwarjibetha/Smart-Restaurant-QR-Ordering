const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true, //  starters, main course, drinks, desserts
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    available: {
      type: Boolean,
      default: true,
    },
    avgPrepTimeMinutes: {
      type: Number,
      required: true,
      min: 1,
      default: 12,
    },
    allergens: {
      type: [String],
      default: [],
      //  ["nuts", "dairy", "egg", "soy", "gluten", "shellfish", "sesame"]
    },
    dietaryTags: {
      type: [String],
      default: [],
      // ["vegan", "vegetarian", "jain", "gluten-free"]
    },
    ratings: [ratingSchema],
  },
  { timestamps: true }
);






menuItemSchema.virtual("averageRating").get(function () { // Virtual for quick average rating 

  if (!this.ratings || this.ratings.length === 0) return null;

  const sum = this.ratings.reduce((acc, r) => acc + r.stars, 0);

  return Number((sum / this.ratings.length).toFixed(2));
});




menuItemSchema.set("toJSON", { virtuals: true });
menuItemSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("MenuItem", menuItemSchema);
