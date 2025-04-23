// Minimal Express server for boid registry JSON persistence
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.BOID_REGISTRY_PORT || 4001;
const REGISTRY_PATH = path.join(__dirname, '../components/boid_registry.json');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// GET registry
app.get('/api/boid_registry', (req, res) => {
  fs.readFile(REGISTRY_PATH, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read registry.' });
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      res.status(500).json({ error: 'Invalid registry JSON.' });
    }
  });
});

// PUT registry
app.put('/api/boid_registry', (req, res) => {
  try {
    const newRegistry = req.body;
    fs.writeFile(REGISTRY_PATH, JSON.stringify(newRegistry, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to write registry.' });
      }
      res.json({ success: true });
    });
  } catch (e) {
    res.status(400).json({ error: 'Invalid registry data.' });
  }
});

app.listen(PORT, () => {
  console.log(`Boid registry server listening at http://localhost:${PORT}`);
});
