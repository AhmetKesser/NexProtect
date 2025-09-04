const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 80;

// Statik dosyalar
app.use(express.static(path.join(__dirname, "NexProtect")));

// Anasayfa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "NexProtect", "index.html"));
});

// İstek sayısı tutma
let requestCount = 0;

// Her istekte sayıyı artır
app.use((req, res, next) => {
  requestCount++;
  io.emit("update", requestCount); // Socket ile frontend'e gönder
  next();
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
