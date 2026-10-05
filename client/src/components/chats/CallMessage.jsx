import React from "react";
import { FiPhone, FiVideo, FiPhoneMissed } from "react-icons/fi";
import "../../styles/CallMessage.css";

const CallMessage = ({ message, onCallBack }) => {
  const isVoice = message.callType === "voice";
  const isMissed = message.callStatus === "missed";

  const getTitle = () => {
    if (isMissed) return `Missed ${isVoice ? "voice" : "video"} call`;
    return `${isVoice ? "Voice" : "Video"} call`;
  };

  const getSubtitle = () => {
    switch (message.callStatus) {
      case "answered":
        return "Accepted";
      case "rejected":
        return "Declined";
      case "ended":
        return "Call ended";
      case "missed":
      default:
        return "Click to call back";
    }
  };

  return (
    <div className="call-message-card" onClick={onCallBack}>
      <div className={`call-icon ${isMissed ? "missed" : ""}`}>
        {isVoice ? isMissed ? <FiPhoneMissed /> : <FiPhone /> : <FiVideo />}
      </div>

      <div className="call-details">
        <h4>{getTitle()}</h4>
        <p>{getSubtitle()}</p>
      </div>

      <span className="call-time">
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
};

export default CallMessage;
