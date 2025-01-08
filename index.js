const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const geminiRoutes = require("./routes/gemini");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = "mongodb+srv://sajidmehmood:O9qx22N7cG1u0uTk@cluster0.yhma3.mongodb.net/";
mongoose
.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/auth", authRoutes);

// Default Route
app.get("/", (req, res) => {
  res.send("Welcome to the Authentication API!");
});

// Start Server
const PORT = 3200;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


// Add Gemini API Routes
app.use("/gemini", geminiRoutes);