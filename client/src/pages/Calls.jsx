import React from "react";
import { FiSearch, FiBell, FiPhone, FiGlobe } from "react-icons/fi";

import "../styles/Calls.css";
import callImg from "../assets/no-calls-image.png";

const Calls = () => {
  return (
    <>
          <div className="calls-container">
        {/* Left Panel */}
        <div className="calls-sidebar">
          <div className="sidebar-header">
            <h2>Calls</h2>

            <div className="sidebar-icons">
              <FiSearch />
              <FiBell />
            </div>
          </div>

          <div className="sidebar-content">
            <img src={callImg} alt="No Calls" className="call-image" />

            <h3>You have no unread Messages</h3>

            <p>You're all caught up!</p>

            <button className="start-call-btn">
              <FiPhone />
              Start a Call
            </button>
          </div>
        </div>

        {/* Right Panel */}

        <div className="calls-main">
          <div className="translate-circle">
            <FiGlobe />
          </div>

          <h2>No active chat selected</h2>

          <p>
            Select any friend from your active roster to start translating,
            secure-calling, and chatting in real-time.
          </p>

          <button className="chat-btn">Chat Saniya Chendurkar</button>
        </div>
      </div>
    </>
  );
};

export default Calls;
