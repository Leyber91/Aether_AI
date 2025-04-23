// Handles node grouping, ungrouping, selection, and collapse/expand logic for AetherCanvas
import { useCallback, useMemo } from 'react';

export function useNodeGrouping(nodes, setNodes, selectedNodeIds, setSelectedNodeIds, groupCollapseState, setGroupCollapseState) {
  // Group selected nodes
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
  }, [nodes, selectedNodeIds, setNodes, setSelectedNodeIds, setGroupCollapseState]);

  // Ungroup
  const handleUngroup = useCallback((groupId) => {
    setNodes(nds => {
      const groupNode = nds.find(n => n.id === groupId);
      if (!groupNode || !groupNode.data || !groupNode.data.children) return nds;
      const updated = nds
        .filter(n => n.id !== groupId)
        .map(n =>
          groupNode.data.children.includes(n.id)
            ? { ...n, parentNode: undefined, extent: undefined }
            : n
        );
      return updated;
    });
    setGroupCollapseState(s => {
      const copy = { ...s };
      delete copy[groupId];
      return copy;
    });
  }, [setNodes, setGroupCollapseState]);

  // Collapse/expand group node
  const handleToggleCollapse = useCallback((groupId) => {
    setGroupCollapseState(s => ({ ...s, [groupId]: !s[groupId] }));
  }, [setGroupCollapseState]);

  // Filter nodes based on group collapse state
  const visibleNodes = useMemo(() => {
    let filtered = nodes;
    Object.entries(groupCollapseState).forEach(([groupId, isCollapsed]) => {
      if (isCollapsed) {
        const groupNode = nodes.find(n => n.id === groupId);
        if (groupNode && groupNode.data && groupNode.data.children) {
          filtered = filtered.filter(n => !groupNode.data.children.includes(n.id) || n.type === 'group');
        }
      }
    });
    return filtered;
  }, [nodes, groupCollapseState]);

  return { handleGroupNodes, handleUngroup, handleToggleCollapse, visibleNodes };
}
