const express = require("express");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const {
  registerUser,
  loginUser,
  forgotPassword,
  resendOTP,
  verifyOTP,
  resetPassword,
  logoutUser,
  verifyEmailOTP,
  resendEmailOTP,
} = require("../controllers/authController");

const User = require("../models/user"); // ✅ for status route
const twilio = require("twilio"); // ✅ Add this
const jwt = require("jsonwebtoken");
const passport = require("passport");
require("../config/passport"); // Ensure passport strategies are loaded

const router = express.Router();
console.log("Auth routes loaded ✅");

// ================== RATE LIMITER ==================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 5 attempts per window per IP
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resendEmailOTPLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    status: "failed",
    message: "Too many verification email requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyEmailOTPLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: "failed",
    message: "Too many verification attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: "failed",
    message: "Too many password reset attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================== REGISTER ==================
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("phone").isMobilePhone().withMessage("Valid phone number is required"),
    // body("dob").notEmpty().withMessage("Date of birth is required"),
    body("language").notEmpty().withMessage("Language is required"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  registerUser
);

// 📧 Verify registration email OTP
router.post("/verify-email-otp", verifyEmailOTPLimiter, verifyEmailOTP);
router.post("/resend-email-otp", resendEmailOTPLimiter, resendEmailOTP);

// ================== LOGIN ==================
router.post(
  "/login",
  loginLimiter,
  [
    body("email").notEmpty().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  loginUser
);

// ================== LOGOUT ==================
router.post("/logout", logoutUser);

// ================== FORGOT PASSWORD ==================
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/resend-otp", forgotPasswordLimiter, resendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// ================== USER STATUS (NEW) ==================
router.get("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("isOnline lastSeen firstName lastName email");
    if (!user) return res.status(404).json({ status: "failed", message: "User not found" });

    res.json({
      status: "success",
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "failed", message: "Server error" });
  }
});
// ========== SOCIAL LOGIN ==============
// Twilio OTP setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const otpStore = {}; // temporary in-memory OTP store

router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[phone] = otp;

  await client.messages.create({
    body: `Your OTP is ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  res.json({ success: true, message: "OTP sent" });
});

router.post("/verify-phone-otp", async (req, res) => {
  const { phone, otp } = req.body;

  if (otpStore[phone] && otpStore[phone] == otp) {
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    delete otpStore[phone];
    return res.json({ token, user });
  } else {
    res.status(400).json({ error: "Invalid OTP" });
  }
});
// Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: req.user });
  }
);

// Facebook
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: req.user });
  }
);

// Apple
// ---------------- APPLE LOGIN (MOCK FOR DEV) ----------------
router.get("/apple", passport.authenticate("apple"));

router.get(
  "/apple/callback",
  passport.authenticate("apple", { failureRedirect: "/login" }),
  (req, res) => {
    // Generate JWT like Google/Facebook
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: req.user });
  }
);

module.exports = router;
