import React from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './VisionParallaxScene.module.css';

/**
 * VisionParallaxStorySection
 * A reusable, animated, story-driven section for the parallax journey.
 * Props:
 *   - title: Section title (string or React node)
 *   - subtitle: Section subtitle (string or React node)
 *   - content: Main content (string or React node)
 *   - visual: Optional visual (SVG, Lottie, or React node)
 *   - style: Custom style overrides
 *   - className: Custom className
 *   - sticky: Whether to apply sticky positioning (boolean, default: false)
 */
export default function VisionParallaxStorySection({
  title,
  subtitle,
  content,
  visual,
  style = {},
  className = '',
  sticky = false,
  ...props
}) {
  // Section ref for sticky and in-view logic
  const ref = React.useRef(null);
  const isInView = useInView(ref, { margin: '-20% 0px -20% 0px', once: false });

  return (
    <section
      ref={ref}
      className={`${styles.storySection} ${className}`}
      style={{
        ...style,
        position: sticky ? 'sticky' : 'static',
        top: sticky ? 0 : undefined,
        zIndex: 3
      }}
      {...props}
      tabIndex={0}
      aria-label={typeof title === 'string' ? title : undefined}
      role="region"
    >
      <div className={styles.storyTextWrap}>
        {title && (
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className={styles.storyTitle}
            tabIndex={0}
          >
            {title}
          </motion.h1>
        )}
        {subtitle && (
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
            className={styles.storySubtitle}
          >
            {subtitle}
          </motion.h2>
        )}
        {content && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ delay: 0.4, duration: 0.8, type: 'spring' }}
            className={styles.storyContent}
          >
            {content}
          </motion.div>
        )}
      </div>
      {visual && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ delay: 0.6, duration: 1, type: 'spring' }}
          className={styles.storyVisual}
          tabIndex={0}
          role="img"
          aria-label="section visual"
        >
          {visual}
        </motion.div>
      )}
    </section>
  );
}
