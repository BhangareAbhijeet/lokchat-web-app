import "../styles/ResetPassword.css";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../Services/api";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  const email = location.state?.email || "";
  const otp = location.state?.otp || new URLSearchParams(location.search).get("token") || "";

  useEffect(() => {
    if (!email || !otp) {
      setIsInvalid(true);
    }
  }, [email, otp]);

  useEffect(() => {
    if (!isSuccess) return;

    const redirectTimer = setTimeout(() => {
      navigate("/login");
    }, 1600);

    return () => clearTimeout(redirectTimer);
  }, [isSuccess, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email || !otp) {
      setIsInvalid(true);
      return;
    }

    if (!newPassword || !confirmPassword) {
      alert("Please complete both password fields.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await resetPassword(email, otp, newPassword);

      if (res.status !== "success") {
        throw new Error(res.message || "This password reset link is invalid or has expired.");
      }

      setIsSuccess(true);
    } catch (err) {
      setIsInvalid(true);
      alert(err.message || "This password reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="reset-page">
        <div className="reset-success-state">
          <div className="reset-success-badge">✓</div>
          <h2>Password Reset Successful</h2>
          <p>Your password has been changed successfully.</p>
          <p className="redirecting-text">Redirecting to Login...</p>
          <div className="reset-loader" aria-label="Redirecting">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  if (isInvalid) {
    return (
      <div className="reset-page">
        <div className="reset-card invalid-card">
          <h1>Reset Link Invalid</h1>
          <p>This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="reset-link">
            Request a New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h1>Reset Password</h1>
        <p>Enter your new password below.</p>

        <form onSubmit={handleResetPassword}>
          <label>
            <span>New Password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </label>

          <label>
            <span>Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <Link to="/login" className="reset-link">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
