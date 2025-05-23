import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './VisionParallaxExperience.module.css';

// Generic Object Pool for Canvas elements
class CanvasObjectPool {
  constructor(createFn, resetFn, initialSize = 0) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.inUse = new Set();
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }
  get() {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.createFn();
    }
    this.resetFn(obj);
    this.inUse.add(obj);
    return obj;
  }
  release(obj) {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      this.pool.push(obj);
    } 
  }
  releaseAll() {
    this.inUse.forEach(obj => this.pool.push(obj));
    this.inUse.clear();
  }
}

// Quantum Foam Layer for subtle background fluctuations
const QuantumFoamLayer = ({ y }) => {
  const canvasRef = useRef(null);
  const particlePoolRef = useRef(null);
  const activeParticlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    const NUM_PARTICLES_TARGET = 350; // Increased particle count
    const MAX_LIFE = 70; // Slightly longer max lifespan
    const PARTICLE_SIZE_MAX = 1.6; // Slightly larger max size
    const PARTICLE_OPACITY_MAX = 0.45; // Increased max opacity

    const createQuantumParticle = () => ({});
    const resetQuantumParticle = (p) => {
      p.x = Math.random() * canvas.width / dpr;
      p.y = Math.random() * canvas.height / dpr;
      p.baseSize = Math.random() * PARTICLE_SIZE_MAX + 0.3;
      p.size = p.baseSize;
      p.life = 0;
      p.maxLife = MAX_LIFE * (0.6 + Math.random() * 0.4);
      p.opacityTarget = Math.random() * PARTICLE_OPACITY_MAX + 0.1; // Ensure a minimum target opacity
      p.opacity = 0;
      p.vx = (Math.random() - 0.5) * 0.15; // Slightly more drift
      p.vy = (Math.random() - 0.5) * 0.15;
      p.pulseSpeed = Math.random() * 0.05 + 0.02; // For size/opacity pulsation
      return p;
    };

    if (!particlePoolRef.current) {
      particlePoolRef.current = new CanvasObjectPool(createQuantumParticle, resetQuantumParticle, NUM_PARTICLES_TARGET);
    }
    while(activeParticlesRef.current.length < NUM_PARTICLES_TARGET) activeParticlesRef.current.push(particlePoolRef.current.get());
    while(activeParticlesRef.current.length > NUM_PARTICLES_TARGET) particlePoolRef.current.release(activeParticlesRef.current.pop());

    let running = true;
    let time = 0; // Local time for pulsation independent of global time if needed

    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      time += 0.016; // Consistent time progression

      activeParticlesRef.current.forEach(p => {
        p.life++;
        if (p.life >= p.maxLife) {
          resetQuantumParticle(p);
        }

        const lifeRatio = p.life / p.maxLife;
        // Smoother fade in/out: Sinusoidal curve for opacity over life
        p.opacity = p.opacityTarget * Math.sin(lifeRatio * Math.PI);
        p.opacity = Math.max(0, p.opacity); // Clamp

        // Subtle size pulsation
        p.size = p.baseSize * (1 + Math.sin(time * p.pulseSpeed + p.x * 0.1) * 0.2); // Add x to vary pulse phase

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width / dpr; if (p.x > canvas.width / dpr) p.x = 0;
        if (p.y < 0) p.y = canvas.height / dpr; if (p.y > canvas.height / dpr) p.y = 0;

        if (p.opacity > 0.01) { // Only draw if somewhat visible
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          // Slightly more pronounced color, still subtle
          ctx.fillStyle = `rgba(210, 230, 255, ${p.opacity * 0.8})`; 
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      running = false;
      window.removeEventListener('resize', updateCanvasSize);
      if (particlePoolRef.current) particlePoolRef.current.releaseAll();
      activeParticlesRef.current = [];
    };
  }, []);

  return (
    <motion.div style={{ y }} className={styles.quantumFoamWrapper}>
      <canvas ref={canvasRef} className={styles.quantumFoamCanvas} />
  </motion.div>
);
};

