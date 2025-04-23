// MeshConnections.js
// Handles flock/connection mesh drawing for both 2D and WebGL

// For 2D Canvas: Draw organic mesh connections (Bezier/neighbor logic)
export function drawMesh2D(ctx, boids) {
  ctx.save();
  for (let i = 0; i < boids.length; i++) {
    const b = boids[i];
    // Find several nearest neighbors (not just all pairs)
    let neighbors = [];
    for (let j = 0; j < boids.length; j++) {
      if (i === j) continue;
      const o = boids[j];
      const dx = b.x - o.x, dy = b.y - o.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < 180 * 180) {
        neighbors.push({o, dist2});
      }
    }
    neighbors.sort((a, b) => a.dist2 - b.dist2);
    for (let k = 0; k < Math.min(5, neighbors.length); k++) {
      const o = neighbors[k].o;
      // Only connect if angle is not too horizontal/vertical
      const dx = b.x - o.x, dy = b.y - o.y;
      const angle = Math.abs(Math.atan2(dy, dx));
      if (angle < 0.15 || Math.abs(angle - Math.PI/2) < 0.15) continue;
      // Similar DNA or shared innovation
      let related = false;
      if (Math.abs(b.dna[3] - o.dna[3]) < 16) related = true;
      if (b.innovations && o.innovations && b.innovations.length && o.innovations.length) {
        for (let bi of b.innovations) {
          if (o.innovations.some(oi => oi.t === bi.t)) { related = true; break; }
        }
      }
      if (related) {
        let pulse = 0.38 + 0.62 * Math.abs(Math.sin(Date.now()/320 + i + k));
        ctx.globalAlpha = 0.15 + 0.22 * pulse;
        ctx.strokeStyle = `hsla(${(b.dna[3]+o.dna[3])/2},100%,75%,${0.46 + 0.18 * pulse})`;
        ctx.lineWidth = 1.1 + 1.6 * pulse;
        // Multi-point Bezier for more organic mesh
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        const mx1 = (b.x + o.x)/2 + Math.sin(Date.now()/400 + i + k)*16;
        const my1 = (b.y + o.y)/2 + Math.cos(Date.now()/360 + i - k)*16;
        const mx2 = (b.x*2 + o.x)/3 + Math.cos(Date.now()/300 + i - k)*8;
        const my2 = (b.y*2 + o.y)/3 + Math.sin(Date.now()/260 + i + k)*8;
        ctx.bezierCurveTo(mx1, my1, mx2, my2, o.x, o.y);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// For WebGL: To be implemented as line geometry (scaffold)
export function drawMeshWebGL(scene, boids) {
  // Scaffold for future Three.js mesh lines
}
