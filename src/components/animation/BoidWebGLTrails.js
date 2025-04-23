// BoidWebGLTrails.js
// Handles organic, fading ghost trails for each boid
import * as THREE from 'three';

export class BoidWebGLTrails {
  constructor(scene) {
    this.maxSegments = 10000; // support up to 1000 boids * 10 trail segments
    this.positions = new Float32Array(this.maxSegments * 2 * 3); // start+end per segment
    this.colors = new Float32Array(this.maxSegments * 2 * 3);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setDrawRange(0, 0);
    this.material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.35 });
    this.lines = new THREE.LineSegments(this.geometry, this.material);
    scene.add(this.lines);
  }

  update(boids) {
    let segCount = 0;
    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      if (!b.ghostTrail || b.ghostTrail.length < 2) continue;
      const n = Math.min(b.ghostTrail.length, 12); // cap for safety
      for (let j = 1; j < n; j++) {
        if (segCount >= this.maxSegments) break;
        // Start point
        this.positions[segCount * 6 + 0] = b.ghostTrail[j-1].x;
        this.positions[segCount * 6 + 1] = b.ghostTrail[j-1].y;
        this.positions[segCount * 6 + 2] = 0;
        // End point
        this.positions[segCount * 6 + 3] = b.ghostTrail[j].x;
        this.positions[segCount * 6 + 4] = b.ghostTrail[j].y;
        this.positions[segCount * 6 + 5] = 0;
        // Fade color and alpha along trail
        const t = j / n;
        const h = b.dna[3] / 360;
        const s = b.dna[4] / 100;
        const l = b.dna[5] / 100;
        const rgb = hslToRgb(h, s, l);
        this.colors[segCount * 6 + 0] = rgb[0] / 255 * (0.2 + 0.5 * t);
        this.colors[segCount * 6 + 1] = rgb[1] / 255 * (0.2 + 0.5 * t);
        this.colors[segCount * 6 + 2] = rgb[2] / 255 * (0.2 + 0.5 * t);
        this.colors[segCount * 6 + 3] = rgb[0] / 255 * (0.2 + 0.5 * t);
        this.colors[segCount * 6 + 4] = rgb[1] / 255 * (0.2 + 0.5 * t);
        this.colors[segCount * 6 + 5] = rgb[2] / 255 * (0.2 + 0.5 * t);
        segCount++;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.setDrawRange(0, segCount * 2);
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
