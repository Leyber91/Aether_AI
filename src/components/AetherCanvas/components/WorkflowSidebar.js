import React, { useEffect, useState } from 'react';
import styles from '../AetherCanvas.Sidebar.module.css';
import {
  listWorkflows,
  loadWorkflow,
  saveWorkflow,
  deleteWorkflow,
  renameWorkflow,
  duplicateWorkflow
} from '../utils/workflowStorage';
import { EXAMPLE_WORKFLOWS } from '../utils/workflowStorage';
import { exportWorkflow, importWorkflow } from '../utils/AetherCanvasExportImport';
import { ReactComponent as EditIcon } from '../icons/HeaderDuplicateIcon.svg';
import { ReactComponent as DuplicateIcon } from '../icons/HeaderDuplicateIcon.svg';
import { ReactComponent as DeleteIcon } from '../icons/HeaderDeleteIcon.svg';
import { ReactComponent as ExportIcon } from '../icons/HeaderExportIcon.svg';
import { ReactComponent as LoadIcon } from '../icons/LoadWorkflowIcon.svg';

/**
 * WorkflowSidebar - Sidebar for managing workflows
 * Props:
 *   onWorkflowSelect: (workflow, filename) => void
 *   onWorkflowSave: (filename) => void
 *   activeWorkflow: string (filename)
 *   nodes: array (for export)
 *   edges: array (for export)
 *   setNodes, setEdges: for import
 */
