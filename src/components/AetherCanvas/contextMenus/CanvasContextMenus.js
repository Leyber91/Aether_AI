import React from 'react';
import { ContextMenuRender, EdgeLabelEditor } from './AetherCanvasContextMenuRender';
import AetherCanvasContextMenu from './AetherCanvasContextMenu';

const CanvasContextMenus = ({
  contextMenu,
  handleHideContextMenu,
  handleContextEdit,
  handleContextDuplicate,
  handleContextDelete,
  handleContextAddLabel,
  editingEdgeId,
  edgeLabelInput,
  handleEdgeLabelChange,
  handleEdgeLabelSave,
  handleEdgeLabelCancel,
  edgeContextMenu
}) => (
  <>
    <ContextMenuRender
      contextMenu={contextMenu}
      handleHideContextMenu={handleHideContextMenu}
      handleContextEdit={handleContextEdit}
      handleContextDuplicate={handleContextDuplicate}
      handleContextDelete={handleContextDelete}
      handleContextAddLabel={handleContextAddLabel}
    />
    <EdgeLabelEditor
      editingEdgeId={editingEdgeId}
      contextMenu={contextMenu}
      edgeLabelInput={edgeLabelInput}
      handleEdgeLabelChange={handleEdgeLabelChange}
      handleEdgeLabelSave={handleEdgeLabelSave}
      handleEdgeLabelCancel={handleEdgeLabelCancel}
    />
    <AetherCanvasContextMenu
      contextMenu={edgeContextMenu.contextMenu}
      onEdit={edgeContextMenu.handleContextEdit}
      onDuplicate={edgeContextMenu.handleContextDuplicate}
      onDelete={edgeContextMenu.handleContextDelete}
      onAddLabel={edgeContextMenu.handleContextAddLabel}
      onHide={edgeContextMenu.handleHideContextMenu}
    />
  </>
);

export default CanvasContextMenus;
