import React, { useRef } from 'react';
import styles from './VisionParallaxScene.module.css';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * ParallaxSection: A full-screen section that animates in and out as you scroll.
 * - Each section fills the viewport, and scrolling jumps from one to the next with a parallax effect.
 * - Children are centered.
 */
export default function VisionParallaxSection({ children, index }) {
  const ref = useRef(null);
  // Use framer-motion's useScroll to get scroll progress for this section
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  // Animate translateY for parallax: section moves at a different speed than scroll
  const y = useTransform(scrollYProgress, [0, 1], ['20vh', '-20vh']);

  return (
    <section ref={ref} className={styles.parallaxSection}>
      <motion.div style={{ y }} className={styles.parallaxContent}>
        {children}
      </motion.div>
    </section>
  );
}
