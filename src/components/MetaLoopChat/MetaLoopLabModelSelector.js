import React, { useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from "../../api/apiService";
import styles from './ModelSelector/ModelSelector.module.css';
import { GroqIcon, OllamaIcon } from '../ModelSelector/FusedIcons';

const Spinner = () => (
  <div className={styles.spinner} aria-label="Loading">
    <div className={styles['spinner-dot']} />
    <div className={styles['spinner-dot']} />
    <div className={styles['spinner-dot']} />
  </div>
);

/**
 * Standalone ModelSelector for MetaLoopLab.
 * Keeps selected model and provider local to avoid cross-contamination between A and B.
 */
export default function MetaLoopLabModelSelector({ selectedModel, selectedProvider, onSelect, style }) {
  const [ollamaModels, setOllamaModels] = useState([]);
  const [groqModels, setGroqModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE_URL}/models/ollama`)
      .then(r => r.json())
      .then(data => setOllamaModels(Array.isArray(data) ? data : []))
      .catch(() => setOllamaModels([]));
    fetch(`${API_BASE_URL}/models/groq`)
      .then(r => r.json())
      .then(data => setGroqModels(Array.isArray(data) ? data : []))
      .catch(() => setGroqModels([]));
    setIsLoading(false);
  }, []);

  return (
    <div className={styles['model-selector']} style={style}>
      <div className={styles['provider-tabs']}>
        <button
          className={`${styles['provider-tab']} ${selectedProvider === 'groq' ? styles.active : ''}`}
          onClick={() => onSelect('groq', groqModels[0]?.id)}
          aria-label="Select Groq Provider"
        >
          <GroqIcon size={20} className={styles['fused-icon']} /> Groq
        </button>
        <button
          className={`${styles['provider-tab']} ${selectedProvider === 'ollama' ? styles.active : ''}`}
          onClick={() => onSelect('ollama', ollamaModels[0]?.id)}
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
            {groqModels && !isLoading ? groqModels.map(model => (
              <div
                key={model.id}
                className={`${styles['model-item']} ${selectedModel === model.id ? styles.selected : ''}`}
                onClick={() => onSelect('groq', model.id)}
                tabIndex={0}
                aria-selected={selectedModel === model.id}
                role="button"
              >
                <div className={styles['model-name']}>{model.name}</div>
                <div className={styles['model-id']}>{model.id}</div>
              </div>
            )) : null}
          </div>
        </div>
      ) : (
        <div className={styles['model-list']}>
          <div className={styles['model-list-header']}>
            <h4><OllamaIcon size={18} className={styles['fused-icon']} /> Ollama Models
              <button className={styles['refresh-button']} title="Refresh Ollama Models" onClick={() => {
                setIsLoading(true);
                fetch(`${API_BASE_URL}/models/ollama`)
                  .then(r => r.json())
                  .then(data => setOllamaModels(Array.isArray(data) ? data : []))
                  .catch(() => setOllamaModels([]));
                setIsLoading(false);
              }}>
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
                onClick={() => onSelect('ollama', model.id)}
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
}
