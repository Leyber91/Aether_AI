import React, { useEffect, useRef } from 'react';

const BoidRenderer = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Initialize canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Define boid properties
    const boids = [];
    const numBoids = 100;

    // Initialize boids
    for (let i = 0; i < numBoids; i++) {
      boids.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and render boids
      boids.forEach((boid) => {
        // Update boid position
        boid.x += boid.vx;
        boid.y += boid.vy;

        // Boundary wrapping
        if (boid.x < 0) boid.x = canvas.width;
        if (boid.x > canvas.width) boid.x = 0;
        if (boid.y < 0) boid.y = canvas.height;
        if (boid.y > canvas.height) boid.y = 0;

        // Simple cohesion and separation
        boids.forEach((otherBoid) => {
          if (otherBoid !== boid) {
            const dx = otherBoid.x - boid.x;
            const dy = otherBoid.y - boid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 50) {
              boid.vx += dx / distance / 100;
              boid.vy += dy / distance / 100;
            }
          }
        });

        // Render boid
        ctx.beginPath();
        ctx.arc(boid.x, boid.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />;
};

export default BoidRenderer;
