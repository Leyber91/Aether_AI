import React, { useState } from 'react';
import styles from '../AetherCanvas.module.css';

const GroupNode = ({ data, id, isCollapsed, onToggleCollapse, onUngroup, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(data.label || 'Group');
  const handleNameChange = (e) => setName(e.target.value);
  const handleNameBlur = () => {
    setEditing(false);
    if (name.trim() && name !== data.label) onRename(id, name.trim());
  };
  return (
    <div className={styles.groupNode + (isCollapsed ? ' ' + styles.groupCollapsed : '')} tabIndex={0}>
      <div className={styles.groupHeader}>
        <button
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand group' : 'Collapse group'}
          aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
        >
          <span className={styles.collapseIcon}>{isCollapsed ? '▶' : '▼'}</span>
        </button>
        {editing ? (
          <input
            className={styles.groupNameInput}
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={e => (e.key === 'Enter' || e.key === 'Escape') && handleNameBlur()}
            autoFocus
            aria-label="Edit group name"
          />
        ) : (
          <span
            className={styles.groupName}
            tabIndex={0}
            onDoubleClick={() => setEditing(true)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setEditing(true)}
            title="Double-click or press Enter to rename"
          >
            {name}
          </span>
        )}
        <button
          className={styles.ungroupBtn}
          onClick={() => onUngroup(id)}
          title="Ungroup nodes"
          aria-label="Ungroup"
        >
          Ungroup
        </button>
      </div>
    </div>
  );
};

export default GroupNode;
