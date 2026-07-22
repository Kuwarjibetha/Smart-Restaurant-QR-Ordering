require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Table = require("../models/Table");
const MenuItem = require("../models/MenuItem");
const { generateTableQR } = require("./generateQR");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Seeding...");


  const ownerEmail = "owner@restaurant.com"; // Owner admin
  const existingOwner = await Admin.findOne({ email: ownerEmail });
  if (!existingOwner) {
    await Admin.create({
      name: "Restaurant Owner",
      email: ownerEmail,
      password: "password123",
      role: "owner",
    });
    console.log(`Created owner admin: ${ownerEmail} / password123`);
  }

  // Kitchen staff admin
  const kitchenEmail = "kitchen@restaurant.com";
  const existingKitchen = await Admin.findOne({ email: kitchenEmail });
  if (!existingKitchen) {
    await Admin.create({
      name: "Kitchen Staff",
      email: kitchenEmail,
      password: "password123",
      role: "kitchen",
    });
    console.log(`Created kitchen admin: ${kitchenEmail} / password123`);
  }

  // Tables 1-5
  for (let i = 1; i <= 5; i++) {
    const exists = await Table.findOne({ tableNumber: i });
    if (!exists) {
      const { qrCodeUrl, tableUrl } = await generateTableQR(i);
      await Table.create({ tableNumber: i, qrCodeUrl, tableUrl });
      console.log(`Created table ${i}`);
    }
  }

  // Starter menu
  const sampleMenu = [
    { name: "Paneer Tikka", category: "Starters", price: 180, isVeg: true, avgPrepTimeMinutes: 15 },
    { name: "Chicken Wings", category: "Starters", price: 220, isVeg: false, avgPrepTimeMinutes: 18 },
    { name: "Veg Fried Rice", category: "Main Course", price: 160, isVeg: true, avgPrepTimeMinutes: 12 },
    { name: "Butter Chicken", category: "Main Course", price: 280, isVeg: false, avgPrepTimeMinutes: 20 },
    { name: "Masala Dosa", category: "Main Course", price: 120, isVeg: true, avgPrepTimeMinutes: 10 },
    { name: "Gulab Jamun", category: "Desserts", price: 80, isVeg: true, avgPrepTimeMinutes: 5 },
    { name: "Cold Coffee", category: "Drinks", price: 90, isVeg: true, avgPrepTimeMinutes: 5 },
    { name: "Masala Chaas", category: "Drinks", price: 60, isVeg: true, avgPrepTimeMinutes: 4 },
  ];

  for (const item of sampleMenu) {
    const exists = await MenuItem.findOne({ name: item.name });
    if (!exists) {
      await MenuItem.create(item);
      console.log(`Created menu item: ${item.name}`);
    }
  }

  console.log("Seeding complete.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
