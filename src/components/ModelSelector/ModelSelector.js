import React, { useContext } from 'react';
import { ModelContext } from '../../contexts/ModelContext';
import styles from './ModelSelector.module.css';
import { GroqIcon, OllamaIcon } from './FusedIcons';

const Spinner = () => (
  <div className={styles.spinner} aria-label="Loading">
    <div className={styles['spinner-dot']} />
    <div className={styles['spinner-dot']} />
    <div className={styles['spinner-dot']} />
  </div>
);

const ModelSelector = () => {
  const { 
    models, 
    selectedModel, 
    selectedProvider, 
    selectModel, 
    refreshOllamaModels,
    isLoading,
    error
  } = useContext(ModelContext);

  // Defensive: always use an array for ollama models
  const ollamaModels = Array.isArray(models.ollama) ? models.ollama : [];

  return (
    <div className={styles['model-selector']}>
      <div className={styles['provider-tabs']}>
        <button 
          className={`${styles['provider-tab']} ${selectedProvider === 'groq' ? styles.active : ''}`}
          onClick={() => selectModel('groq', models.groq && Array.isArray(models.groq) && models.groq.length > 0 ? models.groq[0].id : undefined)}
          aria-label="Select Groq Provider"
        >
          <GroqIcon size={20} className={styles['fused-icon']} /> Groq
        </button>
        <button 
          className={`${styles['provider-tab']} ${selectedProvider === 'ollama' ? styles.active : ''}`}
          onClick={() => selectModel('ollama', ollamaModels[0]?.id)}
          aria-label="Select Ollama Provider"
        >
          <OllamaIcon size={20} className={styles['fused-icon']} /> Ollama
        </button>
      </div>

      {selectedProvider === 'groq' ? (
        <div className={styles['model-list']}>
          <div className={styles['model-list-header']}>
            <h4><GroqIcon size={18} className={styles['fused-icon']} /> Groq Models</h4>
          </div>
          <div className={styles['model-list-items']}>
            {isLoading ? <Spinner /> : null}
            {Array.isArray(models.groq) && !isLoading ? models.groq.map(model => (
              <div 
                key={model.id}
                className={`${styles['model-item']} ${selectedModel === model.id ? styles.selected : ''}`}
                onClick={() => selectModel('groq', model.id)}
                tabIndex={0}
                aria-selected={selectedModel === model.id}
                role="button"
              >
                <div className={styles['model-name']}>{model.name}</div>
                <div className={styles['model-id']}>{model.id}</div>
              </div>
            )) : null}
          </div>
          <div className={styles['api-key-info']}>
            {!process.env.REACT_APP_GROQ_API_KEY && (
              <div className={styles.warning}>
                Groq API key not set. Add REACT_APP_GROQ_API_KEY to your .env file.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles['model-list']}>
          <div className={styles['model-list-header']}>
            <h4><OllamaIcon size={18} className={styles['fused-icon']} /> Ollama Models
              <button className={styles['refresh-button']} title="Refresh Ollama Models" onClick={refreshOllamaModels}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles['fused-icon']} xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="7" stroke="#a6f1ff" strokeWidth="1.5" fill="none" />
                  <path d="M8 3v3.5l2.5 1.5" stroke="#74d0fc" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </button>
            </h4>
          </div>
          <div className={styles['model-list-items']}>
            {isLoading ? <Spinner /> : null}
            {ollamaModels && !isLoading ? ollamaModels.map(model => (
              <div 
                key={model.id}
                className={`${styles['model-item']} ${selectedModel === model.id ? styles.selected : ''}`}
                onClick={() => selectModel('ollama', model.id)}
                tabIndex={0}
                aria-selected={selectedModel === model.id}
                role="button"
              >
                <div className={styles['model-name']}>{model.name}</div>
                <div className={styles['model-info']}>{model.size ? `${Math.round(model.size / (1024 * 1024))} MB` : ''}</div>
              </div>
            )) : null}
          </div>
          {error && (
            <div className={styles['error-badge']} role="alert">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
