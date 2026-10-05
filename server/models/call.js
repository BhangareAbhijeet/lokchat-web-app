const mongoose = require("mongoose");

const callSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  type: { type: String, enum: ["video", "audio"], default: "audio" },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  status: { type: String, enum: ["missed", "completed"], default: "completed" },
});

module.exports = mongoose.model("Call", callSchema);
