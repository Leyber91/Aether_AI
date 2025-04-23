import React, { useState, useEffect, useContext } from 'react';
import { ModelContext } from '../../contexts/ModelContext';
import './OllamaModelMonitor.css';

/**
 * OllamaModelMonitor Component
 * Displays information about available Ollama models and their status
 */
const OllamaModelMonitor = () => {
  // Use ModelContext for models, loading, error, and refresh
  const { models = {}, isLoading: isRefreshing, error, refreshOllamaModels } = useContext(ModelContext);
  const ollamaModels = Array.isArray(models.ollama) ? models.ollama : [];
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(null);

  // Track connection attempts
  useEffect(() => {
    if (isRefreshing) {
      setLastAttempt(new Date());
    }
  }, [isRefreshing]);

  // Format file size for display
  const formatSize = (sizeInBytes) => {
    if (!sizeInBytes) return '0 KB';
    if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else if (sizeInBytes < 1024 * 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  };

  // Format timestamp for last modified
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  const handleRetryConnection = (e) => {
    e.stopPropagation();
    refreshOllamaModels();
  };

  const hasModels = ollamaModels && ollamaModels.length > 0;
  const isConnected = hasModels;

  return (
    <div className="ollama-model-monitor glass-panel">
      <div className="monitor-header" onClick={toggleExpand}>
        <h3>
          <span>Ollama Models</span>
          <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}>{isConnected ? 'Online' : 'Offline'}</span>
        </h3>
        <button 
          className="refresh-button" 
          onClick={(e) => {
            e.stopPropagation();
            refreshOllamaModels();
          }}
          disabled={isRefreshing}
          title="Refresh Ollama status"
        >
          {isRefreshing ? (
            <span className="spinner-small"></span>
          ) : (
            <span>⟳</span>
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="models-list custom-scrollbar">
          {hasModels ? (
            <table className="models-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Size</th>
                  <th>Last Modified</th>
                </tr>
              </thead>
              <tbody>
                {ollamaModels.map(model => (
                  <tr key={model.name || model.id}>
                    <td>{model.name || model.id}</td>
                    <td>{formatSize(model.size)}</td>
                    <td>{formatDate(model.modified)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-models">
              {error ? (
                <>
                  <p className="error-message">Error connecting to Ollama: {error}</p>
                  <div className="connection-help">
                    <p>Troubleshooting steps:</p>
                    <ol>
                      <li>Ensure Ollama is installed and running on your computer</li>
                      <li>Check that Ollama is running on port 11434</li>
                      <li>Verify your firewall settings allow connections to Ollama</li>
                    </ol>
                    <button 
                      className="retry-button" 
                      onClick={handleRetryConnection}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? 'Trying to connect...' : 'Retry Connection'}
                    </button>
                    {lastAttempt && <p className="last-attempt">Last attempt: {lastAttempt.toLocaleTimeString()}</p>}
                  </div>
                </>
              ) : (
                <p>No models found or Ollama is not running</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OllamaModelMonitor;
