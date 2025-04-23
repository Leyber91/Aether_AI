import React from 'react';
import styles from './VisionParallaxExperience.module.css';
import BoidRenderer from '../animation/BoidRenderer';
import AICoreParticlesRenderer from '../animation/AICoreParticlesRenderer';

const HeroSection = () => (
  <section className={styles.heroSection}>
    <div className={styles.boidsBg}>
      {/* Responsive, accessible boid animation */}
      <BoidRenderer />
    </div>
    <div className={styles.heroContent}>
      <div className={styles.heroArt}>
        {/* Premium AI core animation */}
        <AICoreParticlesRenderer />
      </div>
      <h1 className={styles.heroTitle}>Aether Canvas: The Journey Begins</h1>
      <p className={styles.heroSubtitle}>In a world of tangled automations and silent errors, a new intelligence awakens...</p>
    </div>
  </section>
);

export default HeroSection;
