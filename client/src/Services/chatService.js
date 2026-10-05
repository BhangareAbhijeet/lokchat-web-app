import api from "./api";

// Chat List
export const getChatList = async (userId) => {
  const res = await api.get(`/messages/latest/${userId}`);
  return res.data;
};

// Conversation
export const getMessages = async (senderId, receiverId) => {
  const res = await api.get(`/messages/${senderId}/${receiverId}`);
  return res.data;
};

// Optional (don't use if Socket.IO saves messages)
export const sendMessage = async (data) => {
  const res = await api.post("/messages", data);
  return res.data;
};

// Mark Read
export const markMessagesRead = async (senderId, receiverId) => {
  const res = await api.patch(`/messages/mark-read/${senderId}/${receiverId}`);
  return res.data;
};
