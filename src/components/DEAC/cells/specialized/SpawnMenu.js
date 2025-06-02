import React from 'react';
import { FiActivity, FiMessageCircle, FiCpu, FiTarget } from 'react-icons/fi';
import './SpawnMenu.css';

/**
 * SpawnMenu - Tiny cell for specialization selection
 * Ultra-focused on just spawning decisions
 */
const SpawnMenu = ({ onSpawn, onClose }) => {
  const specializations = [
    { type: 'analyzer', icon: FiActivity, label: 'Analyzer' },
    { type: 'communicator', icon: FiMessageCircle, label: 'Hub' },
    { type: 'processor', icon: FiCpu, label: 'Processor' },
    { type: 'coordinator', icon: FiTarget, label: 'Coordinator' }
  ];

  return (
    <div className="spawn-menu">
      <div className="spawn-header">
        <span>Spawn</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="spawn-options">
        {specializations.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            className={`spawn-option ${type}`}
            onClick={() => onSpawn(type)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SpawnMenu; 