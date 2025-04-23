import React, { useRef, useEffect, useState } from 'react';
import styles from './VisionNarrativeSection.module.css';
import BoidRenderer from './animation/BoidRenderer';

// Simple SVG layers for demonstration
const StarsLayer = ({ offset }) => (
  <div className={styles.parallaxLayer} style={{ transform: `translateY(${offset * 0.2}px)` }} aria-hidden="true">
    <svg width="100%" height="100%" viewBox="0 0 1200 800" style={{ position: 'absolute' }}>
      <circle cx="100" cy="100" r="1.5" fill="white" />
      <circle cx="200" cy="50" r="1" fill="white" />
      <circle cx="400" cy="120" r="1.5" fill="white" />
      <circle cx="800" cy="200" r="1" fill="white" />
      <circle cx="1200" cy="300" r="1.2" fill="white" />
    </svg>
  </div>
);
const CloudsLayer = ({ offset }) => (
  <div className={styles.parallaxLayer} style={{ transform: `translateY(${offset * 0.5}px)` }} aria-hidden="true">
    <svg width="100%" height="100%" viewBox="0 0 1200 800" style={{ position: 'absolute' }}>
      <ellipse cx="600" cy="200" rx="300" ry="60" fill="#fff6" />
      <ellipse cx="900" cy="400" rx="200" ry="40" fill="#7ad0ff33" />
    </svg>
  </div>
);
const AuroraLayer = ({ offset }) => (
  <div className={styles.parallaxLayer} style={{ transform: `translateY(${offset * 0.7}px)` }} aria-hidden="true">
    <svg width="100%" height="100%" viewBox="0 0 1200 800" style={{ position: 'absolute' }}>
      <linearGradient id="aurora" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7ad0ff55" />
        <stop offset="100%" stopColor="#a18fff22" />
      </linearGradient>
      <ellipse cx="600" cy="600" rx="500" ry="80" fill="url(#aurora)" />
    </svg>
  </div>
);

const ParallaxBoxBackground = ({ scrollRef }) => {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    if (!scrollRef?.current) return;
    const handleScroll = () => setScroll(scrollRef.current.scrollTop);
    scrollRef.current.addEventListener('scroll', handleScroll);
    return () => scrollRef.current.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  return (
    <div className={styles.parallaxBoxBg} aria-hidden="true">
      <StarsLayer offset={scroll} />
      <CloudsLayer offset={scroll} />
      <AuroraLayer offset={scroll} />
      <div className={styles.boidsBgBox}><BoidRenderer /></div>
    </div>
  );
};

export default ParallaxBoxBackground;
