import React from 'react';
import styles from './VisionParallaxExperience.module.css';

const StorySection = ({ title, content, visual, sticky }) => (
  <section className={styles.storySection} style={sticky ? { position: 'sticky', top: 0 } : {}}>
    <div className={styles.storyTextWrap}>
      {title && <h1 className={styles.storyTitle}>{title}</h1>}
      {content && <div className={styles.storyContent}>{content}</div>}
    </div>
    {visual && <div className={styles.storyVisual}>{visual}</div>}
  </section>
);

export default StorySection;
