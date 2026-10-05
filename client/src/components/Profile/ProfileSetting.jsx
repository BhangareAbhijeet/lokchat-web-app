import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/api";
import api from "../../services/api";

import {
  FiMail,
  FiPhone,
  FiLock,
  FiBell,
  FiShield,
  FiSun,
  FiHelpCircle,
  FiLogOut,
  FiChevronRight,
  FiCheck,
} from "react-icons/fi";

import "../../styles/ProfileSetting.css";

const ProfileSetting = ({
  userData,
  setUserData,
  isEditingProfile,
  phone,
  setPhone,
}) => {
  const navigate = useNavigate();

  const [notification, setNotification] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};

  const profile = userData?.email ? userData : storedUser;

  // SAVE PHONE NUMBER

  const logout = async () => {
    console.log("Profile:", profile);
    console.log("Email:", profile.email);

    try {
      const res = await logoutUser(profile.email);
      console.log("Logout Response:", res);
    } catch (error) {
      console.log("Logout Error:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    localStorage.removeItem("password");

    navigate("/login", { replace: true });
  };

  return (
    <div className="profile-setting-container">
      <div className="profile-setting-card">
        <h2>Account</h2>

        {/* EMAIL */}

        <div className="setting-row">
          <div className="setting-left">
            <div className="icon-box">
              <FiMail />
            </div>

            <div>
              <h4>Email</h4>

              <p>{profile.email || "No Email"}</p>
            </div>
          </div>
        </div>

        {/* PHONE */}

        <div className="setting-row">
          <div className="setting-left">
            <div className="icon-box">
              <FiPhone />
            </div>

            <div>
              <h4>Phone</h4>

              {isEditingProfile ? (
                <input
                  className="edit-input"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              ) : (
                <p>{profile.phone || "No Phone Number"}</p>
              )}
            </div>
          </div>
        </div>

        {/* PASSWORD */}

        <div className="setting-row">
          <div className="setting-left">
            <div className="icon-box">
              <FiLock />
            </div>

            <div>
              <h4>Password</h4>

              <p>Change your password</p>
            </div>
          </div>

          <FiChevronRight />
        </div>
      </div>

      <div className="profile-setting-card">
        <h2>Settings</h2>

        {/* NOTIFICATION */}

        <div className="setting-row">
          <div className="setting-left">
            <div className="icon-box">
              <FiBell />
            </div>

            <h4>Notifications</h4>
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={notification}
              onChange={() => setNotification(!notification)}
            />

            <span className="slider"></span>
          </label>
        </div>

        {/* PRIVACY */}

        <div className="setting-row">
          <div className="setting-left">
            <div className="icon-box">
              <FiShield />
            </div>

            <h4>Privacy</h4>
          </div>

          <FiChevronRight />
        </div>

        {/* APPEARANCE */}

        <div className="setting-row">
          <div className="setting-left">
            <div className="icon-box">
              <FiSun />
            </div>

            <h4>Appearance</h4>
          </div>

          <FiChevronRight />
        </div>

        {/* HELP */}

        <div className="setting-row">
          <div className="setting-left">
            <div className="icon-box">
              <FiHelpCircle />
            </div>

            <h4>Help</h4>
          </div>

          <FiChevronRight />
        </div>

        {/* LOGOUT */}

        <div
          className="setting-row logout-row"
          onClick={() => setShowLogoutModal(true)}
        >
          <div className="setting-left">
            <div className="icon-box">
              <FiLogOut />
            </div>

            <h4>Logout</h4>
          </div>

          <FiChevronRight />
        </div>
      </div>

      {/* LOGOUT MODAL */}

      {showLogoutModal && (
        <div className="logout-overlay">
          <div className="logout-modal">
            <h2>Confirm Logout</h2>

            <p>Are you sure you want to logout?</p>

            <div className="logout-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>

              <button className="confirm-btn" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSetting;
