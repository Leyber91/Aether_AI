import React, { useState } from 'react';
import styles from '../AetherCreator.module.css';
import Tooltip from './Tooltip';

// Preset icons with descriptive emojis
const presetIcons = {
  default: '⚖️',
  codingFocus: '💻',
  creativeWriting: '📝',
  maxSpeed: '⚡',
  qaAssistant: '❓',
  instructFollow: '📋',
  longContext: '📚',
  customPreset: '💾',
};

// Detailed descriptions for each preset
const presetDescriptions = {
  default: 'Balanced settings for general use',
  codingFocus: 'Low temperature, high precision for accurate code generation',
  creativeWriting: 'Higher temperature and creativity-focused parameters',
  maxSpeed: 'Minimal settings for fastest possible inference',
  qaAssistant: 'Optimized for question answering with factual precision',
  instructFollow: 'Fine-tuned for following complex instructions accurately',
  longContext: 'Maximized context window for handling lengthy documents',
  customPreset: 'Your saved custom configuration',
};

const PresetSelector = ({ 
  presets, 
  selectedPreset, 
  handlePresetChange, 
  currentConfig, 
  handleSaveCustomPreset 
}) => {
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');

  // Handler for saving custom preset
  const onSaveCustomPreset = () => {
    if (customPresetName.trim()) {
      handleSaveCustomPreset(customPresetName.trim());
      setShowSavePreset(false);
      setCustomPresetName('');
    }
  };

  return (
    <div className={styles.presetContainer}>
      <div className={styles.presetHeader}>
        <h3>Configuration Presets</h3>
        <Tooltip text="Select a preset to automatically configure all parameters for a specific use case. You can also save your current configuration as a custom preset.">
          <span className={styles.tooltipIcon}>(?)</span>
        </Tooltip>
        {!showSavePreset && (
          <button 
            className={styles.savePresetButton}
            onClick={() => setShowSavePreset(true)}
            type="button"
          >
            Save Current as Preset
          </button>
        )}
      </div>
      
      {showSavePreset && (
        <div className={styles.savePresetForm}>
          <input 
            type="text"
            placeholder="Enter preset name"
            value={customPresetName}
            onChange={(e) => setCustomPresetName(e.target.value)}
            className={styles.presetNameInput}
          />
          <div className={styles.savePresetActions}>
            <button 
              onClick={onSaveCustomPreset}
              className={styles.confirmSaveButton}
              disabled={!customPresetName.trim()}
              type="button"
            >
              Save
            </button>
            <button 
              onClick={() => setShowSavePreset(false)}
              className={styles.cancelSaveButton}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={styles.presetSelectorRow}>
        {Object.entries(presets).map(([key, preset]) => (
          <button
            key={key}
            className={
              selectedPreset === key
                ? `${styles.presetCard} ${styles.presetCardSelected}`
                : styles.presetCard
            }
            onClick={() => handlePresetChange({ target: { value: key } })}
            type="button"
          >
            <div className={styles.presetIcon}>{presetIcons[key] || '🎛️'}</div>
            <div className={styles.presetTitle}>{preset.label}</div>
            <div className={styles.presetDescription}>{presetDescriptions[key] || ''}</div>
          </button>
        ))}
        <button
          className={
            !selectedPreset ? `${styles.presetCard} ${styles.presetCardSelected}` : styles.presetCard
          }
          onClick={() => handlePresetChange({ target: { value: '' } })}
          type="button"
        >
          <div className={styles.presetIcon}>🎛️</div>
          <div className={styles.presetTitle}>Custom</div>
          <div className={styles.presetDescription}>Set parameters manually</div>
        </button>
      </div>
    </div>
  );
};

export default PresetSelector;
