import "../styles/CreateNewPassword.css";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../Services/api";

export default function CreateNewPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const email = location.state?.email || "";
  const otp = location.state?.otp || "";

  useEffect(() => {
    if (!isSuccess) return;

    const redirectTimer = setTimeout(() => {
      navigate("/login");
    }, 1800);

    return () => clearTimeout(redirectTimer);
  }, [isSuccess, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!email || !otp) {
      setError("Your reset session is invalid. Please request a new OTP.");
      return;
    }

    try {
      setLoading(true);

      const res = await resetPassword(email, otp, newPassword);

      if (res.status !== "success") {
        throw new Error(res.message || "Invalid or expired OTP.");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="create-new-page">
        <div className="create-new-success-state">
          <div className="success-checkmark">✓</div>
          <h2>Password Reset Successful</h2>
          <p>Your password has been updated successfully.</p>
          <p className="redirecting-text">Redirecting to Login...</p>
          <div className="success-loader" aria-label="Redirecting">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-new-page">
      <div className="create-new-card">
        <h1>Create New Password</h1>
        <p>Enter your new password below.</p>

        <form onSubmit={handleSubmit}>
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
            <span>Confirm New Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </label>

          {error && <p className="create-new-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <Link to="/login" className="back-link">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
