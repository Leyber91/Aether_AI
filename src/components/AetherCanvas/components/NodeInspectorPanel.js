import React, { useState, useEffect } from 'react';
import sidebarStyles from '../AetherCanvas.Sidebar.module.css';

const NodeInspectorPanel = ({ node, modelsByBackend, onChange, onRun, loading, error, refreshOllamaModels }) => {
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [internalBackend, setInternalBackend] = useState(node?.data?.backend || 'ollama');
  const [internalModelId, setInternalModelId] = useState(node?.data?.modelId || '');

  // Update local state if node changes (e.g. selection changes)
  useEffect(() => {
    setInternalBackend(node?.data?.backend || 'ollama');
    setInternalModelId(node?.data?.modelId || '');
  }, [node]);

  // Watch for backend changes: reset model selection
  useEffect(() => {
    setInternalModelId('');
  }, [internalBackend]);

  // Defensive: ensure availableModels is always an array
  const availableModels = Array.isArray(modelsByBackend?.[internalBackend]) ? modelsByBackend[internalBackend] : [];

  const handleRefreshOllama = async () => {
    setOllamaLoading(true);
    try {
      if (typeof refreshOllamaModels === 'function') {
        await refreshOllamaModels();
      }
    } finally {
      setOllamaLoading(false);
    }
  };

  if (!node) {
    return (
      <div className={sidebarStyles.sidebarPanelEmpty}>Select a node to configure.</div>
    );
  }

  // Special case: StartNode (chat input)
  if (node.type === 'start') {
    return (
      <div className={sidebarStyles.sidebarPanel}>
        <div className={sidebarStyles.sidebarSection}>
          <label className={sidebarStyles.sidebarLabel}>Chat Input</label>
          <textarea
            className={sidebarStyles.sidebarInput}
            value={node.data.input || ''}
            onChange={e => onChange({ input: e.target.value })}
            placeholder="Type your message here..."
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
      </div>
    );
  }

  const { instructions = '', prompt = '', quant = '', temperature = 1.0 } = node.data || {};

  return (
    <div className={sidebarStyles.sidebarPanel}>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Backend</label>
        <select
          className={sidebarStyles.sidebarSelect}
          value={internalBackend}
          onChange={e => {
            setInternalBackend(e.target.value);
            onChange({ backend: e.target.value, modelId: '' });
          }}
        >
          <option value="ollama">Ollama</option>
          <option value="groq">Groq</option>
        </select>
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Model</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            className={sidebarStyles.sidebarSelect}
            value={internalModelId}
            onChange={e => {
              setInternalModelId(e.target.value);
              onChange({ modelId: e.target.value });
            }}
            style={{ flex: 1 }}
            disabled={loading || (internalBackend === 'ollama' && ollamaLoading)}
          >
            <option value="">{internalBackend === 'ollama' ? 'Select Ollama model' : 'Select Groq model'}</option>
            {availableModels.map(m => (
              <option key={m.id} value={m.id}>{m.name}{m.quantization ? ` [${m.quantization}]` : ''}</option>
            ))}
          </select>
          {internalBackend === 'ollama' && (
            <button
              className={sidebarStyles.refreshButton}
              title="Refresh Ollama Models"
              type="button"
              onClick={handleRefreshOllama}
              disabled={ollamaLoading}
              style={{ marginLeft: 4, padding: 0, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', height: 32 }}
            >
              {ollamaLoading ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={sidebarStyles.refreshSpinner}>
                  <circle cx="8" cy="8" r="7" stroke="#a6f1ff" strokeWidth="1.5" fill="none" opacity="0.3" />
                  <path d="M8 3v3.5l2.5 1.5" stroke="#74d0fc" strokeWidth="1.5" strokeLinecap="round" fill="none">
                    <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.8s" repeatCount="indefinite" />
                  </path>
                </svg>
              ) : (
                <span style={{ color: '#74d0fc', fontWeight: 700, fontSize: 18 }}>&#x21bb;</span>
              )}
            </button>
          )}
        </div>
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Instructions / System Prompt</label>
        <textarea className={sidebarStyles.sidebarTextarea} value={instructions} onChange={e => onChange({ instructions: e.target.value })} rows={3} placeholder="Describe what this node should do..." />
        <button type="button" className={sidebarStyles.suggestPromptBtn} onClick={() => onChange({ instructions: 'Suggest a prompt...' })}>Suggest Prompt</button>
      </div>
      <div className={sidebarStyles.sidebarSectionRow}>
        <div className={sidebarStyles.sidebarSubSection}>
          <label className={sidebarStyles.sidebarLabel}>Quantization</label>
          <input className={sidebarStyles.sidebarInput} type="text" value={quant} onChange={e => onChange({ quant: e.target.value })} placeholder="e.g. Q4_K_M" />
        </div>
        <div className={sidebarStyles.sidebarSubSection}>
          <label className={sidebarStyles.sidebarLabel}>Temperature</label>
          <input className={sidebarStyles.sidebarInput} type="number" min={0} max={2} step={0.01} value={temperature} onChange={e => onChange({ temperature: parseFloat(e.target.value) })} />
        </div>
      </div>
      <div className={sidebarStyles.sidebarActions}>
        <button type="button" className={sidebarStyles.runNodeBtn} onClick={onRun} disabled={loading}>{loading ? 'Running...' : 'Run Node'}</button>
      </div>
      {error && <div className={sidebarStyles.sidebarError}>{error}</div>}
    </div>
  );
};

export default NodeInspectorPanel;
