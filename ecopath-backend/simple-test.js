const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'Simple HTTP server is working!',
    timestamp: new Date().toISOString(),
    url: req.url
  }));
});

server.listen(3003, 'localhost', () => {
  console.log('🚀 Simple HTTP server listening on http://localhost:3003');
  console.log('📚 Test with: curl http://localhost:3003/test');
});
