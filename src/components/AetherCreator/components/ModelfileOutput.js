import React from 'react';
import styles from '../AetherCreator.module.css';
import Tooltip from './Tooltip';

const ModelfileOutput = (props) => {
  const {
    generatedModelfile,
    ollamaModelName,
    setOllamaModelName,
    ollamaCreateCommand,
    handleCopyToClipboard,
    handleDownloadModelfile,
  } = props;

  return (
    <div className={styles.modelfileOutputContainer}>
      <div className={styles.outputHeader}>
        <h2 className={styles.outputTitle}>Generated Modelfile</h2>
        <p className={styles.outputDescription}>Your customized Ollama Modelfile will appear here after generation.</p>
      </div>
      
      {!generatedModelfile && (
        <div className={styles.emptyOutputState}>
          <div className={styles.emptyOutputIcon}>📄</div>
          <div className={styles.emptyOutputText}>Configure parameters and click "Generate Modelfile" to create your Ollama Modelfile</div>
        </div>
      )}
      
      <div className={styles.modelfileTextareaContainer}>
        <textarea
          value={generatedModelfile}
          readOnly
          placeholder="Modelfile content will appear here..."
          className={styles.modelfileTextarea}
          style={{ flexGrow: 1, whiteSpace: 'pre', overflowWrap: 'normal', overflowX: 'auto' }}
        />
      </div>
      <div className={styles.actionButtonRow}>
        <button
          onClick={() => handleCopyToClipboard(generatedModelfile, 'Modelfile content')}
          disabled={!generatedModelfile}
          className={`${styles.button} ${styles.copyButton}`}
        >
          Copy Modelfile
        </button>
        <button
          onClick={handleDownloadModelfile}
          disabled={!generatedModelfile}
          className={`${styles.button} ${styles.downloadButton}`}
        >
          Download Modelfile
        </button>
      </div>

      {generatedModelfile && (
        <div style={{ marginTop: '20px' }} className={styles.inputGroup}>
          <label htmlFor="ollamaModelNameInput" className={styles.inputLabel}>
            Ollama Model Name (for `ollama create`):
            <Tooltip text="Enter the name for your model in Ollama (e.g., my-cool-model:latest). This will be used in the example `ollama create` command.">
              <span className={styles.tooltipIcon}>(?)</span>
            </Tooltip>
          </label>
          <input
            type="text"
            id="ollamaModelNameInput"
            value={ollamaModelName}
            onChange={(e) => setOllamaModelName(e.target.value)}
            className={styles.inputControl}
            placeholder="my-custom-model:latest"
          />

          <div className={styles.outputTitle} style={{ marginTop: '15px', marginBottom: '5px' }}>Ollama Create Command:</div>
          <pre
            className={styles.textareaControl} // Using textarea styling for consistency
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              background: '#222', // Darker background for pre
              padding: '10px',
              minHeight: '60px',
              color: '#eee', // Ensure text is visible
            }}
          >
            {ollamaCreateCommand.split('\n')[0]} {/* Display only the command line */}
          </pre>
          {ollamaCreateCommand.includes('# Note:') && (
            <p style={{ fontSize: '0.85em', color: '#aaa', marginTop: '5px' }}>
              {ollamaCreateCommand.substring(ollamaCreateCommand.indexOf('# Note:'))}
            </p>
          )}
          <button
            onClick={() => handleCopyToClipboard(ollamaCreateCommand.split('\n')[0], 'Ollama create command')}
            disabled={!ollamaCreateCommand}
            className={`${styles.button} ${styles.copyButton}`}
            style={{ marginTop: '10px' }}
          >
            Copy Command
          </button>
        </div>
      )}
    </div>
  );
};

export default ModelfileOutput; 