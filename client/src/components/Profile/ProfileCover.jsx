import React, { useState, useEffect } from "react";
import api from "../../services/api";

import {
  FiCamera,
  FiUser,
  FiImage,
  FiEdit2,
  FiCheck,
  FiX,
  FiUpload,
  FiTrash2,
} from "react-icons/fi";

import "../../styles/ProfileCover.css";

const ProfileCover = ({
  userData,
  setUserData,
  isEditingProfile,
  setIsEditingProfile,
  phone,
  setPhone,
}) => {
  const [coverImage, setCoverImage] = useState(null);

  const [profileImage, setProfileImage] = useState(null);

  // Actual files to send to backend
  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const [showCoverMenu, setShowCoverMenu] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [editData, setEditData] = useState({
    firstName: "",

    lastName: "",
    phone: "",
  });

  useEffect(() => {
    setEditData({
      firstName: userData?.firstName || "",

      lastName: userData?.lastName || "",

      phone: userData?.phone || "",
    });
  }, [userData]);

   
  const handleCoverChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setCoverFile(file); // Store actual file
      setCoverImage(URL.createObjectURL(file)); // Preview

      setShowCoverMenu(false);
    }
  };

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
  
    if (file) {
      setProfileFile(file); // Store actual file
      setProfileImage(URL.createObjectURL(file)); // Preview
  
      setShowProfileMenu(false);
    }
  };

  const removeCover = () => {
    setCoverImage(null);

    setShowCoverMenu(false);
  };

  const removeProfile = () => {
    setProfileImage(null);

    setShowProfileMenu(false);
  };

  const editProfile = () => {
    setEditData({
      firstName: userData?.firstName || "",

      lastName: userData?.lastName || "",
    });

    setIsEditingProfile(true);
  };

  const cancelEdit = () => {
    setEditData({
      firstName: userData?.firstName || "",

      lastName: userData?.lastName || "",
    });

    setIsEditingProfile(false);
  };

  const saveProfile = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const formData = new FormData();

      formData.append("firstName", editData.firstName);
      formData.append("lastName", editData.lastName);
      formData.append("phone", phone);

      if (profileFile) {
        formData.append("profilePic", profileFile);
      }

      if (coverFile) {
        formData.append("coverPic", coverFile);
      }
      const res = await api.put(`/profile/${userId}`, formData);
      // Merge old data + updated data
      const updatedUser = {
        ...userData,
        firstName: editData.firstName,
        lastName: editData.lastName,
        phone: phone,
        ...(res.data.profile || res.data),
      };
      // Update parent state immediately
      setUserData(updatedUser);

      // Update local storage
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setIsEditingProfile(false);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="profile-cover-container">
      {/* Cover Section */}

      <div className="cover-container">
        {coverImage || userData?.coverPic?.url ? (
          <img
            src={coverImage || userData.coverPic.url}
            className="cover-image"
            alt="cover"
          />
        ) : (
          <div className="cover-placeholder">
            <FiImage />
          </div>
        )}

        <div className="cover-menu-wrapper">
          <button
            className="cover-upload-btn"
            onClick={() => setShowCoverMenu(!showCoverMenu)}
          >
            <FiCamera />
            Cover
          </button>

          {showCoverMenu && (
            <div className="image-dropdown">
              <label className="dropdown-item">
                <FiUpload />
                Upload Cover
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                />
              </label>

              {(coverImage || userData?.coverPic?.url) && (
                <button className="dropdown-item" onClick={removeCover}>
                  <FiTrash2 />
                  Remove Cover
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Section */}

      <div className="profile-info">
        <div className="profile-image-wrapper">
          {profileImage || userData?.profilePic?.url ? (
            <img
              src={profileImage || userData.profilePic.url}
              className="profile-image"
              alt="profile"
            />
          ) : (
            <div className="profile-placeholder">
              <FiUser />
            </div>
          )}

          <div className="profile-menu-wrapper">
            <button
              className="profile-upload-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <FiCamera />
            </button>

            {showProfileMenu && (
              <div className="image-dropdown profile-dropdown">
                <label className="dropdown-item">
                  <FiUpload />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileChange}
                  />
                </label>

                {(profileImage || userData?.profilePic?.url) && (
                  <button className="dropdown-item" onClick={removeProfile}>
                    <FiTrash2 />
                    Remove Image
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Username */}

        <div className="user-details">
          {isEditingProfile ? (
            <div className="edit-profile-form">
              <input
                className="edit-input"
                type="text"
                placeholder="First Name"
                value={editData.firstName}
                onChange={(e) =>
                  setEditData({
                    ...editData,

                    firstName: e.target.value,
                  })
                }
              />

              <input
                className="edit-input"
                type="text"
                placeholder="Last Name"
                value={editData.lastName}
                onChange={(e) =>
                  setEditData({
                    ...editData,

                    lastName: e.target.value,
                  })
                }
              />
            </div>
          ) : (
            <h2 className="user-name">
              {`${userData?.firstName || ""}
            ${userData?.lastName || ""}`.trim() || "User Name"}
            </h2>
          )}
        </div>

        {/* Buttons */}

        <div className="profile-action">
          {!isEditingProfile ? (
            <button className="edit-profile-btn" onClick={editProfile}>
              <FiEdit2 />
              Edit Profile
            </button>
          ) : (
            <>
              <button className="save-btn" onClick={saveProfile}>
                <FiCheck />
                Save
              </button>

              <button className="cancel-btn" onClick={cancelEdit}>
                <FiX />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};;

export default ProfileCover;
