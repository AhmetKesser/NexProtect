const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

// Store request data
let requestStats = {
    timestamps: [],
    counts: []
};

// Middleware to count requests
app.use((req, res, next) => {
    const now = new Date();
    const minute = now.toISOString().slice(0, 16); // Group by minute
    
    const index = requestStats.timestamps.indexOf(minute);
    if (index === -1) {
        requestStats.timestamps.push(minute);
        requestStats.counts.push(1);
    } else {
        requestStats.counts[index]++;
    }
    
    // Keep only last 60 minutes
    if (requestStats.timestamps.length > 60) {
        requestStats.timestamps.shift();
        requestStats.counts.shift();
    }
    
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, "NexProtect")));

// Route to get stats data
app.get("/stats", (req, res) => {
    res.json(requestStats);
});

// Serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "NexProtect", "index.html"));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
