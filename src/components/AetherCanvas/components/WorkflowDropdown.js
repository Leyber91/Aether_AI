import React, { useEffect, useState } from 'react';
import styles from '../AetherCanvas.module.css';
import {
  listWorkflows,
  loadWorkflow,
  saveWorkflow,
  deleteWorkflow
} from '../utils/workflowStorage';

/**
 * WorkflowDropdown - Dropdown to select and manage workflows
 * Props:
 *   onWorkflowSelect: (workflow, filename) => void
 *   activeWorkflow: string (filename)
 */
const WorkflowDropdown = ({ onWorkflowSelect, activeWorkflow }) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  async function handleSelect(e) {
    const filename = e.target.value;
    try {
      const workflow = await loadWorkflow(filename);
      onWorkflowSelect(workflow, filename);
    } catch (e) {
      setError('Failed to load workflow: ' + e.message);
    }
  }

  return (
    <div className={styles.workflowDropdownContainer}>
      <select
        className={styles.workflowDropdown}
        value={activeWorkflow || ''}
        onChange={handleSelect}
        disabled={loading}
        style={{
          background: '#181a2a', color: '#7ad0ff', border: '1px solid #222b44', borderRadius: 8,
          padding: '6px 18px 6px 10px', fontSize: 15, fontWeight: 600, outline: 'none', minWidth: 160,
          boxShadow: activeWorkflow ? '0 0 8px #00eaff55' : 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        <option value='' disabled>Select workflow...</option>
        {workflows.map(f => (
          <option key={f} value={f} style={{ color: '#e3e5f7', background: '#23253a' }}>{f.replace('.json', '')}</option>
        ))}
      </select>
      {loading && <span style={{ color: '#7ad0ff', marginLeft: 8, fontSize: 13 }}>Loading...</span>}
      {error && <span style={{ color: '#ff5f5f', marginLeft: 8, fontSize: 13 }}>{error}</span>}
    </div>
  );
};

export default WorkflowDropdown;
