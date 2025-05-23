import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './VisionParallaxExperience.module.css';
import BoidRenderer from '../animation/BoidRenderer';
import AICoreParticlesRenderer from '../animation/AICoreParticlesRenderer';

const HeroSection = () => {
  const { scrollYProgress } = useScroll();
  
  // Map the initial scroll progress (0-20%) to dynamicFactor (0.2-1)
  const dynamicFactor = useTransform(
    scrollYProgress,
    [0, 0.2], // First 20% of scroll
    [0.2, 1]  // Map to 0.2-1 range for dynamic factor
  );
  
  // Text animations based on scroll
  const titleY = useTransform(scrollYProgress, [0, 0.1], [0, -15]); 
  const titleOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.7]);
  const subtitleY = useTransform(scrollYProgress, [0, 0.1], [0, -10]);
  const subtitleOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.5]);
  
  // Scale for AI Core (subtle grow effect on initial scroll)
  const coreScale = useTransform(scrollYProgress, [0, 0.1], [1, 1.1]);

  return (
    <section className={styles.heroSection}>
      <div className={styles.boidsBg}>
        {/* Enhanced boid animation */}
        <BoidRenderer />
      </div>
      <div className={styles.heroContent}>
        <motion.div 
          className={styles.heroArt}
          style={{ scale: coreScale }}
        >
          {/* Pass dynamic factor to AICoreParticlesRenderer */}
          <AICoreParticlesRenderer dynamicFactor={dynamicFactor} />
        </motion.div>
        
        <motion.h1 
          className={styles.heroTitle}
          style={{ y: titleY, opacity: titleOpacity }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          Aether Canvas: The Journey Begins
        </motion.h1>
        
        <motion.p 
          className={styles.heroSubtitle}
          style={{ y: subtitleY, opacity: subtitleOpacity }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        >
          In a world of tangled automations and silent errors, a new intelligence awakens...
        </motion.p>
      </div>
    </section>
  );
};

export default HeroSection;
