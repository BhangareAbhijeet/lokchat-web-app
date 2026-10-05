import { useEffect, useRef, useState } from "react";
import { useCall } from "../context/CallContext"; // adjust path if CallScreen.jsx isn't inside components/
import VoiceCall from "./VoiceCall";
import "../styles/CallScreen.css";
import avatar from "../assets/avatar.jpg";

import { Phone, MessageSquare, Mic, MicOff, Volume2 } from "lucide-react";

const getInitials = (name = "") => {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

function CallScreen({ user }) {
  const {
    status,
    otherUser,
    isCaller,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    resetCall,
  } = useCall();

  const [micMuted, setMicMuted] = useState(false);

  // 📞 Outgoing Ringing
  const ringtone = useRef(new Audio("/sounds/ringing.mp3"));

  // 📲 Incoming Ringtone
  const incomingRingtone = useRef(new Audio("/sounds/ringtone.mp3"));

  // 📞 Outgoing Ring
  useEffect(() => {
    if (status === "calling") {
      ringtone.current.loop = true;
      ringtone.current.play().catch(() => {});
    } else {
      ringtone.current.pause();
      ringtone.current.currentTime = 0;
    }
  }, [status]);

  // 📲 Incoming Ring
  useEffect(() => {
    if (status === "incoming") {
      incomingRingtone.current.loop = true;
      incomingRingtone.current.play().catch((err) => {
        console.log("Incoming ringtone error:", err);
      });
    } else {
      incomingRingtone.current.pause();
      incomingRingtone.current.currentTime = 0;
    }
  }, [status]);

  // Stop all sounds on unmount
  useEffect(() => {
    return () => {
      ringtone.current.pause();
      ringtone.current.currentTime = 0;
      incomingRingtone.current.pause();
      incomingRingtone.current.currentTime = 0;
    };
  }, []);

  // If there's no active call and nothing to show, render nothing.
  // (Adjust this if you want an always-visible "idle" call button somewhere else.)
  if (status === "idle") {
    return null;
  }
  console.log("CallScreen otherUser:", otherUser);

  return (
    <div className="call-container">
      {/* Calling */}
      {status === "calling" && otherUser && (
        <div className="call-ui">
          <div
            className="call-bg"
            style={{
              backgroundImage: `url(${otherUser.photo || avatar})`,
            }}
          ></div>

          <div className="call-overlay">
            <h2 className="calling-user-name">
              {otherUser.name || otherUser.id}
            </h2>

            <p className="calling-text">Calling...</p>

            {otherUser.photo ? (
              <img
                src={otherUser.photo}
                alt={otherUser.name}
                className="caller-avatar"
              />
            ) : (
              <div
                className="caller-avatar"
                style={{
                  background: otherUser.avatarColor,
                  color: otherUser.textColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "58px",
                  fontWeight: "700",
                }}
              >
                {getInitials(otherUser.name)}
              </div>
            )}

            <div className="calling-actions">
              <button
                className="control-btn"
                onClick={() => setMicMuted(!micMuted)}
              >
                {micMuted ? (
                  <MicOff size={24} color="white" />
                ) : (
                  <Mic size={24} color="white" />
                )}
              </button>

              <button className="end-call-btn" onClick={endCall}>
                <Phone size={28} color="white" />
              </button>

              <button className="control-btn">
                <Volume2 size={24} color="white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming */}
      {status === "incoming" && otherUser && (
        <div
          className="incoming-ui"
          style={{
            backgroundImage: otherUser.photo
              ? `url(${otherUser.photo})`
              : "none",
            backgroundSize: "115%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="incoming-overlay">
            <h2 className="incoming-user-name">
              {otherUser.name || otherUser.id}
            </h2>
            {otherUser.photo ? (
              <img
                src={otherUser.photo}
                alt={otherUser.name}
                className="incoming-user-avatar"
              />
            ) : (
              <div
                className="incoming-user-avatar"
                style={{
                  background: otherUser.avatarColor,
                  color: otherUser.textColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "58px",
                  fontWeight: "700",
                }}
              >
                {getInitials(otherUser.name)}
              </div>
            )}

            <div className="incoming-actions">
              <div className="action-item">
                <button className="incoming-decline-btn" onClick={declineCall}>
                  <Phone size={30} color="white" />
                </button>
                <span>Decline</span>
              </div>

              <div className="action-item">
                <button className="incoming-accept-btn" onClick={acceptCall}>
                  <Phone size={30} color="white" />
                </button>
                <span>Swipe up to accept</span>
              </div>

              <div className="action-item">
                <button className="incoming-message-btn">
                  <MessageSquare size={30} color="white" />
                </button>
                <span>Message</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected */}
      {status === "connected" && otherUser && (
        <div className="voicecall-wrapper">
          <VoiceCall
            user={user}
            receiver={otherUser.id}
            receiverName={otherUser.name}
            receiverPhoto={otherUser.photo}
            receiverAvatarColor={otherUser.avatarColor}
            receiverTextColor={otherUser.textColor}
            receiverInitials={getInitials(otherUser.name)}
            isCaller={isCaller}
            onEnd={endCall}
          />
        </div>
      )}

      {/* Ended */}
      {status === "ended" && (
        <div className="call-screen">
          <img src={avatar} alt="Avatar" className="caller-avatar" />

          <h2>Call Ended</h2>

          <button className="call-btn" onClick={resetCall}>
            <Phone size={22} strokeWidth={2.5} />
            <span>Close</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default CallScreen;
