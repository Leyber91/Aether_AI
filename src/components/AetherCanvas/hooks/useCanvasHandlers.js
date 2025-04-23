import { useCallback } from 'react';

export default function useCanvasHandlers({
  nodes,
  setNodes,
  edges,
  setEdges,
  setDraggedType,
  setSelectedNodeIds,
  selectedNodeIds,
  setGroupCollapseState,
  setShowGoalWizard
}) {
  const handleCanvasClick = useCallback((event) => {
    if (event.target.classList.contains('canvasArea')) {
      const rect = event.target.getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      const id = (nodes.length + 1).toString();
      setNodes((nds) => nds.concat({
        id,
        type: 'agent',
        position,
        data: {
          label: 'Agent Node',
          backend: 'ollama',
          modelId: '',
          instructions: '',
          quant: '',
          temperature: 1,
          input: '',
          output: ''
        }
      }));
    }
  }, [nodes.length, setNodes]);

  const handleDragStart = useCallback((type) => (e) => {
    setDraggedType(type);
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  }, [setDraggedType]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const reactFlowBounds = event.target.getBoundingClientRect();
    // Read type from drag event
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top
    };
    const id = (nodes.length + 1).toString();
    setNodes((nds) => nds.concat({
      id,
      type,
      position,
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
        backend: 'ollama',
        modelId: '',
        instructions: '',
        quant: '',
        temperature: 1,
        input: '',
        output: ''
      }
    }));
    setDraggedType(null);
  }, [setNodes, setDraggedType, nodes.length]);

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleGroupNodes = useCallback(() => {
    if (selectedNodeIds.length < 2) return;
    const selectedNodesData = nodes.filter(n => selectedNodeIds.includes(n.id));
    const minX = Math.min(...selectedNodesData.map(n => n.position.x));
    const minY = Math.min(...selectedNodesData.map(n => n.position.y));
    const maxX = Math.max(...selectedNodesData.map(n => n.position.x));
    const maxY = Math.max(...selectedNodesData.map(n => n.position.y));
    const groupId = `group-${Date.now()}`;
    const groupNode = {
      id: groupId,
      type: 'group',
      position: { x: minX - 40, y: minY - 40 },
      data: {
        label: 'Group',
        children: selectedNodeIds,
        childrenLabel: `${selectedNodeIds.length} nodes`
      },
      style: {
        width: (maxX - minX) + 120,
        height: (maxY - minY) + 120,
        zIndex: 0
      }
    };
    const updatedNodes = nodes.map(n =>
      selectedNodeIds.includes(n.id)
        ? { ...n, parentNode: groupId, extent: 'parent' }
        : n
    );
    setNodes([...updatedNodes, groupNode]);
    setGroupCollapseState(s => ({ ...s, [groupId]: false }));
    setSelectedNodeIds([]);
  }, [nodes, selectedNodeIds, setNodes, setGroupCollapseState, setSelectedNodeIds]);

  return {
    handleCanvasClick,
    handleDragStart,
    handleDrop,
    handleDragOver,
    handleGroupNodes
  };
}
