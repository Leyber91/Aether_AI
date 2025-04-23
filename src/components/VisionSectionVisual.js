import React from 'react';

// Each section gets a unique geometric SVG visual. These can be evolved for even more premium effects later.
const visuals = [
  // Section 0: Hero
  () => (
    <svg width="100%" height="220" viewBox="0 0 900 220" style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <linearGradient id="heroGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e2b50" />
          <stop offset="100%" stopColor="#2e5bff" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polygon points="0,220 180,80 400,130 700,60 900,220" fill="url(#heroGradient)" filter="url(#glow)" opacity="0.65" />
      <circle cx="120" cy="110" r="32" fill="#2e5bff33" filter="url(#glow)" />
      <circle cx="800" cy="60" r="24" fill="#7ad0ff33" filter="url(#glow)" />
    </svg>
  ),
  // Section 1: Core Principles
  () => (
    <svg width="100%" height="160" viewBox="0 0 900 160" style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <linearGradient id="coreGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e2b50" />
          <stop offset="100%" stopColor="#7ad0ff" />
        </linearGradient>
      </defs>
      <polygon points="0,160 200,40 500,100 900,60 900,160" fill="url(#coreGradient)" opacity="0.7" />
      <rect x="650" y="30" width="80" height="80" rx="32" fill="#2e5bff22" />
    </svg>
  ),
  // Section 2: What Makes Us Unique
  () => (
    <svg width="100%" height="180" viewBox="0 0 900 180" style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <radialGradient id="uniqueRadial" cx="0.7" cy="0.2" r="0.8">
          <stop offset="0%" stopColor="#7ad0ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1e2b50" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      <ellipse cx="700" cy="70" rx="180" ry="60" fill="url(#uniqueRadial)" />
      <polygon points="0,180 100,60 400,120 900,80 900,180" fill="#2e5bff22" />
    </svg>
  ),
  // Section 3: Opportunities
  () => (
    <svg width="100%" height="100" viewBox="0 0 900 100" style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <linearGradient id="oppGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2e5bff" />
          <stop offset="100%" stopColor="#1e2b50" />
        </linearGradient>
      </defs>
      <polygon points="0,100 250,40 700,80 900,100" fill="url(#oppGradient)" opacity="0.85" />
      <circle cx="850" cy="60" r="22" fill="#7ad0ff33" />
    </svg>
  ),
  // Section 4: How Does It Work
  () => (
    <svg width="100%" height="120" viewBox="0 0 900 120" style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <linearGradient id="workGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7ad0ff" />
          <stop offset="100%" stopColor="#1e2b50" />
        </linearGradient>
      </defs>
      <polygon points="0,120 150,40 650,80 900,120" fill="url(#workGradient)" opacity="0.8" />
    </svg>
  ),
  // Section 5: Why Now
  () => (
    <svg width="100%" height="80" viewBox="0 0 900 80" style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <linearGradient id="whyGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e2b50" />
          <stop offset="100%" stopColor="#7ad0ff" />
        </linearGradient>
      </defs>
      <polygon points="0,80 80,20 400,60 900,40 900,80" fill="url(#whyGradient)" opacity="0.9" />
    </svg>
  )
];

const VisionSectionVisual = ({ sectionIndex }) => {
  const Visual = visuals[sectionIndex] || (() => null);
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
      <Visual />
    </div>
  );
};

export default VisionSectionVisual;
