const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Statik dosyalar
app.use(express.static(path.join(__dirname, "NexProtect")));

// Son 30 saniye istek zamanlarını tut
let requestTimes = [];

// Her istekte zaman damgası ekle
app.use((req, res, next) => {
  const now = Date.now();
  requestTimes.push(now);

  // 30 saniyeden eski kayıtları temizle
  requestTimes = requestTimes.filter(ts => now - ts <= 30000);

  next();
});

// Anasayfa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "NexProtect", "index.html"));
});

// Anlık ziyaretçi sayısı
app.get("/api/active", (req, res) => {
  res.json({ active: requestTimes.length });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
