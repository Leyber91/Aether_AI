import React from 'react';
import { ReactComponent as AgentIcon } from '../icons/AgentIcon.svg';
import { FaPlay, FaSpinner } from 'react-icons/fa';
import styles from '../AetherCanvas.module.css';
import { Handle, Position } from 'reactflow';

const AgentNode = ({ data, id, nodeStatus, runningNodes, isFlowRunning, runNode, connectingFromNodeId, handleConnectButton, handleTargetButton, handleCancelConnect }) => {
  // Defensive: ensure nodeStatus is always an object, and id is defined and present as a key
  const safeNodeStatus = nodeStatus && typeof nodeStatus === 'object' ? nodeStatus : {};
  const safeId = (typeof id === 'string' || typeof id === 'number') && id !== undefined && id !== null ? id : '';
  const nodeHasStatus = Object.prototype.hasOwnProperty.call(safeNodeStatus, safeId);

  return (
    <div className={styles.agentNode} data-status={nodeHasStatus ? safeNodeStatus[safeId] : 'idle'}>
      <Handle type="target" position={Position.Left} id="a" />
      <Handle type="source" position={Position.Right} id="a" />
      <AgentIcon className={styles.nodeIcon} /> {data?.label}
      <span className={styles.nodeStatus} data-status={nodeHasStatus ? safeNodeStatus[safeId] : 'idle'}>
        {nodeHasStatus && safeNodeStatus[safeId] === 'waiting' && '⏳'}
        {nodeHasStatus && safeNodeStatus[safeId] === 'running' && <FaSpinner className={styles.spinnerIcon} />}
        {nodeHasStatus && safeNodeStatus[safeId] === 'done' && '✔️'}
      </span>
      <button
        className={styles.runNodeBtn}
        onClick={(e) => { e.stopPropagation(); runNode(id, data?.label); }}
        disabled={!!runningNodes && runningNodes[id] || isFlowRunning}
        title="Run Node"
        aria-label="Run Node"
      >
        {runningNodes && runningNodes[id] ? <FaSpinner className={styles.spinnerIcon} /> : <FaPlay />}
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
};

export default AgentNode;
