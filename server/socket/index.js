const { Server } = require("socket.io");
const Message = require("../models/message");
const User = require("../models/user");
const Group = require("../models/group"); // you need to create a Group model
const translateText = require("../utils/translateText");

let onlineUsers = {}; // userId -> array of socketIds (support multiple devices)
const callUsers = new Map();
const callTimers = new Map();

// Map full language names to ISO codes
const languageMap = {
  English: "en",
  Hindi: "hi",
  Tamil: "ta",
  Telugu: "te",
  Bengali: "bn",
  Marathi: "mr",
  Kannada: "kn",
  Punjabi: "pa",
  Gujarati: "gu",
};

// Helper to fetch language code by userId
async function getLanguageCode(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return "en";
    return languageMap[user.language] || "en";
  } catch (err) {
    console.error("Error fetching user language", err);
    return "en";
  }
}

// helper
const getUnreadCount = async (userId) => {
  return await Message.countDocuments({ receiver: userId, read: false });
};

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    let currentUserId = null;

    // Join private room
    socket.on("joinRoom", (userId) => socket.join(userId));

    // Join group room
    socket.on("joinGroup", (groupId) => socket.join(groupId));

    // Add user online
    socket.on("addUser", async (userId) => {
      currentUserId = userId;

      if (!onlineUsers[userId]) onlineUsers[userId] = [];
      onlineUsers[userId].push(socket.id);

      socket.userId = userId;
      socket.join(userId);

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      io.emit("getUsers", Object.keys(onlineUsers));
      const unreadCount = await getUnreadCount(userId);
      socket.emit("unreadCount", unreadCount);

      socket.lastSeenInterval = setInterval(async () => {
        if (socket.userId) {
          await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
        }
      }, 60000);
    });

    // Typing indicators
    socket.on("typing", ({ senderId, receiverId, groupId }) => {
      if (groupId) {
        socket.to(groupId).emit("typing", { senderId, groupId });
      } else {
        const receiverSockets = onlineUsers[receiverId] || [];
        receiverSockets.forEach((sid) =>
          io.to(sid).emit("typing", { senderId }),
        );
      }
    });

    socket.on("stopTyping", ({ senderId, receiverId, groupId }) => {
      if (groupId) {
        socket.to(groupId).emit("stopTyping", { senderId, groupId });
      } else {
        const receiverSockets = onlineUsers[receiverId] || [];
        receiverSockets.forEach((sid) =>
          io.to(sid).emit("stopTyping", { senderId }),
        );
      }
    });

    // Private message
    socket.on(
      "sendMessage",
      async ({ senderId, receiverId, text, type = "text", fileUrl }) => {
        try {
          // Handle file-based messages
          if (!text && fileUrl) {
            text = fileUrl;
          }

          if (!senderId || !receiverId || !text) {
            console.error("❌ Missing required fields");
            return;
          }

          const senderLanguage = await getLanguageCode(senderId);
          const receiverLanguage = await getLanguageCode(receiverId);

          // Translate text if needed
          let translatedText = text;
          if (senderLanguage !== receiverLanguage) {
            try {
              translatedText = await translateText(
                text,
                senderLanguage,
                receiverLanguage,
              );
            } catch (err) {
              console.error("Translation failed:", err.message);
            }
          }

          // Fetch user details for sender and receiver
          const senderUser = await User.findById(senderId);
          const receiverUser = await User.findById(receiverId);

          const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            text,
            translatedText,
            type,
            read: false,
            delivered: false,
            seen: false,
            senderLanguage,
            receiverLanguage,
          });

          await newMessage.save();

          // Deliver to all connected receiver sockets
          const receiverSockets = onlineUsers[receiverId] || [];
          if (receiverSockets.length > 0) {
            await Message.findByIdAndUpdate(newMessage._id, {
              delivered: true,
            });

            receiverSockets.forEach((sid) => {
              io.to(sid).emit("getMessage", {
                senderId,
                senderName: senderUser
                  ? `${senderUser.firstName} ${senderUser.lastName}`.trim()
                  : "",
                senderProfilePic: senderUser
                  ? senderUser.profilePic?.url || ""
                  : "",
                receiverId,
                receiverName: receiverUser
                  ? `${receiverUser.firstName} ${receiverUser.lastName}`.trim()
                  : "",
                receiverProfilePic: receiverUser
                  ? receiverUser.profilePic?.url || ""
                  : "",
                text,
                translatedText,
                type,
                createdAt: newMessage.createdAt,
                messageId: newMessage._id,
                delivered: true,
                senderLanguage,
                receiverLanguage,
              });
            });
          }

          // Update unread count for receiver
          const unreadCount = await getUnreadCount(receiverId);
          receiverSockets.forEach((sid) =>
            io.to(sid).emit("unreadCount", unreadCount),
          );

          // Notify sender of status
          socket.emit("messageStatus", {
            messageId: newMessage._id,
            status: receiverSockets.length > 0 ? "delivered" : "sent",
          });
        } catch (err) {
          console.error("Error saving message:", err);
        }
      },
    );

    // Group message
    socket.on(
      "sendGroupMessage",
      async ({ senderId, groupId, text, type = "text" }) => {
        try {
          const newMessage = new Message({
            sender: senderId,
            group: groupId, // new field
            text,
            type,
            read: false,
            delivered: true, // assume delivered to all in room
          });
          await newMessage.save();

          io.to(groupId).emit("getGroupMessage", {
            senderId,
            groupId,
            text,
            type,
            createdAt: newMessage.createdAt,
            messageId: newMessage._id,
          });
        } catch (err) {
          console.error("Error sending group message:", err);
        }
      },
    );

    // Mark messages as read (private)
    socket.on("markAsRead", async ({ senderId, receiverId }) => {
      try {
        await Message.updateMany(
          { sender: senderId, receiver: receiverId, read: false },
          { $set: { read: true, seen: true } },
        );
        const senderSockets = onlineUsers[senderId] || [];
        senderSockets.forEach((sid) =>
          io.to(sid).emit("messagesSeen", { receiverId }),
        );

        const unreadCount = await getUnreadCount(receiverId);
        socket.emit("unreadCount", unreadCount);
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    });

    // Profile updated
    socket.on("profileUpdated", ({ userId, updatedProfile }) => {
      socket.broadcast.emit("profileUpdated", { userId, updatedProfile });
    });

    // Logout
    socket.on("logout", async (userId) => {
      if (onlineUsers[userId]) {
        onlineUsers[userId] = onlineUsers[userId].filter(
          (sid) => sid !== socket.id,
        );
        if (onlineUsers[userId].length === 0) {
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });
          delete onlineUsers[userId];
        }
      }
      io.emit("getUsers", Object.keys(onlineUsers));
      socket.leave(userId);
      clearInterval(socket.lastSeenInterval);
    });

    // Disconnect
    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);

      if (socket.userId) {
        callUsers.delete(socket.userId);
      }

      if (currentUserId && onlineUsers[currentUserId]) {
        onlineUsers[currentUserId] = onlineUsers[currentUserId].filter(
          (sid) => sid !== socket.id,
        );
        if (onlineUsers[currentUserId].length === 0) {
          await User.findByIdAndUpdate(currentUserId, {
            isOnline: false,
            lastSeen: new Date(),
          });
          delete onlineUsers[currentUserId];
        }
      }
      io.emit("getUsers", Object.keys(onlineUsers));
      clearInterval(socket.lastSeenInterval);
    });

    // Message reactions (works for private & group)
    socket.on("reactMessage", async ({ messageId, emoji, userId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingReaction = message.reactions.find(
          (r) => r.user.toString() === userId,
        );
        if (existingReaction) existingReaction.emoji = emoji;
        else message.reactions.push({ user: userId, emoji });

        await message.save();

        const populatedMessage = await Message.findById(messageId).populate(
          "reactions.user",
          "firstName lastName profilePic",
        );

        if (message.receiver) {
          io.to(message.receiver.toString()).emit(
            "messageReaction",
            populatedMessage,
          );
          io.to(message.sender.toString()).emit(
            "messageReaction",
            populatedMessage,
          );
        } else if (message.group) {
          io.to(message.group.toString()).emit(
            "messageReaction",
            populatedMessage,
          );
        }
      } catch (err) {
        console.error("Socket reaction error:", err);
      }
    });
    // --- Voice & Video Call Signaling --- //

    // // Caller initiates a call
    // socket.on("call-user", ({ to, from, offer, callType }) => {
    //   // callType: "video" or "audio"
    //   io.to(to).emit("incoming-call", { from, offer, callType });
    // });

    // // Receiver answers the call
    // socket.on("answer-call", ({ to, answer }) => {
    //   io.to(to).emit("call-accepted", { answer });
    // });

    // // Exchange ICE candidates
    // socket.on("ice-candidate", ({ to, candidate }) => {
    //   io.to(to).emit("ice-candidate", candidate);
    // });

    // // End call
    // socket.on("end-call", ({ to }) => {
    //   io.to(to).emit("call-ended");
    // });
    // ==========================
    // Register User
    // ==========================
    socket.on("register-user", (userId) => {
      callUsers.set(userId, socket.id);
      socket.userId = userId;

      console.log(`✅ ${userId} registered`);
      console.log(onlineUsers);
    });

    // ==========================
    // Call User
    // ==========================
    socket.on("call-user", async ({ from, to }) => {
      const receiverSocketId = callUsers.get(to);

      if (receiverSocketId) {
        // Fetch caller details
        const caller = await User.findById(from);

        io.to(receiverSocketId).emit("incoming-call", {
          from,
          fromName: caller
            ? `${caller.firstName} ${caller.lastName}`.trim()
            : "Unknown User",
          fromPhoto: caller?.profilePic?.url || "",
        });

        console.log(`${from} is calling ${to}`);

        // Remove previous timer if exists
        if (callTimers.has(from)) {
          clearTimeout(callTimers.get(from));
          callTimers.delete(from);
        }

        const timer = setTimeout(() => {
          const callerSocketId = callUsers.get(from);
          const receiverSocketId = callUsers.get(to);

          if (callerSocketId) {
            io.to(callerSocketId).emit("call-ended", {
              reason: "missed",
            });
          }

          if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-ended", {
              reason: "missed",
            });
          }

          callTimers.delete(from);
        }, 40000);

        callTimers.set(from, timer);
      } else {
        socket.emit("user-not-available");
      }
    });
    // ==========================
    // Accept Call
    // ==========================
    socket.on("accept-call", async ({ from, to }) => {
      const callerSocketId = callUsers.get(to);

      if (callTimers.has(to)) {
        clearTimeout(callTimers.get(to));
        callTimers.delete(to);
      }

      const accepter = await User.findById(from);

      if (callerSocketId) {
        io.to(callerSocketId).emit("call-accepted", {
          from,
          fromName: accepter
            ? `${accepter.firstName} ${accepter.lastName}`.trim()
            : "Unknown User",
          fromPhoto: accepter?.profilePic?.url || "",
        });

        console.log(`${from} accepted the call from ${to}`);
      }
    });

    // ==========================
    // Decline Call
    // ==========================
    socket.on("decline-call", ({ from, to }) => {
      const callerSocketId = callUsers.get(to);

      // Stop 40 sec timer
      if (callTimers.has(to)) {
        clearTimeout(callTimers.get(to));
        callTimers.delete(to);
      }

      if (callerSocketId) {
        io.to(callerSocketId).emit("call-declined", {
          from,
        });

        // Receiver ला पण call-ended पाठव
        io.to(socket.id).emit("call-ended", {
          from,
        });

        console.log(`${from} declined the call from ${to}`);
      }
    });

    // ==========================
    // End Call
    // ==========================
    socket.on("end-call", ({ from, to }) => {
      const receiverSocketId = callUsers.get(to);

      // Stop 40 sec timeout
      if (callTimers.has(from)) {
        clearTimeout(callTimers.get(from));
        callTimers.delete(from);
      }

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("call-ended", {
          from,
        });
      }

      console.log(`${from} ended the call with ${to}`);
    });

    // ==========================
    // WebRTC Offer
    // ==========================
    socket.on("webrtc-offer", ({ from, to, offer }) => {
      const receiverSocketId = callUsers.get(to);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("webrtc-offer", {
          from,
          offer,
        });

        console.log(`${from} sent WebRTC Offer to ${to}`);
      }
    });

    // ==========================
    // WebRTC Answer
    // ==========================
    socket.on("webrtc-answer", ({ from, to, answer }) => {
      const callerSocketId = callUsers.get(to);

      if (callerSocketId) {
        io.to(callerSocketId).emit("webrtc-answer", {
          from,
          answer,
        });

        console.log(`${from} sent WebRTC Answer to ${to}`);
      }
    });

    // ==========================
    // ICE Candidate
    // ==========================
    socket.on("ice-candidate", ({ from, to, candidate }) => {
      const receiverSocketId = callUsers.get(to);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("ice-candidate", {
          from,
          candidate,
        });

        console.log(`${from} sent ICE Candidate to ${to}`);
      }
    });
  });
}

module.exports = initSocket;
