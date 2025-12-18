const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");

// Send message
router.post("/send", async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text) return res.status(400).json({ error: "Missing fields" });

    const msg = await Message.create({ userId, text, type: "user" });

    // Simple bot response (you can replace with OpenAI later)
    const botMsg = await Message.create({
      userId,
      text: `Bot reply to: ${text}`,
      type: "bot",
    });

    res.json({ user: msg, bot: botMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get conversation
router.get("/:userId", async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.params.userId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
