import React from 'react';
import { Handle, Position } from 'reactflow';
import '../styles/core/BaseTheme.css';
import '../styles/shared/StatusDots.css';
import './NodeCell.css';

/**
 * NodeCell - Primordial network node
 * A minimal, focused cell that can evolve into specialized variants
 */
const NodeCell = ({ 
  id, 
  data, 
  isSelected,
  children 
}) => {
  const nodeClass = `node-cell ${data.type || 'basic'} ${isSelected ? 'selected' : ''}`;

  return (
    <div className={nodeClass} data-node-id={id}>
      {/* Connection Points */}
      <Handle type="target" position={Position.Top} className="connection-point" />
      <Handle type="source" position={Position.Bottom} className="connection-point" />
      <Handle type="target" position={Position.Left} className="connection-point" />
      <Handle type="source" position={Position.Right} className="connection-point" />

      {/* Core Node Content */}
      <div className="node-core">
        <div className="node-id">{id}</div>
        {data.name && <div className="node-name">{data.name}</div>}
      </div>

      {/* Status Indicator using cellular CSS */}
      <div className={`status-dot status-dot--${data.state || 'ready'}`}></div>

      {/* Dynamic Content - allows for specialization */}
      {children}
    </div>
  );
};

export default NodeCell; 