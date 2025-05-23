import React, { useState } from 'react';
import styles from '../AetherCreator.module.css';
import Tooltip from './Tooltip';

const Tier2GGUFImporter = ({ 
  // Basic HF model props
  hfModelId, 
  setHfModelId, 
  // Status and progress tracking
  importStatusMessage,
  setImportStatusMessage,
  importProgress,
  isImporting,
  // Quantization options
  quantizationType,
  setQuantizationType,
  // Import handler
  handleImportHfModel
}) => {
  const [modelSource, setModelSource] = useState('huggingface'); // huggingface or custom
  const [customModelPath, setCustomModelPath] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Handler for model import
  const onImportModel = () => {
    // If using custom model path, set it as the GGUF path directly
    if (modelSource === 'custom' && customModelPath) {
      setImportStatusMessage(`Using custom model path: ${customModelPath}`);
      // Implementation would set the ggufPath directly and skip import
      return;
    }
    
    // Otherwise use the Hugging Face import
    if (hfModelId) {
      handleImportHfModel();
    } else {
      setImportStatusMessage('Error: Hugging Face Model ID is required.');
    }
  };

  return (
    <div className={styles.ggufImporterContainer}>
      <h3 className={styles.sectionTitle}>GGUF Model Importer & Quantizer</h3>
      <p className={styles.sectionDescription}>
        Import models from Hugging Face or use local GGUF files. Models will be converted and optimized for use with Ollama.
      </p>
      
      <div className={styles.sourceToggleContainer}>
        <div
          className={`${styles.sourceToggle} ${modelSource === 'huggingface' ? styles.sourceToggleActive : ''}`}
          onClick={() => setModelSource('huggingface')}
        >
          <span className={styles.sourceIcon}>🤗</span> Hugging Face
        </div>
        <div
          className={`${styles.sourceToggle} ${modelSource === 'custom' ? styles.sourceToggleActive : ''}`}
          onClick={() => setModelSource('custom')}
        >
          <span className={styles.sourceIcon}>📁</span> Local File
        </div>
      </div>
      
      {modelSource === 'huggingface' ? (
        <div className={styles.sourceInputContainer}>
          <div className={styles.inputGroup}>
            <label htmlFor="hfModelId" className={styles.inputLabel}>
              Hugging Face Model ID:
              <Tooltip text="Enter the Hugging Face model ID (e.g., mistralai/Mistral-7B-v0.1 or TheBloke/Mistral-7B-Instruct-v0.2-GGUF). Ensure it is compatible with GGUF conversion.">
                <span className={styles.tooltipIcon}>(?)</span>
              </Tooltip>
            </label>
            <input
              type="text"
              id="hfModelId"
              name="hfModelId"
              placeholder="e.g., TheBloke/CodeLlama-7B-GGUF"
              value={hfModelId}
              onChange={(e) => setHfModelId(e.target.value)}
              className={styles.inputControl}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="quantizationType" className={styles.inputLabel}>
              Target GGUF Quantization Type:
              <Tooltip text="Select the quantization type for the GGUF model. Lower bit quantization (Q4_K_M, Q3_K_M) means smaller file size but potentially reduced quality.">
                <span className={styles.tooltipIcon}>(?)</span>
              </Tooltip>
            </label>
            <select
              id="quantizationType"
              name="quantizationType"
              value={quantizationType}
              onChange={(e) => setQuantizationType(e.target.value)}
              className={styles.selectControl}
            >
              <option value="F16">FP16 (Unquantized GGUF) - Full precision</option>
              <option value="Q8_0">Q8_0 - High quality, 8-bit quantization</option>
              <option value="Q6_K">Q6_K - Good quality, 6-bit quantization</option>
              <option value="Q5_K_M">Q5_K_M - Balanced quality & size</option>
              <option value="Q4_K_M">Q4_K_M - Recommended for most use cases</option>
              <option value="Q3_K_M">Q3_K_M - Smaller size, reduced quality</option>
              <option value="Q2_K">Q2_K - Smallest size, lowest quality</option>
            </select>
          </div>
          
          <div className={styles.advancedOptionsToggle} onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
            {showAdvancedOptions ? '▼' : '▶'} Advanced Options
          </div>
          
          {showAdvancedOptions && (
            <div className={styles.advancedOptionsContainer}>
              <p className={styles.advancedOptionsDescription}>
                Advanced options for model conversion and quantization will be available in the next phase of development.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.sourceInputContainer}>
          <div className={styles.inputGroup}>
            <label htmlFor="customModelPath" className={styles.inputLabel}>
              Local GGUF File Path:
              <Tooltip text="Enter the full path to your local GGUF file. This file will be used directly without conversion.">
                <span className={styles.tooltipIcon}>(?)</span>
              </Tooltip>
            </label>
            <input
              type="text"
              id="customModelPath"
              name="customModelPath"
              placeholder="e.g., C:/models/my-model.gguf"
              value={customModelPath}
              onChange={(e) => setCustomModelPath(e.target.value)}
              className={styles.inputControl}
            />
          </div>
        </div>
      )}
      
      <div className={styles.importButtonContainer}>
        <button
          onClick={onImportModel}
          className={styles.importButton}
          disabled={isImporting || (modelSource === 'huggingface' && !hfModelId) || (modelSource === 'custom' && !customModelPath)}
        >
          {isImporting ? (
            <>
              <span className={styles.loadingSpinner}>⟳</span> Importing Model...
            </>
          ) : (
            <>{modelSource === 'huggingface' ? '🤗 Import from Hugging Face' : '📂 Use Local GGUF File'}</>
          )}
        </button>
      </div>
      
      {importStatusMessage && (
        <div className={styles.statusContainer}>
          <div className={styles.statusHeader}>
            <span className={styles.statusIcon}>{isImporting ? '⟳' : '📊'}</span>
            <span className={styles.statusTitle}>Import Status</span>
          </div>
          <div className={styles.statusMessage}>{importStatusMessage}</div>
          {isImporting && importProgress > 0 && (
            <div className={styles.progressContainer}>
              <div className={styles.progressBar} style={{ width: `${importProgress}%` }}></div>
              <div className={styles.progressLabel}>{importProgress}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tier2GGUFImporter; 