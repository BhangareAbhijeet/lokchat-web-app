const express = require("express");
const User = require("../models/user");
const router = express.Router();
const { cloudinary } = require("../config/cloudinary");
const multer = require("multer");
const streamifier = require("streamifier");

const upload = multer(); // memory storage for image uploads

// Helper: Upload buffer to Cloudinary
function uploadToCloudinary(buffer, folder = "profiles") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// ✅ Get user profile
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -resetOTP -resetOTPExpire"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update user profile (with image support)
router.put("/:id", upload.fields([{ name: "profilePic" }, { name: "coverPic" }]), async (req, res) => {
  try {
    const updates = (({
      firstName,
      lastName,
      phone,
      dob,
      profilePic,
      coverPic,
      about,
      status,
      language
    }) => ({
      firstName,
      lastName,
      phone,
      dob,
      profilePic,
      coverPic,
      about,
      status,
      language
    }))(req.body);

    // 🔹 If profilePic file is uploaded
    if (req.files?.profilePic) {
      const result = await uploadToCloudinary(req.files.profilePic[0].buffer, "profile_pics");
      updates.profilePic = { url: result.secure_url, public_id: result.public_id };
    }

    // 🔹 If coverPic file is uploaded
    if (req.files?.coverPic) {
      const result = await uploadToCloudinary(req.files.coverPic[0].buffer, "cover_pics");
      updates.coverPic = { url: result.secure_url, public_id: result.public_id };
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
