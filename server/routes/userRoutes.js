const express = require("express");
const User = require("../models/user");
const router = express.Router();

// ✅ 1. Get all users (hide password)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 2. Get single user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get users the current user has chatted with
router.get("/chats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const sentTo = await Message.distinct("receiver", { sender: userId });
    const receivedFrom = await Message.distinct("sender", { receiver: userId });

    const chatUserIds = [...new Set([...sentTo, ...receivedFrom])];

    const users = await User.find({
      _id: { $in: chatUserIds }
    }).select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 3. Update user online/offline status
router.patch("/:id/status", async (req, res) => {
  try {
    const { isOnline } = req.body;
    if (typeof isOnline !== "boolean") {
      return res.status(400).json({ message: "isOnline must be true or false" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isOnline,
        lastSeen: isOnline ? null : new Date(), // ✅ lastSeen set jab user offline ho
      },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: `User status updated to ${isOnline ? "online" : "offline"}`,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put("/:id", async (req, res) => {
  //console.log("✅ PUT /api/users/:id route hit with ID:", req.params.id); 
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return updated user
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
// ✅ Contact Info API
router.get("/contact/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "firstName lastName phone about status isOnline profilePic"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      about: user.about || "",
      status: user.status || "Hey there! I am using chat app.",
      isOnline: user.isOnline,
      profilePic: user.profilePic?.url || ""
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ✅ Block User
router.post("/:id/block", async (req, res) => {
  try {
    const userId = req.user?.id; // auth middleware se aayega
    const blockUserId = req.params.id;

    if (userId === blockUserId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: blockUserId }
    });

    res.json({ message: "User blocked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Report User
router.post("/:id/report", async (req, res) => {
  try {
    const report = {
      reportedBy: req.user?.id,
      reportedUser: req.params.id,
      reason: req.body.reason || "No reason provided",
      createdAt: new Date()
    };

    res.json({ message: "User reported successfully", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
