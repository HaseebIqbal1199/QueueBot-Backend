const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Initialize Gemini API
const apiKey = "AIzaSyCIguS-YbBV11IFJljEw6al3npiO0sBUT0";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Middleware to Authenticate JWT
function authMiddleware(req, res, next) {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, "fd4c362e0fca74321daf8105be244d91bbd2aba10710da72d5190ba840224158");
    req.user = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
}

// Route for Gemini API Call
router.post("/query", authMiddleware, async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ msg: "Question is required" });
  }

  try {
    const chatSession = model.startChat({ generationConfig });
    const result = await chatSession.sendMessage(question);

    // Return the generated output
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ msg: "Error generating response" });
  }
});

module.exports = router;
