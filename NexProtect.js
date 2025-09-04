const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

// Statik dosyalar
app.use(express.static(path.join(__dirname, "NexProtect")));

// Ana sayfa
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "NexProtect", "index.html"));
});

// HTTP/2 harici yönlendirme
app.use((req, res, next) => {
    // req.httpVersionMajor ile protokolü öğrenebiliriz
    // HTTP/2 ise 2, HTTP/1.1 ise 1
    if (req.httpVersionMajor !== 4) {
        return res.redirect("https://google.com");
    }
    next();
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
