// BoidWebGLMesh.js
// Handles mesh/connections between boids using Three.js, with animated color and pulse
import * as THREE from 'three';

export class BoidWebGLMesh {
  constructor(scene) {
    this.maxLines = 3000; // support up to 1000 boids * 3 neighbors
    this.positions = new Float32Array(this.maxLines * 2 * 3); // start+end per line
    this.colors = new Float32Array(this.maxLines * 2 * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setDrawRange(0, 0);
    this.material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5 });
    this.lines = new THREE.LineSegments(this.geometry, this.material);
    scene.add(this.lines);
  }

  update(boids, time) {
    let lineCount = 0;
    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      // Find 3 nearest neighbors (simple O(N) for now; can optimize with grid if needed)
      let neighbors = [];
      for (let j = 0; j < boids.length; j++) {
        if (i === j) continue;
        const o = boids[j];
        const dx = b.x - o.x, dy = b.y - o.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 180 * 180) {
          neighbors.push({ o, dist2, j });
        }
      }
      neighbors.sort((a, b) => a.dist2 - b.dist2);
      for (let k = 0; k < Math.min(3, neighbors.length); k++) {
        if (lineCount >= this.maxLines) break;
        const o = neighbors[k].o;
        // Start point
        this.positions[lineCount * 6 + 0] = b.x;
        this.positions[lineCount * 6 + 1] = b.y;
        this.positions[lineCount * 6 + 2] = 0;
        // End point
        this.positions[lineCount * 6 + 3] = o.x;
        this.positions[lineCount * 6 + 4] = o.y;
        this.positions[lineCount * 6 + 5] = 0;
        // Colors (start)
        const h1 = b.dna[3] / 360, s1 = b.dna[4] / 100, l1 = b.dna[5] / 100;
        const h2 = o.dna[3] / 360, s2 = o.dna[4] / 100, l2 = o.dna[5] / 100;
        const rgb1 = hslToRgb(h1, s1, l1);
        const rgb2 = hslToRgb(h2, s2, l2);
        this.colors[lineCount * 6 + 0] = rgb1[0]/255;
        this.colors[lineCount * 6 + 1] = rgb1[1]/255;
        this.colors[lineCount * 6 + 2] = rgb1[2]/255;
        this.colors[lineCount * 6 + 3] = rgb2[0]/255;
        this.colors[lineCount * 6 + 4] = rgb2[1]/255;
        this.colors[lineCount * 6 + 5] = rgb2[2]/255;
        lineCount++;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.setDrawRange(0, lineCount * 2);
  }
}

// Utility: HSL to RGB
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = function(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
