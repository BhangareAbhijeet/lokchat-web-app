
import React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import "./App.css";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import LanguageSelection from "./pages/LanguageSelection";
import SelectionPage from "./pages/SelectionPage";
import MainLayout from "./components/MainLayout";
import ChatPage from "./pages/ChatPage";
import Contacts from "./pages/Contacts";
import Calls from "./pages/Calls";
import Profile from "./pages/Profile";
import ContactInfo from "./pages/ContactInfo";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import CreateNewPassword from "./pages/CreateNewPassword";
import ResetPassword from "./pages/ResetPassword";
import VideoCallingPage from "./pages/VideoCallingPage";
import VoiceCallPage from "./pages/VoiceCallPage";
import CallScreen from "./components/CallScreen";

import {
  CallProvider,
  useCall,
} from "./context/CallContext";


// =====================================================
// GET LOGGED-IN USER
// =====================================================

function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    return null;
  }
}


// =====================================================
// APP CONTENT
// =====================================================

function AppContent() {
  const navigate = useNavigate();
  const {
    status,
    otherUser,
    isCaller,
    acceptCall,
    declineCall,
    endCall,
    resetCall,
  } = useCall();
  

  const currentUser = getCurrentUser();
 

  const currentUserId =
    currentUser?._id ||
    currentUser?.id;
    useEffect(() => {
      if (status !== "connected" || !otherUser || !currentUserId) {
        return;
      }

      navigate(`/voice-call?user=${currentUserId}&target=${otherUser.id}`, {
        replace: true,
        state: {
          targetUser: otherUser,
        },
      });
    }, [status, otherUser, currentUserId, navigate]);


  return (
    <>
      <Routes>
        {/* ============================================
            Pages WITHOUT Sidebar
        ============================================ */}

        <Route path="/" element={<LanguageSelection />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/welcome" element={<Welcome />} />

        <Route path="/selectionpage" element={<SelectionPage />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/verify-otp" element={<VerifyOTP />} />

        <Route path="/create-new-password" element={<CreateNewPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ============================================
            Pages WITH Sidebar
        ============================================ */}

        <Route element={<MainLayout />}>
          <Route path="/messages" element={<ChatPage />} />

          <Route path="/contacts" element={<Contacts />} />

          <Route path="/calls" element={<Calls />} />

          <Route path="/profile" element={<Profile />} />

          <Route path="/contactinfo/:id" element={<ContactInfo />} />

          <Route path="/video-call" element={<VideoCallingPage />} />
          <Route path="/voice-call" element={<VoiceCallPage />} />
        </Route>
      </Routes>

      {/* =================================================
          GLOBAL CALL SCREEN

          This is OUTSIDE Routes so it can appear
          on ANY page.
      ================================================= */}
      {status !== "idle" && status !== "connected" && otherUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
          }}
        >
          <CallScreen
            user={currentUserId}
            status={status}
            otherUser={otherUser}
            isCaller={isCaller}
            acceptCall={acceptCall}
            declineCall={declineCall}
            endCall={endCall}
            resetCall={resetCall}
          />
        </div>
      )}
    </>
  );
}


// =====================================================
// APP
// =====================================================

function App() {
  const currentUser = getCurrentUser();

  const currentUserId =
    currentUser?._id ||
    currentUser?.id;


  return (
    <BrowserRouter>

      <CallProvider
        currentUserId={currentUserId}
      >

        <AppContent />

      </CallProvider>

    </BrowserRouter>
  );
}

export default App;
