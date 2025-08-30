const express = require('express');
const app = express();
const port = 3002;

app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Simple test server listening on http://localhost:${port}`);
  console.log(`📚 Test endpoint: http://localhost:${port}/test`);
});
