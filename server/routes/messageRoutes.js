const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/message");
const User = require("../models/user");
const auth = require("../middleware/authMiddleware");
const Group = require("../models/group");
const { uploadSingle, uploadMultiple } = require("../middleware/upload");

const router = express.Router();

/**
 * ✅ Get all messages (entire DB history)
 */
router.get("/", async (req, res) => {
  try {
    const { from } = req.query;

    let filter = {};

    if (from) {
      filter = {
        $or: [{ sender: from }, { receiver: from }],
      };
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .populate("sender", "firstName lastName email profilePic lastSeen")
      .populate("receiver", "firstName lastName email profilePic lastSeen");

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * ✅ Get all messages for a specific user
 * Returns [] for new users or users with no chats
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("✅ /user/:userId hit with ID:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "firstName lastName email profilePic lastSeen")
      .populate("receiver", "firstName lastName email profilePic lastSeen");

    if (!messages || messages.length === 0) {
      console.log("🆕 No chats found — new or inactive user");
      return res.status(200).json([]); // empty for new user
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("User message fetch error:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching user messages" });
  }
});

/**
 * ✅ Latest chat list for a user (like WhatsApp)
 * Returns [] if user has no messages yet
 */
router.get("/latest/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          "userInfo.firstName": 1,
          "userInfo.lastName": 1,
          "userInfo.email": 1,
          "userInfo.profilePic": 1,
          "userInfo.lastSeen": 1,
        },
      },
    ]);

    if (!messages || messages.length === 0) {
      console.log("🆕 New user — no latest chats yet");
      return res.status(200).json([]); // ✅ return empty for new user
    }

    res.json(messages);
  } catch (err) {
    console.error("Latest chat error:", err);
    res.status(500).json({ error: "Server error while fetching latest chats" });
  }
});

/**
 * ✅ Get messages between two users (ONE-TO-ONE chat)
 * Returns [] if no messages exist between them
 */
router.get("/:senderId/:receiverId", async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return res.status(400).json({ error: "Invalid sender or receiver ID" });
    }

    // Fetch sender & receiver
    const senderUser = await User.findById(senderId);
    const receiverUser = await User.findById(receiverId);

    if (!senderUser || !receiverUser) {
      return res.status(404).json({ error: "Sender or receiver not found" });
    }

    // Fetch messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "firstName lastName email profilePic lastSeen")
      .populate("receiver", "firstName lastName email profilePic lastSeen");

    // Return empty array if no messages exist
    return res.json(messages);
  } catch (err) {
    console.error("Fetch conversation error:", err);
    res.status(500).json({ error: "Server error while fetching messages" });
  }
});

/**
 * ✅ Send a message (save in DB)
 */
