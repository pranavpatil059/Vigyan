const jwt = require("jsonwebtoken");
const Librarian = require("../models/Librarian");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/register  (use once to seed the admin account)
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await Librarian.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered." });

    const librarian = await Librarian.create({ name, email, password });
    res.status(201).json({ success: true, message: "Librarian registered.", id: librarian._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    const librarian = await Librarian.findOne({ email });
    if (!librarian || !(await librarian.comparePassword(password)))
      return res.status(401).json({ success: false, message: "Invalid credentials." });

    const token = signToken(librarian._id);
    res.json({ success: true, token, librarian: { id: librarian._id, name: librarian.name, email: librarian.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
