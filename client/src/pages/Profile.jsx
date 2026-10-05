import React, { useEffect, useState } from "react";
import api from "../services/api";

import ProfileCover from "../components/Profile/ProfileCover";
import ProfileSetting from "../components/Profile/ProfileSetting";

function Profile() {
  const [userData, setUserData] = useState({
    firstName: "",

    lastName: "",

    email: "",

    phone: "",

    profilePic: {
      url: "",
      public_id: "",
    },

    coverPic: {
      url: "",
      public_id: "",
    },
  });

  // COMMON EDIT STATE

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // PHONE STATE

  const [phone, setPhone] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (storedUser) {
      setUserData(storedUser);

      setPhone(storedUser.phone || "");
    }

    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      let userId = localStorage.getItem("userId");

      if (!userId) {
        const storedUser = JSON.parse(localStorage.getItem("user"));

        if (storedUser?.id) {
          userId = storedUser.id;

          localStorage.setItem("userId", userId);
        } else if (storedUser?._id) {
          userId = storedUser._id;

          localStorage.setItem("userId", userId);
        }
      }

      if (!userId) {
        console.log("User ID not found");

        return;
      }

      const res = await api.get(`/profile/${userId}`);

      const data = res.data;

      const normalized = {
        ...data,

        firstName: data.firstName || "",

        lastName: data.lastName || "",

        email: data.email || "",

        phone: data.phone || "",

        profilePic: data.profilePic || {
          url: "",

          public_id: "",
        },

        coverPic: data.coverPic || {
          url: "",

          public_id: "",
        },
      };

      // update states

      setUserData(normalized);

      setPhone(normalized.phone);

      // update storage

      localStorage.setItem("user", JSON.stringify(normalized));
    } catch (err) {
      console.log("Profile Error:", err.response?.data || err.message);
    }
  };

  return (
    <>
      <ProfileCover
        userData={userData}
        setUserData={setUserData}
        isEditingProfile={isEditingProfile}
        setIsEditingProfile={setIsEditingProfile}
        phone={phone}
        setPhone={setPhone}
      />
      <ProfileSetting
        userData={userData}
        setUserData={setUserData}
        isEditingProfile={isEditingProfile}
        phone={phone}
        setPhone={setPhone}
      />
    </>
  );
}

export default Profile;
