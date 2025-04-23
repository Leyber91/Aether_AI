// Handles edge connection, label editing, and context menu logic for AetherCanvas
import { useState, useCallback } from 'react';

export function useEdgeContextMenu(nodes, edges, setNodes, setEdges, setSelectedNodeIds) {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: null, id: null, edge: null });
  const [editingEdgeId, setEditingEdgeId] = useState(null);
  const [edgeLabelInput, setEdgeLabelInput] = useState('');

  // Context menu handlers
  const handleShowContextMenu = useCallback((e, type, id, edge) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type, id, edge });
  }, []);
  const handleHideContextMenu = useCallback(() => setContextMenu({ visible: false, x: 0, y: 0, type: null, id: null, edge: null }), []);

  // Context menu actions
  const handleContextDelete = useCallback(() => {
    if (contextMenu.type === 'node') {
      setNodes(nds => nds.filter(n => n.id !== contextMenu.id));
      setEdges(eds => eds.filter(e => e.source !== contextMenu.id && e.target !== contextMenu.id));
    } else if (contextMenu.type === 'edge') {
      setEdges(eds => eds.filter(e => e.id !== contextMenu.id));
    }
    handleHideContextMenu();
  }, [contextMenu, setNodes, setEdges, handleHideContextMenu]);

  const handleContextDuplicate = useCallback(() => {
    if (contextMenu.type === 'node') {
      const node = nodes.find(n => n.id === contextMenu.id);
      if (node) {
        const newId = `dup${Date.now()}`;
        setNodes(nds => [...nds, { ...node, id: newId, position: { ...node.position, x: node.position.x + 40, y: node.position.y + 40 } }]);
      }
    }
    handleHideContextMenu();
  }, [contextMenu, setNodes, nodes, handleHideContextMenu]);

  const handleContextEdit = useCallback(() => {
    if (contextMenu.type === 'node') {
      setSelectedNodeIds([contextMenu.id]);
    }
    handleHideContextMenu();
  }, [contextMenu, setSelectedNodeIds, handleHideContextMenu]);

  const handleContextAddLabel = useCallback(() => {
    if (contextMenu.type === 'edge') {
      setEditingEdgeId(contextMenu.id);
      setEdgeLabelInput(contextMenu.edge?.data?.label || '');
    }
    handleHideContextMenu();
  }, [contextMenu, handleHideContextMenu]);

  const handleEdgeLabelChange = useCallback((e) => setEdgeLabelInput(e.target.value), []);
  const handleEdgeLabelSave = useCallback(() => {
    setEdges(eds => eds.map(e => e.id === editingEdgeId ? { ...e, data: { ...(e.data || {}), label: edgeLabelInput } } : e));
    setEditingEdgeId(null);
  }, [editingEdgeId, edgeLabelInput, setEdges]);
  const handleEdgeLabelCancel = useCallback(() => setEditingEdgeId(null), []);

  return {
    contextMenu,
    editingEdgeId,
    edgeLabelInput,
    handleShowContextMenu,
    handleHideContextMenu,
    handleContextDelete,
    handleContextDuplicate,
    handleContextEdit,
    handleContextAddLabel,
    handleEdgeLabelChange,
    handleEdgeLabelSave,
    handleEdgeLabelCancel,
    setEditingEdgeId,
    setEdgeLabelInput
  };
}
