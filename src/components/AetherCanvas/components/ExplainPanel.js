import React from 'react';
import styles from '../AetherCanvas.module.css';

/**
 * ExplainPanel - Shows model/node transparency (model info, latency, tokens, logs)
 * Props:
 *   selectedNode: Node object or null
 *   nodeExecutionData: { model, quant, backend, latency, tokens, logs }
 *   loading: boolean
 *   error: string or null
 */
const ExplainPanel = ({ selectedNode, nodeExecutionData, loading, error }) => {
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
  if (error) {
    return (
      <div className={styles.explainPanel}>
        <div className={styles.explainPanelError}>{error}</div>
      </div>
    );
  }
  const { model, quant, backend, latency, tokens, logs } = nodeExecutionData || {};

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
        <strong>Tokens:</strong> {tokens ? `${tokens.input || '—'} in / ${tokens.output || '—'} out` : '—'}
      </div>
      <div className={styles.explainPanelLogs}>
        <strong>Logs:</strong>
        <div className={styles.explainPanelLogBox}>
          {logs && logs.length ? logs.map((log, i) => (
            <div key={i} className={styles.explainPanelLogLine}>{log}</div>
          )) : <span className={styles.explainPanelNoLogs}>No logs</span>}
        </div>
      </div>
    </div>
  );
};

export default ExplainPanel;
