import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  FiCpu, 
  FiZap, 
  FiMessageCircle, 
  FiPlus, 
  FiActivity,
  FiTarget,
  FiLayers,
  FiTrendingUp
} from 'react-icons/fi';

const DEACNetworkNode = ({ 
  id, 
  data, 
  isSelected,
  onCommunicate,
  onSpawnSpecialized,
  communicationFlows,
  metaLoopActive 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [showSpawnMenu, setShowSpawnMenu] = useState(false);

  // Animation for recent communications
  useEffect(() => {
    if (communicationFlows.length > 0) {
      const recentFlow = communicationFlows[communicationFlows.length - 1];
      setLastMessage(recentFlow);
      setIsActive(true);
      
      const timeout = setTimeout(() => setIsActive(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [communicationFlows]);

  const handleCommunicate = async () => {
    // Find a connected node to communicate with
    const message = {
      content: `MetaLoop inquiry from ${data.name || `Node ${id}`}`,
      type: 'exploration',
      timestamp: new Date()
    };
    
    // This would typically target a specific connected node
    // For demo, we'll use a simple broadcast approach
    if (onCommunicate) {
      onCommunicate(id, 'broadcast', message);
    }
  };

  const handleSpawnSpecialized = (specializationType) => {
    if (onSpawnSpecialized) {
      onSpawnSpecialized(id, specializationType);
    }
    setShowSpawnMenu(false);
  };

  const specializationOptions = [
    { type: 'analyzer', label: 'Data Analyzer', icon: FiActivity },
    { type: 'communicator', label: 'Communication Hub', icon: FiMessageCircle },
    { type: 'processor', label: 'Task Processor', icon: FiCpu },
    { type: 'coordinator', label: 'Network Coordinator', icon: FiTarget }
  ];

  const nodeClass = `deac-network-node ${data.isPrimordial ? 'primordial' : 'spawned'} ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`;
  const specializationClass = data.specialization ? `specialized-${data.specialization}` : '';

  return (
    <div className={`${nodeClass} ${specializationClass}`}>
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle"
        style={{ background: '#7ad0ff' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle"
        style={{ background: '#7ad0ff' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle"
        style={{ background: '#7ad0ff' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="node-handle"
        style={{ background: '#7ad0ff' }}
      />

      {/* Node Header */}
      <div className="node-header">
        <div className="node-icon">
          {data.isPrimordial ? <FiLayers /> : <FiCpu />}
        </div>
        <div className="node-info">
          <div className="node-name">
            {data.name || `DEAC ${id}`}
          </div>
          {data.specialization && (
            <div className="node-specialization">
              {data.specialization}
            </div>
          )}
        </div>
        {data.isPrimordial && (
          <div className="primordial-badge">P</div>
        )}
      </div>

      {/* Node Status */}
      <div className="node-status">
        <div className="status-indicators">
          <div className={`status-dot ${data.state || 'ready'}`}></div>
          <span className="status-text">
            {data.state === 'thinking' ? 'Processing' : 
             data.state === 'evolving' ? 'Evolving' :
             data.state === 'communicating' ? 'Communicating' : 'Ready'}
          </span>
        </div>
        
        {metaLoopActive && (
          <div className="metaloop-indicator">
            <FiZap className={`metaloop-icon ${isActive ? 'pulsing' : ''}`} />
          </div>
        )}
      </div>

      {/* Node Metrics */}
      <div className="node-metrics">
        <div className="metric">
          <span className="metric-label">Gen:</span>
          <span className="metric-value">{data.evolutionGeneration || 0}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Conn:</span>
          <span className="metric-value">{data.connectionCount || 0}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Strength:</span>
          <span className="metric-value">{(data.connectionStrength || 0).toFixed(1)}</span>
        </div>
      </div>

      {/* Communication Flow Indicator */}
      {lastMessage && (
        <div className="communication-flow">
          <div className="message-preview">
            {lastMessage.message.substring(0, 30)}...
          </div>
        </div>
      )}

      {/* Model Information */}
      {data.modelId && (
        <div className="model-info">
          <div className="model-name">{data.modelId}</div>
          {data.specialization && (
            <div className="model-specialization">
              Specialized for {data.specialization}
            </div>
          )}
        </div>
      )}

      {/* Node Controls */}
      <div className="node-controls">
        {metaLoopActive && (
          <button 
            className="control-btn communicate-btn"
            onClick={handleCommunicate}
            title="Send MetaLoop Communication"
          >
            <FiMessageCircle />
          </button>
        )}
        
        {data.spawnCapacity > 0 && (
          <button 
            className="control-btn spawn-btn"
            onClick={() => setShowSpawnMenu(!showSpawnMenu)}
            title="Spawn Specialized Node"
          >
            <FiPlus />
          </button>
        )}
        
        <button 
          className="control-btn evolve-btn"
          title="Trigger Evolution"
        >
          <FiTrendingUp />
        </button>
      </div>

      {/* Spawn Menu */}
      {showSpawnMenu && (
        <div className="spawn-menu">
          <div className="spawn-menu-header">
            <span>Spawn Specialized Node</span>
            <button 
              className="close-btn"
              onClick={() => setShowSpawnMenu(false)}
            >×</button>
          </div>
          <div className="specialization-options">
            {specializationOptions.map(option => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.type}
                  className="specialization-option"
                  onClick={() => handleSpawnSpecialized(option.type)}
                >
                  <IconComponent className="option-icon" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Ring for Active Nodes */}
      {isActive && (
        <div className="activity-ring"></div>
      )}
    </div>
  );
};

export default DEACNetworkNode; 