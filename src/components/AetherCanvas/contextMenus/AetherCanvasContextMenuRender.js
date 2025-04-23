// Modular context menu and edge label editor rendering for AetherCanvas
import React from 'react';

export function ContextMenuRender({ contextMenu, handleHideContextMenu, handleContextEdit, handleContextDuplicate, handleContextDelete, handleContextAddLabel }) {
  if (!contextMenu.visible) return null;
  return (
    <div
      style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000, background: 'rgba(32,38,60,0.98)', border: '2px solid #7ad0ff', borderRadius: 8, boxShadow: '0 2px 16px #00eaff33', padding: '10px 0', minWidth: 160 }}
      onMouseLeave={handleHideContextMenu}
      tabIndex={-1}
    >
      {contextMenu.type === 'node' && (
        <>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#7ad0ff', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={handleContextEdit}>Edit</button>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ffe066', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={handleContextDuplicate}>Duplicate</button>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ff7272', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={handleContextDelete}>Delete</button>
        </>
      )}
      {contextMenu.type === 'edge' && (
        <>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#7ad0ff', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={handleContextAddLabel}>Add/Edit Label</button>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ffe066', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={handleContextDuplicate}>Duplicate</button>
          <button style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ff7272', padding: '10px 18px', textAlign: 'left', fontWeight: 600, fontSize: 15, cursor: 'pointer' }} onClick={handleContextDelete}>Delete</button>
        </>
      )}
    </div>
  );
}

export function EdgeLabelEditor({ editingEdgeId, contextMenu, edgeLabelInput, handleEdgeLabelChange, handleEdgeLabelSave, handleEdgeLabelCancel }) {
  if (!editingEdgeId) return null;
  return (
    <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1100, background: 'rgba(32,38,60,0.98)', border: '2px solid #7ad0ff', borderRadius: 8, boxShadow: '0 2px 16px #00eaff33', padding: '18px 24px', minWidth: 220 }}>
      <input
        type="text"
        value={edgeLabelInput}
        onChange={handleEdgeLabelChange}
        autoFocus
        style={{ width: '100%', fontSize: 16, padding: '8px 10px', borderRadius: 6, border: '1.5px solid #7ad0ff', background: '#23253a', color: '#e3e5f7', marginBottom: 14 }}
        placeholder="Edge label"
      />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={handleEdgeLabelSave} style={{ background: '#7ad0ff', color: '#23253a', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Save</button>
        <button onClick={handleEdgeLabelCancel} style={{ background: '#23253a', color: '#7ad0ff', border: '1.5px solid #7ad0ff', borderRadius: 6, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}
