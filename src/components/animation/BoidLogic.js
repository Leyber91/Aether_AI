// BoidLogic.js
// Handles all boid state, evolution, and registry logic (renderer-agnostic)

// --- Utility: Make Boid ID ---
let boidIdCounter = 1;
export function makeBoidId() {
  return 'b' + (boidIdCounter++).toString(36) + '_' + Math.floor(Math.random()*1e6).toString(36);
}

// --- DNA Defaults ---
export const DEFAULT_DNA = [0.05, 0.015, 0.015, 198, 100, 60, 2, 0.01, 0.01, 0.008, 0.15, 8, 0.5, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];

// --- Boid Spawning Logic ---
// Returns true if spawn was successful, false otherwise
export function spawn(pool, live, W, H, registry, parent = null, resourceState = { fps: 60, memRatio: 0.05 }, nextSpecies = 1) {
  if (live >= pool.length) return false;
  let b = pool[live];
  if (!b) {
    b = {};
    pool[live] = b;
  }
  const a = parent ? Math.atan2(parent.vy, parent.vx) + (Math.random()-0.5)*0.3 : Math.random() * Math.PI * 2;
  const s = parent ? Math.hypot(parent.vx, parent.vy) * (0.85 + Math.random()*0.3) : 0.25 + Math.random() * 0.45;
  b.x  = parent ? parent.x + Math.cos(a)*16 : Math.random() * W;
  b.y  = parent ? parent.y + Math.sin(a)*16 : Math.random() * H;
  b.vx = Math.cos(a) * s;
  b.vy = Math.sin(a) * s;
  b.age  = 0;
  b.born = performance.now();
  b.id = makeBoidId();
  b.state = 'alive';
  b.fade = 0; // fade in
  if (parent) {
    // Inherit and meta-mutate
    b.dna = parent.dna.map((v, i) => {
      let mut = (parent.dna[7] || 0.01);
      if (i === 7 && Math.random() < parent.dna[9]) mut *= (0.9 + Math.random()*0.2); // meta-mutation
      if (i === 9) v *= (0.95 + Math.random() * 0.1); // metaMut gene
      if (i === 10) v = Math.max(0, Math.min(1, v + (Math.random()-0.5)*0.02)); // social
      if (i === 11) v = Math.max(2, Math.round(v + (Math.random()-0.5)*2)); // stratMem
      if (i === 12) v = Math.max(0.1, Math.min(1, v + (Math.random()-0.5)*0.05)); // envSens
      if (i >= 13) v = Math.max(-1, Math.min(1, v + (Math.random()-0.5)*0.1)); // neural dna
      return v + (Math.random() < mut ? v * mut * (i<3?0.2:0.1) : 0);
    });
    b.gen = parent.gen + 1;
    b.species = parent.species;
    b.mutEvents = parent.mutEvents;
    b.efficiency = parent.efficiency;
    b.colony = parent.colony;
    b.ancestry = [...(parent.ancestry || []), parent.id];
    b.innovations = [...(parent.innovations || [])];
    b.commHistory = [...(parent.commHistory || [])];
    b.movementMode = (Math.random() < 0.97) ? parent.movementMode : randomMovementMode();
    b.escaped = false;
    b.escapeTimer = 0;
    b.ghostTrail = [];
    if (Math.random() < 0.01) { b.species = nextSpecies; b.mutEvents++; }
  } else if (registry.length && Math.random() < 0.7) {
    if (resourceState.memRatio < 0.2 && Math.random() < 0.2) {
      const bestDNA = getBestEfficiencyDNA(registry);
      if (bestDNA) b.dna = [...bestDNA];
    } else {
      const best = registry[Math.floor(Math.random() * registry.length)];
      b.dna = [...best.dna];
      b.gen = best.gen || 1;
      b.species = best.species || 0;
      b.mutEvents = best.mutEvents || 0;
      b.efficiency = best.efficiency || 0;
      b.colony = best.colony || 0;
      b.ancestry = best.ancestry ? [...best.ancestry] : [];
      b.innovations = best.innovations ? [...best.innovations] : [];
      b.commHistory = best.commHistory ? [...best.commHistory] : [];
      b.movementMode = best.movementMode || 'normal';
      b.escaped = false;
      b.escapeTimer = 0;
      b.ghostTrail = [];
    }
  } else {
    b.dna = [...DEFAULT_DNA];
    b.gen = 1;
    b.species = 0;
    b.mutEvents = 0;
    b.efficiency = 0;
    b.colony = 0;
    b.ancestry = [];
    b.innovations = [];
    b.commHistory = [];
    b.movementMode = 'normal';
    b.escaped = false;
    b.escapeTimer = 0;
    b.ghostTrail = [];
  }
  return true;
}

