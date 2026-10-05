import "../styles/ForgotPassword.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../Services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const res = await forgotPassword(email.trim());

      if (res.status !== "success") {
        setError(res.message || "Failed to send reset OTP");
        return;
      }

      navigate("/verify-otp", {
        state: {
          email: email.trim(),
          flow: "forgot-password",
        },
      });
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <h1>Forgot Password</h1>

        <p>Enter your registered email to receive OTP</p>

        <form onSubmit={handleSendOTP}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && <p className="forgot-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <Link to="/login">Back to Login</Link>
      </div>
    </div>
  );
}
