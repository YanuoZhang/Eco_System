const http = require('http');
const url = require('url');

// Mock energy mix data approximated from Open Electricity dataset
const energyMixByState = {
  VIC: [
    { source: "coal", percentage: 63, generation: 4200 },
    { source: "gas", percentage: 6, generation: 400 },
    { source: "hydro", percentage: 6, generation: 400 },
    { source: "wind", percentage: 20, generation: 1300 },
    { source: "solar", percentage: 5, generation: 340 },
  ],
  NSW: [
    { source: "coal", percentage: 70, generation: 5200 },
    { source: "gas", percentage: 6, generation: 450 },
    { source: "hydro", percentage: 7, generation: 520 },
    { source: "wind", percentage: 8, generation: 600 },
    { source: "solar", percentage: 9, generation: 670 },
  ],
  QLD: [
    { source: "coal", percentage: 72, generation: 5400 },
    { source: "gas", percentage: 12, generation: 900 },
    { source: "hydro", percentage: 3, generation: 220 },
    { source: "wind", percentage: 2, generation: 150 },
    { source: "solar", percentage: 11, generation: 820 },
  ]
};

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Health check endpoint
  if (pathname === '/healthz' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Energy mix endpoint
  if (pathname === '/api/energy-mix' && req.method === 'GET') {
    const stateParam = String(query.state || '').toUpperCase();

    if (!stateParam) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: "Missing required query param 'state' (e.g., ?state=VIC)"
      }));
      return;
    }

    const data = energyMixByState[stateParam];
    if (!data) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: `Unsupported or unknown state '${stateParam}'`
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const port = 3004;
server.listen(port, 'localhost', () => {
  console.log(`🚀 Energy Mix API server listening on http://localhost:${port}`);
  console.log(`📚 Test with: curl "http://localhost:${port}/api/energy-mix?state=VIC"`);
  console.log(`📚 Health check: curl "http://localhost:${port}/healthz"`);
});