const WorkflowSidebar = ({
  onWorkflowSelect,
  onWorkflowSave,
  activeWorkflow,
  nodes,
  edges,
  setNodes,
  setEdges
}) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [renaming, setRenaming] = useState(null); // filename being renamed
  const [renameValue, setRenameValue] = useState('');
  const [duplicating, setDuplicating] = useState(null); // filename being duplicated
  const [duplicateValue, setDuplicateValue] = useState('');
  const [saveAsValue, setSaveAsValue] = useState('');
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const exampleNames = Object.keys(EXAMPLE_WORKFLOWS);
  const [loadedExample, setLoadedExample] = useState(null);

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line
  }, []);

  async function refreshList() {
    setLoading(true);
    try {
      const files = await listWorkflows();
      setWorkflows(files);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleLoad(filename) {
    try {
      const workflow = await loadWorkflow(filename);
      onWorkflowSelect(workflow, filename);
    } catch (e) {
      setError('Failed to load workflow: ' + e.message);
    }
  }

  async function handleDelete(filename) {
    if (!window.confirm('Delete this workflow?')) return;
    setDeleting(filename);
    try {
      await deleteWorkflow(filename);
      if (activeWorkflow === filename) {
        onWorkflowSelect(null, null);
      }
      await refreshList();
    } catch (e) {
      setError('Failed to delete: ' + e.message);
    }
    setDeleting(null);
  }

  async function handleRename(filename) {
    setRenaming(filename);
    setRenameValue(filename.replace('.json', ''));
  }
  async function submitRename(filename) {
    const newName = renameValue.trim() + '.json';
    if (!renameValue.trim() || newName === filename) {
      setRenaming(null);
      return;
    }
    try {
      await renameWorkflow(filename, newName);
      if (activeWorkflow === filename) {
        onWorkflowSelect(await loadWorkflow(newName), newName);
      }
      await refreshList();
    } catch (e) {
      setError('Failed to rename: ' + e.message);
    }
    setRenaming(null);
  }

  async function handleDuplicate(filename) {
    setDuplicating(filename);
    setDuplicateValue(filename.replace('.json', '') + '_copy');
  }
  async function submitDuplicate(filename) {
    const newName = duplicateValue.trim() + '.json';
    if (!duplicateValue.trim() || newName === filename) {
      setDuplicating(null);
      return;
    }
    try {
      await duplicateWorkflow(filename, newName);
      await refreshList();
    } catch (e) {
      setError('Failed to duplicate: ' + e.message);
    }
    setDuplicating(null);
  }

  async function handleSaveAs() {
    setShowSaveAs(true);
    setSaveAsValue('');
  }
  async function submitSaveAs() {
    const newName = saveAsValue.trim() + '.json';
    if (!saveAsValue.trim()) return;
    try {
      await saveWorkflow(newName, { nodes, edges });
      await refreshList();
      setShowSaveAs(false);
    } catch (e) {
      setError('Failed to save: ' + e.message);
    }
  }

  function handleExport(filename) {
    loadWorkflow(filename).then(wf => {
      exportWorkflow(wf.nodes, wf.edges);
    });
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    importWorkflow(file, setNodes, setEdges);
    setImporting(false);
    setShowSaveAs(false);
  }

  function handleLoadExample(exampleName) {
    const example = EXAMPLE_WORKFLOWS[exampleName];
    if (example && onWorkflowSelect) {
      onWorkflowSelect(example, null);
      setLoadedExample(exampleName);
    }
  }

  const iconButton = (Icon, onClick, title, extraProps = {}) => (
    <button className={styles.workflowActionIcon} onClick={onClick} title={title} {...extraProps}>
      <Icon />
    </button>
  );

  const filteredWorkflows = workflows.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={styles.sidebarPanel}>
      <div className={styles.sidebarSection}>
        <h2 className={styles.sidebarHeader}>Examples</h2>
        <ul className={styles.exampleList}>
          {exampleNames.map(name => (
            <li key={name} className={loadedExample === name ? styles.loadedExample : ''}>
              <span>{name}</span>
              <button
                className={styles.loadButton}
                title="Load Example"
                onClick={() => handleLoadExample(name)}
              >Load</button>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.sidebarSection}>
        <h2 className={styles.sidebarHeader}>Workflows</h2>
        <input
          className={styles.workflowSearchBar}
          type="text"
          placeholder="Search workflows..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.sidebarSectionRow}>
          <button className={styles.sidebarButton} onClick={handleSaveAs}>
            + Save Current As...
          </button>
          <label className={styles.sidebarButton} style={{cursor:'pointer'}}>
            Import
            <input type="file" accept="application/json" style={{display:'none'}} onChange={handleImport} />
          </label>
        </div>
        {showSaveAs && (
          <div className={styles.sidebarSectionRow}>
            <input
              className={styles.sidebarInput}
              value={saveAsValue}
              onChange={e => setSaveAsValue(e.target.value)}
              placeholder="Workflow name"
              autoFocus
            />
            <button className={styles.sidebarButton} onClick={submitSaveAs}>Save</button>
            <button className={styles.sidebarButton} onClick={()=>setShowSaveAs(false)}>Cancel</button>
          </div>
        )}
        <ul className={styles.workflowList}>
          {filteredWorkflows.map(f => (
            <li
              key={f}
              className={activeWorkflow === f ? `${styles.selected}` : ''}
            >
              {renaming === f ? (
                <>
                  <input
                    className={styles.sidebarInput}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submitRename(f); if (e.key === 'Escape') setRenaming(null); }}
                    autoFocus
                    style={{marginRight:6,minWidth:90}}
                  />
                  <button className={styles.sidebarButton} onClick={()=>submitRename(f)} style={{marginRight:2}}>✔️</button>
                  <button className={styles.sidebarButton} onClick={()=>setRenaming(null)}>✖️</button>
                </>
              ) : duplicating === f ? (
                <>
                  <input
                    className={styles.sidebarInput}
                    value={duplicateValue}
                    onChange={e => setDuplicateValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submitDuplicate(f); if (e.key === 'Escape') setDuplicating(null); }}
                    autoFocus
                    style={{marginRight:6,minWidth:90}}
                  />
                  <button className={styles.sidebarButton} onClick={()=>submitDuplicate(f)} style={{marginRight:2}}>✔️</button>
                  <button className={styles.sidebarButton} onClick={()=>setDuplicating(null)}>✖️</button>
                </>
              ) : (
                <>
                  <span className={styles.workflowCardName} onClick={()=>handleLoad(f)}>{f.replace('.json','')}</span>
                  <div className={styles.workflowCardActions}>
                    {iconButton(LoadIcon,()=>handleLoad(f),'Load')}
                    {iconButton(EditIcon,()=>handleRename(f),'Rename')}
                    {iconButton(DuplicateIcon,()=>handleDuplicate(f),'Duplicate')}
                    {iconButton(DeleteIcon,()=>handleDelete(f),'Delete',{disabled:deleting===f,style:{color:'#ff5f5f'}})}
                    {iconButton(ExportIcon,()=>handleExport(f),'Export')}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        {loading && <div className={styles.loading}>Loading...</div>}
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
};

export default WorkflowSidebar;
