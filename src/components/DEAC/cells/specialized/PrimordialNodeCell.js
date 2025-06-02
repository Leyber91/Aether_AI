import React, { useState } from 'react';
import { FiLayers, FiZap, FiPlus } from 'react-icons/fi';
import NodeCell from '../core/NodeCell';
import SpawnMenu from './SpawnMenu';
import '../styles/core/BaseTheme.css';
import '../styles/shared/Buttons.css';
import './PrimordialNodeCell.css';

/**
 * PrimordialNodeCell - Evolved from NodeCell
 * Adds spawning capabilities and primordial-specific features
 */
const PrimordialNodeCell = ({ 
  id, 
  data, 
  isSelected,
  onSpawn,
  onCommunicate,
  metaLoopActive 
}) => {
  const [showSpawnMenu, setShowSpawnMenu] = useState(false);

  const handleSpawn = (specializationType) => {
    onSpawn?.(id, specializationType);
    setShowSpawnMenu(false);
  };

  const handleCommunicate = () => {
    onCommunicate?.(id, {
      content: `MetaLoop signal from ${data.name || id}`,
      type: 'exploration'
    });
  };

  // Enhanced data for primordial nodes
  const primordialData = {
    ...data,
    type: 'primordial',
    capabilities: ['spawning', 'evolution', 'communication']
  };

  return (
    <NodeCell id={id} data={primordialData} isSelected={isSelected}>
      {/* Primordial Badge */}
      <div className="primordial-badge">
        <FiLayers />
      </div>

      {/* Generation Counter */}
      <div className="generation-display">
        Gen {data.evolutionGeneration || 0}
      </div>

      {/* Control Panel with cellular button classes */}
      <div className="primordial-controls">
        {metaLoopActive && (
          <button 
            className="cell-btn cell-btn--icon cell-btn--metaloop" 
            onClick={handleCommunicate}
            title="Send MetaLoop Signal"
          >
            <FiZap />
          </button>
        )}
        
        <button 
          className="cell-btn cell-btn--icon cell-btn--spawn"
          onClick={() => setShowSpawnMenu(true)}
          title="Spawn Specialized Node"
        >
          <FiPlus />
        </button>
      </div>

      {/* Spawn Menu */}
      {showSpawnMenu && (
        <SpawnMenu 
          onSpawn={handleSpawn}
          onClose={() => setShowSpawnMenu(false)}
        />
      )}

      {/* MetaLoop Activity Indicator */}
      {metaLoopActive && (
        <div className="metaloop-pulse"></div>
      )}
    </NodeCell>
  );
};

export default PrimordialNodeCell; 