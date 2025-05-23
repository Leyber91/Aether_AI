import React, { useEffect, useRef, useState } from 'react';
import { useScroll } from 'framer-motion';

// Object Pool Implementation
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 0) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.inUse = new Set();

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  get(index) { // Pass index for boids
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.createFn(index); // Pass index if creating new
    }
    this.resetFn(obj, index); // Pass index to reset function
    this.inUse.add(obj);
    return obj;
  }

  release(obj) {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      this.pool.push(obj);
    } else {
      console.warn("Releasing object not in use or already released");
    }
  }

  releaseAll() {
    this.inUse.forEach(obj => this.pool.push(obj));
    this.inUse.clear();
  }
  
  getInUseCount() {
    return this.inUse.size;
  }
}

const BoidRenderer = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null, radius: 150 });
  const boidPoolRef = useRef(null); // Ref for the boid pool
  const activeBoidsRef = useRef([]); // Ref for active boids
  
  const { scrollYProgress } = useScroll();
  const [scrollFactor, setScrollFactor] = useState(0);
  
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange(value => {
      setScrollFactor(value);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

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

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
      }
    };
    const handleMouseOut = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseout', handleMouseOut);

    const NUM_BOIDS_TARGET = 80; // Reduced target number of boids
    
    const params = {
      alignment: 0.9, cohesion: 0.7, separation: 1.8,
      maxSpeed: 2.2, minSpeed: 0.5, perceptionRadius: 60, // Increased perception slightly
      maxForce: 0.15, edgeMargin: 100, noiseStrength: 0.25, // Reduced noise slightly
      noiseFrequency: 0.01, mouseInfluence: 1.0, mouseRadius: 200,
      patternStrength: 0.25
    };
    
    const patterns = {
      active: false, type: 'none', progress: 0,
      duration: 300, interval: 800, counter: 0, target: []
    };

    // Boid class remains mostly the same, but initialization is handled by the pool
    class Boid {
      constructor(index) {
        this.index = index; // Store index for pattern assignment
        this.init(); // Initialize properties
      }

      init(indexOverride) {
        if (indexOverride !== undefined) this.index = indexOverride;
        this.position = { x: Math.random() * (canvas.width / dpr), y: Math.random() * (canvas.height / dpr) };
        this.velocity = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 };
        this.acceleration = { x: 0, y: 0 };
        this.size = Math.random() * 1.8 + 1.8;
        const colorSet = [
          { h: 185, s: 80, l: 65 }, { h: 210, s: 80, l: 70 },
          { h: 160, s: 75, l: 65 }, { h: 230, s: 70, l: 75 },
        ];
        const baseColor = colorSet[Math.floor(Math.random() * colorSet.length)];
        this.color = {
          h: baseColor.h + (Math.random() * 20 - 10), s: baseColor.s + (Math.random() * 15),
          l: baseColor.l + (Math.random() * 15 - 5), a: 0.7 + Math.random() * 0.3
        };
        this.tailLength = Math.floor(Math.random() * 4) + 3; // Shorter trails
        this.trail = []; // Array of {x, y} objects
        this.trailWidths = [];
        this.trailColor = { ...this.color };
        this.phase = Math.random() * Math.PI * 2;
        this.phaseSpeed = 0.03 + Math.random() * 0.03;
        this.shapeVariation = { lengthFactor: 0.8 + Math.random() * 0.4, widthFactor: 0.8 + Math.random() * 0.4, pointiness: 0.8 + Math.random() * 0.4 };
        this.pulseRate = 0.05 + Math.random() * 0.05;
        this.pulseAmount = 0.2 + Math.random() * 0.3;
        this.particleTimer = Math.random() * 20;
        this.emitsParticles = Math.random() < 0.3;
      }
      
      applyForce(force) { this.acceleration.x += force.x; this.acceleration.y += force.y; }
      
      seek(target, weight = 1.0) {
        const desired = { x: target.x - this.position.x, y: target.y - this.position.y };
        const len = Math.sqrt(desired.x * desired.x + desired.y * desired.y);
        if (len > 0) {
          desired.x = (desired.x / len) * params.maxSpeed * weight;
          desired.y = (desired.y / len) * params.maxSpeed * weight;
        }
        const steer = { x: desired.x - this.velocity.x, y: desired.y - this.velocity.y };
        const steerLen = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
        if (steerLen > params.maxForce * weight) {
          steer.x = (steer.x / steerLen) * params.maxForce * weight;
          steer.y = (steer.y / steerLen) * params.maxForce * weight;
        }
        return steer;
      }

      flee(target, weight = 1.0, radius = params.mouseRadius) {
        const dx = this.position.x - target.x; const dy = this.position.y - target.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          const norm = { x: dx / dist, y: dy / dist };
          const factor = (1 - dist / radius) * weight;
          return { x: norm.x * params.maxForce * factor, y: norm.y * params.maxForce * factor };
        }
        return { x: 0, y: 0 };
      }

      align(boids) {
        let steering = { x: 0, y: 0 }; let total = 0;
        for (const other of boids) {
          if (other !== this) {
            const d = this.distance(other);
            if (d < params.perceptionRadius) { steering.x += other.velocity.x; steering.y += other.velocity.y; total++; }
          }
        }
        if (total > 0) {
          steering.x /= total; steering.y /= total;
          const len = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
          if (len > 0) { steering.x = (steering.x / len) * params.maxSpeed; steering.y = (steering.y / len) * params.maxSpeed; }
          steering.x -= this.velocity.x; steering.y -= this.velocity.y;
          const steerLen = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
          if (steerLen > params.maxForce) { steering.x = (steering.x / steerLen) * params.maxForce; steering.y = (steering.y / steerLen) * params.maxForce; }
        }
        return steering;
      }

      cohesion(boids) {
        let centerOfMass = { x: 0, y: 0 }; let total = 0;
        for (const other of boids) {
          if (other !== this) {
            const d = this.distance(other);
            if (d < params.perceptionRadius) { centerOfMass.x += other.position.x; centerOfMass.y += other.position.y; total++; }
          }
        }
        if (total > 0) { centerOfMass.x /= total; centerOfMass.y /= total; return this.seek(centerOfMass); }
        return { x: 0, y: 0 };
      }

      separation(boids) {
        let steering = { x: 0, y: 0 }; let total = 0;
        for (const other of boids) {
          if (other !== this) {
            const d = this.distance(other);
            if (d < params.perceptionRadius * 0.6) {
              const diff = { x: this.position.x - other.position.x, y: this.position.y - other.position.y };
              const len = Math.max(0.1, d);
              diff.x /= (len * len); diff.y /= (len * len);
              steering.x += diff.x; steering.y += diff.y; total++;
            }
          }
        }
        if (total > 0) {
          steering.x /= total; steering.y /= total;
          const len = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
          if (len > 0) { steering.x = (steering.x / len) * params.maxSpeed; steering.y = (steering.y / len) * params.maxSpeed; }
          steering.x -= this.velocity.x; steering.y -= this.velocity.y;
          const steerLen = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
          if (steerLen > params.maxForce) { steering.x = (steering.x / steerLen) * params.maxForce; steering.y = (steering.y / steerLen) * params.maxForce; }
        }
        return steering;
      }
      
      avoidEdges() {
        const width = canvas.width / dpr; const height = canvas.height / dpr; const margin = params.edgeMargin;
        let steering = { x: 0, y: 0 };
        if (this.position.x < margin) steering.x = params.maxForce * ((margin - this.position.x) / margin);
        else if (this.position.x > width - margin) steering.x = -params.maxForce * ((this.position.x - (width - margin)) / margin);
        if (this.position.y < margin) steering.y = params.maxForce * ((margin - this.position.y) / margin);
        else if (this.position.y > height - margin) steering.y = -params.maxForce * ((this.position.y - (height - margin)) / margin);
        return steering;
      }

      distance(other) { const dx = this.position.x - other.position.x; const dy = this.position.y - other.position.y; return Math.sqrt(dx * dx + dy * dy); }

      flock(activeBoids, time, scrollFactor, currentPatterns) {
        const alignment = this.align(activeBoids);
        const cohesion = this.cohesion(activeBoids);
        const separation = this.separation(activeBoids);
        const edges = this.avoidEdges();
        
        this.applyForce({ x: alignment.x * params.alignment, y: alignment.y * params.alignment });
        this.applyForce({ x: cohesion.x * params.cohesion, y: cohesion.y * params.cohesion });
        this.applyForce({ x: separation.x * params.separation, y: separation.y * params.separation });
        this.applyForce({ x: edges.x * 1.2, y: edges.y * 1.2 });
        
        const scrollInfluence = scrollFactor * 0.6;
        const noiseScale = params.noiseStrength * (1 + scrollInfluence);
        const noiseX = Math.sin(this.position.x * params.noiseFrequency + time) * noiseScale;
        const noiseY = Math.cos(this.position.y * params.noiseFrequency + time) * noiseScale;
        this.applyForce({ x: noiseX, y: noiseY });
        
        const phaseOscX = Math.sin(this.phase) * 0.02; const phaseOscY = Math.cos(this.phase) * 0.02;
        this.applyForce({ x: phaseOscX, y: phaseOscY });
        this.phase += this.phaseSpeed;
        
        if (mouseRef.current.x !== null && mouseRef.current.y !== null) {
          const fleeForce = this.flee({ x: mouseRef.current.x / dpr, y: mouseRef.current.y / dpr }, params.mouseInfluence * (1 + scrollFactor));
          this.applyForce(fleeForce);
        }
        
        if (currentPatterns.active && currentPatterns.type !== 'none' && currentPatterns.target.length > this.index) {
          const target = currentPatterns.target[this.index];
          const patternForce = this.seek(target, params.patternStrength * currentPatterns.progress);
          this.applyForce(patternForce);
        }
      }

      update(time) {
        if (this.trail.length >= this.tailLength) { this.trail.shift(); this.trailWidths.shift(); }
        const pulseWidth = 1 + Math.sin(time * this.pulseRate) * this.pulseAmount;
        this.trail.push({ x: this.position.x, y: this.position.y }); // Store only x,y for trail
        this.trailWidths.push(this.size * 0.6 * pulseWidth);
        
        this.velocity.x += this.acceleration.x; this.velocity.y += this.acceleration.y;
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > params.maxSpeed) { this.velocity.x = (this.velocity.x / speed) * params.maxSpeed; this.velocity.y = (this.velocity.y / speed) * params.maxSpeed; }
        else if (speed < params.minSpeed && speed > 0) { this.velocity.x = (this.velocity.x / speed) * params.minSpeed; this.velocity.y = (this.velocity.y / speed) * params.minSpeed; }
        
        this.position.x += this.velocity.x; this.position.y += this.velocity.y;
        this.acceleration.x = 0; this.acceleration.y = 0;
      }

      render(ctx, scrollFactor, time) {
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        const pulseFactor = 1 + Math.sin(time * this.pulseRate) * this.pulseAmount * (1 + scrollFactor * 0.3);
        
        if (this.trail.length > 1) {
          for (let i = 0; i < this.trail.length - 1; i++) {
            const p1 = this.trail[i]; const p2 = this.trail[i+1];
            const width = this.trailWidths[i] * (i / this.trail.length);
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
            const progress = i / this.trail.length;
            const alpha = progress * this.trailColor.a * 0.5; // Reduced trail opacity further
            ctx.strokeStyle = `hsla(${this.trailColor.h}, ${this.trailColor.s}%, ${this.trailColor.l}%, ${alpha})`;
            ctx.lineWidth = Math.max(0.1, width); // Ensure lineWidth is positive
            ctx.stroke();
          }
        }
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);
        const glowSize = 3 + scrollFactor * 4;
        const glowOpacity = 0.25 + scrollFactor * 0.5;
        ctx.shadowColor = `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${glowOpacity})`;
        ctx.shadowBlur = this.size * glowSize * pulseFactor;
        ctx.fillStyle = `hsla(${this.color.h}, ${this.color.s}%, ${this.color.l}%, ${this.color.a})`;
        ctx.beginPath();
        ctx.moveTo(this.size * 2 * this.shapeVariation.lengthFactor * pulseFactor, 0);
        ctx.lineTo(-this.size * this.shapeVariation.pointiness, this.size * this.shapeVariation.widthFactor * pulseFactor);
        ctx.lineTo(-this.size * this.shapeVariation.pointiness, -this.size * this.shapeVariation.widthFactor * pulseFactor);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = `hsla(${this.color.h + 30}, ${this.color.s - 10}%, ${this.color.l + 15}%, ${this.color.a * 1.3})`;
        ctx.beginPath(); ctx.arc(this.size * 0.5, 0, this.size * 0.6 * pulseFactor, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const createBoid = (index) => new Boid(index);
    const resetBoid = (boid, index) => boid.init(index); 

    if (!boidPoolRef.current) {
        boidPoolRef.current = new ObjectPool(createBoid, resetBoid, NUM_BOIDS_TARGET);
    }
    
    // Manage active boids based on NUM_BOIDS_TARGET
    if (activeBoidsRef.current.length < NUM_BOIDS_TARGET) {
        for (let i = activeBoidsRef.current.length; i < NUM_BOIDS_TARGET; i++) {
            activeBoidsRef.current.push(boidPoolRef.current.get(i));
        }
    } else if (activeBoidsRef.current.length > NUM_BOIDS_TARGET) {
        while(activeBoidsRef.current.length > NUM_BOIDS_TARGET) {
            const boidToRemove = activeBoidsRef.current.pop();
            boidPoolRef.current.release(boidToRemove);
        }
    }
    
    const generatePattern = (type, width, height, count) => {
        const targets = [];
        const centerX = width / 2; const centerY = height / 2;
        switch(type) {
            case 'circle':
                const radius = Math.min(width, height) * 0.3;
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    targets.push({ x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius });
                }
                break;
            case 'double-helix':
                const length = Math.min(width, height) * 0.5;
                const helix_radius = Math.min(width, height) * 0.1;
                for (let i = 0; i < count; i++) {
                    const t = (i / count) * Math.PI * 4;
                    const y = centerY + ((i / count) - 0.5) * length;
                    if (i % 2 === 0) targets.push({ x: centerX + Math.cos(t) * helix_radius, y: y });
                    else targets.push({ x: centerX + Math.cos(t + Math.PI) * helix_radius, y: y });
                }
                break;
            case 'grid':
                const cols = Math.ceil(Math.sqrt(count)); const rows = Math.ceil(count / cols);
                const spacing = Math.min(width, height) * 0.6 / Math.max(cols, rows);
                let idx = 0;
                for (let r = 0; r < rows && idx < count; r++) {
                    for (let c = 0; c < cols && idx < count; c++) {
                        targets.push({ x: centerX + (c - (cols-1)/2) * spacing, y: centerY + (r - (rows-1)/2) * spacing });
                        idx++;
                    }
                }
                break;
            case 'spiral':
                const turns = 2.5; // Reduced turns for tighter spiral
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2 * turns;
                    const radiusFactor = (i / count) * Math.min(width, height) * 0.35;
                    targets.push({ x: centerX + Math.cos(angle) * radiusFactor, y: centerY + Math.sin(angle) * radiusFactor });
                }
                break;
            default: // 'none' or fallback
                for (let i = 0; i < count; i++) { targets.push({ x: Math.random() * width, y: Math.random() * height }); }
        }
        return targets;
    };

    let time = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      time += 0.01;
      
      patterns.counter++;
      if (!patterns.active && patterns.counter >= patterns.interval) {
        patterns.active = true; patterns.progress = 0; patterns.counter = 0;
        const patternTypes = ['circle', 'double-helix', 'grid', 'spiral', 'none', 'none'];
        patterns.type = patternTypes[Math.floor(Math.random() * patternTypes.length)];
        patterns.target = generatePattern(patterns.type, canvas.width / dpr, canvas.height / dpr, activeBoidsRef.current.length);
      }
      if (patterns.active) {
        patterns.progress += 1 / patterns.duration;
        if (patterns.progress >= 1) {
          patterns.progress = 1; patterns.counter++;
          if (patterns.counter > patterns.duration * 0.5) { patterns.active = false; patterns.counter = 0; }
        }
      }
      
      activeBoidsRef.current.forEach(boid => {
        boid.flock(activeBoidsRef.current, time, scrollFactor, patterns);
        boid.update(time);
        boid.render(ctx, scrollFactor, time);
      });
      
      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseout', handleMouseOut);
      // Release all boids back to the pool on cleanup
      if (boidPoolRef.current) {
        boidPoolRef.current.releaseAll();
      }
      activeBoidsRef.current = []; // Clear active boids list
    };
  }, [scrollFactor]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'absolute', top: 0, left: 0, 
        width: '100%', height: '100%', 
        pointerEvents: 'none' 
      }} 
    />
  );
};

export default BoidRenderer;
