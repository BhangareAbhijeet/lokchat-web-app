import { io } from "socket.io-client";

export const SOCKET_URL = "https://anteater-tattle-parted.ngrok-free.dev";

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  withCredentials: true,
  autoConnect: true, // ✅ CHANGED
  extraHeaders: {
    "ngrok-skip-browser-warning": "true",
  },
});

socket.on("connect", () => {
  console.log("✅ SOCKET CONNECTED:", socket.id);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const userId = currentUser?._id || currentUser?.id;

  if (userId) {
    socket.emit("register-user", userId);
    socket.emit("video-register-user", userId); // ✅ NEW
    socket.emit("addUser", userId);
    console.log("✅ User registered (voice + video)");
  }
});

socket.on("connect_error", (error) => {
  console.error("❌ SOCKET CONNECTION ERROR:", error);
});

socket.on("disconnect", (reason) => {
  console.log("🔌 SOCKET DISCONNECTED:", reason);
});

export default socket;
