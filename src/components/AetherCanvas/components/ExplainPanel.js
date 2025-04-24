import React from 'react';
import styles from '../AetherCanvas.module.css';

/**
 * ExplainPanel - Shows model/node transparency (model info, latency, tokens, logs, cost, errors)
 * Props:
 *   selectedNode: Node object or null
 *   nodeExecutionData: { model, quant, backend, latency, tokens, logs, prompt, groqCost, error }
 *   loading: boolean
 *   error: string or null
 */
const ExplainPanel = ({ selectedNode, nodeExecutionData, loading, error }) => {
  // Move hook to the top level to comply with React rules
  const [logsOpen, setLogsOpen] = React.useState(false);

  if (!selectedNode) {
    return (
      <div className={styles.explainPanel}>
        <div className={styles.explainPanelEmpty}>Select a node to view details.</div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className={styles.explainPanel}>
        <div className={styles.explainPanelLoading}>Loading node details...</div>
      </div>
    );
  }
  const { model, quant, backend, latency, tokens, logs, prompt, groqCost, error: execError } = nodeExecutionData || {};

  // Suggest fix logic for common errors
  let suggestFix = null;
  if (execError) {
    if (/api key|apikey|key is not set|authorization/i.test(execError)) {
      suggestFix = 'Check your API key configuration in the .env file or settings.';
    } else if (/model.*not found|invalid model/i.test(execError)) {
      suggestFix = 'Check that the model name is correct and available for the selected backend.';
    } else if (/backend.*not implemented|undefined/i.test(execError)) {
      suggestFix = 'Choose a supported backend (Ollama or Groq) in the node settings.';
    } else if (/network|timeout|fetch|connection/i.test(execError)) {
      suggestFix = 'Check your network connection or backend service status.';
    } else {
      suggestFix = null;
    }
  }

  if (error || execError) {
    return (
      <div className={styles.explainPanel}>
        <div className={styles.explainPanelError}>
          <strong>Error:</strong> {error || execError}
        </div>
        {suggestFix && (
          <div className={styles.explainPanelSuggestFix}>
            <strong>Suggested Fix:</strong> {suggestFix}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.explainPanel}>
      <div className={styles.explainPanelSection}>
        <strong>Model:</strong> {model || '—'}
        <span className={styles.explainPanelSub}>({backend || '—'})</span>
      </div>
      <div className={styles.explainPanelSection}>
        <strong>Quantization:</strong> {quant || '—'}
      </div>
      <div className={styles.explainPanelSection}>
        <strong>Latency:</strong> {latency !== undefined ? `${latency} ms` : '—'}
      </div>
      <div className={styles.explainPanelSection}>
        <strong>Tokens:</strong> {tokens ? `${tokens.input || tokens.prompt || '—'} in / ${tokens.output || tokens.completion || '—'} out` : '—'}
      </div>
      <div className={styles.explainPanelSection}>
        <strong>Groq Cost:</strong> {backend === 'groq' ? (groqCost ? `$${groqCost}` : '$0.00') : '$0.00'}
      </div>
      <div className={styles.explainPanelSection}>
        <strong>Prompt:</strong>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#23253a', color: '#e3e5f7', padding: 8, borderRadius: 6, fontSize: 13, margin: 0 }}>{prompt || 'No prompt data available'}</pre>
      </div>
      {/* Logs Section */}
      {logs && logs.length > 0 && (
        <div className={styles.explainPanelSection}>
          <button
            className={styles.explainPanelLogsToggle}
            onClick={() => setLogsOpen(o => !o)}
            style={{ marginBottom: 6, fontSize: 13, background: 'none', color: '#7ad0ff', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {logsOpen ? '▼ Hide Logs' : '▶ Show Logs'}
          </button>
          {logsOpen && (
            <pre style={{ maxHeight: 180, overflowY: 'auto', background: '#181a2a', color: '#b2eaff', padding: 8, borderRadius: 6, fontSize: 12, margin: 0 }}>
              {Array.isArray(logs) ? logs.join('\n') : logs}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplainPanel;
