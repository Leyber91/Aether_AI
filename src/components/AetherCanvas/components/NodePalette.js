import React, { useState, useMemo } from 'react';
import styles from '../AetherCanvas.module.css';
import { ReactComponent as AgentIcon } from '../icons/AgentIcon.svg';
import { ReactComponent as ToolIcon } from '../icons/ToolIcon.svg';
import { ReactComponent as FilterIcon } from '../icons/FilterIcon.svg';
import { ReactComponent as OutputIcon } from '../icons/OutputIcon.svg';
import { ReactComponent as StartIcon } from '../icons/StartIcon.svg';
import { ReactComponent as DuplicateIcon } from '../icons/HeaderDuplicateIcon.svg';

const NODE_PALETTE = [
  { type: 'start', label: 'Chat Input', icon: <StartIcon className={styles.paletteSvgIcon} /> },
  { type: 'agent', label: 'Agent', icon: <AgentIcon className={styles.paletteSvgIcon} /> },
  { type: 'tool', label: 'Tool', icon: <ToolIcon className={styles.paletteSvgIcon} /> },
  { type: 'filter', label: 'Filter', icon: <FilterIcon className={styles.paletteSvgIcon} /> },
  { type: 'output', label: 'Output', icon: <OutputIcon className={styles.paletteSvgIcon} /> }
];

function NodePalette({ onDragStart, selectedNodeIds, onGroupNodes, workflows = [], activeWorkflowId, onWorkflowSelect, onWorkflowDuplicate, onWorkflowDelete }) {
  const [search, setSearch] = useState('');
  const filteredWorkflows = useMemo(() =>
    workflows.filter(wf => wf.name.toLowerCase().includes(search.toLowerCase())),
    [workflows, search]
  );
  return (
    <div className={styles.paletteSidebarColumn}>
      <div className={styles.paletteGridRow}>
        {NODE_PALETTE.map((item, index) => (
          <div
            key={item.type}
            className={styles.paletteItem}
            draggable
            onDragStart={onDragStart(item.type)}
            title={item.label}
          >
            <span className={styles.paletteSvgIcon}>{item.icon}</span>
          </div>
        ))}
      </div>
      <div className={styles.workflowCollection}>
        <input
          className={styles.workflowSearch}
          placeholder="Search workflows..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {filteredWorkflows.length === 0 && (
          <div style={{ color: '#555b7a', padding: '8px 0', textAlign: 'center' }}>No workflows</div>
        )}
        {filteredWorkflows.map(wf => (
          <div
            key={wf.id}
            className={styles.workflowItem + (wf.id === activeWorkflowId ? ' ' + styles.active : '')}
            onClick={() => onWorkflowSelect && onWorkflowSelect(wf.id)}
            title={wf.name}
          >
            <span className={styles.workflowItemIcon}><DuplicateIcon /></span>
            <span className={styles.workflowItemName}>{wf.name}</span>
            <span className={styles.workflowItemActions}>
              <button className={styles.workflowActionBtn} title="Duplicate" onClick={e => { e.stopPropagation(); onWorkflowDuplicate && onWorkflowDuplicate(wf.id); }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="#ffe066"/><rect x="7" y="7" width="7" height="7" rx="2" fill="#7ad0ff"/></svg>
              </button>
              <button className={styles.workflowActionBtn} title="Delete" onClick={e => { e.stopPropagation(); onWorkflowDelete && onWorkflowDelete(wf.id); }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="4" y="4" width="12" height="12" rx="3" fill="#ff5f5f"/><line x1="7" y1="7" x2="13" y2="13" stroke="white" strokeWidth="2"/><line x1="13" y1="7" x2="7" y2="13" stroke="white" strokeWidth="2"/></svg>
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NodePalette;
