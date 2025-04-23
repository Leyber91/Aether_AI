import { useEffect } from 'react';

export default function useCanvasShortcuts({
  selectedNodeIds,
  setNodes,
  setEdges,
  setSelectedNodeIds,
  nodes,
  edges,
  handleDeleteSelected,
  handleDuplicateSelected,
  undoRedo
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.length > 0) {
        handleDeleteSelected();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedNodeIds(nodes.map(n => n.id));
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'c' && selectedNodeIds.length > 0) {
        e.preventDefault();
        window.__aetherClipboard = nodes.filter(n => selectedNodeIds.includes(n.id)).map(n => ({ ...n, id: undefined, position: { ...n.position, x: n.position.x + 40, y: n.position.y + 40 } }));
        window.__aetherClipboardEdges = edges.filter(e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)).map(e => ({ ...e, id: undefined, source: undefined, target: undefined }));
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'v' && window.__aetherClipboard && window.__aetherClipboard.length > 0) {
        e.preventDefault();
        const newIds = [];
        const pastedNodes = window.__aetherClipboard.map((n, i) => {
          const newId = `p${Date.now()}${i}`;
          newIds.push(newId);
          return { ...n, id: newId };
        });
        const pastedEdges = (window.__aetherClipboardEdges || []).map(e => {
          const srcIdx = window.__aetherClipboard.findIndex(n => n.id === e.source);
          const tgtIdx = window.__aetherClipboard.findIndex(n => n.id === e.target);
          if (srcIdx !== -1 && tgtIdx !== -1) {
            return { ...e, id: `pe${Date.now()}${srcIdx}${tgtIdx}`, source: newIds[srcIdx], target: newIds[tgtIdx] };
          }
          return null;
        }).filter(Boolean);
        setNodes(nds => [...nds, ...pastedNodes]);
        setEdges(eds => [...eds, ...pastedEdges]);
        setSelectedNodeIds(newIds);
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'd' && selectedNodeIds.length > 0) {
        e.preventDefault();
        handleDuplicateSelected();
      }
      if (e.ctrlKey && (e.key.toLowerCase() === 'z')) {
        if (e.shiftKey) {
          undoRedo.handleRedo();
        } else {
          undoRedo.handleUndo();
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        undoRedo.handleRedo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, nodes, edges, setNodes, setEdges, setSelectedNodeIds, handleDeleteSelected, handleDuplicateSelected, undoRedo]);
}
