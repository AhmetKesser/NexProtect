const Express = require("express");
const Path = require("path");
const http = require('http');
const { Server } = require('socket.io');

const App = Express();
const server = http.createServer(App);
const io = new Server(server);
const Port = 3000;

// Analytics veri depolama
let analyticsData = {
    totalRequests: 0,
    todayRequests: 0,
    activeUsers: new Set(),
    requests: [],
    statusCodes: {},
    methods: {},
    responseTimes: []
};

// Middleware - tüm istekleri logla
App.use((req, res, next) => {
    const startTime = Date.now();
    const originalEnd = res.end;
    
    // İstek bilgilerini kaydet
    const requestInfo = {
        timestamp: new Date(),
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
    };
    
    // Yanıt tamamlandığında
    res.end = function(...args) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Analytics verilerini güncelle
        analyticsData.totalRequests++;
        analyticsData.todayRequests++;
        analyticsData.activeUsers.add(requestInfo.ip);
        
        // İstek detaylarını ekle
        const fullRequestInfo = {
            ...requestInfo,
            status: res.statusCode,
            responseTime: responseTime
        };
        
        analyticsData.requests.push(fullRequestInfo);
        
        // Durum kodları
        if (!analyticsData.statusCodes[res.statusCode]) {
            analyticsData.statusCodes[res.statusCode] = 0;
        }
        analyticsData.statusCodes[res.statusCode]++;
        
        // Metodlar
        if (!analyticsData.methods[req.method]) {
            analyticsData.methods[req.method] = 0;
        }
        analyticsData.methods[req.method]++;
        
        // Yanıt süreleri
        analyticsData.responseTimes.push(responseTime);
        if (analyticsData.responseTimes.length > 100) {
            analyticsData.responseTimes.shift();
        }
        
        // Son 24 saati tut
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        analyticsData.requests = analyticsData.requests.filter(req => req.timestamp > oneDayAgo);
        
        // Gerçek zamanlı veri gönder
        io.emit('analyticsUpdate', {
            totalRequests: analyticsData.totalRequests,
            todayRequests: analyticsData.todayRequests,
            activeUsers: analyticsData.activeUsers.size,
            avgResponseTime: Math.round(analyticsData.responseTimes.reduce((a, b) => a + b, 0) / analyticsData.responseTimes.length || 0),
            statusCodes: analyticsData.statusCodes,
            methods: analyticsData.methods,
            latestRequest: fullRequestInfo
        });
        
        originalEnd.apply(this, args);
    };
    
    next();
});

// Static dosyalar
App.use(Express.static(Path.join(__dirname, "NexProtect")));

// Ana sayfa
App.get("/", (req, res) => {
    res.sendFile(Path.join(__dirname, "NexProtect", "index.html"));
});

