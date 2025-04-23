import React from 'react';
import styles from './VisionStaticScene.module.css';
import BoidRenderer from './animation/BoidRenderer';

/**
 * Vision Static Scene - Displays the Aether Canvas vision with boid animation
 */
const VisionStaticScene = () => (
  <section className={styles.staticSceneRoot}>
    <div className={styles.boidsBg}>
      {/* Animated boids background */}
      <BoidRenderer />
    </div>
    <div className={styles.heroContent}>
      <div className={styles.heroArt}>
        {/* SVG or Lottie art for key scenes (could swap to real Lottie later) */}
        <svg viewBox="0 0 120 120" width="120" height="120">
          <circle cx="60" cy="60" r="48" fill="#7ad0ff22" />
          <ellipse cx="60" cy="60" rx="38" ry="16" fill="#7ad0ff77" />
          <circle cx="60" cy="60" r="8" fill="#7ad0ff" />
        </svg>
      </div>
      <h1 className={styles.heroTitle}>Aether Canvas: The Journey Begins</h1>
      <p className={styles.heroSubtitle}>In a world of tangled automations and silent errors, a new intelligence awakens...</p>
    </div>
  </section>
);

export default VisionStaticScene;
