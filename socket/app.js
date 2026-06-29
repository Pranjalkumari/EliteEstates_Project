import http from "http";
import { Server } from "socket.io";

const PORT = 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// userId -> socketId
const onlineUsers = new Map();

const addUser = (userId, socketId) => {
  if (!userId) return;
  onlineUsers.set(String(userId), socketId);
};

const removeUser = (socketId) => {
  for (const [userId, currentSocketId] of onlineUsers.entries()) {
    if (currentSocketId === socketId) {
      onlineUsers.delete(userId);
      break;
    }
  }
};

const getUserSocket = (userId) => {
  if (!userId) return null;
  return onlineUsers.get(String(userId)) || null;
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/online/")) {
    const userId = decodeURIComponent(url.pathname.replace("/online/", ""));
    const isOnline = Boolean(getUserSocket(userId));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ userId, online: isOnline }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Not Found" }));
});

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
  },
});

io.on("connection", (socket) => {
  socket.on("newUser", (userId) => {
    addUser(userId, socket.id);
  });

  socket.on("isUserOnline", (userId, cb) => {
    const online = Boolean(getUserSocket(userId));
    if (typeof cb === "function") {
      cb({ userId, online });
    }
  });

  socket.on("sendMessage", ({ receiverId, data }) => {
    const receiverSocketId = getUserSocket(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("getMessage", data);
    }
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Socket server running on ${PORT}`);
});
