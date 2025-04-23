import React from 'react';
import styles from './AppHeader.module.css';

// SVG fluid waves + subtle CSS particles
export default function HeaderFluidBg() {
  return (
    <div className={styles['fluid-bg-container']}>
      {/* Only aura blobs, no waves or particles */}
      <div className={styles['aura-blobs']}>
        <div className={styles['aura-blob1']} />
        <div className={styles['aura-blob2']} />
        <div className={styles['aura-blob3']} />
        <div className={styles['aura-blob4']} />
      </div>
    </div>
  );
}