function getBestEfficiencyDNA(registry) {
  if (!registry.length) return null;
  let best = registry[0];
  for (let i = 1; i < registry.length; i++) {
    if ((registry[i].efficiency || 0) > (best.efficiency || 0)) best = registry[i];
  }
  return best.dna;
}

function randomMovementMode() {
  const modes = ['normal', 'spiral', 'pulse', 'lobed'];
  return modes[Math.floor(Math.random() * modes.length)];
}

// --- Registry load/save (stub, to be implemented with backend or fs) ---
export function loadBoidRegistry() {
  // Load registry from JSON file (stub)
}

export function saveBoidRegistry(pool) {
  // Save registry to JSON file (stub)
}

// --- Multi-Frame Logic Scheduling & Dynamic LOD ---
// Global logic frame counter
let logicFrame = 0;
// Shared grid cache for throttled rebuilds
let _grid, _gridCols, _gridRows, _cellSize;

const MAX_TRAIL_LEN = 12; // strict cap for all boids
const MAX_REGISTRY_SIZE = 200; // keep only the last 200 most fit entries

export function updateBoids(pool, live, W, H, resourceState, registry, nextSpecies, options = {}) {
  // Multi-frame scheduling: update only a subset of boids per frame
  // Dynamic logic grouping based on FPS: more slices when slow
  const logicGroups = resourceState.fps < 30 ? 6 : 3;
  logicFrame = (logicFrame + 1) % logicGroups;

  // Rebuild grid when needed (persist cache across frames)
  if (!_grid || logicFrame === 0 || resourceState.fps > 55) {
    ({ grid: _grid, gridCols: _gridCols, gridRows: _gridRows, cellSize: _cellSize } = buildSpatialGrid(pool, live, W, H));
  }

  for (let i = 0; i < live; i++) {
    if (!pool[i] || !Number.isFinite(pool[i].x) || !Number.isFinite(pool[i].y)) {
      // Log every invalid boid index and contents for diagnosis
      console.warn(`[updateBoids] Skipping invalid boid: {i: ${i}, b:`, pool[i], '}');
      continue;
    }
    const b = pool[i];
    // Dynamic LOD: skip offscreen boids or those in distant regions
    if (options.viewport) {
      const { minX, maxX, minY, maxY } = options.viewport;
      if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) {
        // Skip update for offscreen boids
        continue;
      }
    }
    // Multi-frame scheduling: skip boids not in this logic group
    if ((i % logicGroups) !== logicFrame) continue;
    // Movement update (simple physics + DNA influence)
    b.x += b.vx;
    b.y += b.vy;
    b.age++;
    // Wrap around screen
    if (b.x < 0) b.x += W;
    if (b.x > W) b.x -= W;
    if (b.y < 0) b.y += H;
    if (b.y > H) b.y -= H;
    // Social: interact with neighbors
    // (simple: cohesion, separation, alignment)
    let coh = {x:0, y:0}, sep = {x:0, y:0}, ali = {x:0, y:0}, count=0, sepCount=0;
    const neighbors = getNeighbors(pool, i, _grid, _gridCols, _gridRows, _cellSize, 60);
    for (const j of neighbors) {
      const o = pool[j];
      coh.x += o.x; coh.y += o.y;
      ali.x += o.vx; ali.y += o.vy;
      count++;
      if (Math.hypot(b.x - o.x, b.y - o.y) < 24) { sep.x -= (o.x - b.x); sep.y -= (o.y - b.y); sepCount++; }
    }
    if (count) {
      // Cohesion
      coh.x = coh.x / count - b.x;
      coh.y = coh.y / count - b.y;
      // Alignment
      ali.x = ali.x / count - b.vx;
      ali.y = ali.y / count - b.vy;
    }
    if (sepCount) {
      sep.x /= sepCount; sep.y /= sepCount;
    }
    // Apply social forces (DNA weights)
    b.vx += b.dna[0] * coh.x + b.dna[1] * sep.x + b.dna[2] * ali.x;
    b.vy += b.dna[0] * coh.y + b.dna[1] * sep.y + b.dna[2] * ali.y;
    // Neural DNA/Agent Brain Experimentation
    const turn = boidBrain([coh.x, sep.x], b.dna);
    b.vx += turn * 0.12; b.vy += turn * 0.12;
    // Limit speed
    const speed = Math.hypot(b.vx, b.vy);
    const maxSpeed = 2.5 + b.dna[12];
    if (speed > maxSpeed) {
      b.vx *= maxSpeed / speed;
      b.vy *= maxSpeed / speed;
    }
    // Real-time evolution (crowding/isolation)
    if (count < 2 && Math.random() < 0.01) b.dna[0] += (Math.random()-0.5)*0.002;
    if (count > 8 && Math.random() < 0.01) b.dna[1] += (Math.random()-0.5)*0.002;
    // Social learning
    if (b.innovations && b.innovations.length > 0) {
      const best = b.innovations[b.innovations.length-1];
      for (const j of neighbors) {
        const o = pool[j];
        // Defensive: ensure o.innovations is an array before using find
        if (!o || !Array.isArray(o.innovations)) {
          console.warn(`[updateBoids] Neighbor boid at index ${j} is missing or has invalid innovations array:`, o);
          continue;
        }
        if (!o.innovations.find(e => e.detail === best.detail)) {
          o.innovations.push({...best});
          recordComm(o, `Learned innovation: ${best.type}`);
        }
      }
    }
    // Ghost trail logic, etc. (unchanged)
    b.ghostTrail = b.ghostTrail || [];
    b.ghostTrail.push({x: b.x, y: b.y, t: performance.now()});
    if (b.ghostTrail.length > MAX_TRAIL_LEN) b.ghostTrail.splice(0, b.ghostTrail.length - MAX_TRAIL_LEN);
    // Social learning: communicate with neighbors
    if (count && Math.random() < b.dna[10]) {
      // Share best innovation (if any)
      if (b.innovations && b.innovations.length > 0) {
        const best = b.innovations[b.innovations.length-1];
        for (const j of neighbors) {
          const o = pool[j];
          if (!o || !Array.isArray(o.innovations)) {
            console.warn(`[updateBoids] Neighbor boid at index ${j} is missing or has invalid innovations array:`, o);
            continue;
          }
          if (!o.innovations.find(e => e.detail === best.detail)) {
            o.innovations.push({...best});
            recordComm(o, `Learned innovation: ${best.type}`);
          }
        }
      }
    }
    // Adaptive evolution: if crowded, mutate for separation; if alone, mutate for cohesion
    if (count > 12 && Math.random() < b.dna[7]*2) {
      b.dna[0] *= 1.01 + Math.random()*0.01; // separation
      recordInnovation(b, 'sepBoost', 'Crowded environment');
    }
    if (count < 2 && Math.random() < b.dna[7]*2) {
      b.dna[1] *= 1.01 + Math.random()*0.01; // cohesion
      recordInnovation(b, 'cohBoost', 'Isolated environment');
    }
    // If boid is very old, fade out and mark for replacement
    if (b.age > 800 + Math.random()*800) {
      b.state = 'fading';
      b.fade = 1;
    }
  }
  // 2. Cull and respawn (evolutionary cycle)
  let faded = 0;
  for (let i = 0; i < live; i++) {
    const b = pool[i];
    if (b.state === 'fading') {
      b.fade -= 0.04;
      if (b.fade <= 0) {
        // Save to registry if efficient
        if (b.efficiency > 0.2) registry.push({
          dna: [...b.dna], gen: b.gen, species: b.species, mutEvents: b.mutEvents,
          efficiency: b.efficiency, colony: b.colony, ancestry: [...b.ancestry],
          innovations: [...b.innovations], commHistory: [...b.commHistory],
          movementMode: b.movementMode
        });
        faded++;
        // Respawn
        spawn(pool, i, W, H, registry, null, resourceState, nextSpecies);
      }
    }
  }
  // 3. Save registry after every evolutionary cycle
  if (registry.length > MAX_REGISTRY_SIZE) {
    // Sort by fitness, keep only the best
    registry.sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0));
    registry.length = MAX_REGISTRY_SIZE;
  }
  saveBoidRegistry(registry);
}

