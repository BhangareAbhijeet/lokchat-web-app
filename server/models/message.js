const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true },
    senderLanguage: { type: String, required: true },
    receiverLanguage: { type: String, required: true },
    translatedText: { type: String, default: "" },
    delivered: { type: Boolean, default: false }, // ✅ Delivered status
    seen: { type: Boolean, default: false }, // ✅ Seen status
    read: { type: Boolean, default: false }, // ✅ For unread message count
    type: { type: String, default: "text" }, // ✅ in case you add images/files later

    conversationId: { type: String },
    // ✅ new field for reactions
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String }, // example: "❤️", "😂", "👍"
      },
    ],
    // ✅ Optional: unique id for sender+receiver
  },
  { timestamps: true }, // ✅ Auto adds createdAt & updatedAt
);

// ✅ Index for faster queries between 2 users
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
