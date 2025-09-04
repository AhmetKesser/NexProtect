const Express = require("express");
const Path = require("path");
const App = Express();

const Port = 3000;

App.use((req, res, next) => {
    if (req.httpVersion !== '2.0') {
        return res.redirect(301, 'https://www.google.com');
    }
    next();
});

App.use(Express.static(Path.join(__dirname, "NexProtect")));

App.get("/", (Req, Res) => {
    Res.sendFile(Path.join(__dirname, "NexProtect", "index.html"));
});

App.listen(Port, () => {
    console.log(`OK !`);
});
