const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

function signToken(admin) {
  return jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// post /api/auth/register  
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An admin with this email already exists" });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      role: role === "owner" ? "owner" : "kitchen",
    });

    const token = signToken(admin);
    res.status(201).json({ admin, token });
  } catch (err) {
    res.status(500).json({ error: "Failed to register admin", details: err.message });
  }
}

// post /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(admin);
    res.json({ admin, token });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
}

// get /api/auth/me
async function me(req, res) {
  res.json({ admin: req.admin });
}

module.exports = { register, login, me };
