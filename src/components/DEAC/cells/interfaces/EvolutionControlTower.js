import React, { useState } from 'react';
import { FiZap, FiLayers, FiPlayCircle, FiPauseCircle, FiPlus, FiTarget, FiActivity } from 'react-icons/fi';
import '../styles/shared/Buttons.css';
import '../styles/shared/StatusDots.css';
import './EvolutionControlTower.css';

/**
 * EvolutionControlTower - Command center for network evolution
 * Controls spawning, specialization, and MetaLoop activation
 */
const EvolutionControlTower = ({ 
  selectedDEAC, 
  onEvolutionTrigger, 
  onMetaLoopToggle, 
  metaLoopActive, 
  evolutionInProgress,
  networkStats 
}) => {
  const [evolutionMode, setEvolutionMode] = useState('spawn');

  const handleEvolutionAction = () => {
    if (!selectedDEAC) return;
    onEvolutionTrigger(evolutionMode, selectedDEAC.id);
  };

  const getEvolutionIcon = (mode) => {
    switch (mode) {
      case 'spawn': return FiPlus;
      case 'specialize': return FiTarget;
      case 'enhance': return FiZap;
      default: return FiActivity;
    }
  };

  return (
    <div className="evolution-control-tower">
      
      {/* Control Tower Header */}
      <div className="control-header">
        <div className="header-info">
          <FiLayers className="panel-icon" />
          <div>
            <h3>Evolution Control</h3>
            <span className="control-subtitle">Network Command Center</span>
          </div>
        </div>
        <div className={`tower-status ${evolutionInProgress ? 'active' : 'idle'}`}>
          <div className={`status-dot status-dot--${evolutionInProgress ? 'evolving' : 'ready'}`}></div>
        </div>
      </div>

      {/* Network Stats Overview */}
      <div className="control-section">
        <h4>Network Overview</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Active Nodes</span>
            <span className="stat-value">{networkStats.activeNodes}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Communications</span>
            <span className="stat-value">{networkStats.totalCommunications}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Generation</span>
            <span className="stat-value">Gen {networkStats.evolutionGeneration}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Health Score</span>
            <span className="stat-value">{networkStats.healthScore}%</span>
          </div>
        </div>
      </div>

      {/* MetaLoop Control */}
      <div className="control-section">
        <h4>MetaLoop System</h4>
        <div className="metaloop-controls">
          <button 
            className={`cell-btn ${metaLoopActive ? 'cell-btn--warning' : 'cell-btn--metaloop'}`}
            onClick={() => onMetaLoopToggle(!metaLoopActive)}
          >
            {metaLoopActive ? <FiPauseCircle /> : <FiPlayCircle />}
            {metaLoopActive ? 'Deactivate MetaLoop' : 'Activate MetaLoop'}
          </button>
          
          {metaLoopActive && (
            <div className="metaloop-status-display">
              <div className="metaloop-indicator">
                <div className="metaloop-pulse"></div>
                <span>MetaLoop Active</span>
              </div>
              <div className="communication-metrics">
                <span>{networkStats.totalCommunications} messages exchanged</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evolution Controls */}
      <div className="control-section">
        <h4>Evolution Operations</h4>
        
        {/* Evolution Mode Selection */}
        <div className="evolution-modes">
          {['spawn', 'specialize', 'enhance'].map(mode => {
            const IconComponent = getEvolutionIcon(mode);
            return (
              <button
                key={mode}
                className={`evolution-mode-btn ${evolutionMode === mode ? 'active' : ''}`}
                onClick={() => setEvolutionMode(mode)}
              >
                <IconComponent />
                <span>{mode}</span>
              </button>
            );
          })}
        </div>

        {/* Selected DEAC Info */}
        <div className="selected-deac-info">
          {selectedDEAC ? (
            <div className="deac-summary">
              <div className="deac-header">
                <div className={`status-dot status-dot--${selectedDEAC.data.state}`}></div>
                <div>
                  <span className="deac-name">{selectedDEAC.data.name}</span>
                  <span className="deac-type">{selectedDEAC.type}</span>
                </div>
              </div>
              <div className="deac-capabilities">
                {selectedDEAC.data.capabilities?.slice(0, 2).map((cap, index) => (
                  <span key={index} className="capability-chip">{cap}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <FiTarget className="selection-icon" />
              <span>Select a DEAC to evolve</span>
            </div>
          )}
        </div>

        {/* Evolution Action Button */}
        <button 
          className={`cell-btn cell-btn--primary evolution-action-btn ${!selectedDEAC ? 'disabled' : ''}`}
          onClick={handleEvolutionAction}
          disabled={!selectedDEAC || evolutionInProgress}
        >
          {evolutionInProgress ? (
            <>
              <div className="loading-spinner"></div>
              Evolution in Progress...
            </>
          ) : (
            <>
              <FiZap />
              Trigger {evolutionMode.charAt(0).toUpperCase() + evolutionMode.slice(1)}
            </>
          )}
        </button>
      </div>

      {/* Emergency Controls */}
      <div className="control-section emergency-section">
        <h4>Emergency Controls</h4>
        <div className="emergency-actions">
          <button className="cell-btn cell-btn--warning cell-btn--compact">
            Pause Network
          </button>
          <button className="cell-btn cell-btn--danger cell-btn--compact">
            Emergency Stop
          </button>
        </div>
      </div>

      {/* Evolution History */}
      <div className="control-section">
        <h4>Recent Evolution Events</h4>
        <div className="evolution-history">
          <div className="history-item">
            <div className="event-indicator spawn"></div>
            <div className="event-details">
              <span className="event-action">Spawned Analyzer</span>
              <span className="event-time">2 min ago</span>
            </div>
          </div>
          <div className="history-item">
            <div className="event-indicator specialize"></div>
            <div className="event-details">
              <span className="event-action">Enhanced Genesis Beta</span>
              <span className="event-time">5 min ago</span>
            </div>
          </div>
          <div className="history-item">
            <div className="event-indicator communication"></div>
            <div className="event-details">
              <span className="event-action">MetaLoop Activated</span>
              <span className="event-time">8 min ago</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default EvolutionControlTower; 