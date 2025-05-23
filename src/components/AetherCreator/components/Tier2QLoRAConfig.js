import React, { useState } from 'react';
import styles from '../AetherCreator.module.css';
import Tooltip from './Tooltip';

const Tier2QLoRAConfig = ({ 
  // HF model props
  hfModelId,
  // Dataset props
  datasetPath,
  setDatasetPath,
  // QLoRA parameters
  qloraParams,
  setQloraParams,
  // Status and progress tracking
  importStatusMessage,
  setImportStatusMessage,
  importProgress,
  isImporting,
  // Handler for QLoRA fine-tuning
  handleStartQloraFinetune
}) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [datasetSource, setDatasetSource] = useState('local'); // local or huggingface

  // Handle input changes for QLoRA parameters
  const handleQloraParamChange = (param, value) => {
    setQloraParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // Handle starting QLoRA fine-tuning
  const onStartFineTune = () => {
    if (!hfModelId) {
      setImportStatusMessage('Error: A base Hugging Face Model ID must be specified first.');
      return;
    }
    
    if (!datasetPath) {
      setImportStatusMessage('Error: A dataset path or ID is required for fine-tuning.');
      return;
    }
    
    handleStartQloraFinetune();
  };
  
  // Format numeric input ensuring it's a valid number
  const formatNumericInput = (value, defaultValue) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  return (
    <div className={styles.qloraConfigContainer}>
      <h3 className={styles.sectionTitle}>QLoRA Fine-Tuning</h3>
      <p className={styles.sectionDescription}>
        Fine-tune the imported model using QLoRA (Quantized Low-Rank Adaptation) to specialize it for specific tasks.
      </p>
      
      <div className={styles.sourceToggleContainer}>
        <div
          className={`${styles.sourceToggle} ${datasetSource === 'local' ? styles.sourceToggleActive : ''}`}
          onClick={() => setDatasetSource('local')}
        >
          <span className={styles.sourceIcon}>📂</span> Local Dataset
        </div>
        <div
          className={`${styles.sourceToggle} ${datasetSource === 'huggingface' ? styles.sourceToggleActive : ''}`}
          onClick={() => setDatasetSource('huggingface')}
        >
          <span className={styles.sourceIcon}>🤗</span> Hugging Face Dataset
        </div>
      </div>
      
      <div className={styles.inputGroup}>
        <label htmlFor="datasetPath" className={styles.inputLabel}>
          {datasetSource === 'local' ? 'Local Dataset Path:' : 'Hugging Face Dataset ID:'}
          <Tooltip text="Specify the path to your local fine-tuning dataset or a Hugging Face dataset ID.">
            <span className={styles.tooltipIcon}>(?)</span>
          </Tooltip>
        </label>
        <input
          type="text"
          id="datasetPath"
          name="datasetPath"
          placeholder={datasetSource === 'local' ? 'e.g., C:/datasets/training_data.jsonl' : 'e.g., username/dataset-name'}
          value={datasetPath}
          onChange={(e) => setDatasetPath(e.target.value)}
          className={styles.inputControl}
        />
      </div>
      
      <div className={styles.advancedOptionsToggle} onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
        {showAdvancedOptions ? '▼' : '▶'} QLoRA Parameters
      </div>
      
      {showAdvancedOptions && (
        <div className={styles.advancedOptionsContainer}>
          <div className={styles.qloraParamsGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="qloraRank" className={styles.inputLabel}>
                Rank (r):
                <Tooltip text="LoRA rank parameter. Higher values may improve adaptation but require more memory. Common values: 8, 16, 32.">
                  <span className={styles.tooltipIcon}>(?)</span>
                </Tooltip>
              </label>
              <input
                type="number"
                id="qloraRank"
                min="1"
                max="128"
                value={qloraParams.rank}
                onChange={(e) => handleQloraParamChange('rank', Math.max(1, parseInt(e.target.value, 10) || 1))}
                className={styles.inputControl}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="qloraAlpha" className={styles.inputLabel}>
                Alpha (α):
                <Tooltip text="LoRA alpha parameter. Often set to 2x the rank value. Controls update scale.">
                  <span className={styles.tooltipIcon}>(?)</span>
                </Tooltip>
              </label>
              <input
                type="number"
                id="qloraAlpha"
                min="1"
                max="256"
                value={qloraParams.alpha}
                onChange={(e) => handleQloraParamChange('alpha', Math.max(1, parseInt(e.target.value, 10) || 1))}
                className={styles.inputControl}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="qloraTargetModules" className={styles.inputLabel}>
                Target Modules:
                <Tooltip text="Comma-separated list of modules to fine-tune. Common values: q_proj,v_proj,k_proj,o_proj.">
                  <span className={styles.tooltipIcon}>(?)</span>
                </Tooltip>
              </label>
              <input
                type="text"
                id="qloraTargetModules"
                placeholder="e.g., q_proj,v_proj"
                value={qloraParams.targetModules}
                onChange={(e) => handleQloraParamChange('targetModules', e.target.value)}
                className={styles.inputControl}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="qloraLearningRate" className={styles.inputLabel}>
                Learning Rate:
                <Tooltip text="Training learning rate. Common values: 0.0002 (2e-4), 0.0001 (1e-4), 0.00005 (5e-5).">
                  <span className={styles.tooltipIcon}>(?)</span>
                </Tooltip>
              </label>
              <input
                type="text"
                id="qloraLearningRate"
                placeholder="e.g., 0.0002"
                value={qloraParams.learningRate}
                onChange={(e) => handleQloraParamChange('learningRate', formatNumericInput(e.target.value, 0.0002))}
                className={styles.inputControl}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="qloraEpochs" className={styles.inputLabel}>
                Epochs:
                <Tooltip text="Number of training epochs. More epochs may improve results but take longer.">
                  <span className={styles.tooltipIcon}>(?)</span>
                </Tooltip>
              </label>
              <input
                type="number"
                id="qloraEpochs"
                min="1"
                max="20"
                value={qloraParams.epochs}
                onChange={(e) => handleQloraParamChange('epochs', Math.max(1, parseInt(e.target.value, 10) || 1))}
                className={styles.inputControl}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="qloraBatchSize" className={styles.inputLabel}>
                Batch Size:
                <Tooltip text="Training batch size. Lower values use less memory but train slower.">
                  <span className={styles.tooltipIcon}>(?)</span>
                </Tooltip>
              </label>
              <input
                type="number"
                id="qloraBatchSize"
                min="1"
                max="32"
                value={qloraParams.batchSize}
                onChange={(e) => handleQloraParamChange('batchSize', Math.max(1, parseInt(e.target.value, 10) || 1))}
                className={styles.inputControl}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.finetuneBtnContainer}>
        <button
          onClick={onStartFineTune}
          className={styles.finetuneButton}
          disabled={isImporting || !hfModelId || !datasetPath}
        >
          {isImporting ? (
            <>
              <span className={styles.loadingSpinner}>⟳</span> Fine-tuning in Progress...
            </>
          ) : (
            <>🧠 Start QLoRA Fine-tuning</>
          )}
        </button>
      </div>
      
      {importStatusMessage && datasetPath && (
        <div className={styles.statusContainer}>
          <div className={styles.statusHeader}>
            <span className={styles.statusIcon}>{isImporting ? '⟳' : '📊'}</span>
            <span className={styles.statusTitle}>Fine-tuning Status</span>
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

export default Tier2QLoRAConfig; 