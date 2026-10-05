const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Message = require("../models/message");
const User = require("../models/user");

router.get("/chatList/:userId", async (req, res) => {
  try {
    const userId = req.params.userId.trim();

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    // ✅ Fetch only messages that involve this user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender receiver", "firstName lastName isOnline lastSeen")
      .sort({ createdAt: -1 }); // latest message first

    // 🧹 ADD THIS PART 👇
    if (!messages || messages.length === 0) {
      return res.json([]); // frontend will show blank chat list
    }

    const chatUsersMap = {};

    for (const msg of messages) {
      const chatUser =
        msg.sender._id.toString() === userId ? msg.receiver : msg.sender;

      // ✅ Only add unique users
      if (!chatUsersMap[chatUser._id]) {
        chatUsersMap[chatUser._id] = {
          _id: chatUser._id,
          name: `${chatUser.firstName} ${chatUser.lastName}`.trim(),
          isOnline: chatUser.isOnline,
          lastSeen: chatUser.lastSeen,
          lastMessage: {
            text: msg.text,
            createdAt: msg.createdAt,
          },
          unseenCount: 0,
        };
      }

      // ✅ Update last message if newer
      if (
        new Date(msg.createdAt) >
        new Date(chatUsersMap[chatUser._id].lastMessage.createdAt)
      ) {
        chatUsersMap[chatUser._id].lastMessage = {
          text: msg.text,
          createdAt: msg.createdAt,
        };
      }

      // ✅ Count unseen messages
      if (msg.receiver._id.toString() === userId && !msg.read) {
        chatUsersMap[chatUser._id].unseenCount += 1;
      }
    }

    // ✅ Convert to array and sort by latest message
    const chatList = Object.values(chatUsersMap).sort(
      (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    res.json(chatList);
  } catch (err) {
    console.error("❌ ChatList Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
