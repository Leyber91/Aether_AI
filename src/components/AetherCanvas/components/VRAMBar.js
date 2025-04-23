import React from 'react';
import styles from '../AetherCanvas.module.css';

/**
 * VRAMBar - Shows live VRAM usage per loaded model as a stacked bar.
 * Props:
 *   vramData: [{ modelName, color, usedGB, totalGB }]
 *   onBarClick: function
 */
const VRAMBar = ({ vramData = [], onBarClick }) => {
  const total = vramData.reduce((sum, m) => sum + (m.usedGB || 0), 0);
  return (
    <div className={styles.vramBarContainer} title="Click for details" tabIndex={0} role="button" aria-label="Show loaded models" onClick={onBarClick}>
      <div className={styles.vramBar}>
        {vramData.map((m, i) => (
          <div
            key={m.modelName}
            className={styles.vramBarSegment}
            style={{
              background: m.color,
              width: total ? `${(m.usedGB / total) * 100}%` : '0%',
            }}
            title={`${m.modelName}: ${m.usedGB}GB / ${m.totalGB}GB`}
          />
        ))}
      </div>
      <div className={styles.vramBarLabel}>{total ? `${total.toFixed(1)} GB used` : 'No models loaded'}</div>
    </div>
  );
};

export default VRAMBar;
