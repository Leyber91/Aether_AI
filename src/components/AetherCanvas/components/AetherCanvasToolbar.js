import React from 'react';
import styles from '../AetherCanvas.module.css';

const AetherCanvasToolbar = ({
  onExport,
  onImport,
  onShowGoalWizard,
  onRunFlow,
  isFlowRunning,
  nodes,
  showOutputSidebar,
  setShowOutputSidebar,
  onUndo,
  onRedo,
  undoDisabled,
  redoDisabled,
  selectedNodeIds,
  onDeleteSelected,
  onDuplicateSelected
}) => (
  <div className={styles.headerActions}>
    <button onClick={onExport} className={styles.exportBtn}>Export</button>
    <label className={styles.importBtn}>
      Import<input type="file" accept="application/json" style={{ display: 'none' }} onChange={onImport} />
    </label>
    <button className={styles.goalWizardBtn} onClick={onShowGoalWizard}>
      + Goal-to-Flow Wizard
    </button>
    <button
      className={styles.runFlowBtn}
      onClick={onRunFlow}
      disabled={isFlowRunning || nodes.length === 0}
      title="Run Entire Flow"
      aria-label="Run Entire Flow"
    >
      {isFlowRunning ? <span className={styles.spinnerIcon} /> : <span style={{ marginRight: 6 }} />} Run Flow
    </button>
    <button
      className={styles.outputSidebarToggle}
      onClick={() => setShowOutputSidebar((v) => !v)}
      title={showOutputSidebar ? 'Hide Output Log' : 'Show Output Log'}
      aria-label="Toggle Output Log"
    >
      {showOutputSidebar ? 'Hide Output' : 'Show Output'}
    </button>
    <button
      className={styles.undoBtn}
      onClick={onUndo}
      title="Undo (Ctrl+Z)"
      aria-label="Undo"
      disabled={undoDisabled}
      style={{ marginLeft: 12 }}
    >
      Undo
    </button>
    <button
      className={styles.redoBtn}
      onClick={onRedo}
      title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
      aria-label="Redo"
      disabled={redoDisabled}
      style={{ marginLeft: 8 }}
    >
      Redo
    </button>
    {selectedNodeIds.length > 0 && (
      <button
        className={styles.deleteBtn}
        onClick={onDeleteSelected}
        title="Delete Selected (Del/Backspace)"
        aria-label="Delete Selected"
        style={{ marginLeft: 12 }}
      >
        Delete
      </button>
    )}
    {selectedNodeIds.length > 0 && (
      <button
        className={styles.duplicateBtn}
        onClick={onDuplicateSelected}
        title="Duplicate Selected (Ctrl+D)"
        aria-label="Duplicate Selected"
        style={{ marginLeft: 8 }}
      >
        Duplicate
      </button>
    )}
  </div>
);

export default AetherCanvasToolbar;
