const User = require("../models/user");
const Message = require("../models/message"); // ✅ make sure this is imported
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes, randomInt, scrypt, timingSafeEqual } = require("crypto");
const { promisify } = require("util");
const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const {
  sendEmailVerificationOTP,
  sendPasswordResetOTP,
} = require("../utils/emailService");

const scryptAsync = promisify(scrypt);
const OTP_EXPIRY_MS = 10 * 60 * 1000;

const generateOTP = () => randomInt(100000, 1000000).toString();

const hashOTP = async (otp) => {
  const salt = randomBytes(16);
  const hash = await scryptAsync(otp, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
};

const isOTPValid = async (otp, storedOTP) => {
  if (typeof storedOTP !== "string") return false;

  const [saltHex, hashHex] = storedOTP.split(":");
  if (!/^[a-f0-9]{32}$/.test(saltHex) || !/^[a-f0-9]{128}$/.test(hashHex)) {
    return false;
  }

  const expectedHash = Buffer.from(hashHex, "hex");
  const actualHash = await scryptAsync(otp, Buffer.from(saltHex, "hex"), 64);
  return timingSafeEqual(actualHash, expectedHash);
};

// ================= REGISTER =================
exports.registerUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, dob, language } =
      req.body;

    // 🔍 Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        status: "failed",
        message: "Email or phone already in use",
      });
    }

    // 🔑 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const emailVerificationOTP = generateOTP();
    const hashedEmailVerificationOTP = await hashOTP(emailVerificationOTP);

    // 🆕 Create new user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      dob,
      language,

      // 📧 Email Verification
      emailVerified: false,
      emailVerificationOTP: hashedEmailVerificationOTP,
      emailVerificationOTPExpire: new Date(Date.now() + OTP_EXPIRY_MS),

      currentDeviceId: null,
      isOnline: false,
      lastSeen: null,
      lastLogin: new Date(),
    });

    await user.save();

    try {
      await sendEmailVerificationOTP(user.email, emailVerificationOTP);
    } catch (emailError) {
      try {
        await User.deleteOne({ _id: user._id });
      } catch (cleanupError) {
        console.error("Registration cleanup error:", cleanupError.message);
        user.emailVerificationOTP = undefined;
        user.emailVerificationOTPExpire = undefined;
        await user.save();
      }
      console.error("Verification email delivery failed:", emailError.message);
      return res.status(502).json({
        status: "failed",
        message: "Unable to send verification email. Please try again.",
      });
    }

    // 🧹 Clear any old messages (extra safety)
    try {
      await Message.deleteMany({
        $or: [{ sender: user._id }, { receiver: user._id }],
      });
      console.log("🧹 Old messages cleared for new user:", user._id);
    } catch (err) {
      console.error("Cleanup error:", err.message);
    }

    return res.status(201).json({
      status: "success",
      message: "Registration successful. OTP sent to your email.",
      email: user.email,
    });
  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({
      status: "failed",
      message: "Server error during registration",
    });
  }
};

// ================= VERIFY EMAIL OTP =================

exports.verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email) {
      return res.status(400).json({ status: "failed", message: "Email is required" });
    }
    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ status: "failed", message: "A valid 6-digit OTP is required" });
    }

    // 🔍 Find user
    const user = await User.findOne({ email }).select(
      "+emailVerificationOTP +emailVerificationOTPExpire",
    );

    if (!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found"
      });
    }

    // ✅ Already verified
    if (user.emailVerified) {
      return res.status(200).json({
        status: "success",
        message: "Email is already verified",
      });
    }

    // ❌ Invalid or expired OTP
    if (
      !user.emailVerificationOTP ||
      !user.emailVerificationOTPExpire ||
      user.emailVerificationOTPExpire.getTime() <= Date.now() ||
      !(await isOTPValid(otp, user.emailVerificationOTP))
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid or expired OTP",
      });
    }

    // ✅ Verify email
    user.emailVerified = true;

    // 🧹 Remove OTP after successful verification
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpire = undefined;

    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });

  } catch (err) {
    console.error("Email Verification Error:", err.message);

    return res.status(500).json({
      status: "failed",
      message: "Server error during email verification"
    });
  }
};

// ================= RESEND EMAIL OTP =================
exports.resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: "failed", message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "failed", message: "User not found" });
    }
    if (user.emailVerified) {
      return res.status(200).json({
        status: "success",
        message: "Email is already verified",
      });
    }

    const otp = generateOTP();
    user.emailVerificationOTP = await hashOTP(otp);
    user.emailVerificationOTPExpire = new Date(Date.now() + OTP_EXPIRY_MS);
    await user.save();

    try {
      await sendEmailVerificationOTP(user.email, otp);
    } catch (emailError) {
      user.emailVerificationOTP = undefined;
      user.emailVerificationOTPExpire = undefined;
      await user.save();
      console.error("Verification email delivery failed:", emailError.message);
      return res.status(502).json({
        status: "failed",
        message: "Unable to send verification email. Please try again.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "A new verification OTP was sent to your email",
    });
  } catch (err) {
    console.error("Resend Email OTP Error:", err.message);
    return res.status(500).json({
      status: "failed",
      message: "Server error while resending verification email",
    });
  }
};

