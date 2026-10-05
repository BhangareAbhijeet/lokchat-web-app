const nodemailer = require("nodemailer");

const port = Number(process.env.EMAIL_PORT || 587);
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port,
  secure: port === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const ensureEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }
};

const sendEmailVerificationOTP = async (email, otp) => {
  ensureEmailConfig();
  const mailOptions = {
    from: `"LokChat" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "LokChat Email Verification",
    text: `Your LokChat email verification OTP is ${otp}. It is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Verify Your LokChat Account</h2>

        <p>Hello,</p>

        <p>
          Thank you for registering with LokChat.
          Please use the OTP below to verify your email address.
        </p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 20px;
          text-align: center;
          background: #f2f2f2;
          margin: 20px 0;
        ">
          ${otp}
        </div>

        <p>This OTP is valid for <strong>10 minutes</strong>.</p>

        <p>
          If you did not create a LokChat account, please ignore this email.
        </p>

        <p>Regards,<br>LokChat Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetOTP = async (email, otp) => {
  ensureEmailConfig();
  await transporter.sendMail({
    from: `"LokChat" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "LokChat Password Reset OTP",
    text: `LokChat Password Reset OTP\n\nYour OTP for resetting your LokChat password is:\n\n${otp}\n\nThis OTP will expire after the configured expiration time.\n\nIf you did not request a password reset, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>LokChat Password Reset OTP</h2>

        <p>Hello,</p>

        <p>Your OTP for resetting your LokChat password is:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 20px;
          text-align: center;
          background: #f2f2f2;
          margin: 20px 0;
        ">
          ${otp}
        </div>

        <p>This OTP will expire after the configured expiration time.</p>

        <p>If you did not request a password reset, please ignore this email.</p>

        <p>Regards,<br>LokChat Team</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmailVerificationOTP,
  sendPasswordResetOTP,
};