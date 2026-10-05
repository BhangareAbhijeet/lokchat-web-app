import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/IncomingCall.css";
import socket from "../services/socket";
import bgDark from "../assets/bg-design-dark.png"; // adjust path as needed
import { FiPhone, FiVideo, FiMessageCircle } from "react-icons/fi";

const AVATAR_PALETTE = [
  { avatarColor: "#331c1c", textColor: "#f87171" },
  { avatarColor: "#1e2530", textColor: "#60a5fa" },
  { avatarColor: "#152233", textColor: "#38bdf8" },
  { avatarColor: "#2a1e33", textColor: "#c084fc" },
  { avatarColor: "#33231e", textColor: "#fb923c" },
];

function getAvatarStyle(name = "") {
  const index = name ? name.charCodeAt(0) % AVATAR_PALETTE.length : 0;
  return AVATAR_PALETTE[index];
}

function getInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);

  if (!parts.length) return "?";

  return (
    (parts[0][0] || "") +
    (parts[1]?.[0] || "")
  ).toUpperCase();
}

const IncomingCall = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const caller = location.state?.caller;
  const callerName = caller?.name || caller?.callerId || "Unknown User";
  const avatarStyle = getAvatarStyle(callerName);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (!caller) {
      navigate("/messages");
    }
  }, [caller, navigate]);

  // Listen for the caller hanging up before we accept/decline — without
  // this, cancelling a still-ringing call left this screen stuck forever
  // with no way to know the call was gone. Matches the caller's
  // "video-cancel-call" emit, which the backend re-broadcasts as
  // "video-call-cancelled".
  useEffect(() => {
    const handleCallCancelled = () => {
      console.log("Caller cancelled the call");
      navigate("/messages");
    };

    socket.on("video-call-cancelled", handleCallCancelled);

    return () => {
      socket.off("video-call-cancelled", handleCallCancelled);
    };
  }, [navigate]);

  const acceptCall = () => {
    if (!caller?.callerSocketId) {
      console.error("No caller info — cannot accept call");
      navigate("/messages");
      return;
    }

    socket.emit("video-answer-call", {
      callerSocketId: caller.callerSocketId,
      answererId: currentUserId,
    });

    navigate("/videocall", {
      state: {
        remoteUser: {
          id: caller.callerId,
          name: caller.name || caller.callerId,
          profile: caller.profile || "https://i.pravatar.cc/200?img=12",
        },
      },
    });
  };

  const declineCall = () => {
    if (caller?.callerSocketId) {
      // Let the caller know so THEY can log the "Call declined" message —
      // the caller has both userId (sender) and remoteId (receiver) ready.
      socket.emit("video-decline-call", {
        callerSocketId: caller.callerSocketId,
        declinerId: currentUserId,
      });
    }
    navigate("/messages");
  };

  const sendMessage = () => {
    alert("Open Chat");
  };

  if (!caller) {
    return null;
  }

  return (
    <div
      className="incomingPage"
      style={{
        backgroundImage: `url(${bgDark})`,
      }}
    >
      <div className="incomingOverlay"></div>

      <div className="callerInfo">
        {/* <img
          src={caller?.profile || "https://i.pravatar.cc/200?img=12"}
          alt="Profile"
          className="callerProfile"
        /> */}
        {caller?.profile ? (
          <img src={caller.profile} alt="Profile" className="callerProfile" />
        ) : (
          <div
            className="callerProfile avatarFallback"
            style={{
              background: avatarStyle.avatarColor,
              color: avatarStyle.textColor,
            }}
          >
            {getInitials(callerName)}
          </div>
        )}

        <h1>{caller?.name || caller?.callerId || "Unknown User"}</h1>
        <p className="callerNumber">Incoming Video Call</p>

        <div className="callType">
          <FiVideo />
          <span>Incoming Video Call</span>
        </div>

        <p className="videoText">Turn off your video</p>
      </div>

      <div className="bottomActions">
        <div className="action" onClick={declineCall}>
          <div className="circle red">
            <FiPhone style={{ transform: "rotate(135deg)" }} />
          </div>
          <span>Decline</span>
        </div>

        <div className="action" onClick={acceptCall}>
          <div className="circle green">
            <FiPhone />
          </div>
          <span>Accept</span>
        </div>

        <div className="action" onClick={sendMessage}>
          <div className="circle blue">
            <FiMessageCircle />
          </div>
          <span>Message</span>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;
