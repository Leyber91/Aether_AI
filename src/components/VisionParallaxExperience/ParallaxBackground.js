import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './VisionParallaxExperience.module.css';

// SVG background assets (could be moved to separate files for clarity)
const Stars = () => (
  <motion.div
    className={styles.stars}
    aria-hidden="true"
    initial={{ opacity: 0.18 }}
    animate={{ opacity: [0.18, 0.26, 0.18] }}
    transition={{ duration: 12, repeat: Infinity }}
  >
    <svg width="100%" height="100%" viewBox="0 0 1200 800" style={{ position: 'absolute' }}>
      <circle cx="100" cy="100" r="1.5" fill="white" />
      <circle cx="200" cy="50" r="1" fill="white" />
      <circle cx="400" cy="120" r="1.5" fill="white" />
      <circle cx="800" cy="200" r="1" fill="white" />
      <circle cx="1200" cy="300" r="1.2" fill="white" />
    </svg>
  </motion.div>
);

const Nebula = ({ y }) => (
  <motion.div
    className={styles.nebula}
    style={{ y }}
    aria-hidden="true"
  />
);

const Clouds = ({ y }) => (
  <motion.div
    className={styles.clouds}
    style={{ y }}
    aria-hidden="true"
  />
);

const Constellations = ({ y }) => (
  <motion.div
    className={styles.constellations}
    style={{ y }}
    aria-hidden="true"
  />
);

const Aurora = ({ y }) => (
  <motion.div
    className={styles.aurora}
    style={{ y }}
    aria-hidden="true"
  />
);

const ParallaxBackground = () => {
  const { scrollYProgress } = useScroll();
  // Parallax transforms
  const starsY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const cloudsY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const nebulaY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const constellationsY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const auroraY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  return (
    <div className={styles.bg} aria-hidden="true">
      <motion.div className={styles.stars} style={{ y: starsY }}><Stars /></motion.div>
      <Clouds y={cloudsY} />
      <Nebula y={nebulaY} />
      <Constellations y={constellationsY} />
      <Aurora y={auroraY} />
    </div>
  );
};

export default ParallaxBackground;
