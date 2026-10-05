import { createContext, useContext, useEffect, useState } from "react";
import socket from "../services/socket";

const CallContext = createContext(null);

// Same avatar palette as ContactsSidebar
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
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

export function CallProvider({ children, currentUserId }) {
  const [status, setStatus] = useState("idle");
  const [otherUser, setOtherUser] = useState(null);
  const [isCaller, setIsCaller] = useState(false);

  // ==========================================
  // REGISTER USER + CALL LISTENERS
  // ==========================================

  useEffect(() => {
    if (!currentUserId) return;

    const registerUser = () => {
      console.log("📡 Registering user:", currentUserId);
      socket.emit("register-user", currentUserId);
    };

    if (socket.connected) {
      registerUser();
    }

    socket.on("connect", registerUser);

    // ==========================================
    // INCOMING CALL
    // ==========================================

    const handleIncoming = (data) => {
      const colors = getAvatarStyle(data.callerName || data.from);

      setOtherUser({
        id: data.from,
        name: data.fromName || data.from,
        photo: data.fromPhoto || null,
        avatarColor: colors.avatarColor,
        textColor: colors.textColor,
        initials: getInitials(data.callerName || data.from),
      });

      setIsCaller(false);
      setStatus("incoming");
    };

    // ==========================================
    // CALL ACCEPTED
    // ==========================================
    const handleAccepted = (data) => {
      console.log("Accepted data:", data);
      const colors = getAvatarStyle(data.fromName || data.from);

      setOtherUser({
        id: data.from,
        name: data.fromName || data.from,
        photo: data.fromPhoto || null,
        avatarColor: colors.avatarColor,
        textColor: colors.textColor,
        initials: getInitials(data.fromName || data.from),
      });

      setIsCaller(true);
      setStatus("connected");
    };

    // ==========================================
    // CALL DECLINED
    // ==========================================

    const handleDeclined = () => {
      console.log("❌ CALL DECLINED");
      setStatus("ended");
    };

    // ==========================================
    // CALL ENDED
    // ==========================================

    const handleEnded = () => {
      console.log("📴 CALL ENDED");
      setStatus("ended");
    };

    socket.on("incoming-call", handleIncoming);
    socket.on("call-accepted", handleAccepted);
    socket.on("call-declined", handleDeclined);
    socket.on("call-ended", handleEnded);

    return () => {
      socket.off("connect", registerUser);
      socket.off("incoming-call", handleIncoming);
      socket.off("call-accepted", handleAccepted);
      socket.off("call-declined", handleDeclined);
      socket.off("call-ended", handleEnded);
    };
  }, [currentUserId]);

  // ==========================================
  // START CALL
  // ==========================================

  const startCall = (targetUser) => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");

    const callerName =
      `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() ||
      currentUserId;

    const callerPhoto = currentUser?.profilePic?.url || null;

    console.log("📞 CALLING USER:", targetUser);

    const colors = getAvatarStyle(targetUser.name || "");

    setOtherUser({
      ...targetUser,
      photo: targetUser.photo || null,
      avatarColor: targetUser.avatarColor || colors.avatarColor,
      textColor: targetUser.textColor || colors.textColor,
      initials: targetUser.initials || getInitials(targetUser.name || ""),
    });

    setIsCaller(true);
    setStatus("calling");

    socket.emit("call-user", {
      from: currentUserId,
      to: targetUser.id,
      fromName: callerName,
      fromPhoto: callerPhoto,
    });
  };

  // ==========================================
  // ACCEPT
  // ==========================================

  const acceptCall = () => {
    console.log("Before connected:", otherUser);
    if (!otherUser) return;

    socket.emit("accept-call", {
      from: currentUserId,
      to: otherUser.id,
    });

    setIsCaller(false);
    setStatus("connected");
  };

  // ==========================================
  // DECLINE
  // ==========================================

  const declineCall = () => {
    if (!otherUser) return;

    socket.emit("decline-call", {
      from: currentUserId,
      to: otherUser.id,
    });

    setStatus("ended");
  };

  // ==========================================
  // END
  // ==========================================

  const endCall = () => {
    if (!otherUser) return;

    socket.emit("end-call", {
      from: currentUserId,
      to: otherUser.id,
    });

    setStatus("ended");
  };

  // ==========================================
  // RESET
  // ==========================================

  const resetCall = () => {
    setStatus("idle");
    setOtherUser(null);
    setIsCaller(false);
  };

  return (
    <CallContext.Provider
      value={{
        status,
        otherUser,
        isCaller,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        resetCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => {
  const context = useContext(CallContext);

  if (!context) {
    throw new Error("useCall must be used inside CallProvider");
  }

  return context;
};
