const express = require('express');
const cors = require('cors');
const app = express();
const port = 3002;

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

app.use(cors());
app.use(express.json());

// GET /api/energy-mix?state=VIC
app.get('/api/energy-mix', (req, res) => {
  const stateParam = String(req.query.state || '').toUpperCase();

  if (!stateParam) {
    return res.status(400).json({
      error: "Missing required query param 'state' (e.g., ?state=VIC)"
    });
  }

  const data = energyMixByState[stateParam];
  if (!data) {
    return res.status(404).json({
      error: `Unsupported or unknown state '${stateParam}'`
    });
  }

  return res.json(data);
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`🚀 Energy Mix API server listening on http://localhost:${port}`);
  console.log(`📚 Test with: curl "http://localhost:${port}/api/energy-mix?state=VIC"`);
  console.log(`📚 OpenAPI docs would be at: http://localhost:${port}/docs`);
});
