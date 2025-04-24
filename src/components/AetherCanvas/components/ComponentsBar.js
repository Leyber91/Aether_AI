import React, { useState, useEffect } from 'react';
import styles from '../AetherCanvas.module.css';
import { ReactComponent as AgentIcon } from '../icons/AgentIcon.svg';
import { ReactComponent as ToolIcon } from '../icons/ToolIcon.svg';
import { ReactComponent as FilterIcon } from '../icons/FilterIcon.svg';
import { ReactComponent as OutputIcon } from '../icons/OutputIcon.svg';
import { ReactComponent as StartIcon } from '../icons/StartIcon.svg';

const COMPONENTS = [
  { label: 'Start', icon: <StartIcon />, type: 'start' },
  { label: 'Agent', icon: <AgentIcon />, type: 'agent' },
  { label: 'Tool', icon: <ToolIcon />, type: 'tool' },
  { label: 'Filter', icon: <FilterIcon />, type: 'filter' },
  { label: 'Output', icon: <OutputIcon />, type: 'output' },
];

const ComponentsBar = ({ onComponentDragStart, sidebarRef }) => {
  const [sidebarRight, setSidebarRight] = useState(260); // fallback default
  useEffect(() => {
    function updatePosition() {
      if (sidebarRef && sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect();
        setSidebarRight(rect.width);
      }
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [sidebarRef]);

  return (
    <div
      className={styles.componentsBarHorizontal}
      style={{
        left: sidebarRight + 5, // slightly more gap for compactness
        position: 'absolute',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',        background: 'linear-gradient(90deg, #23253a 80%, #181a2a 100%)',
        borderRadius: '14px',
        boxShadow: '0 2px 18px 0 #00eaff55',
        border: '2.5px solid #7ad0ff',
        padding: '5px 18px 5px 18px',
        zIndex: 20,
        minHeight: '54px',
        gap: '10px',
      }}
    >
      <span className={styles.componentsBarTitle}>Components</span>
      <div className={styles.componentsBarIconsHorizontal}>
        {COMPONENTS.map(c => (
          <div
            key={c.type}
            className={styles.componentIconWrapperHorizontal}
            title={c.label}
            draggable
            onDragStart={e => {
              if (onComponentDragStart) {
                e.dataTransfer.setData('application/reactflow', c.type);
                e.dataTransfer.setData('text/plain', c.type);
                e.dataTransfer.effectAllowed = 'move';
                onComponentDragStart(e, c.type);
              }
            }}
          >
            <div className={styles.componentSvgIconHorizontal}>{c.icon}</div>
            <span className={styles.componentIconLabelHorizontal}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComponentsBar;
