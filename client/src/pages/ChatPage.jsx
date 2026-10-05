import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import socket from "../services/socket";
import ContactsSidebar from "../components/chats/ContactsSidebar";
import ChatListSidebar from "../components/chats/ChatListSidebar";
import { useCall } from "../context/CallContext";
import {
  FiMessageSquare,
  FiPhone,
  FiSearch,
  FiMoreVertical,
  FiMic,
  FiImage,
  FiSmile,
  FiPaperclip,
  FiUsers,
  FiUser,
  FiSend,
  FiChevronDown,
  FiVideo,
  FiPhoneIncoming,
  FiPhoneOutgoing,
  FiPhoneMissed,
} from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";

import Header from "../components/profile/Sidebar";
import "../styles/ChatPage.css";
import { useNavigate, useLocation } from "react-router-dom";

// ---------------------------------------------------------------------------
// CONFIG — adjust these three to match your existing backend setup
// ---------------------------------------------------------------------------
const AUTH_TOKEN_KEY = "token";
const AUTH_USER_KEY = "user";

// ---------------------------------------------------------------------------
// ENDPOINTS
// ---------------------------------------------------------------------------
const ENDPOINTS = {
  chatList: () => "/users",
  conversation: (currentUserId, userId) =>
    `/messages/${currentUserId}/${userId}`,
  sendMessage: () => "/messages",
  markRead: (senderId, receiverId) =>
    `/messages/mark-read/${senderId}/${receiverId}`,
  callHistory: (userId) => `/calls/history/${userId}`,
};

// ---------------------------------------------------------------------------
// SOCKET.IO
// ---------------------------------------------------------------------------
const SOCKET_EVENTS = {
  newMessage: "getMessage",
  onlineUsers: "getUsers",
  unreadCount: "unreadCount",
  messageStatus: "messageStatus",
  messagesSeen: "messagesSeen",
  typing: "typing",
  stopTyping: "stopTyping",
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
  } catch {
    return null;
  }
};

const AVATAR_PALETTE = [
  { avatarColor: "#331c1c", textColor: "#f87171" },
  { avatarColor: "#1e2530", textColor: "#60a5fa" },
  { avatarColor: "#152233", textColor: "#38bdf8" },
  { avatarColor: "#2a1e33", textColor: "#c084fc" },
  { avatarColor: "#33231e", textColor: "#fb923c" },
];

const getAvatarStyle = (name = "") => {
  const index = name ? name.charCodeAt(0) % AVATAR_PALETTE.length : 0;
  return AVATAR_PALETTE[index];
};


const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------
const formatMessageTime = (dateTimeInput) => {
  if (!dateTimeInput) return "";
  const dateTime = new Date(dateTimeInput);
  const now = new Date();
  const diffMs = now.getTime() - dateTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isToday = dateTime.toDateString() === now.toDateString();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const isYesterday = dateTime.toDateString() === yesterdayDate.toDateString();

  if (diffMinutes < 1) return "Just now";
  if (isToday) {
    return dateTime.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (isYesterday) return "Yesterday";
  if (diffDays < 7) {
    return dateTime.toLocaleDateString([], { weekday: "long" });
  }
  return `${dateTime.getDate()}/${dateTime.getMonth() + 1}/${dateTime.getFullYear()}`;
};

const formatBubbleTime = (dateTimeInput) => {
  if (!dateTimeInput) return "";
  const dateTime = new Date(dateTimeInput);
  return dateTime.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatLastSeen = (lastSeenInput) => {
  if (!lastSeenInput) return "Offline";
  const date = new Date(lastSeenInput);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return `last seen today at ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isYesterday) return `last seen yesterday at ${time}`;

  return `last seen ${date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  })} at ${time}`;
};

// Format call duration (from doc6 — used by Calls tab)
const formatCallDuration = (seconds) => {
  if (!seconds) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m`;
};

// ---------------------------------------------------------------------------
// Message-shape helpers
// ---------------------------------------------------------------------------
const normalizeMessage = (msg) => ({
  id: msg._id || msg.id,
  text: msg.text,
  translatedText: msg.translatedText,
  type: msg.type || "text",

  mediaUrl:
    msg.mediaUrl ||
    msg.image ||
    msg.file ||
    msg.url ||
    (msg.type === "image" || msg.type === "audio" ? msg.text : null),

  senderId: typeof msg.sender === "object" ? msg.sender?._id : msg.sender,

  receiverId:
    typeof msg.receiver === "object" ? msg.receiver?._id : msg.receiver,

  sender: msg.sender,
  receiver: msg.receiver,

  senderLanguage: msg.senderLanguage,
  receiverLanguage: msg.receiverLanguage,

  read: Boolean(msg.read),
  delivered: Boolean(msg.delivered),
  seen: Boolean(msg.seen),

  deleted: Boolean(msg.deleted),
  deletedFor: msg.deletedFor || [],

  createdAt: msg.createdAt,
});

const isAudioMessage = (chat) => chat.lastMessage?.type === "audio";
const isImageMessage = (chat) => chat.lastMessage?.type === "image";

