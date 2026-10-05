import React, { useEffect, useState } from "react";
import {
  FaGoogle,
  FaFacebookF,
  FaApple,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { FiSmartphone } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import "../styles/Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Get selected language
  const language = localStorage.getItem("language") || "en";

  // Translations
  const text = {
    en: {
      login: "Log In",
      subtitle: "Enter your email and password to log in",
      email: "Email",
      password: "Password",
      remember: "Remember me",
      forgot: "Forgot Password?",
      logging: "Logging In...",
      button: "Log In",
      social: "Or login with",
      account: "Don't have an account?",
      signup: "Sign Up",
      emailRequired: "Email is required",
      passwordRequired: "Password is required",
      loginSuccess: "Login Successful",
      loginFailed: "Login Failed",
    },

    hi: {
      login: "लॉग इन",
      subtitle: "लॉग इन करने के लिए अपना ईमेल और पासवर्ड दर्ज करें",
      email: "ईमेल",
      password: "पासवर्ड",
      remember: "मुझे याद रखें",
      forgot: "पासवर्ड भूल गए?",
      logging: "लॉग इन हो रहा है...",
      button: "लॉग इन",
      social: "या इसके साथ लॉग इन करें",
      account: "क्या आपका अकाउंट नहीं है?",
      signup: "साइन अप करें",
      emailRequired: "ईमेल आवश्यक है",
      passwordRequired: "पासवर्ड आवश्यक है",
      loginSuccess: "लॉग इन सफल हुआ",
      loginFailed: "लॉग इन असफल",
    },

    ta: {
      login: "உள்நுழைய",
      subtitle: "உங்கள் மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்",
      email: "மின்னஞ்சல்",
      password: "கடவுச்சொல்",
      remember: "என்னை நினைவில் கொள்ளுங்கள்",
      forgot: "கடவுச்சொல்லை மறந்துவிட்டீர்களா?",
      logging: "உள்நுழைகிறது...",
      button: "உள்நுழைய",
      social: "அல்லது இதன் மூலம் உள்நுழையவும்",
      account: "கணக்கு இல்லையா?",
      signup: "பதிவு செய்யவும்",
      emailRequired: "மின்னஞ்சல் தேவை",
      passwordRequired: "கடவுச்சொல் தேவை",
      loginSuccess: "உள்நுழைவு வெற்றி",
      loginFailed: "உள்நுழைவு தோல்வி",
    },

    te: {
      login: "లాగిన్",
      subtitle: "మీ ఇమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి",
      email: "ఇమెయిల్",
      password: "పాస్‌వర్డ్",
      remember: "నన్ను గుర్తుంచుకోండి",
      forgot: "పాస్‌వర్డ్ మర్చిపోయారా?",
      logging: "లాగిన్ అవుతోంది...",
      button: "లాగిన్",
      social: "లేదా దీనితో లాగిన్ అవ్వండి",
      account: "ఖాతా లేదా?",
      signup: "సైన్ అప్",
      emailRequired: "ఇమెయిల్ అవసరం",
      passwordRequired: "పాస్‌వర్డ్ అవసరం",
      loginSuccess: "లాగిన్ విజయవంతం",
      loginFailed: "లాగిన్ విఫలమైంది",
    },

    mr: {
      login: "लॉग इन",
      subtitle: "लॉग इन करण्यासाठी तुमचा ईमेल आणि पासवर्ड टाका",
      email: "ईमेल",
      password: "पासवर्ड",
      remember: "मला लक्षात ठेवा",
      forgot: "पासवर्ड विसरलात?",
      logging: "लॉग इन होत आहे...",
      button: "लॉग इन",
      social: "किंवा यासह लॉग इन करा",
      account: "खाते नाही?",
      signup: "साइन अप",
      emailRequired: "ईमेल आवश्यक आहे",
      passwordRequired: "पासवर्ड आवश्यक आहे",
      loginSuccess: "लॉग इन यशस्वी",
      loginFailed: "लॉग इन अयशस्वी",
    },
    bn: {
      login: "লগ ইন",
      subtitle: "লগ ইন করতে আপনার ইমেল এবং পাসওয়ার্ড লিখুন",
      email: "ইমেল",
      password: "পাসওয়ার্ড",
      remember: "আমাকে মনে রাখুন",
      forgot: "পাসওয়ার্ড ভুলে গেছেন?",
      logging: "লগ ইন হচ্ছে...",
      button: "লগ ইন",
      social: "অথবা এর মাধ্যমে লগ ইন করুন",
      account: "আপনার কি অ্যাকাউন্ট নেই?",
      signup: "সাইন আপ করুন",
      emailRequired: "ইমেল প্রয়োজন",
      passwordRequired: "পাসওয়ার্ড প্রয়োজন",
      loginSuccess: "লগ ইন সফল হয়েছে",
      loginFailed: "লগ ইন ব্যর্থ হয়েছে",
    },

    kn: {
      login: "ಲಾಗಿನ್",
      subtitle: "ಲಾಗಿನ್ ಮಾಡಲು ನಿಮ್ಮ ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
      email: "ಇಮೇಲ್",
      password: "ಪಾಸ್‌ವರ್ಡ್",
      remember: "ನನ್ನನ್ನು ನೆನಪಿಡಿ",
      forgot: "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?",
      logging: "ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ...",
      button: "ಲಾಗಿನ್",
      social: "ಅಥವಾ ಇದರೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ",
      account: "ಖಾತೆ ಇಲ್ಲವೇ?",
      signup: "ಸೈನ್ ಅಪ್",
      emailRequired: "ಇಮೇಲ್ ಅಗತ್ಯವಿದೆ",
      passwordRequired: "ಪಾಸ್‌ವರ್ಡ್ ಅಗತ್ಯವಿದೆ",
      loginSuccess: "ಲಾಗಿನ್ ಯಶಸ್ವಿಯಾಗಿದೆ",
      loginFailed: "ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ",
    },

    pa: {
      login: "ਲਾਗਇਨ",
      subtitle: "ਲਾਗਇਨ ਕਰਨ ਲਈ ਆਪਣਾ ਈਮੇਲ ਅਤੇ ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ",
      email: "ਈਮੇਲ",
      password: "ਪਾਸਵਰਡ",
      remember: "ਮੈਨੂੰ ਯਾਦ ਰੱਖੋ",
      forgot: "ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?",
      logging: "ਲਾਗਇਨ ਹੋ ਰਿਹਾ ਹੈ...",
      button: "ਲਾਗਇਨ",
      social: "ਜਾਂ ਇਸ ਨਾਲ ਲਾਗਇਨ ਕਰੋ",
      account: "ਕੀ ਤੁਹਾਡਾ ਖਾਤਾ ਨਹੀਂ ਹੈ?",
      signup: "ਸਾਈਨ ਅੱਪ",
      emailRequired: "ਈਮੇਲ ਲਾਜ਼ਮੀ ਹੈ",
      passwordRequired: "ਪਾਸਵਰਡ ਲਾਜ਼ਮੀ ਹੈ",
      loginSuccess: "ਲਾਗਇਨ ਸਫਲ",
      loginFailed: "ਲਾਗਇਨ ਅਸਫਲ",
    },

    gu: {
      login: "લૉગિન",
      subtitle: "લૉગિન કરવા માટે તમારું ઇમેઇલ અને પાસવર્ડ દાખલ કરો",
      email: "ઇમેઇલ",
      password: "પાસવર્ડ",
      remember: "મને યાદ રાખો",
      forgot: "પાસવર્ડ ભૂલી ગયા?",
      logging: "લૉગિન થઈ રહ્યું છે...",
      button: "લૉગિન",
      social: "અથવા આ દ્વારા લૉગિન કરો",
      account: "શું તમારું એકાઉન્ટ નથી?",
      signup: "સાઇન અપ",
      emailRequired: "ઇમેઇલ જરૂરી છે",
      passwordRequired: "પાસવર્ડ જરૂરી છે",
      loginSuccess: "લૉગિન સફળ થયું",
      loginFailed: "લૉગિન નિષ્ફળ થયું",
    },
  };

  const t = text[language] || text.en;

  useEffect(() => {
    if (localStorage.getItem("rememberMe") === "true") {
      setEmail(localStorage.getItem("email") || "");
      setPassword(localStorage.getItem("password") || "");
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/messages", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!loginSuccess) return;

    const redirectTimer = setTimeout(() => {
      navigate("/messages");
    }, 1300);

    return () => clearTimeout(redirectTimer);
  }, [loginSuccess, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setLoginError(t.emailRequired);
      return;
    }

    if (!password.trim()) {
      setLoginError(t.passwordRequired);
      return;
    }

    setLoginError("");
    setLoading(true);

    const result = await loginUser({
      email: email.trim(),
      password: password.trim(),
    });

    setLoading(false);

    if (result.status === "success") {
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("email", email);
        localStorage.setItem("password", password);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("email");
        localStorage.removeItem("password");
      }

      if (result.token) {
        localStorage.setItem("token", result.token);
      }

      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
      }

      setLoginSuccess(true);
      return;
    }

    setLoginError(result.message || t.loginFailed);
  };

  if (loginSuccess) {
    return (
      <div className="login-container">
        <div className="login-success-state">
          <div className="success-checkmark">✓</div>
          <h2>{t.loginSuccess}</h2>
          <p>Redirecting...</p>
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
    <div className="login-container">
      <div className="login-card">
        <h3 className="login-logo">LokChat</h3>

        <h1>{t.login}</h1>

        <p className="subtitle">{t.subtitle}</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <span
              className="eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>

          <div className="options">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              {t.remember}
            </label>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/forgot-password");
              }}
            >
              {t.forgot}
            </a>
          </div>

          <button
            type="submit"
            className={`login-btn ${loading ? "is-loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner" aria-hidden="true" />
                <span>{t.logging}</span>
              </>
            ) : (
              t.button
            )}
          </button>

          {loginError && <div className="login-error">{loginError}</div>}
        </form>

        <div className="divider">{t.social}</div>

        <div className="social-icons">
          <button className="google">
            <FaGoogle />
          </button>

          <button className="facebook">
            <FaFacebookF />
          </button>

          <button className="apple">
            <FaApple />
          </button>

          <button className="phone">
            <FiSmartphone />
          </button>
        </div>

        <div className="signup">
          {t.account}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/signup");
            }}
          >
            {" "}
            {t.signup}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
