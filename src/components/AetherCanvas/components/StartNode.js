import React, { useRef } from 'react';
import { Handle, Position } from 'reactflow';
import styles from '../AetherCanvas.module.css';

const stopAll = e => { e.stopPropagation(); };

const StartNode = ({ data, isConnectable, selected }) => {
  const textareaRef = useRef(null);

  // Allow focus and typing regardless of selection state
  // Prevent ReactFlow from blocking pointer events
  return (
    <div className={styles.startNode} data-selected={selected} style={{ pointerEvents: 'auto' }}>
      <div className={styles.nodeHeader}>
        <span className={styles.nodeIcon}>💬</span>
        <span className={styles.nodeLabel}>Chat Input</span>
      </div>
      <textarea
        ref={textareaRef}
        className={styles.startInput}
        value={data.input || ''}
        onChange={e => data.onInputChange && data.onInputChange(e.target.value)}
        placeholder="Type your message here..."
        rows={3}
        style={{ width: '100%', resize: 'vertical', pointerEvents: 'auto' }}
        tabIndex={0}
        onPointerDown={stopAll}
        onClick={stopAll}
        onMouseDown={stopAll}
        onDoubleClick={stopAll}
        onFocus={stopAll}
      />
      <Handle type="source" position={Position.Right} id="a" isConnectable={isConnectable} />
    </div>
  );
};

export default StartNode;
