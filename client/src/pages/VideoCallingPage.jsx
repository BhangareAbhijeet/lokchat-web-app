import React, { useEffect, useRef, useState } from "react";

import "../styles/VideoCallingPage.css";
import socket from "../services/socket";
import { useNavigate, useLocation } from "react-router-dom";
import {
  createPeerConnection,
  addLocalStreamToPeer,
  createOffer,
  createAnswer,
  setRemoteAnswer,
  addIceCandidate,
  setupRemoteStream,
  cleanupCall,
  getLocalStream,
  getLocalStreamObject,
  setLocalStream,
  switchCamera,
} from "../services/webrtc";

import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiRefreshCw,
  FiPhone,
  FiPhoneOff,
} from "react-icons/fi";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";

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

  return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

// Friendly WhatsApp-style duration text, e.g. "45 sec", "1 min", "2 min 5 sec"
const toFriendlyDuration = (totalSeconds) => {
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`;
};

// Live on-screen timer format, e.g. "01:23"
const formatCallDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const VideoCallingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { targetUserId, targetUserName, targetProfile, remoteUser } =
    location.state || {};

  // Reused for both caller (has targetUserId) and receiver (has remoteUser).
  // Only the caller logs the call-outcome bubble — otherwise both sides
  // would each create their own message and you'd get two bubbles per call.
  const isCaller = Boolean(targetUserId);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const userId = currentUser?._id || currentUser?.id;
  const remoteId = targetUserId || remoteUser?.id;
  const profileImage = targetProfile || remoteUser?.profile;

  const remoteName = targetUserName || remoteUser?.name || "Unknown User";
  const avatarStyle = getAvatarStyle(remoteName);

  const goToChat = () => {
    navigate("/messages", {
      state: {
        selectedContact: {
          id: remoteId,
          name: remoteName,
          photo: profileImage,
        },
      },
    });
  };

  console.log("Target User ID:", remoteId);
  console.log("Current User ID:", userId);
  console.log("isCaller:", isCaller);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const targetSocketIdRef = useRef(null);

  // Guards against double-logging the same call outcome
  const callLoggedRef = useRef(false);
  // Set the moment the call actually connects — used both for the live
  // timer AND to compute the final duration when the call ends.
  const callStartTimeRef = useRef(null);

  const [localStream, setLocalStreamState] = useState(null);
  const [mute, setMute] = useState(false);
  const [camera, setCamera] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [isSelfFullscreen, setIsSelfFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleTheme = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleTheme);
    return () => mediaQuery.removeEventListener("change", handleTheme);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    if (!callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (callStartTimeRef.current) {
        setCallDuration(
          Math.floor((Date.now() - callStartTimeRef.current) / 1000),
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    startCamera();
  }, []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Logs a "video-call" type message in chat (renders as a call bubble,
  // like WhatsApp's "No answer" / "Declined" bubble). Only the caller logs
  // this — receiver never opened/answered in these cases, so only the
  // caller side has a meaningful outcome to record.
  const logCallStatus = (text) => {
    if (!isCaller) return;
    if (callLoggedRef.current) return;
    if (!userId || !remoteId) return;
    callLoggedRef.current = true;

    socket.emit("sendMessage", {
      senderId: userId,
      receiverId: remoteId,
      text,
      type: "video-call",
    });
  };

  const logFinalCallOutcome = (fallbackText) => {
    if (callStartTimeRef.current) {
      const seconds = Math.floor(
        (Date.now() - callStartTimeRef.current) / 1000,
      );
      logCallStatus(toFriendlyDuration(seconds));
    } else {
      logCallStatus(fallbackText);
    }
  };

  useEffect(() => {
    const handleCallAccepted = async (data) => {
      try {
        console.log("Call accepted by:", data.answererId);
        setIsConnected(true);
        console.log("Answerer Socket ID:", data.answererSocketId);

        const targetSocketId = data.answererSocketId;
        targetSocketIdRef.current = targetSocketId;

        const stream = getLocalStreamObject();
        if (!stream) {
          console.error("Local stream not available");
          return;
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        createPeerConnection(
          (candidate) => {
            socket.emit("video-webrtc-candidate", {
              targetSocketId: targetSocketId,
              candidate: candidate,
            });
          },
          (connectionState) => {
            console.log("Caller Connection State:", connectionState);
            if (connectionState === "connected") setIsConnected(true);
            if (
              connectionState === "disconnected" ||
              connectionState === "failed" ||
              connectionState === "closed"
            ) {
              setIsConnected(false);
            }
          },
        );

        setupRemoteStream((remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });

        addLocalStreamToPeer(stream);

        const offer = await createOffer();
        socket.emit("video-webrtc-offer", {
          targetSocketId: targetSocketId,
          offer: offer,
        });
      } catch (error) {
        console.error("Error starting WebRTC call:", error);
      }
    };

    const handleWebrtcOffer = async (data) => {
      try {
        const callerSocketId = data.callerSocketId;
        targetSocketIdRef.current = callerSocketId;

        let stream = getLocalStreamObject();
        if (!stream) {
          stream = await getLocalStream();
        }

        setLocalStream(stream);
        setLocalStreamState(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        createPeerConnection(
          (candidate) => {
            socket.emit("video-webrtc-candidate", {
              targetSocketId: callerSocketId,
              candidate: candidate,
            });
          },
          (connectionState) => {
            console.log("Receiver Connection State:", connectionState);
            if (connectionState === "connected") setIsConnected(true);
            if (
              connectionState === "disconnected" ||
              connectionState === "failed" ||
              connectionState === "closed"
            ) {
              setIsConnected(false);
            }
          },
        );

        setupRemoteStream((remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });

        addLocalStreamToPeer(stream);

        const answer = await createAnswer(data.offer);
        socket.emit("video-webrtc-answer", {
          targetSocketId: callerSocketId,
          answer: answer,
        });
      } catch (error) {
        console.error("Error while answering WebRTC Offer:", error);
      }
    };

    const handleWebrtcAnswer = async (data) => {
      try {
        await setRemoteAnswer(data.answer);
      } catch (error) {
        console.error("Error while setting remote answer:", error);
      }
    };

    const handleWebrtcCandidate = async (data) => {
      try {
        await addIceCandidate(data.candidate);
      } catch (error) {
        console.error("Error handling ICE Candidate:", error);
      }
    };

    // Target user isn't registered for video calls (offline / never opened the app)
    const handleUserNotAvailable = (data) => {
      console.log("Target user not available for video call:", data);
      logFinalCallOutcome("No answer");
      cleanupCall();
      goToChat();
    };

    // Callee explicitly hit Decline
    const handleCallDeclined = (data) => {
      console.log("Call declined by:", data.declinerId);
      logFinalCallOutcome("Call declined");
      cleanupCall();
      goToChat();
    };

    // Caller-side listener for "video-call-cancelled" — emitted by the
    // backend's video-cancel-call handler.
    const handleCallCancelled = () => {
      console.log("Call was cancelled");
      logFinalCallOutcome("Call declined");
      cleanupCall();
      goToChat();
    };

    const handleCallEnded = () => {
      setIsConnected(false);
      console.log("Other user ended the call");

      logFinalCallOutcome("No answer");

      cleanupCall();

      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

      setLocalStreamState(null);
      setMute(false);
      setCamera(true);
      goToChat();
    };

    socket.on("video-call-accepted", handleCallAccepted);
    socket.on("video-webrtc-offer", handleWebrtcOffer);
    socket.on("video-webrtc-answer", handleWebrtcAnswer);
    socket.on("video-webrtc-candidate", handleWebrtcCandidate);
    socket.on("video-user-not-available", handleUserNotAvailable);
    socket.on("video-call-declined", handleCallDeclined);
    socket.on("video-call-cancelled", handleCallCancelled);
    socket.on("video-call-ended", handleCallEnded);

    return () => {
      socket.off("video-call-accepted", handleCallAccepted);
      socket.off("video-webrtc-offer", handleWebrtcOffer);
      socket.off("video-webrtc-answer", handleWebrtcAnswer);
      socket.off("video-webrtc-candidate", handleWebrtcCandidate);
      socket.off("video-user-not-available", handleUserNotAvailable);
      socket.off("video-call-declined", handleCallDeclined);
      socket.off("video-call-cancelled", handleCallCancelled);
      socket.off("video-call-ended", handleCallEnded);
    };
  }, [userId, remoteId]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStreamState(stream);
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleToggleMicrophone = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMute(!audioTrack.enabled);
  };

  const handleToggleCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCamera(videoTrack.enabled);
  };

  const handleSwitchCamera = async () => {
    try {
      await switchCamera();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = getLocalStreamObject();
      }
    } catch (error) {
      console.error("Failed to switch camera:", error);
    }
  };

  const handleCall = () => {
    if (!remoteId) {
      console.error("No target user to call");
      return;
    }
    // Original payload shape (kept for reference):
    // socket.emit("video-call-user", {
    //   targetUserId: remoteId,
    //   callerId: userId,
    //   name: currentUser
    //     ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
    //     : "",
    //   profile: currentUser?.profilePic?.url || "",
    // });
    socket.emit("video-call-user", {
      targetUserId: remoteId,
      caller: currentUser,
    });
    console.log("Calling:", remoteId);
  };

  const handleEndCall = () => {
    logFinalCallOutcome("No answer");

    // Diagnostic log: confirms this branch is actually being reached
    // and shows exactly what values it's deciding with — compare this
    // against the backend's "📥 video-cancel-call received" log to see
    // whether the emit is leaving the browser at all.
    console.log("handleEndCall fired.", {
      isCaller,
      remoteId,
      targetSocketIdRefCurrent: targetSocketIdRef.current,
    });

    if (targetSocketIdRef.current) {
      console.log("Emitting video-end-call to", targetSocketIdRef.current);
      socket.emit("video-end-call", {
        targetSocketId: targetSocketIdRef.current,
      });
    } else if (isCaller && remoteId) {
      console.log("Emitting video-cancel-call for targetUserId", remoteId);
      socket.emit("video-cancel-call", { targetUserId: remoteId });
    } else {
      console.log(
        "⚠️ handleEndCall: neither branch matched — nothing was emitted.",
      );
    }

    cleanupCall();

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setLocalStreamState(null);
    setMute(false);
    setCamera(true);

    goToChat();
  };

  return (
    <div className={`videoPage ${isDarkMode ? "dark" : "light"}`}>
      <div className={`remoteVideo ${isSelfFullscreen ? "smallRemote" : ""}`}>
        <video
          ref={remoteVideoRef}
          className="remoteCamera"
          autoPlay
          playsInline
        />
        <div className="overlay"></div>
        {isSelfFullscreen && (
          <button
            className="fullscreenBtn"
            onClick={() => setIsSelfFullscreen(false)}
          >
            <FiMinimize2 />
          </button>
        )}
      </div>

      <div className="userDetails">
        {profileImage ? (
          <img src={profileImage} alt="profile" className="profile" />
        ) : (
          <div
            className="profile avatarFallback"
            style={{
              background: avatarStyle.avatarColor,
              color: avatarStyle.textColor,
            }}
          >
            {getInitials(remoteName)}
          </div>
        )}
        <div>
          <h2>{remoteName}</h2>
          <span className={online ? "status online" : "status offline"}>
            {isConnected ? (
              <>
                🟢 Connected •{" "}
                <span className="call-timer">
                  {formatCallDuration(callDuration)}
                </span>
              </>
            ) : (
              "📶 Ringing..."
            )}
          </span>
        </div>
      </div>

      <div className={`selfCamera ${isSelfFullscreen ? "fullscreenSelf" : ""}`}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`selfVideo ${camera ? "" : "hidden"}`}
        />
        {!isSelfFullscreen && (
          <button
            className="fullscreenBtn"
            onClick={() => setIsSelfFullscreen(true)}
          >
            <FiMaximize2 />
          </button>
        )}
        {!camera && (
          <div className="cameraOff">
            <FiVideoOff size={40} />
          </div>
        )}
      </div>

      <div className="controls">
        <button onClick={handleToggleMicrophone}>
          {mute ? <FiMicOff /> : <FiMic />}
        </button>
        <button onClick={handleToggleCamera}>
          {camera ? <FiVideo /> : <FiVideoOff />}
        </button>

        <button onClick={handleEndCall} className="endBtn">
          <FiPhone style={{ transform: "rotate(135deg)" }} />
        </button>
      </div>
    </div>
  );
};

export default VideoCallingPage;
