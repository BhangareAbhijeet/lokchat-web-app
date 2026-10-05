import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import socket from "../services/socket";   // ✅ correct
import CallScreen from "./CallScreen";

const AUTH_USER_KEY = "user";

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
  } catch {
    return null;
  }
};

function Home() {
  const location = useLocation();

  const currentUser = getCurrentUser();
  const userId = currentUser?._id || currentUser?.id;

  // ✅ Who we're calling — passed in from ChatPage (or wherever the call was started)
  const targetUser = location.state?.targetUser; // { id, name, photo }

  const [registered, setRegistered] = useState(false);

  // Socket connection check
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  // Register the logged-in user on the socket server
  useEffect(() => {
    if (!userId) return;

    socket.emit("register-user", userId);
    setRegistered(true);

    console.log("User Registered:", userId);
  }, [userId]);

  if (!userId) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Please log in first.</h2>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div style={{ padding: 20 }}>
        <h2>No contact selected to call.</h2>
        <p>Go back to your chats and tap the call icon on a contact.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Voice Call App</h1>

      {registered && (
        <div>
          <h2>Welcome {currentUser?.firstName || userId}</h2>
          <p>You are online</p>

          <CallScreen user={userId} targetUser={targetUser} />
        </div>
      )}
    </div>
  );
}

export default Home;
