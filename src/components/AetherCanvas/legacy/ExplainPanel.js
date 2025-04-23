import React from 'react';
import styles from './AetherCanvas.module.css';

const ExplainPanel = ({ selectedNode, nodeExecutionData }) => {
  if (!selectedNode) return <div className={styles.explainPanel}>Select a node to view details</div>;

  const { prompt, model, latency, tokens, groqCost } = nodeExecutionData[selectedNode.id] || {};

  return (
    <div className={styles.explainPanel}>
      <h3>Node Execution Details</h3>
      <div className={styles.detailSection}>
        <label>Prompt:</label>
        <pre>{prompt || 'No prompt data available'}</pre>
      </div>
      <div className={styles.detailSection}>
        <label>Model:</label>
        <span>{model || 'No model data available'}</span>
      </div>
      <div className={styles.detailSection}>
        <label>Latency:</label>
        <span>{latency ? `${latency} ms` : 'No latency data available'}</span>
      </div>
      <div className={styles.detailSection}>
        <label>Tokens:</label>
        <span>{tokens ? `Prompt: ${tokens.prompt}, Completion: ${tokens.completion}` : 'No token data available'}</span>
      </div>
      <div className={styles.detailSection}>
        <label>Groq Cost:</label>
        <span>{groqCost ? `$${groqCost}` : '$0.00'}</span>
      </div>
    </div>
  );
};

export default ExplainPanel;