router.post("/", auth, async (req, res) => {
  try {
    const { sender, receiver, text, message, type } = req.body;
    const msgText = text || message;

    if (!sender || !receiver || !msgText) {
      return res
        .status(400)
        .json({ error: "sender, receiver, and text/message are required" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(sender) ||
      !mongoose.Types.ObjectId.isValid(receiver)
    ) {
      return res.status(400).json({ error: "Invalid sender or receiver ID" });
    }

    const senderUser = await User.findById(sender);
    const receiverUser = await User.findById(receiver);
    if (!senderUser || !receiverUser) {
      return res
        .status(404)
        .json({ error: "Sender or receiver not found in database" });
    }

    const newMessage = new Message({
      sender,
      receiver,
      text: msgText,
      type: type || "text",
      read: false,
      delivered: false,
      seen: false,
    });

    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "firstName lastName email profilePic lastSeen")
      .populate("receiver", "firstName lastName email profilePic lastSeen");

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (err) {
    console.error("Message Send Error:", err);
    res.status(500).json({ error: "Server error while sending message" });
  }
});

/**
 * ✅ Mark all messages from sender → receiver as read/seen
 */
router.patch("/mark-read/:senderId/:receiverId", auth, async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return res.status(400).json({ error: "Invalid sender or receiver ID" });
    }

    const result = await Message.updateMany(
      { sender: senderId, receiver: receiverId, read: false },
      { $set: { read: true, seen: true } },
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read and seen.`,
    });
  } catch (err) {
    console.error("Mark read error:", err);
    res
      .status(500)
      .json({ error: "Server error while marking messages as read" });
  }
});

/**
 * ✅ Get unread count for a user
 */
router.get("/unread/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const count = await Message.countDocuments({
      receiver: userId,
      read: false,
    });
    res.json({ unreadCount: count });
  } catch (err) {
    console.error("Unread count error:", err);
    res
      .status(500)
      .json({ error: "Server error while counting unread messages" });
  }
});

/**
 * ✅ Delete a message
 */
router.delete("/:messageId", auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    await Message.findByIdAndDelete(messageId);
    res.json({ success: true, message: "Message deleted successfully" });
  } catch (err) {
    console.error("Delete message error:", err);
    res.status(500).json({ error: "Server error while deleting message" });
  }
});

// ------------------- Group Chat Routes -------------------

// a) Create a new group (no auth)
router.post("/groups", async (req, res) => {
  try {
    const { name, members, admin } = req.body; // admin ID must come from body

    if (!name || !members || members.length === 0 || !admin) {
      return res
        .status(400)
        .json({ error: "Group name, members, and admin are required" });
    }

    const group = new Group({
      name,
      members,
      admins: [admin], // admin ID from body
    });

    await group.save();
    res.status(201).json(group);
  } catch (err) {
    console.error("Group creation error:", err);
    res.status(500).json({ error: "Server error while creating group" });
  }
});

// b) Send a message to a group (no auth)
router.post("/group-message", async (req, res) => {
  try {
    const { groupId, sender, text, type } = req.body;

    if (!groupId || !text || !sender) {
      return res
        .status(400)
        .json({ error: "Group ID, sender, and text are required" });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const message = new Message({
      sender,
      group: groupId,
      text,
      type,
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "firstName lastName profilePic")
      .populate("group", "name members");

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Send group message error:", err);
    res.status(500).json({ error: "Server error while sending group message" });
  }
});

// c) Get messages from a group (no auth)
router.get("/group/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const messages = await Message.find({ group: groupId })
      .sort({ createdAt: 1 })
      .populate("sender", "firstName lastName profilePic");

    res.json(messages);
  } catch (err) {
    console.error("Fetch group messages error:", err);
    res
      .status(500)
      .json({ error: "Server error while fetching group messages" });
  }
});
// ✅ Get all groups
router.get("/groups", async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("members", "firstName lastName email profilePic")
      .populate("admins", "firstName lastName email profilePic")
      .sort({ createdAt: -1 });

    if (!groups || groups.length === 0) {
      return res.status(200).json({ message: "No groups found" });
    }

    res.status(200).json(groups);
  } catch (err) {
    console.error("Fetch all groups error:", err);
    res.status(500).json({ error: "Server error while fetching all groups" });
  }
});

// ✅ Get all groups a user is part of
router.get("/groups/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const groups = await Group.find({ members: userId })
      .populate("members", "firstName lastName profilePic email")
      .populate("admins", "firstName lastName profilePic email");

    res.json(groups);
  } catch (err) {
    console.error("Fetch user groups error:", err);
    res.status(500).json({ error: "Server error while fetching user groups" });
  }
});
// ✅ Helper function for file type detection
const detectFileType = (mime) => {
  if (!mime) return "file";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  return "file";
};

/**
 * ------------------- One-to-One File Message -------------------
 */
router.post("/send-file", (req, res, next) => {
  // ✅ manually run upload middleware here
  uploadSingle(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ error: err.message });
    }

    console.log("🧩 req.body:", req.body);
    console.log("🧩 req.file:", req.file);

    try {
      const { sender, receiver, senderLanguage, receiverLanguage } = req.body;
      console.log("Body:", req.body);
      console.log("File:", req.file);

      if (!sender || !receiver || !req.file) {
        return res
          .status(400)
          .json({ error: "Sender, receiver, and file are required" });
      }

      const newMessage = new Message({
        sender,
        receiver,
        text: req.file.path || req.file.url,
        type: detectFileType(req.file.mimetype),
        senderLanguage,
        receiverLanguage,
        read: false,
        delivered: false,
        seen: false,
      });

      await newMessage.save();

      const populatedMessage = await Message.findById(newMessage._id)
        .populate("sender", "firstName lastName profilePic")
        .populate("receiver", "firstName lastName profilePic");

      res.status(201).json({ success: true, message: populatedMessage });
    } catch (err) {
      console.error("Send file message error:", err);
      res
        .status(500)
        .json({ error: "Server error while sending file message" });
    }
  });
});

/**
 * ------------------- Group File Message -------------------
 */
router.post("/group-send-file", (req, res, next) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const { groupId, sender } = req.body;
      console.log("Group File Body:", req.body);
      console.log("Group File File:", req.file);

      if (!groupId || !sender || !req.file) {
        return res
          .status(400)
          .json({ error: "Group ID, sender, and file are required" });
      }

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });

      const message = new Message({
        sender,
        group: groupId,
        text: req.file.path || req.file.url,
        type: detectFileType(req.file.mimetype),
      });

      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "firstName lastName profilePic")
        .populate("group", "name members");

      res.status(201).json(populatedMessage);
    } catch (err) {
      console.error("Send group file message error:", err);
      res
        .status(500)
        .json({ error: "Server error while sending group file message" });
    }
  });
});

/**
 * ✅ Send Multiple Files
 */
router.post("/send-multiple", (req, res) => {
  uploadMultiple(req, res, async (err) => {
    if (err) {
      console.error("Multer multiple error:", err);
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedFiles = req.files.map((file) => ({
        url: file.path || file.url,
        type: detectFileType(file.mimetype),
      }));

      res.status(201).json({
        success: true,
        message: "Files uploaded successfully",
        files: uploadedFiles,
      });
    } catch (err) {
      console.error("Multiple file upload error:", err);
      res.status(500).json({ error: "Server error while uploading files" });
    }
  });
});
module.exports = router;
