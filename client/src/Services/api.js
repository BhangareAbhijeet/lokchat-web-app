import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_UNI_LOKCHAT_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Signup
export const signupUser = async (userData) => {
  try {
    const res = await api.post("/register", userData);
    return res.data;
  } catch (error) {
    return (
      error.response?.data || {
        status: "failed",
        message: "Network Error",
      }
    );
  }
};

export const forgotPassword = async (email) => {
  try {
    const res = await api.post("/forgot-password", { email });
    return res.data;
  } catch (error) {
    return (
      error.response?.data || {
        status: "failed",
        message: "Network Error",
      }
    );
  }
};

export const verifyOTP = async (email, otp, flow = "signup") => {
  const endpoint = flow === "signup" ? "/verify-email-otp" : "/verify-otp";

  try {
    const res = await api.post(endpoint, { email, otp });
    return res.data;
  } catch (error) {
    return (
      error.response?.data || {
        status: "failed",
        message: "Network Error",
      }
    );
  }
};

export const resendOTP = async (email, flow = "signup") => {
  const endpoint = flow === "signup" ? "/resend-email-otp" : "/resend-otp";

  try {
    const res = await api.post(endpoint, { email });
    return res.data;
  } catch (error) {
    return (
      error.response?.data || {
        status: "failed",
        message: "Network Error",
      }
    );
  }
};

export const resetPassword = async (email, otp, newPassword) => {
  try {
    const res = await api.post("/reset-password", { email, otp, newPassword });
    return res.data;
  } catch (error) {
    return (
      error.response?.data || {
        status: "failed",
        message: "Network Error",
      }
    );
  }
};

// Login
export const loginUser = async (loginData) => {
  try {
    const res = await api.post("/login", loginData);
    return res.data;
  } catch (error) {
    return (
      error.response?.data || {
        status: "failed",
        message: "Network Error",
      }
    );
  }
};

// Logout
export const logoutUser = async (email) => {
  try {
    const res = await api.post("/logout", {
      email,
    });

    return res.data;
  } catch (error) {
    return (
      error.response?.data || {
        status: "failed",
        message: "Network Error",
      }
    );
  }
};

// ✅ Fetch all registered users (used as contacts list for now)
export const getContacts = () => api.get(`/users`);

export const getConversation = (senderId, receiverId) =>
  api.get(`/messages/${senderId}/${receiverId}`);

export default api;