// Analytics dashboard
App.get("/dashboard", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>NexProtect - Analytics Dashboard</title>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highcharts/11.1.0/highcharts.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.2/socket.io.js"></script>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
                    color: #ffffff;
                    min-height: 100vh;
                }

                .header {
                    background: rgba(0, 0, 0, 0.8);
                    padding: 20px 0;
                    text-align: center;
                    border-bottom: 2px solid #00d4ff;
                    box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
                }

                .header h1 {
                    font-size: 2.5em;
                    background: linear-gradient(45deg, #00d4ff, #0099cc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
                }

                .stats-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    padding: 30px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .stat-card {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0, 212, 255, 0.3);
                    border-radius: 15px;
                    padding: 25px;
                    text-align: center;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
                }

                .stat-number {
                    font-size: 2.5em;
                    font-weight: bold;
                    color: #00d4ff;
                    margin-bottom: 10px;
                    text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
                }

                .stat-label {
                    font-size: 1.1em;
                    color: #cccccc;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .charts-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    padding: 30px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .chart-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(0, 212, 255, 0.2);
                    border-radius: 20px;
                    padding: 20px;
                }

                .chart-title {
                    font-size: 1.3em;
                    margin-bottom: 15px;
                    color: #00d4ff;
                    text-align: center;
                    font-weight: 600;
                }

                #requestsChart, #statusChart, #timeChart, #methodChart {
                    height: 400px;
                }

                .status-indicator {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    display: flex;
                    align-items: center;
                    background: rgba(0, 0, 0, 0.8);
                    padding: 10px 20px;
                    border-radius: 25px;
                    border: 1px solid #00d4ff;
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #00ff00;
                    margin-right: 10px;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            </style>
        </head>
        <body>
            <div class="status-indicator">
                <div class="status-dot"></div>
                <span>Canlı İzleme Aktif</span>
            </div>

            <div class="header">
                <h1>NexProtect Analytics</h1>
            </div>

            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-number" id="totalRequests">0</div>
                    <div class="stat-label">Toplam İstek</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="todayRequests">0</div>
                    <div class="stat-label">Bugünkü İstekler</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="activeUsers">0</div>
                    <div class="stat-label">Aktif Kullanıcı</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="avgResponseTime">0ms</div>
                    <div class="stat-label">Ort. Yanıt Süresi</div>
                </div>
            </div>

            <div class="charts-container">
                <div class="chart-card">
                    <div class="chart-title">İstek Sayısı (Gerçek Zamanlı)</div>
                    <div id="requestsChart"></div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-title">HTTP Durum Kodları</div>
                    <div id="statusChart"></div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-title">İstek Metodları</div>
                    <div id="methodChart"></div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-title">Yanıt Süreleri</div>
                    <div id="timeChart"></div>
                </div>
            </div>

            <script>
                const socket = io();
                let requestsChart, statusChart, methodChart, timeChart;

                // Grafikleri başlat
                function initCharts() {
                    // İstek sayısı grafiği
                    requestsChart = Highcharts.chart('requestsChart', {
                        chart: {
                            type: 'spline',
                            backgroundColor: 'transparent',
                            animation: Highcharts.svg
                        },
                        title: { text: null },
                        xAxis: {
                            type: 'datetime',
                            gridLineColor: 'rgba(255,255,255,0.1)'
                        },
                        yAxis: {
                            title: { text: 'İstek/dk' },
                            gridLineColor: 'rgba(255,255,255,0.1)'
                        },
                        series: [{
                            name: 'İstekler',
                            data: [],
                            color: '#00d4ff'
                        }],
                        plotOptions: {
                            spline: {
                                marker: { enabled: false }
                            }
                        }
                    });

                    // HTTP durum kodları
                    statusChart = Highcharts.chart('statusChart', {
                        chart: {
                            type: 'pie',
                            backgroundColor: 'transparent'
                        },
                        title: { text: null },
                        series: [{
                            name: 'Durum Kodları',
                            data: [],
                            colors: ['#00d4ff', '#00ff88', '#ff6b6b', '#ffd93d', '#6c5ce7']
                        }],
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: true,
                                    format: '<b>{point.name}</b>: {point.y}'
                                }
                            }
                        }
                    });

                    // İstek metodları
                    methodChart = Highcharts.chart('methodChart', {
                        chart: {
                            type: 'column',
                            backgroundColor: 'transparent'
                        },
                        title: { text: null },
                        xAxis: {
                            categories: [],
                            gridLineColor: 'rgba(255,255,255,0.1)'
                        },
                        yAxis: {
                            title: { text: 'İstek Sayısı' },
                            gridLineColor: 'rgba(255,255,255,0.1)'
                        },
                        series: [{
                            name: 'Metodlar',
                            data: [],
                            color: '#00d4ff'
                        }]
                    });

                    // Yanıt süreleri
                    timeChart = Highcharts.chart('timeChart', {
                        chart: {
                            type: 'line',
                            backgroundColor: 'transparent'
                        },
                        title: { text: null },
                        xAxis: {
                            title: { text: 'Son İstekler' },
                            gridLineColor: 'rgba(255,255,255,0.1)'
                        },
                        yAxis: {
                            title: { text: 'Yanıt Süresi (ms)' },
                            gridLineColor: 'rgba(255,255,255,0.1)'
                        },
                        series: [{
                            name: 'Yanıt Süresi',
                            data: [],
                            color: '#00ff88'
                        }]
                    });
                }

                // Socket.IO ile gerçek zamanlı veri alma
                socket.on('analyticsUpdate', function(data) {
                    // İstatistikleri güncelle
                    document.getElementById('totalRequests').textContent = data.totalRequests.toLocaleString();
                    document.getElementById('todayRequests').textContent = data.todayRequests.toLocaleString();
                    document.getElementById('activeUsers').textContent = data.activeUsers;
                    document.getElementById('avgResponseTime').textContent = data.avgResponseTime + 'ms';

                    // İstek sayısı grafiği
                    const now = new Date().getTime();
                    requestsChart.series[0].addPoint([now, 1], true, 
                        requestsChart.series[0].data.length > 50);

                    // HTTP durum kodları
                    const statusData = Object.entries(data.statusCodes).map(([code, count]) => ({
                        name: code,
                        y: count
                    }));
                    statusChart.series[0].setData(statusData);

                    // İstek metodları
                    const methods = Object.keys(data.methods);
                    const methodData = Object.values(data.methods);
                    methodChart.xAxis[0].setCategories(methods);
                    methodChart.series[0].setData(methodData);

                    // Yanıt süresi
                    if (data.latestRequest) {
                        timeChart.series[0].addPoint(data.latestRequest.responseTime, true,
                            timeChart.series[0].data.length > 30);
                    }
                });

                // Sayfa yüklendiğinde başlat
                document.addEventListener('DOMContentLoaded', function() {
                    initCharts();
                });
            </script>
        </body>
        </html>
    `);
});

// Analytics API endpoint'i
App.get("/api/analytics", (req, res) => {
    res.json({
        totalRequests: analyticsData.totalRequests,
        todayRequests: analyticsData.todayRequests,
        activeUsers: analyticsData.activeUsers.size,
        avgResponseTime: Math.round(analyticsData.responseTimes.reduce((a, b) => a + b, 0) / analyticsData.responseTimes.length || 0),
        statusCodes: analyticsData.statusCodes,
        methods: analyticsData.methods,
        recentRequests: analyticsData.requests.slice(-10)
    });
});

// Test endpoint'leri (test amaçlı)
App.get("/api/test", (req, res) => {
    res.json({ message: "Test endpoint çalışıyor!" });
});

App.post("/api/test", (req, res) => {
    res.json({ message: "POST test başarılı!" });
});

App.get("/api/slow", (req, res) => {
    // Yavaş yanıt simülasyonu
    setTimeout(() => {
        res.json({ message: "Yavaş yanıt!" });
    }, Math.random() * 2000 + 1000);
});

// 404 hata yakalama
App.use((req, res) => {
    res.status(404).json({ error: "Sayfa bulunamadı!" });
});

// Socket.IO bağlantıları
io.on('connection', (socket) => {
    console.log('Yeni dashboard bağlantısı: ' + socket.id);
    
    // İlk bağlantıda mevcut verileri gönder
    socket.emit('analyticsUpdate', {
        totalRequests: analyticsData.totalRequests,
        todayRequests: analyticsData.todayRequests,
        activeUsers: analyticsData.activeUsers.size,
        avgResponseTime: Math.round(analyticsData.responseTimes.reduce((a, b) => a + b, 0) / analyticsData.responseTimes.length || 0),
        statusCodes: analyticsData.statusCodes,
        methods: analyticsData.methods
    });
    
    socket.on('disconnect', () => {
        console.log('Dashboard bağlantısı kesildi: ' + socket.id);
    });
});

// Sunucuyu başlat
server.listen(Port, () => {
    console.log(`✅ NexProtect Analytics sunucusu ${Port} portunda çalışıyor!`);
    console.log(`📊 Dashboard: http://localhost:${Port}/dashboard`);
    console.log(`🔗 API: http://localhost:${Port}/api/analytics`);
});
