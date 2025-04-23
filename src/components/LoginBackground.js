import React, { useEffect, useRef } from 'react';
import './LoginBackground.css';

export default function LoginBackground() {
  const canvasRef = useRef(null);
  const interaction = useRef({ x: 0.5, y: 0.5, focus: false, hover: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    let W = 0, H = 0;
    const setSize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    setSize();
    window.addEventListener('resize', setSize);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const CENTER = () => [W / 2, H / 2];
    const RINGS = [140, 220, 320];
    const PARTICLE_COUNT = 32;
    let particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle: (2 * Math.PI * i) / PARTICLE_COUNT,
      radius: 180 + Math.random() * 180,
      speed: 0.08 + Math.random() * 0.07,
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.12 + Math.random() * 0.18,
      color: Math.random() < 0.2 ? '#a6f1ff' : '#00eaff'
    }));
    const POLYGONS = [
      { sides: 3, radius: 120, speed: 0.05, alpha: 0.13 },
      { sides: 6, radius: 180, speed: -0.03, alpha: 0.10 },
    ];
    const CONSTELLATION_POINTS = 8;
    let constellationBase = Array.from({ length: CONSTELLATION_POINTS }, (_, i) => Math.random() * Math.PI * 2);
    // For neural links and signal pulses
    let neuralLinks = [];
    for (let i = 0; i < CONSTELLATION_POINTS; i++) {
      for (let j = i + 1; j < CONSTELLATION_POINTS; j++) {
        if (Math.random() < 0.55) neuralLinks.push([i, j, Math.random()]);
      }
    }
    let signalPulses = Array.from({ length: 7 }, () => ({
      link: Math.floor(Math.random() * neuralLinks.length),
      t: Math.random(),
      speed: 0.12 + Math.random() * 0.16,
      color: Math.random() < 0.5 ? '#a6f1ff' : '#00eaff',
      hueShift: Math.random() * 360
    }));
    // Wisps
    let wisps = Array.from({ length: 3 }, (_, i) => ({
      phase: Math.random() * Math.PI * 2,
      amp: 60 + Math.random() * 50,
      speed: 0.13 + Math.random() * 0.07,
      color: `rgba(166,241,255,0.07)`
    }));
    // Shooting star state
    let shootingStar = null;
    let shootingStarTimer = Math.random() * 12 + 8;

    function onMove(e) {
      let x, y;
      if (e.touches && e.touches.length) {
        x = e.touches[0].clientX; y = e.touches[0].clientY;
      } else {
        x = e.clientX; y = e.clientY;
      }
      interaction.current.x = x / W;
      interaction.current.y = y / H;
    }
    function onFocus() { interaction.current.focus = true; }
    function onBlur() { interaction.current.focus = false; }
    function onHover() { interaction.current.hover = true; }
    function onUnhover() { interaction.current.hover = false; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('focusin', onFocus);
    window.addEventListener('focusout', onBlur);
    setTimeout(() => {
      const panel = document.querySelector('.login-container.glass-panel');
      if (panel) {
        panel.addEventListener('mouseenter', onHover);
        panel.addEventListener('mouseleave', onUnhover);
      }
    }, 800);

    function drawWisps(t, cx, cy) {
      wisps.forEach((w, idx) => {
        ctx.save();
        ctx.globalAlpha = 0.23 + 0.09 * Math.sin(t * 0.7 + idx);
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) {
          const theta = (i / 60) * Math.PI * 2;
          const r = 200 + w.amp * Math.sin(theta * 2 + w.phase + t * w.speed + idx) * (0.7 + 0.3 * Math.cos(t * 0.22 + idx));
          const x = cx + Math.cos(theta) * r;
          const y = cy + Math.sin(theta) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = w.color;
        ctx.shadowColor = '#a6f1ff';
        ctx.shadowBlur = 30;
        ctx.lineWidth = 2.2 + Math.sin(t * 0.7 + idx) * 1.2;
        ctx.stroke();
        ctx.restore();
      });
    }

    function animationLoop() {
      const t = Date.now() * 0.001;
      ctx.clearRect(0, 0, W, H);
      const [cx, cy] = CENTER();
      const { x: mx, y: my, focus, hover } = interaction.current;
      const parallax = (amt) => [ (mx-0.5)*amt, (my-0.5)*amt ];
      const glowBoost = (focus || hover) ? 1.35 : 1.0;

      // Wisps (AI energy fields)
      if (!reduceMotion) drawWisps(t, cx, cy);

      ctx.save();
      const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 360);
      auraGrad.addColorStop(0, `rgba(0,234,255,${0.22*glowBoost})`);
      auraGrad.addColorStop(0.25, `rgba(0,234,255,${0.09*glowBoost})`);
      auraGrad.addColorStop(0.65, 'rgba(0,111,255,0.05)');
      auraGrad.addColorStop(1, 'rgba(0,0,0,0.01)');
      ctx.globalAlpha = (0.7 + 0.2 * Math.sin(t * 0.7)) * glowBoost;
      ctx.beginPath();
      ctx.arc(cx, cy, 360, 0, 2 * Math.PI);
      ctx.fillStyle = auraGrad;
      ctx.shadowColor = '#00eaff';
      ctx.shadowBlur = 100 * glowBoost;
      ctx.fill();
      ctx.restore();

      if (!reduceMotion) {
        RINGS.forEach((r, i) => {
          const [dx, dy] = parallax(18 + i*8);
          ctx.save();
          ctx.globalAlpha = 0.13 + 0.08 * Math.sin(t * 0.8 + i);
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dy, r, 0, 2 * Math.PI);
          ctx.strokeStyle = '#00eaff';
          ctx.lineWidth = 2.2 + 0.7 * Math.sin(t * 0.6 + i);
          ctx.shadowColor = '#00eaff';
          ctx.shadowBlur = 18;
          ctx.stroke();
          ctx.restore();
        });
        POLYGONS.forEach((poly, idx) => {
          const [dx, dy] = parallax(16 + idx*10);
          ctx.save();
          ctx.translate(cx + dx, cy + dy);
          ctx.rotate(t * poly.speed + idx * 0.7);
          ctx.globalAlpha = poly.alpha + 0.04 * Math.sin(t * 0.9 + idx);
          ctx.beginPath();
          for (let i = 0; i < poly.sides; i++) {
            const theta = (2 * Math.PI * i) / poly.sides;
            const x = Math.cos(theta) * poly.radius;
            const y = Math.sin(theta) * poly.radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.strokeStyle = '#00eaff';
          ctx.lineWidth = 1.7;
          ctx.shadowColor = '#00eaff';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.restore();
        });
        // --- CONSTELLATION POINTS ---
        let points = [];
        for (let i = 0; i < CONSTELLATION_POINTS; i++) {
          constellationBase[i] += Math.sin(t*0.23 + i) * 0.0007 + Math.cos(t*0.16 + i*1.1) * 0.0009;
          const angle = (2 * Math.PI * i) / CONSTELLATION_POINTS + Math.sin(t * 0.18 + i) * 0.08 + constellationBase[i];
          const r = 250 + Math.sin(t * 0.6 + i) * 12;
          const [dx, dy] = parallax(11);
          points.push([
            cx + Math.cos(angle) * r + dx,
            cy + Math.sin(angle) * r + dy
          ]);
        }
        // --- Neural Links (AI synapses) ---
        neuralLinks.forEach(([i, j, phase], idx) => {
          const p1 = points[i], p2 = points[j];
          // Animate link width and color
          ctx.save();
          ctx.globalAlpha = 0.19 + 0.09 * Math.sin(t * 1.2 + phase * 7.1);
          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          // Curve for neural look
          const mx = (p1[0] + p2[0]) / 2 + Math.sin(t * 0.8 + idx) * 18;
          const my = (p1[1] + p2[1]) / 2 + Math.cos(t * 0.7 + idx) * 18;
          ctx.quadraticCurveTo(mx, my, p2[0], p2[1]);
          // Dynamic color
          const grad = ctx.createLinearGradient(p1[0], p1[1], p2[0], p2[1]);
          grad.addColorStop(0, '#00eaff');
          grad.addColorStop(1, '#a6f1ff');
          ctx.strokeStyle = grad;
          ctx.shadowColor = '#a6f1ff';
          ctx.shadowBlur = 10;
          ctx.lineWidth = 1.3 + Math.sin(t * 1.1 + idx) * 0.7;
          ctx.stroke();
          ctx.restore();
        });
        // --- Signal Pulses (AI data flow) ---
        signalPulses.forEach((pulse, idx) => {
          const [i, j] = neuralLinks[pulse.link];
          const p1 = points[i], p2 = points[j];
          // Pulse travels along the quadratic curve
          pulse.t += pulse.speed * 0.008;
          if (pulse.t > 1) { pulse.t = 0; pulse.link = Math.floor(Math.random() * neuralLinks.length); }
          // Quadratic bezier interpolation
          const mx = (p1[0] + p2[0]) / 2 + Math.sin(t * 0.8 + idx) * 18;
          const my = (p1[1] + p2[1]) / 2 + Math.cos(t * 0.7 + idx) * 18;
          const tt = pulse.t;
          const x = (1-tt)*(1-tt)*p1[0] + 2*(1-tt)*tt*mx + tt*tt*p2[0];
          const y = (1-tt)*(1-tt)*p1[1] + 2*(1-tt)*tt*my + tt*tt*p2[1];
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(x, y, 3.2 + Math.sin(t * 1.2 + idx) * 1.1, 0, 2 * Math.PI);
          ctx.fillStyle = `hsl(${pulse.hueShift + t*24}, 100%, 72%)`;
          ctx.shadowColor = '#fff';
          ctx.shadowBlur = 18;
          ctx.fill();
          ctx.restore();
        });
        // --- Micro-particles (active nodes) ---
        points.forEach(([x, y], i) => {
          ctx.save();
          ctx.globalAlpha = 0.18 + 0.13 * Math.sin(t * 1.7 + i);
          ctx.beginPath();
          ctx.arc(x, y, 2.1 + Math.sin(t * 2.1 + i) * 0.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#a6f1ff';
          ctx.shadowColor = '#fff';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
        });
        // --- Energy Orbs ---
        particles.forEach(p => {
          p.angle += p.speed * 0.008;
          if (p.angle > 2 * Math.PI) p.angle -= 2 * Math.PI;
          p.radius += Math.sin(t * 0.11 + p.angle) * 0.04;
          const [dx, dy] = parallax(6 + p.size * 2);
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(p.angle) * p.radius + dx,
            cy + Math.sin(p.angle) * p.radius + dy,
            p.size + Math.sin(t * 0.7 + p.angle) * 0.4,
            0,
            2 * Math.PI
          );
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 18;
          ctx.fill();
          ctx.restore();
        });
        // --- Shooting Star ---
        shootingStarTimer -= 1/60;
        if (shootingStarTimer < 0 && !shootingStar) {
          const angle = Math.random() * Math.PI * 2;
          shootingStar = {
            x: cx + Math.cos(angle) * 320,
            y: cy + Math.sin(angle) * 320,
            vx: Math.cos(angle + Math.PI/2) * (Math.random()*2+2.2),
            vy: Math.sin(angle + Math.PI/2) * (Math.random()*2+2.2),
            alpha: 0.9,
            life: 0
          };
          shootingStarTimer = Math.random() * 12 + 8;
        }
        if (shootingStar) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, shootingStar.alpha * (1 - shootingStar.life/30));
          ctx.beginPath();
          ctx.arc(shootingStar.x, shootingStar.y, 2.2, 0, 2 * Math.PI);
          ctx.fillStyle = '#fff';
          ctx.shadowColor = '#a6f1ff';
          ctx.shadowBlur = 32;
          ctx.fill();
          ctx.globalAlpha *= 0.7;
          ctx.beginPath();
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(shootingStar.x - shootingStar.vx*18, shootingStar.y - shootingStar.vy*18);
          ctx.strokeStyle = '#a6f1ff';
          ctx.lineWidth = 2.6;
          ctx.shadowBlur = 18;
          ctx.stroke();
          ctx.restore();
          shootingStar.x += shootingStar.vx * 1.6;
          shootingStar.y += shootingStar.vy * 1.6;
          shootingStar.life++;
          if (shootingStar.life > 30) shootingStar = null;
        }
        // --- Soft Ripple/Pulse ---
        if ((Math.floor(t) % 7 === 0) || focus || hover) {
          ctx.save();
          ctx.globalAlpha = 0.09 + 0.07 * Math.abs(Math.sin(t * 0.8));
          ctx.beginPath();
          ctx.arc(cx, cy, 270 + Math.sin(t * 0.5) * 7, 0, 2 * Math.PI);
          ctx.strokeStyle = '#00eaff';
          ctx.lineWidth = 7 * (0.7 + 0.3 * Math.sin(t * 0.5));
          ctx.shadowColor = '#00eaff';
          ctx.shadowBlur = 28 * glowBoost;
          ctx.stroke();
          ctx.restore();
        }
      }
      requestAnimationFrame(animationLoop);
    }
    animationLoop();

    return () => {
      window.removeEventListener('resize', setSize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('focusin', onFocus);
      window.removeEventListener('focusout', onBlur);
      const panel = document.querySelector('.login-container.glass-panel');
      if (panel) {
        panel.removeEventListener('mouseenter', onHover);
        panel.removeEventListener('mouseleave', onUnhover);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="login-neural-bg" />;
}
