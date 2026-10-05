import { useEffect, useRef, useState } from "react";
import socket from "../services/socket";
import "../styles/VoiceCall.css";

import { Mic, MicOff, Phone, Volume2, VolumeX } from "lucide-react";

import avatar from "../assets/avatar.jpg";

import {
  createPeer,
  getPeer,
  getLocalStream,
  getAudioOnlyStream,
  closePeer,
  muteAudio,
} from "../services/webrtc";

function VoiceCall({
  user,
  receiver,
  receiverName,
  receiverPhoto,
  receiverAvatarColor,
  receiverTextColor,
  receiverInitials,
  onEnd,
  isCaller,
}) {
  const audioRef = useRef(null);
  const peerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const callStartedRef = useRef(false);

  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [transcripts, setTranscripts] = useState([]);
  const recognitionRef = useRef(null);

  console.log("VoiceCall Props:", {
    receiverName,
    receiverPhoto,
    receiverInitials,
    receiverAvatarColor,
    receiverTextColor,
  });

  // =====================================================
  // TIMER
  // =====================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let text = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }

      // ❌ setTranscript(text);  <-- delete/comment kar

      socket.emit("live-transcript", {
        from: user,
        to: receiver,
        text,
      });
    };

    recognition.onerror = (event) => {
      console.log("Speech Error:", event.error);
    };

    recognition.onend = () => {
      console.log("Speech Recognition Stopped");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  // =====================================================
  // CREATE PEER
  // =====================================================

  useEffect(() => {
    let peer = getPeer();

    if (!peer) {
      peer = createPeer();
    }

    peerRef.current = peer;

    // ===================================================
    // REMOTE AUDIO
    // ===================================================

    peer.ontrack = (event) => {
      console.log("🎵 Remote audio received");

      const remoteStream = event.streams[0];

      if (!remoteStream || !audioRef.current) {
        return;
      }

      audioRef.current.srcObject = remoteStream;

      audioRef.current
        .play()
        .then(() => {
          console.log("✅ Remote audio playing");
          if (recognitionRef.current) {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (err) {
                console.log("Recognition already running");
              }
            }
          }
        })
        .catch((err) => {
          console.log("Audio play error:", err);
        });
    };

    // ===================================================
    // ICE CANDIDATE
    // ===================================================

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;

      console.log("📤 Sending ICE candidate");

      socket.emit("ice-candidate", {
        from: user,
        to: receiver,
        candidate: event.candidate,
      });
    };

    // ===================================================
    // RECEIVE OFFER
    // ===================================================

    const handleOffer = async (data) => {
      if (peer.signalingState !== "stable") {
        console.log("Offer ignored:", peer.signalingState);
        return;
      }
      try {
        console.log("📩 Voice offer received from:", data.from);

        const stream = await getAudioOnlyStream();

        stream.getTracks().forEach((track) => {
          const alreadyAdded = peer
            .getSenders()
            .some((sender) => sender.track === track);

          if (!alreadyAdded) {
            peer.addTrack(track, stream);
          }
        });

        await peer.setRemoteDescription(new RTCSessionDescription(data.offer));

        // Flush any ICE candidates that arrived early
        for (const candidate of pendingCandidatesRef.current) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn("⚠️ Skipping stale ICE candidate:", err.message);
          }
        }
        pendingCandidatesRef.current = [];

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        // IMPORTANT:
        // Answer MUST be sent here
        socket.emit("webrtc-answer", {
          from: user,
          to: data.from,
          answer: peer.localDescription,
        });

        console.log("📤 Voice answer sent to:", data.from);
      } catch (error) {
        console.error("❌ Offer handling error:", error);
      }
    };

    // ===================================================
    // RECEIVE ANSWER
    // ===================================================

    const handleAnswer = async (data) => {
      try {
        console.log("📩 Voice answer received from:", data.from);

        if (
          !peer.currentRemoteDescription ||
          peer.currentRemoteDescription.type === ""
        ) {
          await peer.setRemoteDescription(
            new RTCSessionDescription(data.answer),
          );

          console.log("✅ Remote answer applied");

          // Flush any ICE candidates that arrived early
          for (const candidate of pendingCandidatesRef.current) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn("⚠️ Skipping stale ICE candidate:", err.message);
            }
          }
          pendingCandidatesRef.current = [];
        }
      } catch (error) {
        console.error("❌ Answer handling error:", error);
      }
    };

    // ===================================================
    // RECEIVE ICE
    // ===================================================

    const handleIceCandidate = async (data) => {
      try {
        if (!data.candidate) return;

        if (peer.remoteDescription && peer.remoteDescription.type) {
          await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log("✅ ICE candidate added");
        } else {
          pendingCandidatesRef.current.push(data.candidate);
          console.log("⏳ ICE candidate queued");
        }
      } catch (error) {
        console.error("❌ ICE candidate error:", error);
      }
    };

    // ===================================================
    // CALL ENDED
    // ===================================================

    const handleCallEnded = () => {
      console.log("📞 Other user ended the call");

      closePeer();
      pendingCandidatesRef.current = [];

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.srcObject = null;
      }

      if (onEnd) {
        onEnd();
      }
    };

    const handleLiveTranscript = (data) => {
      setTranscripts((prev) => [...prev, data.text]);
    };

    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);
    socket.on("live-transcript", handleLiveTranscript);
    return () => {
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      socket.off("live-transcript", handleLiveTranscript);
    };
  }, [user, receiver, onEnd]);

  // =====================================================
  // CALLER STARTS CALL
  // =====================================================

  useEffect(() => {
    if (!isCaller) return;
    if (callStartedRef.current) return;
    callStartedRef.current = true;

    startVoiceCall();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCaller]);

  const startVoiceCall = async () => {
    try {
      let peer = getPeer();

      if (!peer) {
        peer = createPeer();
      }

      peerRef.current = peer;

      const stream = await getAudioOnlyStream();

      stream.getTracks().forEach((track) => {
        const alreadyAdded = peer
          .getSenders()
          .some((sender) => sender.track === track);

        if (!alreadyAdded) {
          peer.addTrack(track, stream);
        }
      });

      const offer = await peer.createOffer();

      await peer.setLocalDescription(offer);

      socket.emit("webrtc-offer", {
        from: user,
        to: receiver,
        offer: peer.localDescription,
      });

      console.log("📤 Voice offer sent to:", receiver);
    } catch (error) {
      console.error("❌ Start voice call error:", error);
    }
  };

  // =====================================================
  // MUTE
  // =====================================================

  const handleMute = () => {
    const peer = peerRef.current;
    if (!peer) return;

    const audioSenders = peer
      .getSenders()
      .filter((sender) => sender.track && sender.track.kind === "audio");

    if (audioSenders.length === 0) return;

    const newEnabledState = !audioSenders[0].track.enabled;

    audioSenders.forEach((sender) => {
      sender.track.enabled = newEnabledState;
    });

    setMuted(!newEnabledState);
    console.log(
      newEnabledState ? "🎤 Unmuted" : "🔇 Muted",
      audioSenders.length,
      "track(s)",
    );
  };

  // =====================================================
  // SPEAKER
  // =====================================================

  const handleSpeaker = () => {
    const newState = !speakerOn;

    setSpeakerOn(newState);

    if (audioRef.current) {
      audioRef.current.muted = !newState;
    }
  };

  // =====================================================
  // END CALL
  // =====================================================

  const endCall = async () => {
    console.log("📞 Ending voice call");

    socket.emit("end-call", {
      from: user,
      to: receiver,
    });

    try {
      const stream = await getLocalStream();

      stream.getTracks().forEach((track) => {
        track.stop();
      });
    } catch (error) {
      console.log("Stream stop error:", error);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    closePeer();
    pendingCandidatesRef.current = [];

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }

    if (onEnd) {
      onEnd();
    }
  };

  return (
    <div
      className="voice-call"
      style={{
        "--call-bg": `url(${receiverPhoto || avatar})`,
      }}
    >
      <div className="overlay">
        <audio ref={audioRef} autoPlay playsInline />

        <div className="top-section">
          {receiverPhoto ? (
            <img src={receiverPhoto} className="avatar" alt="avatar" />
          ) : (
            <div
              className="avatar"
              style={{
                background: receiverAvatarColor,
                color: receiverTextColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "60px",
                fontWeight: "700",
              }}
            >
              {receiverInitials}
            </div>
          )}

          <h2>{receiverName || receiver}</h2>

          <p>Voice Call</p>

          <h3>
            {Math.floor(time / 60)}:
            {time % 60 < 10 ? "0" + (time % 60) : time % 60}
          </h3>
          <div className="live-transcript-box">
            {transcripts.map((msg, index) => (
              <div key={index} className="transcript-message">
                {msg}
              </div>
            ))}
          </div>
        </div>

        <div className="bottom-controls">
          <button className="icon-btn" onClick={handleMute}>
            {muted ? <MicOff /> : <Mic />}
          </button>

          <button className="icon-btn" onClick={handleSpeaker}>
            {speakerOn ? <Volume2 /> : <VolumeX />}
          </button>

          <button className="end-btn" onClick={endCall}>
            <Phone />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceCall;