// ================= LOGIN =================
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ status: "failed", errors: errors.array() });

  const { email, password } = req.body;
  const deviceId = req.headers["device-id"] || uuidv4(); // client must send device-id

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid credentials" });

    if (!user.emailVerified) {
      return res.status(403).json({
        status: "failed",
        message: "Please verify your email before logging in",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid credentials" });

    // 🚫 Prevent multiple device login
    if (user.currentDeviceId && user.currentDeviceId !== deviceId) {
      return res.status(403).json({
        status: "failed",
        message: "User already logged in on another device",
      });
    }

    // ✅ Update device, online, and login info
    user.currentDeviceId = deviceId;
    user.isOnline = true;
    user.lastSeen = null;
    user.lastLogin = new Date();
    await user.save();

    // 🎫 Create token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      // no expiry for now
    );

    return res.json({
      status: "success",
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isOnline: user.isOnline,
      },
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res
      .status(500)
      .json({ status: "failed", message: "Server error during login" });
  }
};

// ================= LOGOUT =================
exports.logoutUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ status: "failed", message: "User not found" });

    user.currentDeviceId = null;
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
      lastSeen: user.lastSeen,
    });
  } catch (err) {
    console.error("Logout Error:", err.message);
    res
      .status(500)
      .json({ status: "failed", message: "Server error during logout" });
  }
};

// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: "failed", message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        status: "success",
        message: "If an account exists for this email, a password reset OTP has been sent.",
      });
    }

    const otp = generateOTP();
    user.resetOTP = await hashOTP(otp);
    user.resetOTPExpire = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetOTP(user.email, otp);
    } catch (emailError) {
      user.resetOTP = undefined;
      user.resetOTPExpire = undefined;
      await user.save();
      console.error("Password reset email delivery failed:", emailError.message);
      return res.status(502).json({
        status: "failed",
        message: "Unable to send password reset email. Please try again.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "If an account exists for this email, a password reset OTP has been sent.",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err.message);
    return res.status(500).json({ status: "failed", message: "Server error" });
  }
};

// ================= RESEND FORGOT PASSWORD OTP =================
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: "failed", message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        status: "success",
        message: "If an account exists for this email, a password reset OTP has been sent.",
      });
    }

    const otp = generateOTP();
    user.resetOTP = await hashOTP(otp);
    user.resetOTPExpire = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetOTP(user.email, otp);
    } catch (emailError) {
      user.resetOTP = undefined;
      user.resetOTPExpire = undefined;
      await user.save();
      console.error("Password reset resend email delivery failed:", emailError.message);
      return res.status(502).json({
        status: "failed",
        message: "Unable to send password reset email. Please try again.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "A new password reset OTP has been sent to your email.",
    });
  } catch (err) {
    console.error("Resend OTP Error:", err.message);
    return res.status(500).json({ status: "failed", message: "Server error" });
  }
};

// ================= VERIFY OTP =================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email) {
      return res.status(400).json({ status: "failed", message: "Email is required" });
    }

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ status: "failed", message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email }).select("+resetOTP +resetOTPExpire");

    if (!user || !user.resetOTP || !user.resetOTPExpire) {
      return res.status(400).json({ status: "failed", message: "Invalid or expired OTP" });
    }

    if (user.resetOTPExpire.getTime() <= Date.now() || !(await isOTPValid(otp, user.resetOTP))) {
      return res.status(400).json({ status: "failed", message: "Invalid or expired OTP" });
    }

    return res.json({ status: "success", message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP Error:", err.message);
    return res.status(500).json({ status: "failed", message: "Server error" });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ status: "failed", message: "Email, OTP, and new password are required" });
    }

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ status: "failed", message: "Invalid or expired OTP" });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ status: "failed", message: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({ email }).select("+resetOTP +resetOTPExpire");

    if (!user || !user.resetOTP || !user.resetOTPExpire) {
      return res.status(400).json({ status: "failed", message: "Invalid or expired OTP" });
    }

    if (user.resetOTPExpire.getTime() <= Date.now() || !(await isOTPValid(otp, user.resetOTP))) {
      return res.status(400).json({ status: "failed", message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
    await user.save();

    return res.json({ status: "success", message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err.message);
    return res.status(500).json({ status: "failed", message: "Server error" });
  }
};
