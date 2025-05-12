// Express server for JSON file persistence (boid registry and reflector memory)
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PERSISTENCE_PORT || 4001;

// File paths
const REGISTRY_PATH = path.join(__dirname, '../components/boid_registry.json');
const REFLECTOR_MEMORY_PATH = path.join(__dirname, '../components/MetaLoopChat/reflectorMemory.json');

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

// GET reflector memory
app.get('/api/reflector_memory', (req, res) => {
  // Create the file if it doesn't exist
  if (!fs.existsSync(REFLECTOR_MEMORY_PATH)) {
    fs.writeFileSync(REFLECTOR_MEMORY_PATH, JSON.stringify({
      sessionId: `session_${Date.now()}`,
      startTime: new Date().toISOString(),
      seedPrompt: '',
      overallGoal: '',
      loopCycles: [],
      learnedHeuristics: []
    }, null, 2));
  }
  
  fs.readFile(REFLECTOR_MEMORY_PATH, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read reflector memory.' });
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      res.status(500).json({ error: 'Invalid reflector memory JSON.' });
    }
  });
});

// PUT reflector memory
app.put('/api/reflector_memory', (req, res) => {
  try {
    const newMemory = req.body;
    fs.writeFile(REFLECTOR_MEMORY_PATH, JSON.stringify(newMemory, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to write reflector memory.' });
      }
      res.json({ success: true });
    });
  } catch (e) {
    res.status(400).json({ error: 'Invalid reflector memory data.' });
  }
});

app.listen(PORT, () => {
  console.log(`Persistence server listening at http://localhost:${PORT}`);
  console.log(`- Boid registry: ${REGISTRY_PATH}`);
  console.log(`- Reflector memory: ${REFLECTOR_MEMORY_PATH}`);
});
