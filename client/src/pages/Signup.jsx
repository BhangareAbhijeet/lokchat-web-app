import "../styles/Signup.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaChevronDown } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import CountryCodeSelect from "../pages/CountryCodeSelect";
import { signupUser } from "../Services/api";
const language = localStorage.getItem("language") || "English";

const translations = {
  English: {
    title: "Sign Up",
    subtitle: "Create an account to continue!",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Enter Your Email",
    selectLanguage: "Select Language",
    phone: "Phone Number",
    password: "Password",
    register: "Register",
    registering: "Registering...",
    already: "Already have an account?",
    login: "Login",

    errors: {
      firstName: "First Name required",
      lastName: "Last Name required",
      emailRequired: "Email required",
      emailInvalid: "Enter valid email",
      language: "Please select a language",
      phone: "Please Enter Mobile Number",
      passwordRequired: "Password required",
      passwordInvalid:
        "Password must be 8+ chars, 1 capital, 1 digit & 1 symbol",
    },
  },

  हिंदी: {
    title: "साइन अप",
    subtitle: "जारी रखने के लिए खाता बनाएं!",
    firstName: "पहला नाम",
    lastName: "अंतिम नाम",
    email: "अपना ईमेल दर्ज करें",
    selectLanguage: "भाषा चुनें",
    phone: "फ़ोन नंबर",
    password: "पासवर्ड",
    register: "रजिस्टर करें",
    registering: "रजिस्टर हो रहा है...",
    already: "क्या आपका पहले से खाता है?",
    login: "लॉगिन",

    errors: {
      firstName: "पहला नाम आवश्यक है",
      lastName: "अंतिम नाम आवश्यक है",
      emailRequired: "ईमेल आवश्यक है",
      emailInvalid: "मान्य ईमेल दर्ज करें",
      language: "कृपया भाषा चुनें",
      phone: "मोबाइल नंबर दर्ज करें",
      passwordRequired: "पासवर्ड आवश्यक है",
      passwordInvalid:
        "पासवर्ड में 8 अक्षर, 1 बड़ा अक्षर, 1 अंक और 1 विशेष चिन्ह होना चाहिए",
    },
  },
  தமிழ்: {
    title: "பதிவு செய்யவும்",
    subtitle: "தொடர உங்கள் கணக்கை உருவாக்குங்கள்!",
    firstName: "முதல் பெயர்",
    lastName: "கடைசி பெயர்",
    email: "உங்கள் மின்னஞ்சலை உள்ளிடவும்",
    selectLanguage: "மொழியைத் தேர்ந்தெடுக்கவும்",
    phone: "தொலைபேசி எண்",
    password: "கடவுச்சொல்",
    register: "பதிவு செய்யவும்",
    registering: "பதிவு செய்யப்படுகிறது...",
    already: "ஏற்கனவே கணக்கு உள்ளதா?",
    login: "உள்நுழைய",

    errors: {
      firstName: "முதல் பெயர் அவசியம்",
      lastName: "கடைசி பெயர் அவசியம்",
      emailRequired: "மின்னஞ்சல் அவசியம்",
      emailInvalid: "சரியான மின்னஞ்சலை உள்ளிடவும்",
      language: "மொழியைத் தேர்ந்தெடுக்கவும்",
      phone: "மொபைல் எண்ணை உள்ளிடவும்",
      passwordRequired: "கடவுச்சொல் அவசியம்",
      passwordInvalid:
        "கடவுச்சொல்லில் குறைந்தது 8 எழுத்துகள், 1 பெரிய எழுத்து, 1 எண் மற்றும் 1 சிறப்பு குறியீடு இருக்க வேண்டும்",
    },
  },
  తెలుగు: {
    title: "సైన్ అప్",
    subtitle: "కొనసాగడానికి ఖాతాను సృష్టించండి!",
    firstName: "మొదటి పేరు",
    lastName: "చివరి పేరు",
    email: "మీ ఇమెయిల్ నమోదు చేయండి",
    selectLanguage: "భాషను ఎంచుకోండి",
    phone: "ఫోన్ నంబర్",
    password: "పాస్‌వర్డ్",
    register: "నమోదు చేయండి",
    registering: "నమోదవుతోంది...",
    already: "ఇప్పటికే ఖాతా ఉందా?",
    login: "లాగిన్",

    errors: {
      firstName: "మొదటి పేరు అవసరం",
      lastName: "చివరి పేరు అవసరం",
      emailRequired: "ఇమెయిల్ అవసరం",
      emailInvalid: "చెల్లుబాటు అయ్యే ఇమెయిల్ నమోదు చేయండి",
      language: "దయచేసి భాషను ఎంచుకోండి",
      phone: "మొబైల్ నంబర్ నమోదు చేయండి",
      passwordRequired: "పాస్‌వర్డ్ అవసరం",
      passwordInvalid:
        "పాస్‌వర్డ్‌లో కనీసం 8 అక్షరాలు, 1 పెద్ద అక్షరం, 1 సంఖ్య మరియు 1 ప్రత్యేక గుర్తు ఉండాలి",
    },
  },
  বাংলা: {
    title: "সাইন আপ",
    subtitle: "চালিয়ে যেতে একটি অ্যাকাউন্ট তৈরি করুন!",
    firstName: "প্রথম নাম",
    lastName: "শেষ নাম",
    email: "আপনার ইমেল লিখুন",
    selectLanguage: "ভাষা নির্বাচন করুন",
    phone: "ফোন নম্বর",
    password: "পাসওয়ার্ড",
    register: "নিবন্ধন করুন",
    registering: "নিবন্ধন হচ্ছে...",
    already: "আগেই কি একটি অ্যাকাউন্ট আছে?",
    login: "লগইন",

    errors: {
      firstName: "প্রথম নাম প্রয়োজন",
      lastName: "শেষ নাম প্রয়োজন",
      emailRequired: "ইমেল প্রয়োজন",
      emailInvalid: "সঠিক ইমেল লিখুন",
      language: "অনুগ্রহ করে ভাষা নির্বাচন করুন",
      phone: "মোবাইল নম্বর লিখুন",
      passwordRequired: "পাসওয়ার্ড প্রয়োজন",
      passwordInvalid:
        "পাসওয়ার্ডে কমপক্ষে ৮টি অক্ষর, ১টি বড় হাতের অক্ষর, ১টি সংখ্যা এবং ১টি বিশেষ চিহ্ন থাকতে হবে",
    },
  },
  ಕನ್ನಡ: {
    title: "ಸೈನ್ ಅಪ್",
    subtitle: "ಮುಂದುವರಿಯಲು ಖಾತೆಯನ್ನು ರಚಿಸಿ!",
    firstName: "ಮೊದಲ ಹೆಸರು",
    lastName: "ಕೊನೆಯ ಹೆಸರು",
    email: "ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ",
    selectLanguage: "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    phone: "ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    password: "ಪಾಸ್‌ವರ್ಡ್",
    register: "ನೋಂದಣಿ ಮಾಡಿ",
    registering: "ನೋಂದಣಿ ನಡೆಯುತ್ತಿದೆ...",
    already: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?",
    login: "ಲಾಗಿನ್",

    errors: {
      firstName: "ಮೊದಲ ಹೆಸರು ಅಗತ್ಯವಿದೆ",
      lastName: "ಕೊನೆಯ ಹೆಸರು ಅಗತ್ಯವಿದೆ",
      emailRequired: "ಇಮೇಲ್ ಅಗತ್ಯವಿದೆ",
      emailInvalid: "ಸರಿಯಾದ ಇಮೇಲ್ ನಮೂದಿಸಿ",
      language: "ದಯವಿಟ್ಟು ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
      phone: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
      passwordRequired: "ಪಾಸ್‌ವರ್ಡ್ ಅಗತ್ಯವಿದೆ",
      passwordInvalid:
        "ಪಾಸ್‌ವರ್ಡ್‌ನಲ್ಲಿ ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳು, 1 ದೊಡ್ಡ ಅಕ್ಷರ, 1 ಸಂಖ್ಯೆ ಮತ್ತು 1 ವಿಶೇಷ ಚಿಹ್ನೆ ಇರಬೇಕು",
    },
  },
  ਪੰਜਾਬੀ: {
    title: "ਸਾਈਨ ਅੱਪ",
    subtitle: "ਜਾਰੀ ਰੱਖਣ ਲਈ ਖਾਤਾ ਬਣਾਓ!",
    firstName: "ਪਹਿਲਾ ਨਾਮ",
    lastName: "ਆਖਰੀ ਨਾਮ",
    email: "ਆਪਣਾ ਈਮੇਲ ਦਰਜ ਕਰੋ",
    selectLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ",
    phone: "ਫੋਨ ਨੰਬਰ",
    password: "ਪਾਸਵਰਡ",
    register: "ਰਜਿਸਟਰ ਕਰੋ",
    registering: "ਰਜਿਸਟਰ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...",
    already: "ਕੀ ਪਹਿਲਾਂ ਹੀ ਖਾਤਾ ਹੈ?",
    login: "ਲਾਗਇਨ",

    errors: {
      firstName: "ਪਹਿਲਾ ਨਾਮ ਲਾਜ਼ਮੀ ਹੈ",
      lastName: "ਆਖਰੀ ਨਾਮ ਲਾਜ਼ਮੀ ਹੈ",
      emailRequired: "ਈਮੇਲ ਲਾਜ਼ਮੀ ਹੈ",
      emailInvalid: "ਸਹੀ ਈਮੇਲ ਦਰਜ ਕਰੋ",
      language: "ਕਿਰਪਾ ਕਰਕੇ ਭਾਸ਼ਾ ਚੁਣੋ",
      phone: "ਮੋਬਾਈਲ ਨੰਬਰ ਦਰਜ ਕਰੋ",
      passwordRequired: "ਪਾਸਵਰਡ ਲਾਜ਼ਮੀ ਹੈ",
      passwordInvalid:
        "ਪਾਸਵਰਡ ਵਿੱਚ ਘੱਟੋ-ਘੱਟ 8 ਅੱਖਰ, 1 ਵੱਡਾ ਅੱਖਰ, 1 ਨੰਬਰ ਅਤੇ 1 ਵਿਸ਼ੇਸ਼ ਚਿੰਨ੍ਹ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ",
    },
  },
  ગુજરાતી: {
    title: "સાઇન અપ",
    subtitle: "આગળ વધવા માટે એકાઉન્ટ બનાવો!",
    firstName: "પ્રથમ નામ",
    lastName: "છેલ્લું નામ",
    email: "તમારો ઇમેલ દાખલ કરો",
    selectLanguage: "ભાષા પસંદ કરો",
    phone: "ફોન નંબર",
    password: "પાસવર્ડ",
    register: "નોંધણી કરો",
    registering: "નોંધણી થઈ રહી છે...",
    already: "શું પહેલેથી એકાઉન્ટ છે?",
    login: "લૉગિન",

    errors: {
      firstName: "પ્રથમ નામ જરૂરી છે",
      lastName: "છેલ્લું નામ જરૂરી છે",
      emailRequired: "ઇમેલ જરૂરી છે",
      emailInvalid: "યોગ્ય ઇમેલ દાખલ કરો",
      language: "કૃપા કરીને ભાષા પસંદ કરો",
      phone: "મોબાઇલ નંબર દાખલ કરો",
      passwordRequired: "પાસવર્ડ જરૂરી છે",
      passwordInvalid:
        "પાસવર્ડમાં ઓછામાં ઓછા 8 અક્ષરો, 1 મોટું અક્ષર, 1 નંબર અને 1 વિશેષ ચિહ્ન હોવું જોઈએ",
    },
  },

  मराठी: {
    title: "साइन अप",
    subtitle: "पुढे जाण्यासाठी खाते तयार करा!",
    firstName: "पहिले नाव",
    lastName: "आडनाव",
    email: "तुमचा ईमेल टाका",
    selectLanguage: "भाषा निवडा",
    phone: "फोन नंबर",
    password: "पासवर्ड",
    register: "नोंदणी करा",
    registering: "नोंदणी सुरू आहे...",
    already: "आधीपासून खाते आहे का?",
    login: "लॉगिन",

    errors: {
      firstName: "पहिले नाव आवश्यक आहे",
      lastName: "आडनाव आवश्यक आहे",
      emailRequired: "ईमेल आवश्यक आहे",
      emailInvalid: "योग्य ईमेल टाका",
      language: "कृपया भाषा निवडा",
      phone: "मोबाईल नंबर टाका",
      passwordRequired: "पासवर्ड आवश्यक आहे",
      passwordInvalid:
        "पासवर्डमध्ये 8 अक्षरे, 1 मोठे अक्षर, 1 अंक आणि 1 विशेष चिन्ह असणे आवश्यक आहे",
    },
  },
};
export default function Signup() {
  const language = localStorage.getItem("language") || "English";
  const text = translations[language] || translations["English"];

  console.log("Language:", language);
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState(null);
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    language: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };
  const validate = () => {
    let newErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = text.errors.firstName;

    if (!form.lastName.trim()) newErrors.lastName = text.errors.lastName;

    if (!form.email.trim()) {
      newErrors.email = text.errors.emailRequired;
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
      newErrors.email = text.errors.emailInvalid;
    }

    if (!form.language) newErrors.language = text.errors.language;

    if (!phone.trim()) newErrors.phone = text.errors.phone;

    if (!form.password.trim()) {
      newErrors.password = text.errors.passwordRequired;
    } else if (
      !/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(form.password)
    ) {
      newErrors.password = text.errors.passwordInvalid;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };
  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      phone: phone.trim(),
      language: form.language,
    };

    const res = await signupUser(payload);

    setLoading(false);

    if (res.status === "success") {
      navigate("/verify-otp", {
        state: {
          email: form.email.trim(),
          flow: "signup",
        },
      });
      return;
    }

    alert(res.message || "Signup Failed");
  };
  return (
    <div className="signup-page">
      <div className="back-btn">
        <Link to="/SelectionPage">
          <IoArrowBack />
        </Link>
      </div>

      <div className="signup-box">
        <h1>{text.title}</h1>
        <p>{text.subtitle}</p>
        <div className="row">
          <div className="field">
            <input
              type="text"
              name="firstName"
              placeholder={text.firstName}
              value={form.firstName}
              onChange={handleChange}
            />

            {errors.firstName && (
              <p className="error-text">{errors.firstName}</p>
            )}
          </div>
          <div className="field">
            <input
              type="text"
              name="lastName"
              placeholder={text.lastName}
              value={form.lastName}
              onChange={handleChange}
            />

            {errors.lastName && <p className="error-text">{errors.lastName}</p>}
          </div>
        </div>

        <div className="field">
          <input
            className="full-input"
            type="email"
            name="email"
            placeholder={text.email}
            value={form.email}
            onChange={handleChange}
          />

          {errors.email && <p className="error-text">{errors.email}</p>}
        </div>

        <div className="field">
          <div className="select-wrapper">
            <span className="lang-icon">🟡</span>

            <select
              className="language-select"
              name="language"
              value={form.language}
              onChange={handleChange}
              style={{
                color: form.language
                  ? "var(--input-text)"
                  : "var(--option-text)",
              }}
            >
              <option value="">{text.selectLanguage}</option>
              <option>English (English)</option>
              <option>हिंदी (Hindi)</option>
              <option>தமிழ் (Tamil)</option>
              <option>తెలుగు (Telugu)</option>
              <option>বাংলা (Bengali)</option>
              <option>मराठी (Marathi)</option>
              <option>ಕನ್ನಡ (Kannada)</option>
              <option>ਪੰਜਾਬੀ (Punjabi)</option>
              <option>ગુજરાતી (Gujarati)</option>
            </select>

            <FaChevronDown className="select-icon" />
          </div>

          {errors.language && <p className="error-text">{errors.language}</p>}
        </div>

        <div className="field">
          <div className="phone-row">
            <CountryCodeSelect
              value={country?.iso2}
              onChange={setCountry}
              defaultIso2="in"
            />

            <input
              className="phone-input"
              type="tel"
              placeholder={text.phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {errors.phone && <p className="error-text">{errors.phone}</p>}
        </div>

        <div className="field">
          <div className="password">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={text.password}
              name="password"
              value={form.password}
              onChange={handleChange}
            />

            <span
              className="eye"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>

          {errors.password && <p className="error-text">{errors.password}</p>}
        </div>

        <button
          className="register-btn"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? text.registering : text.register}
        </button>

        <p className="login-text">
          {text.already}
          <span>
            <a className="login-link" href="/login">
              {text.login}
            </a>
          </span>
        </p>
      </div>
    </div>
  );
}