// Enhanced generative starfield component with fractal-like patterns
const GenerativeStarfield = () => {
  const canvasRef = useRef(null);
  const starPoolRef = useRef(null);
  const activeStarsRef = useRef([]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    
    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();
    
    const NUM_STARS_TARGET = 100; 
    const NUM_FRACTAL_CLUSTERS = 2; 
    const NUM_PORTALS = 1;         
    
    const createStar = () => ({});
    const resetStar = (star) => {
      star.x = Math.random() * canvas.width / dpr;
      star.y = Math.random() * canvas.height / dpr;
      star.radius = Math.random() * 1.5 + 0.3;
      star.opacity = Math.random() * 0.4 + 0.2;
      star.blinkSpeed = Math.random() * 0.02 + 0.005;
      star.blinkOffset = Math.random() * Math.PI * 2;
      star.colorHue = 190 + Math.random() * 40;
      return star;
    };

    if (!starPoolRef.current) {
      starPoolRef.current = new CanvasObjectPool(createStar, resetStar, NUM_STARS_TARGET);
    }
    while(activeStarsRef.current.length < NUM_STARS_TARGET) activeStarsRef.current.push(starPoolRef.current.get());
    while(activeStarsRef.current.length > NUM_STARS_TARGET) starPoolRef.current.release(activeStarsRef.current.pop());

    const fractalClusters = Array.from({ length: NUM_FRACTAL_CLUSTERS }, () => ({
      centerX: Math.random() * canvas.width / dpr,
      centerY: Math.random() * canvas.height / dpr,
      scale: Math.random() * 40 + 20, 
      numPoints: Math.floor(Math.random() * 4) + 3, 
      rotation: Math.random() * Math.PI * 2,
      depth: Math.floor(Math.random() * 2), 
      colorHue: Math.random() * 60 + 180,
      opacity: Math.random() * 0.15 + 0.05, 
      speed: Math.random() * 0.0005 + 0.0002, 
      pulseRate: Math.random() * 0.015 + 0.005,
      glowIntensity: Math.random() * 0.2 + 0.1 
    }));
    
    const portals = Array.from({ length: NUM_PORTALS }, () => ({
      x: Math.random() * canvas.width / dpr,
      y: Math.random() * canvas.height / dpr,
      outerRadius: Math.random() * 80 + 40,
      innerRadius: Math.random() * 20 + 10,
      rotationSpeed: (Math.random() * 0.0005 + 0.0002) * (Math.random() > 0.5 ? 1 : -1),
      rotation: Math.random() * Math.PI * 2,
      pulseRate: Math.random() * 0.005 + 0.002, 
      colorHue: Math.random() * 40 + 190,
      opacity: Math.random() * 0.1 + 0.03 
    }));
    
    const generateFractalPoints = (x, y, scale, numPoints, rotation, depth) => {
      const points = [];
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2 + rotation;
        const px = x + Math.cos(angle) * scale;
        const py = y + Math.sin(angle) * scale;
        points.push({ x: px, y: py });
        if (depth > 0) {
          points.push(...generateFractalPoints(px, py, scale * 0.45, numPoints, rotation + Math.PI / numPoints, depth - 1));
        }
      }
      return points;
    };
    
    const drawPortal = (ctx, portal, time) => {
      const pulseScale = 1 + Math.sin(time * portal.pulseRate) * 0.05; 
      const outerRadius = portal.outerRadius * pulseScale;
      const innerRadius = portal.innerRadius * pulseScale;
      portal.rotation += portal.rotationSpeed;
      const gradient = ctx.createRadialGradient(portal.x, portal.y, innerRadius, portal.x, portal.y, outerRadius);
      gradient.addColorStop(0, `hsla(${portal.colorHue}, 80%, 70%, ${portal.opacity * 0.7})`);
      gradient.addColorStop(0.5, `hsla(${portal.colorHue + 20}, 80%, 60%, ${portal.opacity * 0.4})`);
      gradient.addColorStop(1, `hsla(${portal.colorHue + 40}, 70%, 50%, 0)`);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter'; 
      ctx.beginPath(); ctx.arc(portal.x, portal.y, outerRadius, 0, Math.PI * 2); ctx.fillStyle = gradient; ctx.fill();
      const numFlares = 6; 
      for (let i = 0; i < numFlares; i++) {
        const angle = (i / numFlares) * Math.PI * 2 + portal.rotation;
        const len = outerRadius * (0.6 + 0.2 * Math.sin(time * 1.5 + i));
        ctx.beginPath();
        ctx.moveTo(portal.x + Math.cos(angle) * innerRadius * 1.2, portal.y + Math.sin(angle) * innerRadius * 1.2);
        ctx.lineTo(portal.x + Math.cos(angle) * len, portal.y + Math.sin(angle) * len);
        ctx.strokeStyle = `hsla(${portal.colorHue}, 90%, 70%, ${portal.opacity * 1.2 * (1 - i/numFlares)})`;
        ctx.lineWidth = 1 + 1 * (1 - i/numFlares);
        ctx.stroke();
      }
      ctx.restore();
    };
    
    let time = 0; let running = true;
    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width/dpr, canvas.height/dpr);
      time += 0.01;
      activeStarsRef.current.forEach(star => {
        const twinkle = 0.5 + 0.5 * Math.sin(time * star.blinkSpeed + star.blinkOffset);
        ctx.beginPath(); ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${star.colorHue}, 70%, 80%, ${star.opacity * twinkle})`;
        ctx.fill();
      });
      portals.forEach(portal => drawPortal(ctx, portal, time));
      fractalClusters.forEach(cluster => {
        cluster.rotation += cluster.speed;
        const pulse = 0.9 + 0.1 * Math.sin(time * cluster.pulseRate);
        const points = generateFractalPoints(cluster.centerX, cluster.centerY, cluster.scale * pulse, cluster.numPoints, cluster.rotation, cluster.depth);
        ctx.save();
        ctx.shadowColor = `hsla(${cluster.colorHue}, 90%, 75%, ${cluster.opacity * cluster.glowIntensity * pulse * 0.5})`;
        ctx.shadowBlur = 5 * pulse;
        ctx.beginPath();
        points.forEach((point, i) => { if (i === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
        for (let i = 0; i < points.length; i += cluster.numPoints) {
          if (i + cluster.numPoints <= points.length) {
            ctx.moveTo(points[i].x, points[i].y);
            for (let j = 1; j < cluster.numPoints; j++) ctx.lineTo(points[i + j].x, points[i + j].y);
            ctx.closePath();
          }
        }
        ctx.strokeStyle = `hsla(${cluster.colorHue}, 90%, 70%, ${cluster.opacity * pulse * 0.8})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
        points.forEach(point => {
          const dotSize = 0.6 + 0.2 * Math.sin(point.x * 0.01 + point.y * 0.01 + time);
          ctx.beginPath(); ctx.arc(point.x, point.y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${cluster.colorHue}, 90%, 85%, ${cluster.opacity * 1.2 * pulse})`;
          ctx.fill();
        });
        ctx.restore();
      });
      requestAnimationFrame(animate);
    };
    animate();
    return () => {
      running = false; window.removeEventListener('resize', updateCanvasSize);
      if (starPoolRef.current) starPoolRef.current.releaseAll();
      activeStarsRef.current = [];
    };
  }, []);
  return <canvas ref={canvasRef} className={styles.generativeStarfield} />;
};

const EnergyWaves = ({ y }) => {
  const canvasRef = useRef(null);
  const waveParticlePoolRef = useRef(null);
  const activeWaveParticlesRef = useRef([]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const updateSize = () => {
      canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`; canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    
    window.addEventListener('resize', updateSize); updateSize();
    
    const NUM_WAVES = 1; 
    const PARTICLES_PER_WAVE_TARGET = 7;
    const waves = Array.from({ length: NUM_WAVES }, (_, i) => ({
      points: 100, amplitude: 30 + i * 10, wavelength: 0.01 + i * 0.002,
      speed: 0.015 + i * 0.005, phase: Math.random() * Math.PI * 2, thickness: 1.5 + i * 0.5, 
      verticalPosition: 0.3 + (i * 0.4), colorHue: 190 + i * 20, opacity: 0.1 - (i * 0.02) 
    }));
    const createWaveParticle = () => ({});
    const resetWaveParticle = (p, wave, xPos, yPos) => {
        p.x = xPos; p.y = yPos;
        p.size = 0.5 + Math.random() * 1.5;
        p.opacity = wave.opacity * 3 * Math.random(); 
        p.life = 0; p.maxLife = 30 + Math.random() * 30; 
        p.vx = (Math.random() - 0.5) * 0.2; p.vy = (Math.random() - 0.5) * 0.2;
        p.colorHue = wave.colorHue + 10 + Math.random() * 20;
        return p;
    };
    if (!waveParticlePoolRef.current) {
        waveParticlePoolRef.current = new CanvasObjectPool(createWaveParticle, (p) => p); 
    }
    let time = 0; let running = true;
    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width/dpr, canvas.height/dpr);
      time += 0.01;
      let currentParticleIndex = 0;
      const requiredParticles = NUM_WAVES * PARTICLES_PER_WAVE_TARGET;
      while(activeWaveParticlesRef.current.length < requiredParticles) activeWaveParticlesRef.current.push(waveParticlePoolRef.current.get());
      while(activeWaveParticlesRef.current.length > requiredParticles) waveParticlePoolRef.current.release(activeWaveParticlesRef.current.pop());
      waves.forEach(wave => {
        const { points, amplitude, wavelength, speed, phase, thickness, verticalPosition, colorHue, opacity } = wave;
        const width = canvas.width / dpr; const height = canvas.height / dpr;
        wave.phase += speed;
        ctx.save();
        ctx.shadowColor = `hsla(${colorHue}, 90%, 80%, ${opacity * 0.6})`;
        ctx.shadowBlur = thickness * 3;
        ctx.beginPath(); ctx.lineWidth = thickness; ctx.strokeStyle = `hsla(${colorHue}, 90%, 70%, ${opacity})`;
        for (let x = 0; x <= points; x++) {
          const xPos = (x / points) * width;
          const baseY = height * verticalPosition;
          const y = baseY + Math.sin(xPos * wavelength + phase) * amplitude + Math.sin(xPos * wavelength * 2 + phase * 1.5) * (amplitude * 0.3) + Math.sin(xPos * wavelength * 0.5 + phase * 0.7) * (amplitude * 0.2);
          if (x === 0) ctx.moveTo(xPos, y); else ctx.lineTo(xPos, y);
        }
        ctx.stroke(); ctx.restore();
        for (let i = 0; i < PARTICLES_PER_WAVE_TARGET; i++) {
          const particle = activeWaveParticlesRef.current[currentParticleIndex++];
          if(!particle) continue;
          if(particle.life >= particle.maxLife || particle.life === undefined) {
            const xPosOnWave = (Math.random()) * width;
            const yPosOnWave = height * verticalPosition + Math.sin(xPosOnWave * wavelength + phase) * amplitude;
            resetWaveParticle(particle, wave, xPosOnWave, yPosOnWave);
          }
          particle.x += particle.vx; particle.y += particle.vy; particle.life++;
          const particleAlpha = particle.opacity * (1 - particle.life / particle.maxLife);
          ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${particle.colorHue}, 90%, 80%, ${particleAlpha})`;
          ctx.fill();
        }
      });
      requestAnimationFrame(animate);
    };
    animate();
    return () => {
      running = false; window.removeEventListener('resize', updateSize);
      if (waveParticlePoolRef.current) waveParticlePoolRef.current.releaseAll();
      activeWaveParticlesRef.current = [];
    };
  }, []);
  return <motion.div style={{ y }} className={styles.energyWavesWrapper}><canvas ref={canvasRef} className={styles.energyWaves} /></motion.div>;
};

const FlowField = ({ y }) => {
  const canvasRef = useRef(null);
  const flowParticlePoolRef = useRef(null);
  const activeFlowParticlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const updateSize = () => {
      canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`; canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', updateSize); updateSize();
    
    const NUM_PARTICLES_TARGET = 30;

    const createFlowParticle = () => ({});
    const resetFlowParticle = (p) => {
        p.x = Math.random() * canvas.width / dpr;
        p.y = Math.random() * canvas.height / dpr;
        p.size = Math.random() * 2.0 + 0.8;
        p.speed = Math.random() * 0.5 + 0.15;
        p.dirX = Math.random() * 2 - 1; p.dirY = Math.random() * 2 - 1;
        p.hue = Math.random() * 40 + 180;
        p.opacity = Math.random() * 0.4 + 0.1;
        p.lifespan = Math.random() * 200 + 80;
        p.age = 0;
        p.pulseRate = Math.random() * 0.04 + 0.01;
        return p;
    };

    if(!flowParticlePoolRef.current) {
        flowParticlePoolRef.current = new CanvasObjectPool(createFlowParticle, resetFlowParticle, NUM_PARTICLES_TARGET);
    }
    while(activeFlowParticlesRef.current.length < NUM_PARTICLES_TARGET) activeFlowParticlesRef.current.push(flowParticlePoolRef.current.get());
    while(activeFlowParticlesRef.current.length > NUM_PARTICLES_TARGET) flowParticlePoolRef.current.release(activeFlowParticlesRef.current.pop());

    const simplex = { noise2D: (x, y) => Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2 };
    let time = 0; let running = true;
    
    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width/dpr, canvas.height/dpr);
      time += 0.01;
      
      activeFlowParticlesRef.current.forEach(p => {
        p.age++;
        if (p.age > p.lifespan) { resetFlowParticle(p); return; }
        
        const noise = simplex.noise2D(p.x * 0.01 + time, p.y * 0.01);
        const angle = noise * Math.PI * 2;
        p.dirX = Math.cos(angle) * 0.8 + p.dirX * 0.2; p.dirY = Math.sin(angle) * 0.8 + p.dirY * 0.2;
        const len = Math.sqrt(p.dirX * p.dirX + p.dirY * p.dirY);
        if (len > 0) { p.dirX /= len; p.dirY /= len; }
        p.x += p.dirX * p.speed; p.y += p.dirY * p.speed;
        
        if (p.x < 0) p.x = canvas.width / dpr; if (p.x > canvas.width / dpr) p.x = 0;
        if (p.y < 0) p.y = canvas.height / dpr; if (p.y > canvas.height / dpr) p.y = 0;
        
        const fadeInOut = Math.sin((p.age / p.lifespan) * Math.PI);
        const pulseFactor = 1 + 0.15 * Math.sin(time * p.pulseRate);
        const alpha = p.opacity * fadeInOut;
        
        ctx.save();
        ctx.shadowColor = `hsla(${p.hue}, 90%, 70%, ${alpha * 0.3})`;
        ctx.shadowBlur = p.size * 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * pulseFactor, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${alpha})`; ctx.fill();
        
        const tailLength = p.speed * 6;
        const gradient = ctx.createLinearGradient(p.x, p.y, p.x - p.dirX * tailLength, p.y - p.dirY * tailLength);
        gradient.addColorStop(0, `hsla(${p.hue}, 90%, 75%, ${alpha * 0.7})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 90%, 75%, 0)`);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.dirX * tailLength, p.y - p.dirY * tailLength);
        ctx.strokeStyle = gradient; ctx.lineWidth = p.size * 0.7 * pulseFactor; ctx.stroke();
        ctx.restore();
      });
      requestAnimationFrame(animate);
    };
    animate();
    return () => {
      running = false; window.removeEventListener('resize', updateSize);
      if (flowParticlePoolRef.current) flowParticlePoolRef.current.releaseAll();
      activeFlowParticlesRef.current = [];
    };
  }, []);
  
  return (
    <motion.div style={{ y }} className={styles.flowFieldWrapper}>
      <canvas ref={canvasRef} className={styles.flowField} />
    </motion.div>
  );
};

const Nebula = ({ y, x, scale }) => (
  <motion.div
    className={styles.nebula}
    style={{ y, x, scale }}
    initial={{ opacity: 0, scale: 0.85 }} // Start more subtle
    animate={{ 
      opacity: [0.4, 0.6, 0.4], // Reduced max opacity
      scale: [1, 1.03, 1], // Less aggressive scale
      filter: ["blur(45px)", "blur(40px)", "blur(45px)"] // Slightly more blur
    }}
    transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
    aria-hidden="true"
  />
);

const Aurora = ({ y, x, opacity }) => (
  <motion.div
    className={styles.aurora}
    style={{ y, x, opacity }}
    initial={{ opacity: 0.05 }} // Start more subtle
    animate={{ 
      opacity: [0.05, 0.15, 0.05], // Reduced max opacity
      filter: ["blur(65px)", "blur(75px)", "blur(65px)"]
    }}
    transition={{ duration: 18, repeat: Infinity, repeatType: "reverse" }}
    aria-hidden="true"
  />
);

const CosmicDust = ({ y, x }) => { // Added x for parallax
  const [dustRotation, setDustRotation] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setDustRotation(prev => (prev + 0.05) % 360), 50); // Slower rotation
    return () => clearInterval(interval);
  }, []);
  
  return (
  <motion.div
      className={styles.cosmicDust}
      style={{ y, x, rotate: dustRotation, transformStyle: "preserve-3d", perspective: "1000px"}}
    aria-hidden="true"
  />
);
};

// Quantum Entanglement Effect with interactive connection lines
const QuantumEntanglement = ({ y }) => {
  const canvasRef = useRef(null);
  const particlePoolRef = useRef(null);
  const activeParticlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const updateSize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();
    
    // Mouse interaction
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX * dpr;
      mouseRef.current.y = e.clientY * dpr;
      mouseRef.current.active = true;
      
      // Reset mouse active status after 2 seconds of inactivity
      clearTimeout(mouseRef.current.timeout);
      mouseRef.current.timeout = setTimeout(() => {
        mouseRef.current.active = false;
      }, 2000);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    const NUM_PARTICLES_TARGET = 40; // Adjusted lower for better performance
    
    const createEntangledParticle = () => ({});
    const resetEntangledParticle = (p) => {
      p.x = Math.random() * canvas.width / dpr;
      p.y = Math.random() * canvas.height / dpr;
      p.size = Math.random() * 1.5 + 0.5;
      p.vx = (Math.random() - 0.5) * 0.2;
      p.vy = (Math.random() - 0.5) * 0.2;
      p.hue = 180 + Math.random() * 40;
      p.opacity = Math.random() * 0.2 + 0.05;
      p.entanglementRadius = Math.random() * 150 + 50;
      p.entanglementStrength = Math.random() * 0.4 + 0.1;
      p.pulseSpeed = Math.random() * 0.03 + 0.01;
      p.mouseInfluence = Math.random() * 0.3 + 0.1;
      p.connections = [];
      return p;
    };
    
    if (!particlePoolRef.current) {
      particlePoolRef.current = new CanvasObjectPool(createEntangledParticle, resetEntangledParticle, NUM_PARTICLES_TARGET);
    }
    
    while(activeParticlesRef.current.length < NUM_PARTICLES_TARGET) activeParticlesRef.current.push(particlePoolRef.current.get());
    while(activeParticlesRef.current.length > NUM_PARTICLES_TARGET) particlePoolRef.current.release(activeParticlesRef.current.pop());
    
    let time = 0;
    let running = true;
    
    const measureEntanglement = (p1, p2) => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only entangle particles within a certain radius
      if (distance < p1.entanglementRadius) {
        // Calculate connection strength - higher when closer
        const strength = (1 - distance / p1.entanglementRadius) * p1.entanglementStrength;
        return strength;
      }
      return 0;
    };
    
    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      time += 0.01;
      
      // Reset connections
      activeParticlesRef.current.forEach(p => {
        p.connections = [];
      });
      
      // Update particle positions and find connections
      activeParticlesRef.current.forEach(p => {
        // Regular movement logic
        p.x += p.vx;
        p.y += p.vy;
        
        // Wrap around screen edges
        if (p.x < 0) p.x = canvas.width / dpr;
        if (p.x > canvas.width / dpr) p.x = 0;
        if (p.y < 0) p.y = canvas.height / dpr;
        if (p.y > canvas.height / dpr) p.y = 0;
        
        // Mouse influence (gentle attraction or repulsion)
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x / dpr - p.x;
          const dy = mouseRef.current.y / dpr - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            const force = p.mouseInfluence / (distance + 10);
            p.vx += dx * force;
            p.vy += dy * force;
            
            // Limit velocity
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > 2) {
              p.vx = (p.vx / speed) * 2;
              p.vy = (p.vy / speed) * 2;
            }
          }
        }
        
        // Find connections to other particles
        activeParticlesRef.current.forEach(other => {
          if (p === other) return;
          
          const strength = measureEntanglement(p, other);
          if (strength > 0) {
            p.connections.push({ particle: other, strength });
          }
        });
      });
      
      // Draw connections first (under particles)
      ctx.lineWidth = 0.5;
      ctx.lineCap = 'round';
      
      // Keep track of drawn connections to avoid duplicates
      const drawnConnections = new Set();
      
      activeParticlesRef.current.forEach(p => {
        p.connections.forEach(connection => {
          const other = connection.particle;
          // Create a unique ID for this connection
          const connId = p.x < other.x ? 
            `${p.x},${p.y}-${other.x},${other.y}` : 
            `${other.x},${other.y}-${p.x},${p.y}`;
          
          // Only draw if we haven't already drawn this connection
          if (!drawnConnections.has(connId)) {
            drawnConnections.add(connId);
            
            const strength = connection.strength;
            // Base opacity on connection strength and add subtle pulsing
            const pulseFactor = 0.7 + 0.3 * Math.sin(time * 2 + p.x * 0.01 + p.y * 0.01);
            const opacity = strength * 0.3 * pulseFactor;
            
            // Draw line with gradient
            const gradient = ctx.createLinearGradient(p.x, p.y, other.x, other.y);
            gradient.addColorStop(0, `hsla(${p.hue}, 90%, 70%, ${opacity})`);
            gradient.addColorStop(1, `hsla(${other.hue}, 90%, 70%, ${opacity})`);
            
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = gradient;
            ctx.stroke();
            
            // Optional: Draw small glow at intersection midpoint
            if (strength > 0.15) {
              const midX = (p.x + other.x) / 2;
              const midY = (p.y + other.y) / 2;
              const glowSize = strength * 2.5;
              
              ctx.beginPath();
              ctx.arc(midX, midY, glowSize, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${(p.hue + other.hue) / 2}, 90%, 75%, ${opacity * 1.2})`;
              ctx.fill();
            }
          }
        });
      });
      
      // Draw particles
      activeParticlesRef.current.forEach(p => {
        const pulseFactor = 1 + 0.2 * Math.sin(time * p.pulseSpeed + p.x * 0.01 + p.y * 0.01);
        const particleSize = p.size * pulseFactor;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.opacity * pulseFactor})`;
        ctx.fill();
        
        // Add subtle glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, particleSize * 2, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(p.x, p.y, particleSize, p.x, p.y, particleSize * 2);
        gradient.addColorStop(0, `hsla(${p.hue}, 90%, 70%, ${p.opacity * 0.7})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 90%, 70%, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      running = false;
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (particlePoolRef.current) particlePoolRef.current.releaseAll();
      activeParticlesRef.current = [];
    };
  }, []);
  
  return (
    <motion.div style={{ y }} className={styles.quantumEntanglementWrapper}>
      <canvas ref={canvasRef} className={styles.quantumEntanglement} />
    </motion.div>
  );
};