const ChatPage = () => {
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?._id || currentUser?.id;
  const { startCall } = useCall();
  const [selectedChat, setSelectedChat] = useState(null);
  const [search, setSearch] = useState("");
  const [showUnread, setShowUnread] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const selectedContact = location.state?.selectedContact;

    if (selectedContact) {
      handleSelectChat(selectedContact);

      navigate("/messages", {
        replace: true,
        state: null,
      });
    }
  }, [location.state]);

  const activeNav =
    location.pathname === "/messages"
      ? "messages"
      : location.pathname === "/contacts"
        ? "contacts"
        : location.pathname === "/calls"
          ? "calls"
          : location.pathname === "/profile"
            ? "profile"
            : "messages";

  // ---- Backend-driven state ---------------------------------------------
  const [chats, setChats] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(true);
  const [sidebarView, setSidebarView] = useState("chats");
  const [showMenu, setShowMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [matchedIndexes, setMatchedIndexes] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chatsError, setChatsError] = useState(null);

  const [allContacts, setAllContacts] = useState([]);

  const [messages, setMessages] = useState({});
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationError, setConversationError] = useState(null);

  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);
  const [isSending, setIsSending] = useState(false);

  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const conversation = selectedChat ? messages[selectedChat.id] || [] : [];

  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);

  const socketRef = useRef(null);
  const selectedChatIdRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const pickerRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef([]);
  const sidebarMenuRef = useRef(null);
  const chatMenuRef = useRef(null);

  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id || null;
  }, [selectedChat]);

  useEffect(() => {
    if (!selectedChat) return;
    const updated = chats.find((c) => c.id === selectedChat.id);
    if (
      updated &&
      (updated.online !== selectedChat.online ||
        updated.lastSeen !== selectedChat.lastSeen)
    ) {
      setSelectedChat((prev) =>
        prev
          ? { ...prev, online: updated.online, lastSeen: updated.lastSeen }
          : prev,
      );
    }
  }, [chats, selectedChat]);

  const shouldHighlightUnread = useCallback(
    (chat) => {
      const msg = chat.lastMessage;
      if (!msg || !currentUserId) return false;
      return msg.senderId !== currentUserId && !msg.read;
    },
    [currentUserId],
  );

  const getPreviewText = useCallback(
    (chat) => {
      const msg = chat.lastMessage;
      if (!msg) return "";
      if (isAudioMessage(chat)) {
        return msg.senderId === currentUserId
          ? "Sent voice message"
          : "Received voice message";
      }
      if (isImageMessage(chat)) {
        return msg.senderId === currentUserId
          ? "Sent an image"
          : "Received an image";
      }
      return msg.text || "";
    },
    [currentUserId],
  );

  const handleEmoji = (emojiData) => {
    setMessageInput((prev) => prev + emojiData.emoji);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder) return;

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });

      const formData = new FormData();
      formData.append("file", audioBlob, "voice.webm");
      formData.append("sender", currentUserId);
      formData.append("receiver", selectedChat.id);
      formData.append("type", "audio");

      try {
        const res = await api.post("/messages/send-file", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const newMessage = normalizeMessage(res.data.message);

        setMessages((prev) => ({
          ...prev,
          [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage],
        }));

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  lastMessage: newMessage,
                }
              : chat,
          ),
        );
      } catch (err) {
        console.error(err.response?.data || err.message);
      } finally {
        recorder.stream.getTracks().forEach((track) => track.stop());

        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsRecording(false);
      }
    };

    recorder.stop();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];

    if (!file || !selectedChat) return;

    if (!file.type.startsWith("image/")) {
      console.log("Only images allowed");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("sender", currentUserId);
      formData.append("receiver", selectedChat.id);
      formData.append("senderLanguage", currentUser?.language || "en");
      formData.append("receiverLanguage", selectedChat?.language || "en");
      formData.append("type", "image");

      const res = await api.post("/messages/send-file", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newMessage = normalizeMessage(res.data.message);

      setMessages((prev) => ({
        ...prev,
        [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage],
      }));

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                lastMessage: newMessage,
              }
            : chat,
        ),
      );
    } catch (error) {
      console.error(error.response?.data || error.message);
    } finally {
      setSelectedFile(null);
      e.target.value = "";
    }
  };

  // =========================================================================
  // 1. Fetch chat list
  // =========================================================================
  const fetchChatList = useCallback(async () => {
    setIsLoadingChats(true);
    setChatsError(null);

    try {
      const res = await api.get(`/messages/user/${currentUserId}`);
      const allMessages = Array.isArray(res.data) ? res.data : [];

      const conversationMap = new Map();

      for (const msg of allMessages) {
        const sender = msg.sender;
        const receiver = msg.receiver;

        if (!sender || !receiver) continue;
        if (sender._id === receiver._id) continue;

        const isSender = sender._id === currentUserId;
        const isReceiver = receiver._id === currentUserId;
        if (!isSender && !isReceiver) continue;

        const otherUser = isSender ? receiver : sender;
        const otherId = otherUser._id;
        const normalized = normalizeMessage(msg);

        const existing = conversationMap.get(otherId) || {
          userInfo: otherUser,
          lastMessage: null,
          unreadCount: 0,
        };

        const msgTime = new Date(msg.createdAt).getTime();
        const existingTime = existing.lastMessage
          ? new Date(existing.lastMessage.createdAt).getTime()
          : -Infinity;

        if (msgTime > existingTime) {
          existing.lastMessage = normalized;
        }

        if (isReceiver && !normalized.read) {
          existing.unreadCount += 1;
        }

        conversationMap.set(otherId, existing);
      }

      const conversations = Array.from(conversationMap.values()).sort(
        (a, b) =>
          new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt),
      );

      const mapped = conversations.map(
        ({ userInfo: u, lastMessage, unreadCount }) => ({
          id: u._id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          photo: u.profilePic?.url || null,
          online: !!u.isOnline,
          unread: unreadCount,
          lastMessage,
        }),
      );

      setChats(mapped);
    } catch (err) {
      console.error("Failed to fetch chat list:", err);
      setChatsError("Failed to load chats");
    } finally {
      setIsLoadingChats(false);
    }
  }, [currentUserId]);

  // =========================================================================
  // 1a. Fetch call history (from doc6)
  // =========================================================================
  const fetchCallHistory = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoadingCalls(true);

    try {
      const res = await api.get(`/calls/history/${currentUserId}`);
      const calls = Array.isArray(res.data) ? res.data : [];

      const formatted = calls.map((call) => ({
        id: call._id,
        callerId: call.callerId,
        receiverId: call.receiverId,
        callerName: call.callerName,
        receiverName: call.receiverName,
        callerProfile: call.callerProfile,
        receiverProfile: call.receiverProfile,
        duration: call.duration || 0,
        status: call.status, // 'completed', 'missed', 'declined'
        type: call.callerId === currentUserId ? "outgoing" : "incoming",
        createdAt: call.createdAt,
      }));

      setCallHistory(formatted);
    } catch (err) {
      console.error("Failed to fetch call history:", err);
    } finally {
      setIsLoadingCalls(false);
    }
  }, [currentUserId]);

  // =========================================================================
  // 1b. Fetch all registered contacts
  // =========================================================================
  useEffect(() => {
    if (!currentUserId) return;

    api
      .get("/users")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        const mapped = data
          .filter((u) => u._id !== currentUserId)
          .map((u) => ({
            id: u._id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
            photo: u.profilePic?.url || null,
            online: !!u.isOnline,
            lastSeen: u.lastSeen || null,
          }));

        setAllContacts(mapped);
      })
      .catch((err) =>
        console.error("Failed to fetch contacts for search:", err),
      );
  }, [currentUserId]);

  // =========================================================================
  // 2. Mark conversation as read
  // =========================================================================
  const markConversationRead = useCallback(async (userId) => {
    try {
      await api.patch(ENDPOINTS.markRead(userId, currentUserId));

      socketRef.current?.emit("markAsRead", {
        senderId: userId,
        receiverId: currentUserId,
      });
    } catch (err) {
      console.error("Failed to mark conversation as read:", err);
    }
    setChats((prev) =>
      prev.map((c) =>
        c.id === userId
          ? {
              ...c,
              unread: 0,
              lastMessage: c.lastMessage
                ? { ...c.lastMessage, read: true }
                : null,
            }
          : c,
      ),
    );

    setMessages((prev) => {
      if (!prev[userId]) return prev;
      return {
        ...prev,
        [userId]: prev[userId].map((m) =>
          m.senderId === userId ? { ...m, read: true, seen: true } : m,
        ),
      };
    });
  }, []);

  // =========================================================================
  // 3. Fetch full conversation
  // =========================================================================
  const fetchConversation = useCallback(
    async (userId) => {
      setIsLoadingConversation(true);
      setConversationError(null);

      try {
        const res = await api.get(`/messages/${currentUserId}/${userId}`);

        const data = Array.isArray(res.data)
          ? res.data
          : res.data.messages || [];

        const normalized = data.map(normalizeMessage);

        setMessages((prev) => ({
          ...prev,
          [userId]: normalized,
        }));
      } catch (err) {
        console.error("Failed to load conversation:", err);
        setConversationError("Couldn't load this conversation.");
      } finally {
        setIsLoadingConversation(false);
      }
    },
    [currentUserId],
  );

  // =========================================================================
  // 4a. Mount: load chat list + call history + connect Socket.IO
  // =========================================================================
  useEffect(() => {
    fetchChatList();
    fetchCallHistory();

    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

  socket.on("connect", () => {
  console.log("🔌 Socket connected:", socket.id);
  socket.emit("addUser", currentUserId);
  socket.emit("register-user", currentUserId);
  socket.emit("video-register-user", currentUserId); // ✅ NEW
  console.log("📡 User registered (voice + video)"); // ✅ NEW
});

    socket.on("getMessage", (data) => {
      const msg = normalizeMessage({
        _id: data.messageId,
        sender: data.senderId,
        receiver: data.receiverId,
        text: data.text,
        translatedText: data.translatedText,
        type: data.type,
        delivered: data.delivered,
        read: false,
        seen: false,
        createdAt: data.createdAt,
      });

      const otherUserId =
        msg.senderId === currentUserId ? msg.receiverId : msg.senderId;

      setMessages((prev) => {
        const existing = prev[otherUserId] || [];

        if (existing.some((m) => m.id === msg.id)) {
          return prev;
        }

        return {
          ...prev,
          [otherUserId]: [...existing, msg],
        };
      });

      setChats((prev) => {
        const exists = prev.some((chat) => chat.id === otherUserId);

        if (!exists) {
          const contactInfo = allContacts.find((c) => c.id === otherUserId);

          const newChat = {
            id: otherUserId,
            name: contactInfo?.name || "Unknown User",
            photo: contactInfo?.photo || null,
            online: contactInfo?.online || false,
            unread: msg.senderId !== currentUserId ? 1 : 0,
            lastMessage: msg,
          };

          return [newChat, ...prev];
        }

        const updatedChats = prev.map((chat) =>
          chat.id === otherUserId
            ? {
                ...chat,
                lastMessage: msg,
                unread:
                  selectedChatIdRef.current === otherUserId
                    ? 0
                    : (chat.unread || 0) + 1,
              }
            : chat,
        );

        const updatedChat = updatedChats.find((c) => c.id === otherUserId);
        const otherChats = updatedChats.filter((c) => c.id !== otherUserId);

        return [updatedChat, ...otherChats];
      });

      if (selectedChatIdRef.current === otherUserId) {
        markConversationRead(otherUserId);
      }
    });

    socket.on("getUsers", (onlineUserIds) => {
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          online: onlineUserIds.includes(chat.id),
        })),
      );

      setAllContacts((prev) =>
        prev.map((contact) => ({
          ...contact,
          online: onlineUserIds.includes(contact.id),
        })),
      );
    });

    socket.on("messageStatus", (data) => {
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((userId) => {
          updated[userId] = updated[userId].map((m) =>
            m.id === data.messageId
              ? { ...m, delivered: data.status === "delivered" }
              : m,
          );
        });
        return updated;
      });
    });

    socket.on("messagesSeen", ({ receiverId }) => {
      setMessages((prev) => {
        if (!prev[receiverId]) return prev;

        return {
          ...prev,
          [receiverId]: prev[receiverId].map((m) =>
            m.senderId === currentUserId ? { ...m, seen: true, read: true } : m,
          ),
        };
      });
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((userId) => {
          updated[userId] = updated[userId].map((m) =>
            m.id === messageId ? { ...m, deleted: true, text: "" } : m,
          );
        });
        return updated;
      });
    });
    // ================= Typing =================

    socket.on("typing", ({ senderId }) => {
      if (selectedChatIdRef.current === senderId) {
        setIsTyping(true);
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === senderId
            ? {
                ...chat,
                typing: true,
              }
            : chat,
        ),
      );
    });

    socket.on("stopTyping", ({ senderId }) => {
      if (selectedChatIdRef.current === senderId) {
        setIsTyping(false);
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === senderId
            ? {
                ...chat,
                typing: false,
              }
            : chat,
        ),
      );
    });
    return () => {
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("connect");
      socket.off("getMessage");
      socket.off("getUsers");
      socket.off("messageStatus");
      socket.off("messagesSeen");
      socket.off("messageDeleted");
      socketRef.current = null;
    };
  }, [currentUserId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(event.target)
      ) {
        setShowEmoji(false);
      }

      if (
        sidebarMenuRef.current &&
        !sidebarMenuRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }

      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setShowChatMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    if (!selectedChat) return;

    // Wait until React finishes rendering the messages
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);
  }, [selectedChat, conversation.length]);

  // =========================================================================
  // 5. When a chat is selected
  // =========================================================================
  const handleSelectChat = (chat) => {
    setChats((prev) => {
      const exists = prev.some((c) => c.id === chat.id);

      if (exists) {
        return prev.map((c) =>
          c.id === chat.id
            ? {
                ...c,
                online: chat.online ?? c.online,
                lastSeen: chat.lastSeen ?? c.lastSeen,
              }
            : c,
        );
      }

      return [
        { ...chat, unread: 0, lastMessage: chat.lastMessage || null },
        ...prev,
      ];
    });

    setSelectedChat(chat);

    if (!messages[chat.id]) {
      fetchConversation(chat.id);
    }

    markConversationRead(chat.id);
  };

  // =========================================================================
  // 6. Send message
  // =========================================================================
  const handleSendMessage = () => {
    const text = messageInput.trim();
    if (!text || !selectedChat || !currentUserId) return;
    if (!socketRef.current?.connected) {
      console.error("Socket not connected");
      return;
    }

    const tempId = Date.now().toString();

    const tempMessage = {
      id: tempId,
      text,
      type: "text",
      senderId: currentUserId,
      receiverId: selectedChat.id,
      createdAt: new Date().toISOString(),
      delivered: false,
      read: false,
      seen: false,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), tempMessage],
    }));

    setChats((prev) => {
      let updatedChat = null;
      const otherChats = prev
        .map((chat) => {
          if (chat.id === selectedChat.id) {
            updatedChat = { ...chat, lastMessage: tempMessage };
            return null;
          }
          return chat;
        })
        .filter(Boolean);

      if (!updatedChat) {
        updatedChat = { ...selectedChat, lastMessage: tempMessage, unread: 0 };
      }
      return [updatedChat, ...otherChats];
    });

    setMessageInput("");
    clearTimeout(typingTimeout.current);

    socketRef.current.emit("stopTyping", {
      senderId: currentUserId,
      receiverId: selectedChat.id,
    });
    socketRef.current.emit("sendMessage", {
      senderId: currentUserId,
      receiverId: selectedChat.id,
      text,
      type: "text",
      senderLanguage: currentUser?.language || "en",
      receiverLanguage: selectedChat?.language || "en",
    });
  };
  const handleTyping = (e) => {
    const value = e.target.value;

    setMessageInput(value);

    if (!selectedChat || !socketRef.current) return;

    socketRef.current.emit("typing", {
      senderId: currentUserId,
      receiverId: selectedChat.id,
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socketRef.current.emit("stopTyping", {
        senderId: currentUserId,
        receiverId: selectedChat.id,
      });
    }, 1000);
  };
  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (messageId, forEveryone) => {
    if (!selectedChat) return;

    try {
      await api.delete(`/messages/${messageId}`);

      setMessages((prev) => {
        const updatedConversation = (prev[selectedChat.id] || []).filter(
          (m) => m.id !== messageId,
        );

        setChats((chats) =>
          chats.map((chat) =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  lastMessage:
                    updatedConversation.length > 0
                      ? updatedConversation[updatedConversation.length - 1]
                      : null,
                }
              : chat,
          ),
        );

        return {
          ...prev,
          [selectedChat.id]: updatedConversation,
        };
      });
    } catch (err) {
      console.error(
        "Failed to delete message:",
        err.response?.data || err.message,
      );
    } finally {
      setActiveMenuMessageId(null);
    }
  };

  const nextMatch = () => {
    if (!matchedIndexes.length) return;
    const next =
      currentMatch === matchedIndexes.length - 1 ? 0 : currentMatch + 1;
    setCurrentMatch(next);
    messageRefs.current[matchedIndexes[next]]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const previousMatch = () => {
    if (!matchedIndexes.length) return;
    const prev =
      currentMatch === 0 ? matchedIndexes.length - 1 : currentMatch - 1;
    setCurrentMatch(prev);
    messageRefs.current[matchedIndexes[prev]]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // Call history helpers (from doc6)
  const handleCallFromHistory = (call) => {
    const targetId =
      call.callerId === currentUserId ? call.receiverId : call.callerId;
    const targetName =
      call.callerId === currentUserId ? call.receiverName : call.callerName;
    const targetPhoto =
      call.callerId === currentUserId
        ? call.receiverProfile
        : call.callerProfile;

    socketRef.current?.emit("video-call-user", {
      callerId: currentUserId,
      name: `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim(),
      targetUserId: targetId,
      profile: currentUser?.profilePic?.url || currentUser?.profile || null,
    });

    navigate("/videocall", {
      state: {
        targetUserId: targetId,
        targetUserName: targetName,
        targetProfile: targetPhoto,
      },
    });
  };

  const getCallIcon = (call) => {
    if (call.type === "outgoing") {
      return call.status === "missed" ? (
        <FiPhoneMissed size={18} color="#ef4444" />
      ) : (
        <FiPhoneOutgoing size={18} color="#10b981" />
      );
    } else {
      return call.status === "missed" ? (
        <FiPhoneMissed size={18} color="#ef4444" />
      ) : (
        <FiPhoneIncoming size={18} color="#10b981" />
      );
    }
  };

  // =========================================================================
  // Derived list for the sidebar
  // =========================================================================
  const filteredChats = (Array.isArray(chats) ? chats : [])
    .filter((chat) => {
      if (!chat) return false;

      const matchesSearch = (chat.name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesUnread = !showUnread || (chat.unread ?? 0) > 0;

      return matchesSearch && matchesUnread;
    })
    .sort((a, b) => {
      const aTime = Date.parse(a?.lastMessage?.createdAt || 0);
      const bTime = Date.parse(b?.lastMessage?.createdAt || 0);

      return bTime - aTime;
    });

  const chatIds = new Set(chats.map((c) => c.id));
  const matchingContactsOnly =
    search.trim().length === 0
      ? []
      : allContacts.filter(
          (c) =>
            !chatIds.has(c.id) &&
            c.name.toLowerCase().includes(search.toLowerCase()),
        );

  return (
    <>
      <div className="chat-page">
        <div className="main-container">
          {/* ================= Sidebar ================= */}
          {(activeNav === "messages" ||
            activeNav === "contacts" ||
            activeNav === "calls") && (
            <>
              {activeNav === "messages" ? (
                <aside className="chatpg-sidebar">
                  <div className="sidebar-header">
                    <h2>LokChat</h2>

                    <div className="menu-wrapper" ref={sidebarMenuRef}>
                      <FiMoreVertical
                        className="menu-icon"
                        onClick={() => setShowMenu(!showMenu)}
                      />

                      {showMenu && (
                        <div className="menu-dropdown">
                          <div
                            className="menu-item"
                            onClick={() => {
                              navigate("/contacts");
                              setShowMenu(false);
                            }}
                          >
                            Contacts
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="search-box">
                    <FiSearch className="search-icon" />

                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="chat-filter">
                    <div
                      className={`toggle-slider ${showUnread ? "right" : "left"}`}
                    ></div>

                    <button
                      className={!showUnread ? "active" : ""}
                      onClick={() => setShowUnread(false)}
                    >
                      All
                    </button>

                    <button
                      className={showUnread ? "active" : ""}
                      onClick={() => setShowUnread(true)}
                    >
                      Unread
                    </button>
                  </div>

                  <div className="chat-list">
                    {isLoadingChats ? (
                      <p style={{ padding: 20 }}>Loading chats...</p>
                    ) : chatsError ? (
                      <p style={{ padding: 20 }}>{chatsError}</p>
                    ) : (
                      <>
                        {filteredChats.map((chat) => {
                          const highlight = shouldHighlightUnread(chat);

                          return (
                            <div
                              key={chat.id}
                              className={`chat-card ${
                                selectedChat?.id === chat.id ? "selected" : ""
                              }`}
                              onClick={() => handleSelectChat(chat)}
                            >
                              <div
                                className="chat-avatar"
                                style={{
                                  background: getAvatarStyle(chat.name)
                                    .avatarColor,
                                  color: getAvatarStyle(chat.name).textColor,
                                }}
                              >
                                {chat.photo ? (
                                  <img
                                    src={chat.photo}
                                    alt={chat.name}
                                    className="avatar-image"
                                  />
                                ) : (
                                  <span>
                                    <span>{getInitials(chat.name)}</span>
                                  </span>
                                )}

                                {chat.online && (
                                  <span className="online-dot"></span>
                                )}
                              </div>

                              <div className="chat-info">
                                <div className="top">
                                  <h4>{chat.name}</h4>

                                  <span>
                                    {formatMessageTime(
                                      chat.lastMessage?.createdAt,
                                    )}
                                  </span>
                                </div>

                                <div className="bottom">
                                  <p className={highlight ? "unread-text" : ""}>
                                    {isAudioMessage(chat) && (
                                      <FiMic className="msg-type-icon" />
                                    )}
                                    {isImageMessage(chat) && (
                                      <FiImage className="msg-type-icon" />
                                    )}
                                    {chat.typing ? (
                                      <span className="typing-text">
                                        Typing...
                                      </span>
                                    ) : (
                                      <>
                                        {isAudioMessage(chat) && (
                                          <FiMic className="msg-type-icon" />
                                        )}

                                        {isImageMessage(chat) && (
                                          <FiImage className="msg-type-icon" />
                                        )}

                                        {getPreviewText(chat)}
                                      </>
                                    )}
                                  </p>

                                  {chat.unread > 0 && (
                                    <span className="badge">{chat.unread}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {matchingContactsOnly.length > 0 && (
                          <>
                            <div
                              style={{
                                padding: "12px 20px 6px",
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#7a7a7a",
                                textTransform: "uppercase",
                              }}
                            >
                              Contacts
                            </div>

                            {matchingContactsOnly.map((contact) => (
                              <div
                                key={contact.id}
                                className="chat-card"
                                onClick={() => {
                                  setSearch("");
                                  handleSelectChat({
                                    ...contact,
                                    unread: 0,
                                    lastMessage: null,
                                  });
                                }}
                              >
                                <div
                                  className="chat-avatar"
                                  style={{
                                    background: getAvatarStyle(contact.name)
                                      .avatarColor,
                                    color: getAvatarStyle(contact.name)
                                      .textColor,
                                  }}
                                >
                                  {contact.photo ? (
                                    <img
                                      src={contact.photo}
                                      alt={contact.name}
                                      className="avatar-image"
                                    />
                                  ) : (
                                    <span
                                      style={{
                                        color: getAvatarStyle(contact.name)
                                          .textColor,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {getInitials(contact.name)}
                                    </span>
                                  )}
                                </div>

                                <div className="chat-info">
                                  <div className="top">
                                    <h4>{contact.name}</h4>
                                  </div>
                                  <div className="bottom">
                                    <p>Tap to start chatting</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </aside>
              ) : activeNav === "calls" ? (
                <aside className="chatpg-sidebar calls-sidebar">
                  <div className="sidebar-header">
                    <h2>Calls</h2>
                  </div>

                  <div className="calls-list">
                    {isLoadingCalls ? (
                      <p style={{ padding: 20 }}>Loading calls...</p>
                    ) : callHistory.length === 0 ? (
                      <p
                        style={{ padding: 20, textAlign: "center", color: "#999" }}
                      >
                        No calls yet
                      </p>
                    ) : (
                      callHistory.map((call) => {
                        const otherName =
                          call.callerId === currentUserId
                            ? call.receiverName
                            : call.callerName;
                        const otherPhoto =
                          call.callerId === currentUserId
                            ? call.receiverProfile
                            : call.callerProfile;

                        return (
                          <div
                            key={call.id}
                            className="call-card"
                            onClick={() => handleCallFromHistory(call)}
                          >
                            <div
                              className="call-avatar"
                              style={{
                                background: getAvatarStyle(otherName)
                                  .avatarColor,
                                color: getAvatarStyle(otherName).textColor,
                              }}
                            >
                              {otherPhoto ? (
                                <img
                                  src={otherPhoto}
                                  alt={otherName}
                                  className="avatar-image"
                                />
                              ) : (
                                <span>{getInitials(otherName)}</span>
                              )}
                            </div>

                            <div className="call-info">
                              <div className="top">
                                <h4>{otherName}</h4>
                                <span className="call-time">
                                  {formatMessageTime(call.createdAt)}
                                </span>
                              </div>
                              <div className="bottom">
                                <div className="call-status-row">
                                  {getCallIcon(call)}
                                  <span className="call-status-text">
                                    {call.type === "outgoing"
                                      ? call.status === "missed"
                                        ? "Call failed"
                                        : "Outgoing"
                                      : call.status === "missed"
                                        ? "Missed call"
                                        : "Incoming"}
                                  </span>
                                </div>
                                {call.duration > 0 && (
                                  <span className="call-duration">
                                    {formatCallDuration(call.duration)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              className="call-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCallFromHistory(call);
                              }}
                            >
                              <FiPhone size={20} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </aside>
              ) : (
                <ContactsSidebar
                  onBack={() => navigate("/messages")}
                  onSelectContact={(contact) => {
                    setSidebarView("chats");
                    handleSelectChat(contact);
                  }}
                />
              )}
            </>
          )}

          {/* ================= Chat Area ================= */}

          <section className="chat-area">
            {!selectedChat ? (
              <div className="empty-chat">
                <h2>No Conversation Selected</h2>
                <p>
                  Select a conversation from the left sidebar to start chatting.
                </p>
              </div>
            ) : (
              <>
                {/* ================= Chat Header ================= */}

                <div className="chat-header">
                  <div className="header-left">
                    <div
                      className="chat-avatar large"
                      style={{
                        background: selectedChat.photo
                          ? "transparent"
                          : getAvatarStyle(selectedChat.name).avatarColor,
                        color: getAvatarStyle(selectedChat.name).textColor,
                      }}
                    >
                      {selectedChat.photo ? (
                        <img
                          src={selectedChat.photo}
                          alt={selectedChat.name}
                          className="avatar-image"
                        />
                      ) : (
                        <span>{getInitials(selectedChat.name)}</span>
                      )}
                    </div>
                    <div>
                      <h3>{selectedChat.name}</h3>

                      <span className="online-status">
                        {isTyping
                          ? "Typing..."
                          : selectedChat.online
                            ? "Online"
                            : selectedChat.lastSeen
                              ? formatLastSeen(selectedChat.lastSeen)
                              : "Offline"}
                      </span>
                    </div>
                  </div>

                  <div className="header-actions">
                    <FiVideo
  style={{ cursor: "pointer" }}
  onClick={() => {
    // ✅ NEW: Check socket is connected
    if (!socketRef.current?.connected) {
      alert("Not connected. Please wait and try again.");
      return;
    }

    // ✅ NEW: Emit socket event to notify receiver
    socketRef.current.emit(
      "video-call-user",
      {
        callerId: currentUserId,
        name: `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim(),
        targetUserId: selectedChat.id,
        profile: currentUser?.profilePic?.url || null,
      },
      (error) => {
        if (error) {
          console.error("❌ Failed to initiate call:", error);
          alert("Failed to start call. Try again.");
          return;
        }
        console.log("✅ Video call initiated");
      }
    );

    // Navigate caller to video call page
    navigate("/video-call", {
      state: {
        remoteUser: {
          id: selectedChat.id,
          name: selectedChat.name,
          status: selectedChat.online ? "Online" : "Offline",
          profile: selectedChat.photo || "https://i.pravatar.cc/200?img=12",
        },
      },
    });
  }}
/>

                    <FiPhone
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        startCall({
                          id: selectedChat.id,
                          name: selectedChat.name,
                          photo: selectedChat.photo,
                          avatarColor: getAvatarStyle(selectedChat.name)
                            .avatarColor,
                          textColor: getAvatarStyle(selectedChat.name)
                            .textColor,
                          initials: getInitials(selectedChat.name),
                        })
                      }
                    />
                    <div className="header-menu-wrapper" ref={chatMenuRef}>
                      <FiMoreVertical
                        className="menu-icon"
                        onClick={() => setShowChatMenu(!showChatMenu)}
                      />

                      {showChatMenu && (
                        <div className="header-menu-dropdown">
                          <div
                            className="menu-item"
                            onClick={() => {
                              setShowSearch(!showSearch);
                              setShowChatMenu(false);
                            }}
                          >
                            Search
                          </div>

                          <div
                            className="menu-item"
                            onClick={() => {
                              navigate(`/contactinfo/${selectedChat.id}`, {
                                state: {
                                  contact: {
                                    id: selectedChat.id,
                                    name: selectedChat.name,
                                    photo: selectedChat.photo,
                                    status: selectedChat.online
                                      ? "Online"
                                      : selectedChat.lastSeen
                                        ? formatLastSeen(selectedChat.lastSeen)
                                        : "Offline",
                                  },
                                },
                              });
                              setShowChatMenu(false);
                            }}
                          >
                            Contact
                          </div>

                          <div
                            className="menu-item"
                            onClick={() => {
                              setShowWallpaperModal(true);
                              setShowChatMenu(false);
                            }}
                          >
                            Wallpaper
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ================= Chat Content ================= */}

                {showSearch && (
                  <div className="chat-search-box">
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={chatSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setChatSearch(value);

                        if (!value.trim()) {
                          setMatchedIndexes([]);
                          setCurrentMatch(0);
                          return;
                        }

                        const matches = [];

                        conversation.forEach((msg, index) => {
                          if (
                            (msg.text || "")
                              .toLowerCase()
                              .includes(value.toLowerCase())
                          ) {
                            matches.push(index);
                          }
                        });

                        setMatchedIndexes(matches);
                        setCurrentMatch(0);

                        if (matches.length > 0) {
                          setTimeout(() => {
                            messageRefs.current[matches[0]]?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }, 100);
                        }
                      }}
                    />
                    <div className="search-actions">
                      <button onClick={previousMatch}>↑</button>
                      <button onClick={nextMatch}>↓</button>
                      <span>
                        {matchedIndexes.length
                          ? `${currentMatch + 1}/${matchedIndexes.length}`
                          : "0/0"}
                      </span>
                      <button
                        className="close-search-btn"
                        onClick={() => {
                          setShowSearch(false);
                          setChatSearch("");
                          setMatchedIndexes([]);
                          setCurrentMatch(0);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                <div className="chat-content">
                  {isLoadingConversation ? (
                    <div className="empty-chat-screen">
                      <p>Loading conversation…</p>
                    </div>
                  ) : conversationError ? (
                    <div className="empty-chat-screen">
                      <p style={{ color: "#f87171" }}>{conversationError}</p>
                    </div>
                  ) : conversation.length === 0 ? (
                    <div className="empty-chat-screen">
                      <div className="empty-icon">
                        <FiMessageSquare />
                      </div>

                      <h2>No Chats Yet</h2>

                      <p>
                        Start a conversation with{" "}
                        <strong>{selectedChat.name}</strong>.
                      </p>

                      <p className="sub-text">
                        Messages will appear here once you start chatting.
                      </p>
                    </div>
                  ) : (
                    <div className="chat-body" ref={chatBodyRef}>
                      {conversation.map((msg, index) => {
                        const isMine = msg.senderId === currentUserId;
                        const isHiddenForMe =
                          msg.deletedFor?.includes(currentUserId);

                        if (isHiddenForMe) return null;

                        return (
                          <div
                            key={msg.id}
                            ref={(el) => (messageRefs.current[index] = el)}
                            className={`message ${
                              isMine ? "sent" : "received"
                            } ${msg.type === "image" ? "image-message" : ""} ${
                              matchedIndexes.includes(index)
                                ? index === matchedIndexes[currentMatch]
                                  ? "current-highlight"
                                  : "search-highlight"
                                : ""
                            }`}
                          >
                            <div className="message-bubble">
                              {isMine && !msg.deleted && (
                                <div className="message-menu-wrapper">
                                  <button
                                    className="message-menu-btn"
                                    onClick={() =>
                                      setActiveMenuMessageId(
                                        activeMenuMessageId === msg.id
                                          ? null
                                          : msg.id,
                                      )
                                    }
                                  >
                                    <FiChevronDown size={18} />
                                  </button>

                                  {activeMenuMessageId === msg.id && (
                                    <div className="message-menu-dropdown">
                                      <div
                                        className="message-menu-item"
                                        onClick={() =>
                                          handleDeleteMessage(msg.id, false)
                                        }
                                      >
                                        Delete for me
                                      </div>

                                      <div
                                        className="message-menu-item danger"
                                        onClick={() =>
                                          handleDeleteMessage(msg.id, true)
                                        }
                                      >
                                        Delete for everyone
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {msg.deleted ? (
                                <p className="deleted-text">
                                  <em>This message was deleted</em>
                                </p>
                              ) : msg.type === "video-call" ? (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "2px 4px",
                                  }}
                                >
                                  <FiVideo size={18} />
                                  <div>
                                    <div style={{ fontWeight: 600 }}>
                                      Video call
                                    </div>
                                    <div style={{ fontSize: 13, opacity: 0.75 }}>
                                      {msg.text}
                                    </div>
                                  </div>
                                </div>
                              ) : msg.type === "image" ? (
                                <img
                                  src={msg.mediaUrl}
                                  alt=""
                                  className="chat-image"
                                />
                              ) : msg.type === "audio" ? (
                                <audio controls src={msg.mediaUrl} />
                              ) : (
                                <>
                                  <p>
                                    {chatSearch && msg.text
                                      ? msg.text
                                          .split(
                                            new RegExp(`(${chatSearch})`, "gi"),
                                          )
                                          .map((part, i) =>
                                            part.toLowerCase() ===
                                            chatSearch.toLowerCase() ? (
                                              <mark key={i}>{part}</mark>
                                            ) : (
                                              part
                                            ),
                                          )
                                      : msg.text}
                                  </p>

                                  <div className="message-meta">
                                    <span className="message-time">
                                      {formatBubbleTime(msg.createdAt)}
                                    </span>

                                    {isMine && (
                                      <span
                                        className={`message-status ${
                                          msg.seen
                                            ? "seen"
                                            : msg.delivered
                                              ? "delivered"
                                              : "sent"
                                        }`}
                                      >
                                        {msg.delivered || msg.seen ? "✓✓" : "✓"}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {isTyping && (
                        <div className="message received typing-message">
                          <div className="typing-bubble">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* ================= Chat Input ================= */}

                <div className="chat-input">
                  <div className="input-wrapper">
                    <div className="emoji-box">
                      <button
                        ref={emojiBtnRef}
                        className="input-icon"
                        type="button"
                        onClick={() => setShowEmoji((prev) => !prev)}
                      >
                        <FiSmile
                          color={showEmoji ? "#25D366" : "#6b7280"}
                          size={20}
                        />
                      </button>

                      {showEmoji && (
                        <div className="emoji-picker" ref={pickerRef}>
                          <EmojiPicker
                            onEmojiClick={handleEmoji}
                            width={320}
                            height={420}
                            lazyLoadEmojis
                          />
                        </div>
                      )}
                    </div>

                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Message"
                      value={messageInput}
                      onChange={handleTyping}
                      onKeyDown={handleInputKeyDown}
                      disabled={isSending}
                    />

                    <input
                      type="file"
                      id="fileInput"
                      hidden
                      accept="image/*"
                      onChange={handleFileSelect}
                    />

                    <button
                      className="attach-icon"
                      type="button"
                      onClick={() =>
                        document.getElementById("fileInput").click()
                      }
                    >
                      <FiPaperclip size={20} />
                    </button>
                  </div>

                  <button
                    className="mic-btn"
                    onClick={
                      messageInput.trim()
                        ? handleSendMessage
                        : isRecording
                          ? stopRecording
                          : startRecording
                    }
                    disabled={isSending}
                  >
                    {messageInput.trim() ? <FiSend /> : <FiMic />}
                  </button>
                </div>
                {/* ================= Wallpaper Popup ================= */}
                {showWallpaperModal && (
                  <div
                    className="wallpaper-overlay"
                    onClick={() => setShowWallpaperModal(false)}
                  >
                    <div
                      className="wallpaper-popup"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="wallpaper-icon"></div>
                      <h2>Wallpaper</h2>
                      <p>Wallpaper feature coming soon!</p>
                      <button onClick={() => setShowWallpaperModal(false)}>
                        OK
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default ChatPage;
