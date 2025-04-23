// BoidWebGLPoints.js
// Handles boid point rendering using Three.js with custom shaders for glow and DNA-based color
import * as THREE from 'three';

export class BoidWebGLPoints {
  constructor(scene, canvas) {
    this.canvas = canvas;
    // Preallocate geometry for up to 1000 boids
    this.maxBoids = 1000;
    this.positions = new Float32Array(this.maxBoids * 3);
    this.colors = new Float32Array(this.maxBoids * 3);
    this.alphas = new Float32Array(this.maxBoids);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));
    this.geometry.setDrawRange(0, 0);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointSize: { value: 8.0 },
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vAlpha = alpha;
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = pointSize * (300.0 / length(mvPosition.xyz));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          float glow = smoothstep(0.5, 0.2, d);
          gl_FragColor = vec4(vColor, vAlpha * glow);
        }
      `,
      vertexColors: true,
      transparent: true,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  update(boids, time) {
    const n = Math.min(boids.length, this.maxBoids);
    for (let i = 0; i < n; i++) {
      this.positions[i * 3] = boids[i].x;
      this.positions[i * 3 + 1] = boids[i].y;
      this.positions[i * 3 + 2] = 0;
      // Color from DNA
      const h = boids[i].dna[3] / 360;
      const s = boids[i].dna[4] / 100;
      const l = boids[i].dna[5] / 100;
      const rgb = hslToRgb(h, s, l);
      this.colors[i * 3] = rgb[0] / 255;
      this.colors[i * 3 + 1] = rgb[1] / 255;
      this.colors[i * 3 + 2] = rgb[2] / 255;
      this.alphas[i] = 0.7 + 0.3 * Math.sin(time / 400 + i); // animated alpha
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;
    this.geometry.setDrawRange(0, n);
    this.material.uniforms.time.value = time;
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
