import React, { useState } from 'react';
import { FiCpu, FiHardDrive, FiWifi, FiZap, FiActivity, FiEdit3 } from 'react-icons/fi';
import '../styles/shared/Buttons.css';
import '../styles/shared/StatusDots.css';
import './DEACInspectorPanel.css';

/**
 * DEACInspectorPanel - Deep structure viewer for selected DEAC
 * Shows internal architecture, capabilities, and evolution state
 */
const DEACInspectorPanel = ({ selectedDEAC, onStructureModify }) => {
  const [editMode, setEditMode] = useState(false);

  if (!selectedDEAC) {
    return (
      <div className="deac-inspector-panel">
        <div className="inspector-header">
          <FiActivity className="panel-icon" />
          <h3>DEAC Inspector</h3>
        </div>
        <div className="inspector-empty">
          <div className="empty-state-icon">
            <FiCpu />
          </div>
          <p>Select a DEAC node to inspect its internal structure</p>
        </div>
      </div>
    );
  }

  const { data } = selectedDEAC;
  const structure = data.internalStructure || {};

  const handleStructureEdit = (component, newValue) => {
    const updatedStructure = { ...structure, [component]: newValue };
    onStructureModify?.(updatedStructure);
  };

  return (
    <div className="deac-inspector-panel">
      
      {/* Inspector Header */}
      <div className="inspector-header">
        <div className="header-info">
          <FiActivity className="panel-icon" />
          <div>
            <h3>DEAC Inspector</h3>
            <span className="inspector-subtitle">{data.name}</span>
          </div>
        </div>
        <button 
          className={`cell-btn cell-btn--icon ${editMode ? 'cell-btn--warning' : 'cell-btn--secondary'}`}
          onClick={() => setEditMode(!editMode)}
          title={editMode ? 'Exit Edit Mode' : 'Edit Structure'}
        >
          <FiEdit3 />
        </button>
      </div>

      {/* Basic Info Section */}
      <div className="inspector-section">
        <h4>Core Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">ID:</span>
            <span className="info-value">{selectedDEAC.id}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Type:</span>
            <span className="info-value">{data.type || selectedDEAC.type}</span>
          </div>
          <div className="info-item">
            <span className="info-label">State:</span>
            <div className="status-display">
              <div className={`status-dot status-dot--${data.state}`}></div>
              <span>{data.state}</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-label">Generation:</span>
            <span className="info-value">Gen {data.evolutionGeneration || 0}</span>
          </div>
        </div>
      </div>

      {/* Internal Structure */}
      <div className="inspector-section">
        <h4>Internal Architecture</h4>
        <div className="structure-grid">
          
          {/* Core Processors */}
          <div className="structure-component">
            <div className="component-header">
              <FiCpu className="component-icon" />
              <span>Core Processors</span>
            </div>
            <div className="component-value">
              {editMode ? (
                <input 
                  type="number" 
                  value={structure.coreProcessors || 0}
                  onChange={(e) => handleStructureEdit('coreProcessors', parseInt(e.target.value))}
                  className="structure-input"
                />
              ) : (
                <span className="metric-value">{structure.coreProcessors || 0}</span>
              )}
            </div>
          </div>

          {/* Memory Banks */}
          <div className="structure-component">
            <div className="component-header">
              <FiHardDrive className="component-icon" />
              <span>Memory Banks</span>
            </div>
            <div className="component-value">
              {editMode ? (
                <input 
                  type="number" 
                  value={structure.memoryBanks || 0}
                  onChange={(e) => handleStructureEdit('memoryBanks', parseInt(e.target.value))}
                  className="structure-input"
                />
              ) : (
                <span className="metric-value">{structure.memoryBanks || 0}</span>
              )}
            </div>
          </div>

          {/* Communication Channels */}
          <div className="structure-component">
            <div className="component-header">
              <FiWifi className="component-icon" />
              <span>Comm Channels</span>
            </div>
            <div className="component-value">
              {editMode ? (
                <input 
                  type="number" 
                  value={structure.communicationChannels || 0}
                  onChange={(e) => handleStructureEdit('communicationChannels', parseInt(e.target.value))}
                  className="structure-input"
                />
              ) : (
                <span className="metric-value">{structure.communicationChannels || 0}</span>
              )}
            </div>
          </div>

          {/* Specialized Components */}
          {structure.analysisEngines && (
            <div className="structure-component">
              <div className="component-header">
                <FiZap className="component-icon" />
                <span>Analysis Engines</span>
              </div>
              <div className="component-value">
                <span className="metric-value">{structure.analysisEngines}</span>
              </div>
            </div>
          )}

          {structure.enhancementModules && (
            <div className="structure-component">
              <div className="component-header">
                <FiActivity className="component-icon" />
                <span>Enhancement Modules</span>
              </div>
              <div className="component-value">
                <span className="metric-value">{structure.enhancementModules}</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Capabilities */}
      <div className="inspector-section">
        <h4>Capabilities</h4>
        <div className="capabilities-list">
          {data.capabilities?.map((capability, index) => (
            <div key={index} className="capability-tag">
              {capability}
            </div>
          )) || <span className="no-data">No capabilities defined</span>}
        </div>
      </div>

      {/* Specialization Info */}
      {data.specialization && (
        <div className="inspector-section">
          <h4>Specialization</h4>
          <div className="specialization-info">
            <div className="specialization-badge">
              {data.specialization}
            </div>
            {data.parentId && (
              <div className="parent-info">
                <span className="info-label">Spawned from:</span>
                <span className="info-value">{data.parentId}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evolution Actions */}
      <div className="inspector-section">
        <h4>Evolution Actions</h4>
        <div className="evolution-actions">
          <button className="cell-btn cell-btn--spawn cell-btn--compact">
            Spawn Child
          </button>
          <button className="cell-btn cell-btn--secondary cell-btn--compact">
            Enhance
          </button>
          <button className="cell-btn cell-btn--warning cell-btn--compact">
            Specialize
          </button>
        </div>
      </div>

    </div>
  );
};

export default DEACInspectorPanel; 