// --- Neural DNA/Agent Brain Experimentation ---
function boidBrain(inputs, dna) {
  // 2 inputs, 2 hidden, 1 output
  // h1 = tanh(w1*x1 + w2*x2 + b1)
  // h2 = tanh(w3*x1 + w4*x2 + b1)
  // out = tanh(w5*h1 + w6*h2 + w7*x1 + w8*x2 + b2)
  const h1 = Math.tanh(dna[13]*inputs[0] + dna[14]*inputs[1] + dna[18]);
  const h2 = Math.tanh(dna[15]*inputs[0] + dna[16]*inputs[1] + dna[18]);
  const out = Math.tanh(dna[17]*h1 + dna[19]*h2 + dna[13]*inputs[0] + dna[14]*inputs[1] + dna[19]);
  return out;
}

// --- Optimized Spatial Grid for O(N) Neighbor Search ---
export function buildSpatialGrid(pool, live, W, H, cellSize = 80) {
  const gridCols = Math.ceil(W / cellSize);
  const gridRows = Math.ceil(H / cellSize);
  const grid = Array.from({ length: gridCols * gridRows }, () => []);
  for (let i = 0; i < live; i++) {
    const b = pool[i];
    const col = Math.floor(b.x / cellSize);
    const row = Math.floor(b.y / cellSize);
    // Defensive: clamp col/row and ensure grid cell exists
    const safeCol = Math.max(0, Math.min(gridCols - 1, col));
    const safeRow = Math.max(0, Math.min(gridRows - 1, row));
    const idx = safeCol + gridCols * safeRow;
    if (!Array.isArray(grid[idx])) grid[idx] = [];
    grid[idx].push(i);
  }
  return { grid, gridCols, gridRows, cellSize };
}

