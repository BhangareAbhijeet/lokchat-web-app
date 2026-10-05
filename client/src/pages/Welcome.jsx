import React, { useState } from "react";
import "../styles/Welcome.css";
import { FaArrowRight } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBack } from "react-icons/io5";

import GetStartedImage from "../assets/welcome.png";
import WelcomeImage from "../assets/imageonborading2.png";

const Welcome = () => {
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState(1);

  const navigate = useNavigate();

  const language = localStorage.getItem("language") || "English";

  const translations = {
    English: {
      page1: {
        title: "Welcome to LokChat",
        desc: (
          <>
            Bring your favorite people together and start
            <br />
            meaningful conversations.
          </>
        ),
      },
      page2: {
        title: "Start Talking, Stay Connected.",
        desc: (
          <>
            Connect instantly with friends, family, or
            <br />
            colleagues. Your conversations, your way.
          </>
        ),
      },
      page3: {
        title: "Your Privacy Matters",
        desc: (
          <>
            Every message is encrypted, so your chats stay
            <br />
            personal and safe.
          </>
        ),
      },
      button1: "Get Started",
      button2: "Next",
    },

    हिंदी: {
      page1: {
        title: "लोकचैट में आपका स्वागत है",
        desc: (
          <>
            अपने पसंदीदा लोगों को एक साथ लाएँ और अर्थपूर्ण बातचीत <br />
            शुरू करें।
          </>
        ),
      },
      page2: {
        title: "बातचीत शुरू करें, जुड़े रहें।",
        desc: (
          <>
            दोस्तों, परिवार या सहकर्मियों से तुरंत जुड़ें। आपकी बातचीत, <br />
            आपका तरीका।
          </>
        ),
      },
      page3: {
        title: "आपकी गोपनीयता मायने रखती है|",
        desc: (
          <>
            हर संदेश एन्क्रिप्टेड होता है, इसलिए आपकी बातचीत निजी
            <br />
            और सुरक्षित रहती है।
          </>
        ),
      },
      button1: "शुरू करें",
      button2: "आगे",
    },

    मराठी: {
      page1: {
        title: "लोकचॅट मध्ये आपले स्वागत आहे",
        desc: (
          <>
            आपल्या आवडत्या लोकांना एकत्र आणा आणि अर्थपूर्ण संवाद <br />
            सुरू करा.
          </>
        ),
      },
      page2: {
        title: "बोलणे सुरू करा, जोडले राहा.",
        desc: (
          <>
            मित्र, कुटुंब किंवा सहकारी यांच्याशी त्वरित संपर्क करा. आपली <br />
            संभाषणे, आपला मार्ग.
          </>
        ),
      },
      page3: {
        title: "तुमची गोपनीयता महत्त्वाची आहे",
        desc: (
          <>
            प्रत्येक संदेश एन्क्रिप्ट केलेला असतो, त्यामुळे तुमची गप्पा <br />
            वैयक्तिक आणि सुरक्षित राहतात.
          </>
        ),
      },
      button1: "सुरू करा",
      button2: "पुढे",
    },
    தமிழ்: {
      page1: {
        title: "லோக் சார்டுக்கு வரவேற்பு",
        desc: "உங்கள் பிடித்த மக்களை ஒன்றாக கொண்டு வந்து அர்த்தமுள்ள உரையாடலைத் தொடங்குங்கள்.",
      },
      page2: {
        title: "பேச ஆரம்பிக்கவும், தொடர்ந்து இருங்கள்.",
        desc: "நண்பர்கள், குடும்பம் அல்லது सहசெயலாளர்களுடன் உடனடியாக இணைக. உங்கள் உரையாடல், உங்கள் விதி.",
      },
      page3: {
        title: "உங்கள் தனியுரிமை முக்கியம்",
        desc: "ஒவ்வொரு செய்தியும் குறியாக்கம் செய்யப்பட்டுள்ளதால், உங்கள் உரையாடல்கள் தனிப்பட்டதும் பாதுகாப்பானதும் ஆகும்.",
      },
      button1: "தொடங்கவும்",
      button2: "அடுத்து",
    },

    తెలుగు: {
      page1: {
        title: "లోక్చాట్ కు స్వాగతం",
        desc: "మీ ఇష్టమైన వ్యక్తులను కలిపి అర్థవంతమైన సంభాషణలు ప్రారంభించండి.",
      },
      page2: {
        title: "మాట్లాడటం ప్రారంభించండి, కనెక్ట్‌గా ఉండండి.",
        desc: "మిత్రులు, కుటుంబ సభ్యులు లేదా సహచరులతో వెంటనే కనెక్ట్ అవ్వండి. మీ సంభాషణలు, మీ శైలి.",
      },
      page3: {
        title: "మీ గోప్యత ముఖ్యం",
        desc: "ప్రతి సందేశం గుప్తీకరించబడింది, కాబట్టి మీ చాట్స్ వ్యక్తిగతంగా మరియు సురక్షితంగా ఉంటాయి.",
      },
      button1: "ప్రారంభించండి",
      button2: "తదుపరి",
    },

    বাংলা: {
      page1: {
        title: "লোকচ্যাট এ আপনাকে স্বাগতম",
        desc: "আপনার প্রিয় মানুষদের একত্রিত করুন এবং অর্থপূর্ণ আলাপ শুরু করুন।",
      },
      page2: {
        title: "কথা শুরু করুন, সংযুক্ত থাকুন।",
        desc: "বন্ধু, পরিবার বা সহকর্মীদের সাথে তৎক্ষণাৎ সংযোগ করুন। আপনার কথোপকথন, আপনার পথ।",
      },
      page3: {
        title: "আপনার গোপনীয়তা গুরুত্বপূর্ণ",
        desc: "প্রতি বার্তাই এনক্রিপ্ট করা হয়, তাই আপনার চ্যাটগুলি ব্যক্তিগত এবং নিরাপদ থাকে।",
      },
      button1: "শুরু করুন",
      button2: "পরবর্তী",
    },

    ಕನ್ನಡ: {
      page1: {
        title: "ಲೋಕ್ ಚಾಟ್ ಗೆ ಸ್ವಾಗತ",
        desc: "ನಿಮ್ಮ ಪ್ರಿಯಜನರನ್ನು ಒಟ್ಟಿಗೆ ತರಿಸಿ ಮತ್ತು ಅರ್ಥಪೂರ್ಣ ಸಂಭಾಷಣೆಗಳನ್ನು ಪ್ರಾರಂಭಿಸಿ.",
      },
      page2: {
        title: "ಮಾತನಾಡಲು ಪ್ರಾರಂಭಿಸಿ, ಕನೆಕ್ಟ್ ಆಗಿರಿ.",
        desc: "ಮಿತ್ರರು, ಕುಟುಂಬ ಅಥವಾ ಸಹೋದ್ಯೋಗಿಗಳೊಂದಿಗೆ ತಕ್ಷಣ ಸಂಪರ್ಕ ಸಾಧಿಸಿ. ನಿಮ್ಮ ಸಂಭಾಷಣೆ, ನಿಮ್ಮ ವಿಧಾನ.",
      },
      page3: {
        title: "ನಿಮ್ಮ ಗೌಪ್ಯತೆ ಮುಖ್ಯ",
        desc: "ಪ್ರತಿ ಸಂದೇಶವು ಎನ್ಕ್ರಿಪ್ಟ್ ಮಾಡಲ್ಪಟ್ಟಿದೆ, ಆದ್ದರಿಂದ ನಿಮ್ಮ ಚಾಟ್‌ಗಳು ಖಾಸಗಿ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿರುತ್ತವೆ.",
      },
      button1: "ತொடರಿ",
      button2: "ಮುಂದೆ",
    },

    ਪੰਜਾਬੀ: {
      page1: {
        title: "ਲੋਕਚੈਟ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ",
        desc: "ਆਪਣੇ ਮਨਪਸੰਦ ਲੋਕਾਂ ਨੂੰ ਇਕੱਠੇ ਕਰੋ ਅਤੇ ਅਰਥਪੂਰਨ ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ।",
      },
      page2: {
        title: "ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ, ਜੁੜੇ ਰਹੋ।",
        desc: "ਦੋਸਤਾਂ, ਪਰਿਵਾਰ ਜਾਂ ਸਹਕਰਮੀਆਂ ਨਾਲ ਤੁਰੰਤ ਜੁੜੋ। ਤੁਹਾਡੀ ਗੱਲਬਾਤ, ਤੁਹਾਡਾ ਤਰੀਕਾ।",
      },
      page3: {
        title: "ਤੁਹਾਡੀ ਪ੍ਰਾਈਵੇਸੀ ਮਹੱਤਵਪੂਰਨ ਹੈ",
        desc: "ਹਰ ਸੁਨੇਹਾ ਇਨਕ੍ਰਿਪਟ ਕੀਤਾ ਗਿਆ ਹੈ, ਇਸ ਲਈ ਤੁਹਾਡੀਆਂ ਗੱਲਬਾਤਾਂ ਨਿੱਜੀ ਅਤੇ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦੀਆਂ ਹਨ।",
      },
      button1: "ਸ਼ੁਰੂ ਕਰੋ",
      button2: "ਅਗਲਾ",
    },

    ગુજરાતી: {
      page1: {
        title: "લોકચેટ માં તમારું સ્વાગત છે",
        desc: "તમારા પ્રિય લોકો ને એક સાથે લાવો અને અર્થપૂર્ણ સંવાદ શરૂ કરો.",
      },
      page2: {
        title: "વાતચીત શરૂ કરો, જોડાયેલા રહો.",
        desc: "મિત્રો, પરિવાર કે સહકર્મચારીઓ સાથે તરત જ જોડાઓ. તમારી વાતચીત, તમારો રીત.",
      },
      page3: {
        title: "તમારી ખાનગીપણું મહત્વપૂર્ણ છે",
        desc: "દરેક સંદેશા એન્ક્રિપ્ટ કરાયેલ છે, તેથી તમારી વાતચીત અંગત અને સુરક્ષિત રહે છે.",
      },
      button1: "શરૂ કરો",
      button2: "આગળ",
    },
  };

  const text = translations[language] || translations["English"];
  const handleNext = () => {
    if (page < 3) {
      setDirection(1); // Next animation
      setPage((prev) => prev + 1);
    } else {
      navigate("/selectionpage");
    }
  };

  const handleBack = () => {
    setDirection(0); // Back animation
    setPage((prev) => prev - 1);
  };

  return (
    <div className="welcome-container">
      {/* Back Button */}
      {page === 1 ? (
        <Link to="/" className="back-button">
          <IoArrowBack />
        </Link>
      ) : (
        <button className="back-button" onClick={handleBack}>
          <IoArrowBack />
        </button>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={page}
          className="welcome-content"
          initial={
            direction === 1 ? { x: 400, opacity: 0 } : { x: 0, opacity: 1 }
          }
          animate={{
            x: 0,
            opacity: 1,
          }}
          exit={
            direction === 1 ? { x: -400, opacity: 0 } : { x: 0, opacity: 1 }
          }
          transition={
            direction === 1
              ? {
                  duration: 0.4,
                  ease: "easeInOut",
                }
              : {
                  duration: 0,
                }
          }
        >
          {/* Image */}
          <div className="welcome-image">
            <img
              src={page === 1 ? GetStartedImage : WelcomeImage}
              alt="Welcome"
            />
          </div>

          {/* Heading */}
          <h1 className="welcome-title">
            {page === 1 && text.page1.title}
            {page === 2 && text.page2.title}
            {page === 3 && text.page3.title}
          </h1>

          {/* Description */}
          <p className={`welcome-description desc${page}`}>
            {page === 1 && text.page1.desc}
            {page === 2 && text.page2.desc}
            {page === 3 && text.page3.desc}
          </p>

          {/* Button */}
          <button
            className={
              page === 1
                ? "next-button btn1"
                : page === 2
                  ? "next-button btn2"
                  : "next-button btn3"
            }
            onClick={handleNext}
          >
            <span>{page === 1 ? text.button1 : text.button2}</span>
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Fixed Dots */}
      <div className="welcome-dots">
        <span className={page === 1 ? "dot active" : "dot"}></span>
        <span className={page === 2 ? "dot active" : "dot"}></span>
        <span className={page === 3 ? "dot active" : "dot"}></span>
        <span className="dot"></span>
      </div>
    </div>
  );
};

export default Welcome;
