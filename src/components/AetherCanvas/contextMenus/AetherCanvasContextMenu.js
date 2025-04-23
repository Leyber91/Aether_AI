// Context menu UI and accessibility for AetherCanvas
import React from 'react';

export default function AetherCanvasContextMenu({ contextMenu, onEdit, onDuplicate, onDelete, onAddLabel, onHide }) {
  if (!contextMenu.visible) return null;
  return (
    <div
      style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000, background: 'rgba(32,38,60,0.98)', border: '2px solid #7ad0ff', borderRadius: 8, boxShadow: '0 2px 16px #00eaff33', padding: '10px 0', minWidth: 160 }}
      onMouseLeave={onHide}
      tabIndex={-1}
      role="menu"
      aria-label="Canvas context menu"
    >
      {contextMenu.type === 'node' && (
        <>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#7ad0ff', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={onEdit}>Edit</button>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ffe066', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={onDuplicate}>Duplicate</button>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ff7272', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={onDelete}>Delete</button>
        </>
      )}
      {contextMenu.type === 'edge' && (
        <>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#7ad0ff', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={onAddLabel}>Add/Edit Label</button>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ffe066', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={onDuplicate}>Duplicate</button>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ff7272', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={onDelete}>Delete</button>
        </>
      )}
    </div>
  );
}