export function getNeighbors(pool, i, grid, gridCols, gridRows, cellSize, radius = 60) {
  const b = pool[i];
  if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.y)) {
    // Log every invalid boid index and contents for diagnosis
    console.warn(`[getNeighbors] Skipping invalid boid: {i: ${i}, b:`, pool[i], '}');
    return [];
  }
  const col = Math.floor(b.x / cellSize);
  const row = Math.floor(b.y / cellSize);
  let neighbors = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const ncol = col + dx;
      const nrow = row + dy;
      if (ncol < 0 || ncol >= gridCols || nrow < 0 || nrow >= gridRows) continue;
      const idx = ncol + gridCols * nrow;
      if (!Array.isArray(grid[idx])) continue; // Defensive: skip if not initialized
      for (const j of grid[idx]) {
        const other = pool[j];
        if (
          i !== j &&
          other &&
          Number.isFinite(other.x) && Number.isFinite(other.y) &&
          Math.hypot(b.x - other.x, b.y - other.y) < radius
        ) {
          neighbors.push(j);
        }
      }
    }
  }
  return neighbors;
}

// --- Additional logic migrated from LoginBackground.js ---
export function recordInnovation(boid, type, detail) {
  if (!boid.innovations) {
    boid.innovations = [];
    console.warn('[recordInnovation] boid.innovations was undefined, initializing as empty array:', boid);
  }
  boid.innovations.push({ t: Date.now(), type, detail });
}

export function recordComm(boid, msg) {
  boid.commHistory.push({ t: Date.now(), msg });
}

export function fitness(b, W, H) {
  return (performance.now() - b.born) - 0.5 * Math.hypot(b.x - W / 2, b.y - H / 2);
}

export function getMemRatio() {
  if (performance && performance.memory) {
    const mem = performance.memory;
    return mem.usedJSHeapSize / mem.jsHeapSizeLimit;
  }
  return 0.05;
}

// --- Resource-Aware Adaptive Scaling ---
export function adaptiveScale(pool, state, setState) {
  // state: { fps, memRatio, boidCount, trailLength, meshDensity, bloom }
  // setState: function to update state (or mutate in place if not React)
  let { fps, memRatio, boidCount, trailLength, meshDensity, bloom } = state;

  // Lower boid count if FPS is low or memory is high
  if (fps < 28 && boidCount > 80) {
    boidCount = Math.max(40, Math.floor(boidCount * 0.8));
  } else if (fps > 55 && boidCount < 350) {
    boidCount = Math.min(350, boidCount + 8);
  }
  // Lower trail length if FPS/mem is low
  if (fps < 28 || memRatio > 0.25) {
    trailLength = Math.max(6, Math.floor(trailLength * 0.7));
  } else if (fps > 55 && trailLength < 24) {
    trailLength = Math.min(24, trailLength + 2);
  }
  // Lower mesh density if FPS is low
  if (fps < 28 && meshDensity > 1) {
    meshDensity = Math.max(1, meshDensity - 1);
  } else if (fps > 55 && meshDensity < 4) {
    meshDensity = meshDensity + 1;
  }
  // Disable bloom if FPS is low
  if (fps < 28 && bloom) bloom = false;
  else if (fps > 55 && !bloom) bloom = true;

  // Update state
  setState({ ...state, boidCount, trailLength, meshDensity, bloom });
}
