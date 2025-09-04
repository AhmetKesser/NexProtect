const Express = require("express");
const Path = require("path");
const App = Express();
const Port = 3000;

// İstek kayıtları tutulacak
let requests = [];

// Statik dosyalar
App.use(Express.static(Path.join(__dirname, "NexProtect")));

// Her isteği yakala
App.use((req, res, next) => {
    requests.push({
        url: req.originalUrl,
        time: Date.now()
    });

    // 1 dakikadan eski verileri temizle (hafızayı şişirmesin)
    requests = requests.filter(r => r.time > Date.now() - 60 * 1000);
    next();
});

// API endpoint: frontend buradan çekecek
App.get("/api/stats", (req, res) => {
    res.json(requests);
});

// Ana sayfa
App.get("/", (req, res) => {
    res.sendFile(Path.join(__dirname, "NexProtect", "index.html"));
});

App.listen(Port, () => {
    console.log(`OK ! http://localhost:${Port}`);
});
