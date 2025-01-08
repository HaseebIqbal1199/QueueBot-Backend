const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/userModel.js");

const router = express.Router();
const JWT_SECRET = "your_jwt_secret_key"; // Replace with a strong secret key

// Signup Route
router.post(
  "/signup",
  [
    check("username").notEmpty().withMessage("Username is required"),
    check("email").isEmail().withMessage("Invalid email"),
    check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      // Check if the user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Save the new user
      user = new User({ username, email, password: hashedPassword });
      await user.save();

      res.status(201).json({ msg: "User registered successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  }
);

// Login Route
router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Invalid email"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      // Check the password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      // Generate a JWT
      const payload = { userId: user.id };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  }
);

// Protected Route Example
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password"); // Exclude password
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// Middleware to Authenticate JWT
function authMiddleware(req, res, next) {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
}

module.exports = router;
