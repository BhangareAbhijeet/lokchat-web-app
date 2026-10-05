let peerConnection = null;
let localStream = null;
let pendingCandidates = [];

const config = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

// ---------------------------------------------------------------------------
// Peer Connection
// ---------------------------------------------------------------------------

/**
 * Create WebRTC Peer Connection
 * @param {Function} onIceCandidate - Callback when ICE candidate is discovered
 * @param {Function} onConnectionStateChange - Callback for connection state changes
 */
export const createPeerConnection = (
  onIceCandidate,
  onConnectionStateChange,
) => {
  peerConnection = new RTCPeerConnection(config);

  console.log("✅ WebRTC Peer Connection Created");

  peerConnection.onicecandidate = (event) => {
    if (event.candidate && onIceCandidate) {
      onIceCandidate(event.candidate);
    }
  };

  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection.connectionState;
    console.log("WebRTC Connection State:", state);

    if (onConnectionStateChange) {
      onConnectionStateChange(state);
    }
  };

  // NOTE: Do NOT flush pending candidates here. The remote description
  // (offer/answer) must be set first, or addIceCandidate will fail.
  // Candidates are flushed after setRemoteDescription succeeds.

  return peerConnection;
};

// Alias — shorter name
export const createPeer = () => {
  if (!peerConnection) {
    return createPeerConnection();
  }
  return peerConnection;
};

// Get existing peer connection
export const getPeerConnection = () => {
  return peerConnection;
};

// Alias
export const getPeer = () => {
  return peerConnection;
};

/**
 * Flush any ICE candidates that arrived before remote description was set.
 * Must only be called AFTER setRemoteDescription has succeeded.
 */
const flushPendingCandidates = () => {
  if (!peerConnection || pendingCandidates.length === 0) return;

  console.log(`Flushing ${pendingCandidates.length} queued ICE candidate(s)`);

  pendingCandidates.forEach((candidate) => {
    peerConnection
      .addIceCandidate(new RTCIceCandidate(candidate))
      .then(() => console.log("Queued ICE Candidate added"))
      .catch((err) => console.error("Error adding queued ICE:", err));
  });

  pendingCandidates = [];
};

// ---------------------------------------------------------------------------
// Local Media
// ---------------------------------------------------------------------------

/**
 * Get Camera + Microphone (video call)
 */
export const getLocalStream = async () => {
  if (localStream) {
    return localStream;
  }

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    console.log("🎥 Camera and microphone access granted");

    return localStream;
  } catch (error) {
    console.error("Error accessing camera or microphone:", error);
    throw error;
  }
};

/**
 * Get Microphone only (audio-only calls)
 */
export const getAudioOnlyStream = async () => {
  if (localStream) {
    return localStream;
  }

  try {
    console.log("🎤 Requesting microphone permission...");

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    console.log("✅ Microphone Ready");
    console.log(localStream.getAudioTracks());

    return localStream;
  } catch (err) {
    console.error("❌ Audio Permission Error:", err);
    throw err;
  }
};

/**
 * Get existing local stream (without requesting a new one)
 */
export const getLocalStreamObject = () => {
  return localStream;
};

/**
 * Set existing local stream
 */
export const setLocalStream = (stream) => {
  localStream = stream;
};

export const addLocalStreamToPeer = (stream) => {
  if (!peerConnection) {
    console.error("Peer connection not created");
    return;
  }

  stream.getTracks().forEach((track) => {
    console.log("Track Settings:", track.getSettings());
    peerConnection.addTrack(track, stream);
  });

  console.log("Local stream added to peer connection");
};

/**
 * Receive remote video/audio stream
 */
export const setupRemoteStream = (onRemoteStream) => {
  if (!peerConnection) {
    console.error("Peer connection not created");
    return;
  }

  peerConnection.ontrack = (event) => {
    const [remoteStream] = event.streams;

    const track = remoteStream.getVideoTracks()[0];

    if (track) {
      console.log("Remote Track Settings:", track.getSettings());
    }

    onRemoteStream(remoteStream);
  };
};

// ---------------------------------------------------------------------------
// Offer / Answer / ICE
// ---------------------------------------------------------------------------

export const createOffer = async () => {
  if (!peerConnection) {
    console.error("Peer connection not created");
    return null;
  }

  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    console.log("WebRTC Offer Created");

    return offer;
  } catch (error) {
    console.error("Error creating offer:", error);
    return null;
  }
};

export const createAnswer = async (offer) => {
  if (!peerConnection) {
    console.error("Peer connection not created");
    return null;
  }

  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Remote description is set now — safe to flush pending candidates
    flushPendingCandidates();

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.log("WebRTC Answer Created");

    return answer;
  } catch (error) {
    console.error("Error creating answer:", error);
    return null;
  }
};

export const setRemoteAnswer = async (answer) => {
  if (!peerConnection) {
    console.error("Peer connection not created");
    return;
  }

  try {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer),
    );

    // Remote description is set now — safe to flush pending candidates
    flushPendingCandidates();

    console.log("Remote answer set successfully");
  } catch (error) {
    console.error("Error setting remote answer:", error);
  }
};

export const addIceCandidate = async (candidate) => {
  // Queue candidate if:
  // 1. Peer connection doesn't exist yet, OR
  // 2. Remote description hasn't been set yet
  if (!peerConnection || !peerConnection.remoteDescription) {
    console.log("Remote description not ready. Queueing ICE candidate...");
    pendingCandidates.push(candidate);
    return;
  }

  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    console.log("ICE Candidate added successfully");
  } catch (error) {
    console.error("Error adding ICE Candidate:", error);
  }
};

// ---------------------------------------------------------------------------
// Track Controls
// ---------------------------------------------------------------------------

export const toggleMicrophone = () => {
  const stream = getLocalStreamObject();

  if (!stream) return false;

  const audioTrack = stream.getAudioTracks()[0];

  if (!audioTrack) return false;

  audioTrack.enabled = !audioTrack.enabled;

  return audioTrack.enabled;
};

// Alias — simpler name, same behavior
export const muteAudio = () => {
  return toggleMicrophone();
};

export const toggleCamera = () => {
  const stream = getLocalStreamObject();

  if (!stream) return false;

  const videoTrack = stream.getVideoTracks()[0];

  if (!videoTrack) return false;

  videoTrack.enabled = !videoTrack.enabled;

  return videoTrack.enabled;
};

export const switchCamera = async () => {
  const stream = getLocalStreamObject();

  if (!stream) return;

  const videoTrack = stream.getVideoTracks()[0];

  if (!videoTrack) return;

  const currentFacingMode = videoTrack.getSettings().facingMode;
  const newFacingMode = currentFacingMode === "user" ? "environment" : "user";

  const newStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: newFacingMode },
    audio: false,
  });

  const newVideoTrack = newStream.getVideoTracks()[0];

  const pc = getPeerConnection();

  if (pc) {
    const sender = pc
      .getSenders()
      .find((s) => s.track && s.track.kind === "video");

    if (sender) {
      await sender.replaceTrack(newVideoTrack);
    }
  }

  videoTrack.stop();
  stream.removeTrack(videoTrack);
  stream.addTrack(newVideoTrack);

  return stream;
};

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export const cleanupCall = () => {
  // Stop camera and microphone
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  // Close PeerConnection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // Reset state
  pendingCandidates = [];

  console.log("❌ WebRTC cleanup completed");
};

// Alias — matches simpler naming convention
export const closePeer = () => {
  cleanupCall();
};
