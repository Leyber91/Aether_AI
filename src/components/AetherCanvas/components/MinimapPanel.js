import React from 'react';
import { MiniMap } from 'reactflow';
import { minimapNodeStrokeColor, minimapNodeColor } from '../utils/AetherCanvasStyleUtils';

const MinimapPanel = () => (
  <MiniMap
    nodeStrokeColor={minimapNodeStrokeColor}
    nodeColor={minimapNodeColor}
    nodeBorderRadius={6}
    style={{
      background: 'rgba(25, 26, 35, 0.92)',
      border: '2px solid #7ad0ff',
      borderRadius: 12,
      boxShadow: '0 2px 16px #00eaff33',
      margin: 8,
      width: 140,
      height: 90,
      zIndex: 10,
    }}
  />
);

export default MinimapPanel;