const ParallaxBackground = () => {
  const { scrollYProgress } = useScroll();
  
  // Parallax transforms - adjust speeds for visual hierarchy
  const quantumFoamY = useTransform(scrollYProgress, [0, 1], [0, -20]); // Slower, deeper
  const starfieldY = useTransform(scrollYProgress, [0, 1], [0, -35]);
  const dustY = useTransform(scrollYProgress, [0, 1], [0, -65]); 
  const dustX = useTransform(scrollYProgress, [0, 1], [0, 12]);
  const energyWavesY = useTransform(scrollYProgress, [0, 1], [0, -95]);
  const nebulaY = useTransform(scrollYProgress, [0, 1], [0, -115]); 
  const flowFieldY = useTransform(scrollYProgress, [0, 1], [0, -145]);
  const auroraY = useTransform(scrollYProgress, [0, 1], [0, -165]); 
  const entanglementY = useTransform(scrollYProgress, [0, 1], [0, -50]); // New entanglement effect
  
  const nebulaX = useTransform(scrollYProgress, [0, 1], [0, 22]);
  const auroraX = useTransform(scrollYProgress, [0, 1], [0, -18]);
  
  const nebulaScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1.02, 0.97]);
  
  // Adjusted opacities for Quantum Foam layer
  const quantumFoamOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.6, 0.9, 0.9, 0.6]); 
  const auroraOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.1, 0.25, 0.2, 0.05]);
  const flowFieldOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.15, 0.4, 0.3, 0.1]);
  const energyWavesOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.03, 0.25, 0.15, 0.02]);
  const entanglementOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.2, 0.6, 0.6, 0.2]); // New opacity transform

  return (
    <div className={styles.bg} aria-hidden="true">
      <motion.div style={{ y: quantumFoamY, opacity: quantumFoamOpacity }}>
        <QuantumFoamLayer />
      </motion.div>

      <motion.div style={{ y: starfieldY }}>
        <GenerativeStarfield />
      </motion.div>
      
      <motion.div style={{ y: entanglementY, opacity: entanglementOpacity }}>
        <QuantumEntanglement y={entanglementY} />
      </motion.div>
      
      <CosmicDust y={dustY} x={dustX} />
      
      <motion.div style={{ y: energyWavesY, opacity: energyWavesOpacity }}>
        <EnergyWaves />
      </motion.div>
      
      <motion.div style={{ y: flowFieldY, opacity: flowFieldOpacity }}>
        <FlowField />
      </motion.div>
      
      <motion.div style={{ y: nebulaY, x: nebulaX, scale: nebulaScale }}>
        <Nebula /> 
      </motion.div>
      
      <motion.div style={{ y: auroraY, x: auroraX, opacity: auroraOpacity }}>
        <Aurora />
      </motion.div>
    </div>
  );
};

export default ParallaxBackground;
