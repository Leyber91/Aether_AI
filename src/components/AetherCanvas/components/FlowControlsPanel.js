import React from 'react';
import { Controls, Background } from 'reactflow';

const FlowControlsPanel = () => (
  <>
    <Controls
      showInteractive={true}
      style={{
        background: 'rgba(25, 26, 35, 0.92)',
        border: '2px solid #7ad0ff',
        borderRadius: 10,
        boxShadow: '0 2px 12px #00eaff33',
        margin: 8,
        zIndex: 10,
      }}
      position="bottom-left"
    />
    <Background variant="dots" gap={16} size={1} />
  </>
);

export default FlowControlsPanel;
