import React, { useState } from 'react';
import ReactFlow, { Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import PrimordialNodeCell from '../specialized/PrimordialNodeCell';
import NodeCell from '../core/NodeCell';
import '../styles/core/BaseTheme.css';
import './NetworkCanvas.css';

/**
 * NetworkCanvas - Enhanced living network visualization
 * Integrates with the ultimate DEAC interface for real-time interaction
 */
const NetworkCanvas = ({ 
  nodes = [], 
  edges = [], 
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onCommunicate,
  metaLoopActive = false,
  onSpawn
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Enhanced node type mapping for the ultimate interface
  const nodeTypes = {
    primordial: (props) => (
      <PrimordialNodeCell
        {...props}
        isSelected={selectedNodeId === props.id}
        onSpawn={(nodeId, specializationType) => {
          // Handle spawning within the network
          onSpawn?.(nodeId, specializationType);
        }}
        onCommunicate={(nodeId, message) => {
          // Handle MetaLoop communication
          onCommunicate?.(nodeId, findNearestNode(nodeId), message);
        }}
        metaLoopActive={metaLoopActive}
      />
    ),
    default: (props) => (
      <NodeCell
        {...props}
        isSelected={selectedNodeId === props.id}
      />
    ),
    specialized: (props) => (
      <NodeCell
        {...props}
        isSelected={selectedNodeId === props.id}
        data={{
          ...props.data,
          type: 'specialized'
        }}
      />
    ),
    // Future node types can evolve here
    analyzer: (props) => <NodeCell {...props} isSelected={selectedNodeId === props.id} />,
    communicator: (props) => <NodeCell {...props} isSelected={selectedNodeId === props.id} />,
    processor: (props) => <NodeCell {...props} isSelected={selectedNodeId === props.id} />,
    coordinator: (props) => <NodeCell {...props} isSelected={selectedNodeId === props.id} />
  };

  // Find nearest node for communication (helper function)
  const findNearestNode = (sourceNodeId) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode || nodes.length < 2) return null;

    // Simple nearest neighbor based on position
    let nearest = null;
    let minDistance = Infinity;

    nodes.forEach(node => {
      if (node.id === sourceNodeId) return;
      
      const sourcePos = sourceNode.position || { x: 0, y: 0 };
      const nodePos = node.position || { x: 0, y: 0 };
      
      const distance = Math.sqrt(
        Math.pow(nodePos.x - sourcePos.x, 2) +
        Math.pow(nodePos.y - sourcePos.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = node.id;
      }
    });

    return nearest;
  };

  // Enhanced node click handler for ultimate interface integration
  const handleNodeClick = (event, node) => {
    setSelectedNodeId(node.id);
    onNodeClick?.(node.id); // Notify the main interface
  };

  // Handle node spawning
  const handleNodeSpawn = (parentId, specializationType) => {
    onSpawn?.(parentId, specializationType);
  };

  // Ensure all nodes have valid structure
  const validatedNodes = nodes.map(node => ({
    ...node,
    id: node.id || `node-${Math.random()}`,
    type: node.type || 'default',
    position: node.position || { x: 0, y: 0 },
    data: node.data || {}
  }));

  // Ensure all edges have valid structure  
  const validatedEdges = edges.map(edge => ({
    ...edge,
    id: edge.id || `edge-${Math.random()}`,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'default',
    style: edge.style || { stroke: '#4facfe', strokeWidth: 2 }
  }));

  return (
    <div className="network-canvas">
      <ReactFlow
        nodes={validatedNodes}
        edges={validatedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
      >
        {/* Enhanced background for living network feel */}
        <Background 
          variant="dots" 
          gap={20} 
          size={1} 
          color={metaLoopActive ? "rgba(122, 208, 255, 0.4)" : "rgba(180, 183, 201, 0.3)"} 
        />
        
        {/* Enhanced controls */}
        <Controls />
        
        {/* MetaLoop Status Overlay */}
        {metaLoopActive && (
          <div className="metaloop-status">
            <div className="metaloop-pulse-indicator"></div>
            <span>MetaLoop Active</span>
          </div>
        )}

        {/* Network Statistics Overlay */}
        <div className="network-stats-overlay">
          <div className="stat-item">
            <span className="stat-label">Nodes:</span>
            <span className="stat-value">{validatedNodes.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Edges:</span>
            <span className="stat-value">{validatedEdges.length}</span>
          </div>
          {selectedNodeId && (
            <div className="stat-item selected">
              <span className="stat-label">Selected:</span>
              <span className="stat-value">{selectedNodeId}</span>
            </div>
          )}
        </div>

      </ReactFlow>
    </div>
  );
};

export default NetworkCanvas; 