// BoidRenderer2D.js
// Canvas2D-based renderer for boids (logic extracted from LoginBackground.js)

// Draw a single boid (advanced, organic)
export function drawBoid(ctx, b) {
  const [sepK, cohK, aliK, hue, sat, light, size, mutRate, volition, metaMut, social, stratMem, envSens] = b.dna;
  const px = b.x;
  const py = b.y;
  const angle = Math.atan2(b.vy, b.vx);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  // Outer glow for high innovation/ancestry
  let totalLegacy = (b.ancestry ? b.ancestry.length : 0) + (b.innovations ? b.innovations.length : 0);
  if (totalLegacy > 8) {
    ctx.save();
    ctx.shadowColor = `hsla(${hue},100%,80%,0.95)`;
    ctx.shadowBlur = 32 + Math.min(80, totalLegacy * 3.2);
    ctx.globalAlpha = 0.32 + 0.22 * Math.min(1, totalLegacy/18);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.2, size * 1.6 + totalLegacy*0.09), 0, 2 * Math.PI);
    ctx.fillStyle = `hsla(${hue},100%,60%,0.18)`;
    ctx.fill();
    ctx.restore();
  }
  // Movement mode visualizations (organic)
  if (b.movementMode === 'spiral') {
    ctx.save();
    ctx.rotate(Math.sin(Date.now()/600 + b.gen)*0.3);
    ctx.beginPath();
    for (let t = 0; t < 2 * Math.PI; t += 0.18) {
      const r = Math.max(0.2, size * (1.18 + 0.6 * Math.sin(Date.now()/170 + t*4)));
      ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r);
    }
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue},${sat + 26}%,${light + 29}%)`;
    ctx.globalAlpha = 0.91 * b.fade;
    ctx.filter = 'blur(0.5px)';
    ctx.fill();
    ctx.filter = 'none';
    ctx.restore();
  } else if (b.movementMode === 'pulse') {
    const pulse = 1 + 0.38 * Math.sin(Date.now()/100 + b.gen);
    ctx.save();
    ctx.scale(1, 0.96 + 0.09*Math.sin(Date.now()/100 + b.gen));
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0.2, size * 1.3 * pulse), Math.max(0.2, size * 0.8 * pulse), 0, 0, 2 * Math.PI);
    ctx.fillStyle = `hsl(${hue},${sat + 21}%,${light + 22}%)`;
    ctx.globalAlpha = 0.81 * b.fade;
    ctx.filter = 'blur(0.3px)';
    ctx.fill();
    ctx.filter = 'none';
    ctx.restore();
  } else if (b.movementMode === 'lobed') {
    ctx.save();
    ctx.rotate(Math.cos(Date.now()/900 + b.gen)*0.18);
    ctx.beginPath();
    for (let t = 0; t < 2 * Math.PI; t += Math.PI/3) {
      const r = Math.max(0.2, size * (1.13 + 0.33 * Math.sin(Date.now()/220 + t*2.5)));
      ctx.ellipse(Math.cos(t) * r, Math.sin(t) * r, Math.max(0.2, size*0.6), Math.max(0.2, size*0.3), 0, 0, 2*Math.PI);
    }
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue},${sat + 14}%,${light + 15}%)`;
    ctx.globalAlpha = 0.77 * b.fade;
    ctx.filter = 'blur(0.4px)';
    ctx.fill();
    ctx.filter = 'none';
    ctx.restore();
  } else {
    // normal mode (ellipse, more organic)
    ctx.save();
    ctx.rotate(Math.sin(Date.now()/800 + b.gen)*0.07);
    ctx.beginPath();
    const rx = Math.max(0.2, size * 1.18);
    const ry = Math.max(0.2, size * 0.75);
    ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI);
    let glow = b.speciesGlow ? Math.min(1, b.speciesGlow) : 0;
    let flash = b.flash ? Math.min(1, b.flash) : 0;
    ctx.fillStyle = `hsl(${hue},${sat + 13}%,${light + 12 + 40 * glow}%)`;
    ctx.shadowColor = flash > 0 ? `#fff` : `hsl(${hue},${sat + 7}%,${Math.max(0, light - 8)}%)`;
    ctx.shadowBlur = 12 + 22 * flash;
    ctx.globalAlpha = 0.89 * b.fade;
    ctx.filter = 'blur(0.25px)';
    ctx.fill();
    ctx.filter = 'none';
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  // Animated, morphing nucleus/organelle
  let innerPulse = 1 + 0.29 * Math.sin(Date.now()/70 + b.gen);
  let innovColor = b.innovations && b.innovations.length ? b.innovations.length * 13 + hue : hue;
  let innerGlow = b.flash ? Math.min(1, b.flash) : 0;
  ctx.save();
  ctx.globalAlpha = 0.56 + 0.33 * innerGlow;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const t = i / 8 * 2 * Math.PI;
    const r = Math.max(0.1, size * 0.22 * innerPulse * (1 + 0.31 * Math.sin(Date.now()/31 + t + b.gen)));
    ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r);
  }
  ctx.closePath();
  ctx.fillStyle = `hsla(${innovColor},100%,88%,${0.38 + 0.41 * innerGlow})`;
  ctx.filter = 'blur(1.1px)';
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();
  ctx.restore();
}

// Draw all boids and their ghost trails
export function renderBoids2D(ctx, boids) {
  for (const b of boids) {
    if (b.ghostTrail && b.ghostTrail.length > 1) {
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(b.ghostTrail[0].x, b.ghostTrail[0].y);
      for (let pt of b.ghostTrail) ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.restore();
    }
    drawBoid(ctx, b);
  }
}
