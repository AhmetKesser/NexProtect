const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Statik dosyalar
app.use(express.static(path.join(__dirname, "NexProtect")));

// İstek sayısı tutma
let requestCount = 0;

// Her istekte sayıyı artır
app.use((req, res, next) => {
  requestCount++;
  next();
});

// Anasayfa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "NexProtect", "index.html"));
});

// API endpoint: İstek sayısını döner
app.get("/api/requests", (req, res) => {
  res.json({ count: requestCount, timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
