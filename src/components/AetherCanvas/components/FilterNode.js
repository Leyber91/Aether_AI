import React from 'react';
import { ReactComponent as FilterIcon } from '../icons/FilterIcon.svg';
import { FaPlay, FaSpinner } from 'react-icons/fa';
import styles from '../AetherCanvas.module.css';
import { Handle, Position } from 'reactflow';

const FilterNode = ({ data, id, nodeStatus, runningNodes, isFlowRunning, runNode, connectingFromNodeId, handleConnectButton, handleTargetButton, handleCancelConnect }) => (
  <div className={styles.filterNode} data-status={nodeStatus[id] || 'idle'}>
    <Handle type="target" position={Position.Left} id="a" />
    <Handle type="source" position={Position.Right} id="a" />
    <FilterIcon className={styles.nodeIcon} /> {data.label}
    <span className={styles.nodeStatus} data-status={nodeStatus[id] || 'idle'}>
      {nodeStatus[id] === 'waiting' && '⏳'}
      {nodeStatus[id] === 'running' && <FaSpinner className={styles.spinnerIcon} />}
      {nodeStatus[id] === 'done' && '✔️'}
    </span>
    <button
      className={styles.runNodeBtn}
      onClick={(e) => { e.stopPropagation(); runNode(id, data.label); }}
      disabled={!!runningNodes[id] || isFlowRunning}
      title="Run Node"
      aria-label="Run Node"
    >
      {runningNodes[id] ? <FaSpinner className={styles.spinnerIcon} /> : <FaPlay />}
    </button>
    {connectingFromNodeId === null && (
      <button
        className={styles.connectNodeBtn}
        onClick={(e) => { e.stopPropagation(); handleConnectButton(id); }}
        title="Connect from this node"
        aria-label="Connect Node"
      >
        🔗 Connect
      </button>
    )}
    {connectingFromNodeId && connectingFromNodeId !== id && (
      <button
        className={styles.targetNodeBtn}
        onClick={(e) => { e.stopPropagation(); handleTargetButton(id); }}
        title="Connect to this node"
        aria-label="Target Node"
      >
        ➡️ Target
      </button>
    )}
    {connectingFromNodeId === id && (
      <button
        className={styles.cancelConnectBtn}
        onClick={(e) => { e.stopPropagation(); handleCancelConnect(); }}
        title="Cancel Connection"
        aria-label="Cancel Connection"
      >
        ✖ Cancel
      </button>
    )}
  </div>
);

export default FilterNode;
