import React from 'react';
import styles from '../AetherCanvas.module.css';
import { ReactComponent as AgentIcon } from '../icons/AgentIcon.svg';
import { ReactComponent as ToolIcon } from '../icons/ToolIcon.svg';
import { ReactComponent as FilterIcon } from '../icons/FilterIcon.svg';
import { ReactComponent as OutputIcon } from '../icons/OutputIcon.svg';
import { ReactComponent as StartIcon } from '../icons/StartIcon.svg';

const NODE_PALETTE = [
  { type: 'start', label: 'Chat Input', icon: <StartIcon className={styles.paletteSvgIcon} /> },
  { type: 'agent', label: 'Agent', icon: <AgentIcon className={styles.paletteSvgIcon} /> },
  { type: 'tool', label: 'Tool', icon: <ToolIcon className={styles.paletteSvgIcon} /> },
  { type: 'filter', label: 'Filter', icon: <FilterIcon className={styles.paletteSvgIcon} /> },
  { type: 'output', label: 'Output', icon: <OutputIcon className={styles.paletteSvgIcon} /> }
];

const NodePalette = ({ onDragStart, selectedNodeIds, onGroupNodes }) => (
  <div className={styles.palette}>
    {NODE_PALETTE.map((item) => (
      <div
        key={item.type}
        className={styles.paletteItem}
        draggable
        onDragStart={onDragStart(item.type)}
        title={item.label}
      >
        <span className={styles.paletteSvgIcon}>{item.icon}</span> {item.label}
      </div>
    ))}
    <div className={styles.paletteActions}>
      <button
        className={styles.groupBtn}
        onClick={onGroupNodes}
        disabled={!selectedNodeIds || selectedNodeIds.length < 2}
        title="Group selected nodes"
      >
        Group
      </button>
      <button
        className={styles.ungroupBtn}
        onClick={() => window.dispatchEvent(new CustomEvent('requestUngroup'))}
        title="Ungroup selected group node"
        disabled={!(selectedNodeIds && selectedNodeIds.length === 1)}
      >
        Ungroup
      </button>
    </div>
  </div>
);

export default NodePalette;
