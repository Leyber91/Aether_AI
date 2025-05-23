import React from 'react';
import { motion } from 'framer-motion';
import styles from './VisionParallaxExperience.module.css';

const StorySection = ({ title, content, visual, sticky }) => {
  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        delayChildren: 0.2,
        staggerChildren: 0.15
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };
  
  // Content fade-in effect
  const contentVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };

  return (
    <motion.section
      className={styles.storySection}
      style={sticky ? { position: 'sticky', top: 0 } : {}}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.3 }}
      variants={containerVariants}
    >
      <motion.div className={styles.storyTextWrap} variants={itemVariants}>
        {title && (
          <motion.h1 
            className={styles.storyTitle}
            variants={itemVariants}
            whileHover={{ scale: 1.02, color: '#a18fff' }}
          >
            {title}
          </motion.h1>
        )}
        
        {content && (
          <motion.div 
            className={styles.storyContent}
            variants={contentVariants}
          >
            {content}
          </motion.div>
        )}
      </motion.div>
      
      {visual && (
        <motion.div 
          className={styles.storyVisual}
          variants={itemVariants}
          whileHover={{ scale: 1.05, rotate: -2 }}
        >
          {visual}
        </motion.div>
      )}
    </motion.section>
  );
};

export default StorySection;
