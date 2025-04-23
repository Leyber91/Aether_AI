// Handles flow execution, node running, and topological sort logic for AetherCanvas
import { useState, useCallback } from 'react';
import { sendMessageToOllama } from '../../../services/enhancedOllamaService';
import { sendMessageToGroq } from '../../../services/groqService';

export function useFlowRunner(nodes, edges, setOutputLogs, setNodeStatus, setNodes) {
  const [runningNodes, setRunningNodes] = useState({});
  const [isFlowRunning, setIsFlowRunning] = useState(false);

  // Topological Sort Utility
  const topologicalSort = useCallback((nodes, edges) => {
    const inDegree = {};
    const graph = {};
    nodes.forEach(n => {
      inDegree[n.id] = 0;
      graph[n.id] = [];
    });
    edges.forEach(e => {
      graph[e.source].push(e.target);
      inDegree[e.target]++;
    });
    const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    const result = [];
    while (queue.length) {
      const id = queue.shift();
      result.push(id);
      for (const neighbor of graph[id]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) queue.push(neighbor);
      }
    }
    return result;
  }, []);

  // Node Execution Logic
  const runNode = useCallback(async (nodeId, label, context = 'individual', nodeData = {}) => {
    setRunningNodes((r) => ({ ...r, [nodeId]: true }));
    setOutputLogs((logs) => [...logs, `[${context === 'flow' ? 'Flow' : 'Node'}] Running ${label} (${nodeId})...`]);
    let result = '';
    try {
      if (nodeData.backend === 'ollama') {
        // Prepare messages for Ollama
        const messages = [
          { role: 'system', content: nodeData.instructions || 'You are a helpful assistant.' },
          { role: 'user', content: nodeData.input || '' }
        ];
        const resp = await sendMessageToOllama(nodeData.modelId, messages, {});
        result = resp?.content || '[Ollama] No output.';
      } else if (nodeData.backend === 'groq') {
        const messages = [
          { role: 'system', content: nodeData.instructions || 'You are a helpful assistant.' },
          { role: 'user', content: nodeData.input || '' }
        ];
        const resp = await sendMessageToGroq(nodeData.modelId, messages);
        result = resp?.content || '[Groq] No output.';
      } else {
        result = `Backend '${nodeData.backend}' not implemented.`;
      }
      setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, output: result } } : n));
      setOutputLogs((logs) => [...logs, `[${context === 'flow' ? 'Flow' : 'Node'}] Output from ${label} (${nodeId}): ${result}`]);
    } catch (err) {
      setOutputLogs((logs) => [...logs, `[${context === 'flow' ? 'Flow' : 'Node'}] Error running ${label} (${nodeId}): ${err.message}`]);
    }
    setRunningNodes((r) => ({ ...r, [nodeId]: false }));
  }, [setOutputLogs, setNodes]);

  // Run Flow with Data Passing
  const runFlow = useCallback(async () => {
    if (isFlowRunning) return;
    setIsFlowRunning(true);
    setOutputLogs((logs) => [...logs, '--- Running Entire Flow (topological order) ---']);
    const nodeOrder = topologicalSort(nodes, edges);
    const contextData = {};
    let nodeStatusMap = {};
    nodes.forEach(n => { nodeStatusMap[n.id] = 'idle'; });
    setNodeStatus({ ...nodeStatusMap });
    for (const nodeId of nodeOrder) {
      nodeStatusMap[nodeId] = 'waiting';
      setNodeStatus({ ...nodeStatusMap });
      const inputNodes = edges.filter(e => e.target === nodeId).map(e => e.source);
      for (const input of inputNodes) {
        while (nodeStatusMap[input] !== 'done') {
          await new Promise(r => setTimeout(r, 50));
        }
      }
      let inputValue = '';
      const node = nodes.find(n => n.id === nodeId);
      // If this is a StartNode, use its input as the input value
      if (node.type === 'start') {
        inputValue = node.data.input || '';
      } else if (inputNodes.length > 0) {
        inputValue = inputNodes.map(srcId => contextData[srcId]).join('\n');
      }
      let result = '';
      try {
        if (node.data.backend === 'ollama') {
          const messages = [
            { role: 'system', content: node.data.instructions || 'You are a helpful assistant.' },
            { role: 'user', content: inputValue || '' }
          ];
          const resp = await sendMessageToOllama(node.data.modelId, messages, {});
          result = resp?.content || '[Ollama] No output.';
        } else if (node.data.backend === 'groq') {
          const messages = [
            { role: 'system', content: node.data.instructions || 'You are a helpful assistant.' },
            { role: 'user', content: inputValue || '' }
          ];
          const resp = await sendMessageToGroq(node.data.modelId, messages);
          result = resp?.content || '[Groq] No output.';
        } else if (node.type === 'start') {
          result = inputValue;
        } else {
          result = `Backend '${node.data.backend}' not implemented.`;
        }
        contextData[nodeId] = result;
        setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, input: inputValue, output: result } } : n));
        setOutputLogs((logs) => [...logs, `[Flow]  Output from ${nodeId}: ${result}`]);
        nodeStatusMap[nodeId] = 'done';
        setNodeStatus({ ...nodeStatusMap });
      } catch (err) {
        setOutputLogs((logs) => [...logs, `[Flow]  Error running ${nodeId}: ${err.message}`]);
        nodeStatusMap[nodeId] = 'error';
        setNodeStatus({ ...nodeStatusMap });
      }
    }
    setOutputLogs((logs) => [...logs, '--- Flow Complete ---']);
    setIsFlowRunning(false);
  }, [isFlowRunning, nodes, edges, setOutputLogs, setNodeStatus, topologicalSort, setNodes]);

  return {
    runningNodes,
    isFlowRunning,
    runNode,
    runFlow,
  };
}
