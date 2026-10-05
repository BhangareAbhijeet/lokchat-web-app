const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: String,
    bio: String,
    photo: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" } // ✅ Changed from object to String
    },
    coverPic: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" } // ✅ Changed from object to String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
