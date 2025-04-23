# AetherCanvas Logic Flow Relationships

This document outlines the logic flow and relationships between the major components, hooks, managers, and utilities in the AetherCanvas module.

## High-Level Structure
- **AetherCanvas.js** (root component)
  - Manages state for nodes, edges, selection, context menus, and output logs
  - Renders child components and passes state/handlers as props

### Component Relationships

- **AetherCanvasToolbar**
  - Toolbar for actions: export/import workflow, undo/redo, run, show wizard, etc.
  - Receives handlers and state from AetherCanvas

- **CanvasFlow**
  - Main canvas area using ReactFlow
  - Receives nodes, edges, and handlers for drag/drop, selection, etc.
  - Uses:
    - **MinimapPanel** (overview of canvas)
    - **FlowControlsPanel** (zoom/reset controls)
    - **Node Components**: AgentNode, ToolNode, FilterNode, OutputNode, GroupNode

- **NodePalette**
  - Palette for adding new nodes to the canvas

- **OutputSidebar**
  - Displays output logs, toggled by state in AetherCanvas

- **GoalToFlowWizardPanel**
  - Wizard for generating flows from user goals
  - Uses **GoalToFlowWizard** (outside components folder)

- **Context Menus**
  - **CanvasContextMenus**
  - **AetherCanvasContextMenu** and **AetherCanvasContextMenuRender** (contextual actions)

### Managers
- **AetherCanvasNodeManager**: Node creation, duplication, grouping, etc.
- **AetherCanvasEdgeManager**: Edge creation, editing, deletion, etc.

### Hooks
- **useCanvasHandlers**: Centralized event/callback logic for canvas actions
- **useCanvasShortcuts**: Keyboard shortcuts for canvas actions

### Utilities
- **AetherCanvasExportImport**: Import/export workflow as JSON
- **AetherCanvasFlowRunner**: Logic for running the flow
- **AetherCanvasUndoRedo**: Undo/redo stack logic
- **AetherCanvasStyleUtils**: Shared style logic for nodes and minimap

### Icons & Styles
- SVG icons for each node type (Agent, Tool, Filter, Output)
- Shared CSS module for all components

## Data Flow
- State is managed at the AetherCanvas level and passed down
- Handlers are passed as props to child components for actions
- Managers/utilities are used for logic-heavy operations (node/edge manipulation, import/export, etc.)

## Extensibility
- New node types can be added by creating a component, SVG icon, and updating NodePalette
- Additional context menus or panels can be added as new components and integrated via props

---

**This document should be updated if new components or major logic flows are added to the AetherCanvas module.**
