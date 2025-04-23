// Export/import logic for AetherCanvas

export function exportWorkflow(nodes, edges) {
  const data = JSON.stringify({ nodes, edges }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aether-canvas-workflow.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importWorkflow(file, setNodes, setEdges) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const { nodes: importedNodes, edges: importedEdges } = JSON.parse(evt.target.result);
      setNodes(importedNodes || []);
      setEdges(importedEdges || []);
    } catch {
      alert('Invalid workflow file');
    }
  };
  reader.readAsText(file);
}
