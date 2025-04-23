import React, { useRef, useEffect } from 'react';

/**
 * AICoreParticlesRenderer
 * Premium AI core with entangling, glowing blue particles orbiting a central nucleus,
 * surrounded by evolved, color-coherent, AI-inspired filaments/curves.
 */
const NUM_CORE_PARTICLES = 48;
const NUM_FILAMENTS = 3;
const FILAMENT_POINTS = 38;
const RADIUS = 56; // px, orbital radius
const PARTICLE_SIZE = 4;
const FILAMENT_SIZE = 2.7;
const CORE_RADIUS = 24;
const GLOW_COLOR = 'rgba(42, 180, 255, 0.55)';
const PARTICLE_COLOR = 'rgba(90,220,255,0.95)';
const PARTICLE_GLOW = 'rgba(42,180,255,0.35)';
const BG_COLOR = 'rgba(0,12,32,0)';

// Filament color stops (blue/cyan/teal/white)
const FILAMENT_GRADIENTS = [
  ['#7ad0ff', '#2ebfff', '#eaf6ff'],
  ['#b4e2ff', '#7ad0ff', '#2ebfff'],
  ['#2ebfff', '#7ad0ff', '#eaf6ff']
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const AICoreParticlesRenderer = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let dpr = window.devicePixelRatio || 1;
    let width = 220, height = 220;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Core blue particles (entangling)
    const particles = Array.from({ length: NUM_CORE_PARTICLES }, (_, i) => {
      const angle = (i / NUM_CORE_PARTICLES) * Math.PI * 2;
      return {
        baseAngle: angle,
        angle,
        radius: RADIUS + Math.random() * 8 - 4,
        speed: lerp(0.009, 0.018, Math.random()),
        entangle: Math.random() * Math.PI * 2,
        entangleSpeed: lerp(0.012, 0.025, Math.random()),
      };
    });

    // Filament parameters (Fermat spiral or Lissajous)
    const filaments = Array.from({ length: NUM_FILAMENTS }, (_, fIdx) => {
      // Each filament gets a phase and a color gradient
      return {
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: lerp(0.004, 0.008, Math.random()),
        gradient: FILAMENT_GRADIENTS[fIdx % FILAMENT_GRADIENTS.length],
        points: Array.from({ length: FILAMENT_POINTS }, (_, i) => i),
      };
    });

    function drawCore() {
      // Glowing core
      ctx.save();
      ctx.globalAlpha = 0.96;
      let grad = ctx.createRadialGradient(width/2, height/2, 2, width/2, height/2, CORE_RADIUS);
      grad.addColorStop(0, '#eaf6ff');
      grad.addColorStop(0.18, '#7ad0ff');
      grad.addColorStop(0.42, '#2ebfff');
      grad.addColorStop(0.75, 'rgba(42,180,255,0.7)');
      grad.addColorStop(1, 'rgba(42,180,255,0.09)');
      ctx.beginPath();
      ctx.arc(width/2, height/2, CORE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = GLOW_COLOR;
      ctx.shadowBlur = 38;
      ctx.fill();
      ctx.restore();
      // Core highlight
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.beginPath();
      ctx.arc(width/2, height/2, CORE_RADIUS * 0.47, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.shadowColor = '#b9eaff';
      ctx.shadowBlur = 22;
      ctx.fill();
      ctx.restore();
    }

    function drawParticle(p) {
      ctx.save();
      let x = width/2 + Math.cos(p.angle + Math.sin(p.entangle) * 0.18) * p.radius;
      let y = height/2 + Math.sin(p.angle + Math.cos(p.entangle) * 0.18) * p.radius;
      ctx.beginPath();
      ctx.arc(x, y, PARTICLE_SIZE, 0, Math.PI * 2);
      ctx.fillStyle = PARTICLE_COLOR;
      ctx.shadowColor = PARTICLE_GLOW;
      ctx.shadowBlur = 18;
      ctx.globalAlpha = 0.88;
      ctx.fill();
      ctx.restore();
    }

    function drawFilament(filament, t) {
      // Draw a spiral or parametric curve, color-graded, with evolving phase
      for (let i = 0; i < FILAMENT_POINTS; ++i) {
        // Fermat spiral (r = a * sqrt(theta)), or Lissajous for more interest
        let theta = (i / FILAMENT_POINTS) * Math.PI * 4 + filament.phase + t * 0.6;
        let r = lerp(RADIUS + 24, RADIUS + 40, i / FILAMENT_POINTS) + Math.sin(t + i) * 2.6;
        let x = width/2 + Math.cos(theta + Math.sin(t + i) * 0.11) * r;
        let y = height/2 + Math.sin(theta + Math.cos(t + i) * 0.11) * r;
        // Color gradient along filament
        let gradIdx = i / FILAMENT_POINTS;
        let color;
        if (gradIdx < 0.5) {
          color = filament.gradient[0];
        } else if (gradIdx < 0.85) {
          color = filament.gradient[1];
        } else {
          color = filament.gradient[2];
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, FILAMENT_SIZE + Math.sin(t * 2 + i) * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 13;
        ctx.globalAlpha = 0.78 + 0.18 * Math.sin(t * 2.3 + i * 0.6);
        ctx.fill();
        ctx.restore();
      }
    }

    let running = true;
    let t = 0;
    function animate() {
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, width, height);
      drawCore();
      filaments.forEach(filament => drawFilament(filament, t));
      particles.forEach(drawParticle);
      // Animate
      particles.forEach((p, i) => {
        p.angle += p.speed;
        p.entangle += p.entangleSpeed * (0.7 + 0.3 * Math.sin(p.angle + i));
      });
      filaments.forEach((f, i) => {
        f.phase += f.phaseSpeed * (0.8 + 0.2 * Math.cos(t + i));
      });
      t += 0.012;
      if (running) requestAnimationFrame(animate);
    }
    animate();
    return () => { running = false; };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={220}
      style={{ display: 'block', margin: '0 auto', background: 'transparent' }}
      aria-label="AI Core entangling particles animation"
      tabIndex={-1}
    />
  );
};

export default AICoreParticlesRenderer;
