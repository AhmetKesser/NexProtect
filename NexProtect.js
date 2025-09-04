const Express = require("express");
const Path = require("path");
const App = Express();

const Port = 3000;

App.use(Express.static(Path.join(__dirname, "NexProtect")));

App.use((Req, Res, Next) => {
    if (Req.httpVersionMajor !== 4) {
        return Res.redirect("https://google.com");
    }
    Next();
});

App.get("/", (Req, Res) => {
    Res.sendFile(Path.join(__dirname, "NexProtect", "index.html"));
});

App.listen(Port, () => {
    console.log(`OK !`);
});
