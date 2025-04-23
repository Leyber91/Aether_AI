// BoidRendererWebGL.js
// Modular WebGL renderer with optional bloom postprocessing
import * as THREE from 'three';
import { BoidWebGLPoints } from './BoidWebGLPoints';
import { BoidWebGLMesh } from './BoidWebGLMesh';
import { BoidWebGLTrails } from './BoidWebGLTrails';
import { BloomComposer } from './BloomComposer';

// --- Frame counters for throttling ---
let meshFrame = 0;
let trailFrame = 0;

export class BoidRendererWebGL {
  constructor(canvas, { bloom = false, superLod = false } = {}) {
    if (!canvas) throw new Error('BoidRendererWebGL requires a canvas');
    this.canvas = canvas;
    this.useBloom = bloom;
    this.superLod = superLod;
    this.initThree();
  }

  initThree() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setSize(this.canvas.width, this.canvas.height, false);
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, this.canvas.width, this.canvas.height, 0, -1000, 1000);
    // Modular sub-renderers
    this.pointsRenderer = new BoidWebGLPoints(this.scene, this.canvas);
    this.meshRenderer = new BoidWebGLMesh(this.scene);
    this.trailsRenderer = new BoidWebGLTrails(this.scene);
    if (this.useBloom) {
      this.bloomComposer = new BloomComposer(this.renderer, this.scene, this.camera);
    }
  }

  setBloom(enabled) {
    this.useBloom = enabled;
    if (enabled && !this.bloomComposer) {
      this.bloomComposer = new BloomComposer(this.renderer, this.scene, this.camera);
    }
  }

  setSuperLod(enabled) {
    this.superLod = enabled;
  }

  renderBoids(boids) {
    const time = Date.now();
    // Throttle mesh/trail updates
    meshFrame = (meshFrame + 1) % (this.superLod ? 6 : 2);
    trailFrame = (trailFrame + 1) % (this.superLod ? 6 : 3);
    if (trailFrame === 0) this.trailsRenderer.update(boids, time);
    if (meshFrame === 0) this.meshRenderer.update(boids, time);
    this.pointsRenderer.update(boids, time);
    this.renderer.setSize(this.canvas.width, this.canvas.height, false);
    this.camera.right = this.canvas.width;
    this.camera.bottom = this.canvas.height;
    this.camera.updateProjectionMatrix();
    if (this.useBloom && this.bloomComposer) {
      this.bloomComposer.setSize(this.canvas.width, this.canvas.height);
      this.bloomComposer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // --- Neural Brain Visualization Overlay ---
  // Draw a simple neural net overlay for a selected boid
  renderBrainOverlay(boid, ctx, x, y, scale = 32) {
    if (!boid || !boid.dna) return;
    // 2 inputs, 2 hidden, 1 output
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.9;
    // Draw input nodes
    ctx.fillStyle = '#44f';
    ctx.beginPath(); ctx.arc(-1, 0, 0.13, 0, 2*Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(-1, 1, 0.13, 0, 2*Math.PI); ctx.fill();
    // Draw hidden nodes
    ctx.fillStyle = '#4f4';
    ctx.beginPath(); ctx.arc(0, 0.3, 0.13, 0, 2*Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0.7, 0.13, 0, 2*Math.PI); ctx.fill();
    // Draw output node
    ctx.fillStyle = '#f44';
    ctx.beginPath(); ctx.arc(1, 0.5, 0.13, 0, 2*Math.PI); ctx.fill();
    // Draw weights as lines
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 0.06;
    // Input to hidden
    ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(0, 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(0, 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, 1); ctx.lineTo(0, 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, 1); ctx.lineTo(0, 0.7); ctx.stroke();
    // Hidden to output
    ctx.beginPath(); ctx.moveTo(0, 0.3); ctx.lineTo(1, 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0.7); ctx.lineTo(1, 0.5); ctx.stroke();
    ctx.restore();
  }

  // Example usage: call renderBrainOverlay(selectedBoid, overlayCanvasCtx, 40, 40, 36)
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
