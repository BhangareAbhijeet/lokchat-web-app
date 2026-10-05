const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");
require("dotenv").config();

// ✅ Cloudinary configuration (ensure env vars are set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ✅ Cloudinary storage setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // make sure it's a configured instance
  params: async (req, file) => {
    const fileName = file.originalname.split(".")[0];
    return {
      folder: "chat_uploads", // Cloudinary folder name
      public_id: `${Date.now()}-${fileName}`, // unique file name
      resource_type: "auto", // auto-detect file type (image, video, raw, etc.)
    };
  },
});

// ✅ File filter (optional but recommended)
const fileFilter = (req, file, cb) => {
  // const allowedMimeTypes = [
  //   "image/jpeg",
  //   "image/png",
  //   "image/gif",
  //   "application/pdf",
  //   "video/mp4",
  //   "video/quicktime",
  //   "video/x-msvideo",
  //   "video/x-matroska",
  //   "audio/mpeg",
  //   "audio/wav",
  // ];

  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/aac",
    "audio/x-aac",
    "audio/mp4", // some AAC encoders use this
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file type! Only image, video, audio, and PDF are allowed."
      ),
      false
    );
  }
};

// ✅ Define multer upload middleware (no file size limit)
const upload = multer({
  storage,
  fileFilter,
  limits: {}, // no size limit
});

// ✅ Export both single and multiple upload handlers
module.exports = {
  uploadSingle: upload.single("file"), // For single file upload
  uploadMultiple: upload.array("files", 5), // Optional: up to 5 files at once
};
