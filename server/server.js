require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");

const connectDB = require("./config/db");
const i18n = require("./i18n");
const errorHandler = require("./middleware/errorHandler");
const chatRoutes = require("./routes/chatRoutes");

// routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const profileRoutes = require("./routes/profileRoutes");
const contactRoutes = require("./routes/contactRoutes");
const translationRoutes = require("./routes/translationRoutes");

// socket
const initSocket = require("./socket");

const app = express();
const server = http.createServer(app);

// connect DB
connectDB();



// middleware
// app.use(cors());
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(i18n.init);

// routes
app.get("/", (req, res) => res.send({ message: res.__("API is running...") }));
app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/translate", translationRoutes);
app.use("/api/chats", chatRoutes);

// error handler
app.use(errorHandler);

// socket.io
initSocket(server);

// start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
