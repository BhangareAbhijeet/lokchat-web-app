// config/cloudinary.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

// ✅ 1. Configure Cloudinary safely
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("❌ Missing Cloudinary environment variables!");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ✅ 2. Create Cloudinary storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // must be a configured instance
  params: async (req, file) => {
    const fileName = file.originalname.split(".")[0];
    return {
      folder: "chat_uploads",
      public_id: `${Date.now()}-${fileName}`,
      resource_type: "auto", // detect automatically (image, video, pdf, etc.)
      // No need for allowed_formats here; Cloudinary handles it
    };
  },
});

// ✅ 3. Optional file filter (only safe formats)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg", "image/png", "image/gif",
    "application/pdf",
    "video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska",
    "audio/mpeg", "audio/wav"
  ];
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported file type!"), false);
};

// ✅ 4. Create multer instance (no file size limit)
const upload = multer({
  storage,
  fileFilter,
  limits: {}, // no size limit
});

// ✅ 5. Export both for reuse
module.exports = {
  cloudinary,
  upload,
};
