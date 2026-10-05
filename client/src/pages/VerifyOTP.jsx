import "../styles/VerifyOTP.css";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyOTP, resendOTP } from "../Services/api";

export default function VerifyOTP() {
  const [timer, setTimer] = useState(20);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const flow = location.state?.flow || "forgot-password";
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (!isSuccess) return;

    const redirectTimer = setTimeout(() => {
      navigate("/login");
    }, 1800);

    return () => clearTimeout(redirectTimer);
  }, [isSuccess, navigate]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      alert("Email is missing. Please try again.");
      return;
    }

    if (timer > 0 || resending) return;

    try {
      setResending(true);

      const res = await resendOTP(email, flow);
      if (res.status !== "success") {
        throw new Error(res.message || "Failed to resend OTP");
      }

      setOtp(["", "", "", "", "", ""]);
      setTimer(20);
      document.getElementById("otp-0")?.focus();
    } catch (err) {
      alert(err.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Email is missing. Please try again.");
      return;
    }

    const otpValue = otp.join("");

    if (otpValue.length !== 6 || !/^\d{6}$/.test(otpValue)) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const res = await verifyOTP(email, otpValue, flow);

      if (res.status !== "success") {
        throw new Error(res.message || "Invalid OTP");
      }

      if (flow === "signup") {
        setIsSuccess(true);
        return;
      }

      navigate("/create-new-password", {
        state: {
          email,
          otp: otpValue,
          flow: "forgot-password",
        },
      });
    } catch (err) {
      alert(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="otp-page">
        <div className="otp-card">
          <h1>Verification required</h1>
          <p className="otp-text">
            We could not find your email for this verification flow.
          </p>
          <Link to="/login" className="back-login">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="otp-page otp-success-page">
        <div className="otp-success-content">
          <div className="success-badge">✓</div>
          <h2>User Created Successfully</h2>
          <p>Redirecting to Login...</p>
          <div className="redirect-loader" aria-label="Redirecting">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-page">
      <div className="otp-card">
        <h1>Enter OTP</h1>

        <p className="otp-text">
          Please enter the 6-digit code sent to your email address.
        </p>

        <p className="otp-email">{email}</p>

        <form onSubmit={handleVerifyOTP}>
          <div className="otp-inputs">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </div>

          <button type="submit" className="verify-btn" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="resend-text">
          {timer > 0 ? (
            <>Resend OTP in {timer}s</>
          ) : (
            <button
              type="button"
              className="resend-link"
              onClick={handleResendOTP}
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
          )}
        </p>

        <Link to="/login" className="back-login">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
