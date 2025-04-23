// Undo/Redo logic for AetherCanvas
import { useState, useCallback, useEffect } from 'react';

export function useUndoRedo(nodes, edges, setNodes, setEdges) {
  const [history, setHistory] = useState([]); // [{nodes, edges}]
  const [future, setFuture] = useState([]);

  // Push current state to history stack
  const pushHistory = useCallback(() => {
    setHistory(h => [...h, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
    setFuture([]);
  }, [nodes, edges]);

  // Undo
  const handleUndo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      setFuture(f => [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }, ...f]);
      const prev = h[h.length - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      return h.slice(0, -1);
    });
  }, [nodes, edges, setNodes, setEdges]);

  // Redo
  const handleRedo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      setHistory(h => [...h, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
      const next = f[0];
      setNodes(next.nodes);
      setEdges(next.edges);
      return f.slice(1);
    });
  }, [nodes, edges, setNodes, setEdges]);

  // Track changes for undo/redo
  useEffect(() => {
    // Only push to history when nodes/edges change due to user action
    // (skip on initial mount)
    if (!window.__aetherInitialMount) {
      window.__aetherInitialMount = true;
      return;
    }
    pushHistory();
    // eslint-disable-next-line
  }, [nodes, edges]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handleUndoRedoKey(e) {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
    }
    window.addEventListener('keydown', handleUndoRedoKey);
    return () => window.removeEventListener('keydown', handleUndoRedoKey);
  }, [handleUndo, handleRedo]);

  return { handleUndo, handleRedo, pushHistory, history, future };
}
