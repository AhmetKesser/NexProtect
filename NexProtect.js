const http = require("http");
const WebSocket = require("ws");
const cluster = require("cluster");
const os = require("os");

const cpus = os.cpus().length;
const port = 8080;
const index = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Layer7 - DSTAT</title>
    <style>
      html,
      body {
        height: 100%;
        margin: 0;
      }

      body {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      }

      body > div {
        width: 100%;
      }

      #chart {
        width: 80%;
        margin: auto;
      }

      #info {
        margin-top: 2em;
        text-align: center;
        font-family: Arial, Helvetica, sans-serif;
      }
    </style>
  </head>

  <body>
    <div>
      <h2 id="info"></h2>
      <div id="chart"></div>
    </div>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script>
      window.onload = () => {
        let info = document.getElementById("info");

        let chart = Highcharts.chart("chart", {
          exporting: {
            enabled: true,
          },
          chart: {
            type: "area",
          },
          title: {
            text: "Layer7 DSTAT",
          },
          xAxis: {
            type: "datetime",
          },
          yAxis: {
            title: {
              text: "",
            },
          },
          series: [
            {
              name: "Requests",
              data: [],
            },
          ],
        });

        info.innerText = "Capturing requests from " + location.host + "/dstat";

        let ws = new WebSocket(
          (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/"
        );

        ws.onmessage = (event) => {
          let requests = Number(event.data);
          let time = new Date().getTime();
          chart.series[0].addPoint([time, requests], true, chart.series[0].points.length > 60);
        };
      };
    </script>
  </body>
</html>
`;

if (cluster.isMaster) {
  console.log(`Number of CPUs is ${cpus}`);
  console.log(`Master ${process.pid} is running`);

  let requests = 0;
  let childs = [];
  for (let i = 0; i < cpus; i++) {
    let child = cluster.fork();
    child.on("message", (msg) => {
      requests++;
    });
    childs.push(child);
  }

  setInterval(() => {
    for (let child of childs) {
      child.send(requests);
    }
    requests = 0;
  }, 1000);
} else {
  console.log(`Worker ${process.pid} started`);

  const handler = function (req, res) {
    if (req.url == "/dstat") {
      process.send(0);
      res.end();
    } else {
      res.end(index);
    }
  };

  const server = http.createServer(handler);
  const wss = new WebSocket.Server({ server });

  process.on("message", (requests) => {
    wss.clients.forEach((client) => client.send(requests));
  });

  server.listen(port);
}
