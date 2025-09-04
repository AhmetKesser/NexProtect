const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

// İstekleri kaydetmek için array
let requestsLog = [];

// Gelen tüm istekleri kaydet
app.use((req, res, next) => {
    const logItem = {
        url: req.originalUrl,
        method: req.method,
        status: null, // daha sonra dolduracağız
        time: new Date()
    };

    // Yanlış istekleri 404 ile yakalamak için res.on kullanıyoruz
    res.on("finish", () => {
        logItem.status = res.statusCode;
        requestsLog.push(logItem);

        // RAM çok dolmasın diye son 100 isteği tut
        if (requestsLog.length > 100) requestsLog.shift();
    });

    next();
});

// Statik dosyalar
app.use(express.static(path.join(__dirname, "NexProtect")));

// Ana sayfa
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "NexProtect", "index.html"));
});

// API endpoint: istek loglarını JSON olarak ver
app.get("/api/requests", (req, res) => {
    res.json(requestsLog);
});

// 404 yakalama
app.use((req, res) => {
    res.status(404).send("Sayfa bulunamadı");
});

app.listen(port, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${port}`);
});
