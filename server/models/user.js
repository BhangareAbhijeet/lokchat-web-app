const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // 🔑 Login Credentials
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.facebookId && !this.appleId;
      },
    },
    googleId: { type: String },
    facebookId: { type: String },
    appleId: { type: String },

    // 👤 Basic Info
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String, unique: true, sparse: true },
    dob: { type: Date },
    language: { type: String, default: "en" },

    // 🔑 Forgot Password (OTP)
    resetOTP: { type: String, select: false },
    resetOTPExpire: { type: Date, select: false },

    // 📧 Email Verification

    emailVerified: { type: Boolean, default: false },

    emailVerificationOTP: { type: String, select: false },

    emailVerificationOTPExpire: { type: Date, select: false },

    // 🔒 Single-device login
    currentDeviceId: { type: String, default: null },

    // 👤 Profile Info
    profilePic: {
      url: { type: String, default: "" },
      public_id: { type: String, default: " " },
    },
    coverPic: {
      url: { type: String, default: "" },
      public_id: { type: String, default: " " },
    },
    about: { type: String, default: "" },
    status: { type: String, default: "Hey there! I am using chat app." },

    // 🟢 Online Presence
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    lastLogin: { type: Date, default: null }, // 🔑 track last login time

    // store normalized E.164 phone number here (string like "+919876543210")
    phone: { type: String, index: true, unique: true, sparse: true },

    // 👫 Contacts
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 🚫 Blocked Users
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

// 🔹 Helper: Update user by ID
userSchema.statics.updateById = async function (id, updates) {
  try {
    const updatedUser = await this.findByIdAndUpdate(id, updates, {
      new: true,
    });
    return updatedUser;
  } catch (err) {
    throw err;
  }
};

// 🔹 Helper: Fix old documents with profilePic/coverPic as string
userSchema.statics.fixProfileFields = async function () {
  try {
    const users = await this.find({
      $or: [
        { profilePic: { $type: "string" } },
        { coverPic: { $type: "string" } },
      ],
    });

    for (let user of users) {
      if (typeof user.profilePic === "string") {
        user.profilePic = { url: "", public_id: "" };
      }
      if (typeof user.coverPic === "string") {
        user.coverPic = { url: "", public_id: "" };
      }
      await user.save();
    }
    console.log(`Fixed ${users.length} users' profile/cover fields.`);
  } catch (err) {
    console.error("Error fixing profile fields:", err);
  }
};

module.exports = mongoose.model("User", userSchema);
