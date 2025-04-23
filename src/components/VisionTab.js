import React from 'react';
import styles from './VisionTab.module.css';
import VisionParallaxExperience from './VisionParallaxExperience/VisionParallaxExperience';

/**
 * Vision Tab - Premium Parallax Narrative Experience
 */
const VisionTab = () => (
  <div className={styles.visionContainer}>
    <div className={styles.visionParallaxRoot}>
      <VisionParallaxExperience />
    </div>
  </div>
);

export default VisionTab;
