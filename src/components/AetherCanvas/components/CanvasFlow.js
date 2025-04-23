import React from 'react';
import ReactFlow from 'reactflow';
import MinimapPanel from './MinimapPanel';
import FlowControlsPanel from './FlowControlsPanel';
import { getNodeStyle } from '../utils/AetherCanvasStyleUtils';

const CanvasFlow = ({
  visibleNodes,
  visibleEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  customNodeTypes,
  edgeTypes,
  handleCanvasClick,
  handleDrop,
  handleDragOver,
  onSelectionChange,
  selectedNodeIds
}) => (
  <ReactFlow
    nodes={visibleNodes.map(n => ({ ...n, style: getNodeStyle(n, selectedNodeIds) }))}
    edges={visibleEdges}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    onConnect={onConnect}
    nodeTypes={customNodeTypes}
    edgeTypes={edgeTypes}
    onPaneClick={handleCanvasClick}
    fitView
    onDrop={handleDrop}
    onDragOver={handleDragOver}
    onSelectionChange={onSelectionChange}
    connectionLineStyle={{ stroke: '#7ad0ff', strokeWidth: 2 }}
    connectionLineType="bezier"
    defaultEdgeOptions={{ animated: true, style: { stroke: '#7ad0ff', strokeWidth: 2 } }}
    connectOnClick={true}
  >
    <MinimapPanel />
    <FlowControlsPanel />
  </ReactFlow>
);

export default CanvasFlow;
