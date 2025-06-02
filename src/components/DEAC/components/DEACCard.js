import React, { useState } from 'react';
import { 
  FiMessageCircle, 
  FiZap, 
  FiTrash2, 
  FiActivity, 
  FiHash,
  FiBarChart2,
  FiClock,
  FiTrendingUp,
  FiPlay,
  FiPause,
  FiCheck,
  FiSquare
} from 'react-icons/fi';

/**
 * DEACCard - Individual DEAC card component
 */
const DEACCard = ({ deac, onInteract, onEvolve, onDelete, isSelected, onSelect, viewMode = 'grid' }) => {
  const [isEvolving, setIsEvolving] = useState(false);

  const handleEvolve = async () => {
    setIsEvolving(true);
    try {
      await onEvolve(deac.id);
    } finally {
      setIsEvolving(false);
    }
  };

  const handleSelection = () => {
    if (onSelect) {
      onSelect(deac.id, !isSelected);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const getStatusColor = (state) => {
    switch (state?.toLowerCase()) {
      case 'ready': return 'status-ready';
      case 'thinking': return 'status-thinking';
      case 'evolving': return 'status-evolving';
      case 'learning': return 'status-thinking';
      case 'error': return 'status-error';
      case 'paused': return 'status-paused';
      default: return 'status-ready';
    }
  };

  const evolutionProgress = Math.min((deac.evolution_score || 0) * 100, 100);

  if (viewMode === 'list') {
    return (
      <div className={`deac-list-item ${isSelected ? 'selected' : ''} fade-in`}>
        <div className="list-item-selection">
          <button 
            className="selection-checkbox"
            onClick={handleSelection}
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? <FiCheck /> : <FiSquare />}
          </button>
        </div>
        
        <div className="list-item-info">
          <div className="list-item-header">
            <h4>{deac.name}</h4>
            <div className={`status-indicator ${getStatusColor(deac.state)}`}>
              <FiActivity />
              {deac.state || 'ready'}
            </div>
          </div>
          <p className="list-item-description">{deac.description}</p>
          <div className="list-item-meta">
            <span><FiHash /> {deac.id.slice(0, 8)}...</span>
            <span>Model: {deac.base_model}</span>
            <span><FiClock /> {formatDate(deac.created_at)}</span>
          </div>
        </div>
        
        <div className="list-item-metrics">
          <div className="metric-compact">
            <FiMessageCircle />
            <span>{deac.total_interactions}</span>
          </div>
          <div className="metric-compact">
            <FiTrendingUp />
            <span>{deac.evolution_generations}</span>
          </div>
          <div className="metric-compact">
            <FiBarChart2 />
            <span>{evolutionProgress.toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="list-item-actions">
          <button
            className="btn btn-primary btn-compact"
            onClick={() => onInteract(deac)}
            title="Interact with this DEAC"
          >
            <FiMessageCircle />
          </button>
          
          <button
            className="btn btn-secondary btn-compact"
            onClick={handleEvolve}
            disabled={isEvolving || deac.state === 'evolving'}
            title="Trigger evolution for this DEAC"
          >
            {isEvolving ? (
              <div className="loading-spinner small"></div>
            ) : (
              <FiZap />
            )}
          </button>

          <button
            className="btn btn-danger btn-compact"
            onClick={() => onDelete(deac.id)}
            title="Delete this DEAC"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className={`deac-card ${isSelected ? 'selected' : ''} fade-in`}>
      {onSelect && (
        <div className="card-selection">
          <button 
            className="selection-checkbox"
            onClick={handleSelection}
            title={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? <FiCheck /> : <FiSquare />}
          </button>
        </div>
      )}
      
      <div className="deac-card-header">
        <div className="deac-card-title">
          <h3>{deac.name}</h3>
          <div className={`status-indicator ${getStatusColor(deac.state)}`}>
            <FiActivity />
            {deac.state || 'ready'}
          </div>
        </div>
        <div className="deac-card-model">
          <span className="model-label">Model:</span>
          <span className="model-name">{deac.base_model}</span>
        </div>
      </div>

      <div className="deac-card-content">
        <p className="deac-description">{deac.description}</p>

        <div className="deac-metrics">
          <div className="metric-row">
            <div className="metric-item">
              <FiMessageCircle className="metric-icon" />
              <div>
                <span className="metric-value">{deac.total_interactions}</span>
                <span className="metric-label">Interactions</span>
              </div>
            </div>
            <div className="metric-item">
              <FiTrendingUp className="metric-icon" />
              <div>
                <span className="metric-value">{deac.evolution_generations}</span>
                <span className="metric-label">Generations</span>
              </div>
            </div>
          </div>

          <div className="evolution-progress">
            <div className="progress-header">
              <span>Evolution Progress</span>
              <span>{evolutionProgress.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${evolutionProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="deac-meta">
          <div className="meta-item">
            <FiClock className="meta-icon" />
            <span>Created: {formatDate(deac.created_at)}</span>
          </div>
          <div className="meta-item">
            <FiHash className="meta-icon" />
            <span>ID: {deac.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      <div className="deac-card-actions">
        <button
          className="btn btn-primary"
          onClick={() => onInteract(deac)}
          title="Interact with this DEAC"
        >
          <FiMessageCircle />
          Interact
        </button>
        
        <button
          className="btn btn-secondary"
          onClick={handleEvolve}
          disabled={isEvolving || deac.state === 'evolving'}
          title="Trigger evolution for this DEAC"
        >
          {isEvolving ? (
            <>
              <div className="loading-spinner small"></div>
              Evolving...
            </>
          ) : (
            <>
              <FiZap />
              Evolve
            </>
          )}
        </button>

        <button
          className="btn btn-danger"
          onClick={() => onDelete(deac.id)}
          title="Delete this DEAC"
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

export default DEACCard; 