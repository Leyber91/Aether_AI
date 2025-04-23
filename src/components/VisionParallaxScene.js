import React from 'react';
import styles from './VisionParallaxScene.module.css';
import { motion, useScroll, useTransform } from 'framer-motion';
import BoidRenderer from './animation/BoidRenderer';
import VisionParallaxStorySection from './VisionParallaxStorySection';

// Parallax layers for the Vision tab interactive story
const ParallaxBackground = ({ scrollYProgress }) => {
  // Animate each layer at a different speed for deep parallax
  const starsY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const cloudsY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const nebulaY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const constellationsY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const auroraY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className={styles.bg}>
      <motion.div className={styles.stars} style={{ y: starsY }} />
      <motion.div className={styles.clouds} style={{ y: cloudsY }} />
      <motion.div className={styles.nebula} style={{ y: nebulaY }} />
      <motion.div className={styles.constellations} style={{ y: constellationsY }} />
      <motion.div className={styles.aurora} style={{ y: auroraY }} />
      <div className={styles.boids}>
        <BoidRenderer />
      </div>
    </div>
  );
};

const VisionParallaxScene = () => {
  // Parallax scroll progress
  const { scrollYProgress } = useScroll();
  // Example: animate opacity/position based on scroll
  const y1 = useTransform(scrollYProgress, [0, 0.3], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0.2, 0.6], [120, -120]);
  const y3 = useTransform(scrollYProgress, [0.5, 1], [120, 0]);

  return (
    <div className={styles.visionParallaxRoot}>
      <ParallaxBackground scrollYProgress={scrollYProgress} />
      <motion.div className={styles.storyLayer} style={{ y: y1 }}>
        <VisionParallaxStorySection
          title="Aether Canvas: The Journey Begins"
          content="In a world of tangled automations and silent errors, a new intelligence awakens..."
          visual={null}
          sticky={true}
        />
      </motion.div>
      <motion.div className={styles.storyLayer} style={{ y: y2 }}>
        <VisionParallaxStorySection
          title="The Spark of Aether"
          content="The arrival of Aether Canvas brings clarity—AI agents flock, nodes snap together, and flows illuminate the darkness."
          visual={null}
          sticky={false}
        />
      </motion.div>
      <motion.div className={styles.storyLayer} style={{ y: y3 }}>
        <VisionParallaxStorySection
          title="Your Voyage"
          content="Describe your goal. Watch the AI build, explain, and optimize your flow. Errors are fixed by animated helpers. Data pulses, outputs blossom, and you orchestrate intelligence."
          visual={null}
          sticky={false}
        />
      </motion.div>
      <motion.div className={styles.storyLayer} style={{ y: y3 }}>
        <VisionParallaxStorySection
          title="The Community Constellation"
          content="Share, remix, and discover flows. The canvas zooms out—revealing a living constellation of user-created intelligence."
          visual={null}
          sticky={false}
        />
      </motion.div>
    </div>
  );
};

export default VisionParallaxScene;
