// Utility functions for node and edge styling in AetherCanvas
export const getNodeStyle = (n, selectedNodeIds = []) => {
  if (n.type === 'group' && Array.isArray(selectedNodeIds) && selectedNodeIds.includes(n.id)) {
    return { ...n.style, boxShadow: '0 0 0 4px #7ad0ff99, 0 8px 32px #7ad0ff33', border: '3px solid #7ad0ff', background: 'linear-gradient(135deg, #23253a 60%, #191a23 100%)' };
  }
  return n.style;
};

export const minimapNodeStrokeColor = (node) => {
  switch (node.type) {
    case 'agent': return '#7ad0ff';
    case 'tool': return '#00eaff';
    case 'filter': return '#f7c873';
    case 'output': return '#7dff72';
    default: return '#7ad0ff';
  }
};

export const minimapNodeColor = (node) => {
  switch (node.type) {
    case 'agent': return '#222b44';
    case 'tool': return '#003e52';
    case 'filter': return '#4a3a18';
    case 'output': return '#1a4a3a';
    default: return '#23253a';
  }
};
