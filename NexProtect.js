const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Memory'de toplam istek sayısı
let totalRequests = 0;

// Statik dosyalar
app.use(express.static(path.join(__dirname, "NexProtect")));

// Her isteği say
app.use((req, res, next) => {
  totalRequests++;
  next();
});

// API endpoint: frontend buradan veriyi çekecek
app.get("/api/stats", (req, res) => {
  res.json({ totalRequests });
});

// Ana sayfa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "NexProtect", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
