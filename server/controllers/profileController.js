const Profile = require("../models/profile");
const User = require("../models/user"); // ✅ to update email/phone directly
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

function uploadToCloudinary(buffer, folder = "profiles") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" }, // auto handles image, video, pdf
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// 🔹 Get logged-in user's profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate("user", "-password");
    if (!profile)
      return res.status(404).json({ success: false, message: "Profile not found" });

    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 Update profile (name, bio, profilePic, coverPic, email, phone)
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, about, email, phone } = req.body;

    // ✅ Find or create profile
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) profile = new Profile({ user: req.user.id });

    // ✅ Update profile fields
    if (name) profile.name = name;
    if (bio) profile.bio = bio;
    if (about) profile.about = about;

    // ✅ If file uploaded (profilePic OR coverPic)
    if (req.file) {
      const folderType = req.query.type === "cover" ? "cover-pics" : "profile-pics";
      const result = await uploadToCloudinary(req.file.buffer, folderType);

      if (req.query.type === "cover") {
        profile.coverPic = { url: result.secure_url, public_id: result.public_id };
      } else {
        profile.photo = { url: result.secure_url, public_id: result.public_id };
      }
    }

    // ✅ Update email/phone in User model (not just profile)
    if (email || phone) {
      const user = await User.findById(req.user.id);
      if (email) user.email = email;
      if (phone) user.phone = phone;
      await user.save();
    }

    await profile.save();

    // ✅ Return updated profile
    const updatedProfile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      "-password"
    );

    res.json({ success: true, message: "Profile updated successfully", profile: updatedProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
