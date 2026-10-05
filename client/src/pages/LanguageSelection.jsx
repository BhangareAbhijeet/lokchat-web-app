import React, { useState } from "react";
import "../styles/LanguageSelection.css";
import { useNavigate } from "react-router-dom";

const languages = [
  { name: "English", native: "English" },
  { name: "हिंदी", native: "Hindi" },
  { name: "தமிழ்", native: "Tamil" },
  { name: "తెలుగు", native: "Telugu" },
  { name: "বাংলা", native: "Bengali" },
  { name: "मराठी", native: "Marathi" },
  { name: "ಕನ್ನಡ", native: "Kannada" },
  { name: "ਪੰਜਾਬੀ", native: "Punjabi" },
  { name: "ગુજરાતી", native: "Gujarati" },
];

function LanguageSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("English");

  return (
    <div className="language-page">
      <div className="language-container">
        <div className="heading">
          <div className="icon">🌐</div>
          <h1>Select Language</h1>
        </div>
        <div className="language-list">
          {languages.map((lang) => (
            <div
              key={lang.name}
              className={`language-item ${
                selected === lang.name ? "language-active" : ""
              }`}
              onClick={() => setSelected(lang.name)}
            >
              <span>
                {lang.name}
                {selected === lang.name && <span className="tick">✔</span>}
              </span>
            </div>
          ))}
        </div>

        <button
          className="next-btn"
          onClick={() => {
            localStorage.setItem("language", selected);
            navigate("/Welcome");
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
export default LanguageSelection;
