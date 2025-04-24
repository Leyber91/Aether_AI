// Handles flow execution, node running, and topological sort logic for AetherCanvas
import { useState, useCallback } from 'react';
import { sendMessageToOllama } from '../../../services/enhancedOllamaService';
import { sendMessageToGroq } from '../../../services/groqService';

function getType(val) {
  if (Array.isArray(val)) return 'array';
  if (val && typeof val === 'object') return 'object';
  if (typeof val === 'string') return 'text';
  return typeof val;
}

function validateType(expected, actual) {
  if (!expected || !actual) return true;
  if (expected === actual) return true;
  // Allow 'file' to pass as object for now (future: refine)
  if ((expected === 'file' && actual === 'object') || (expected === 'object' && actual === 'file')) return true;
  return false;
}

// Accept setNodeExecutionData as an argument
export function useFlowRunner(nodes, edges, setOutputLogs, setNodeStatus, setNodes, setNodeExecutionData) {
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

  // Helper: update node execution data
  const updateNodeExecData = (nodeId, data) => {
    setNodeExecutionData(prev => ({ ...prev, [nodeId]: { ...(prev[nodeId] || {}), ...data } }));
  };

  // Node Execution Logic
  const runNode = useCallback(async (nodeId, label, context = 'individual', nodeData = {}) => {
    setRunningNodes((r) => ({ ...r, [nodeId]: true }));
    setOutputLogs((logs) => [...logs, `[${context === 'flow' ? 'Flow' : 'Node'}] Running ${label} (${nodeId})...`]);
    let result = '';
    let latency = null;
    let tokens = null;
    let groqCost = null;
    let error = null;
    let logs = [];
    let prompt = nodeData.input || '';
    const start = performance.now();
    try {
      if (nodeData.backend === 'ollama') {
        const messages = [
          { role: 'system', content: nodeData.instructions || 'You are a helpful assistant.' },
          { role: 'user', content: nodeData.input || '' }
        ];
        const resp = await sendMessageToOllama(nodeData.modelId, messages, {});
        result = resp?.content || '[Ollama] No output.';
        tokens = resp?.usage || null;
        logs = resp?.logs || [];
      } else if (nodeData.backend === 'groq') {
        const messages = [
          { role: 'system', content: nodeData.instructions || 'You are a helpful assistant.' },
          { role: 'user', content: nodeData.input || '' }
        ];
        const resp = await sendMessageToGroq(nodeData.modelId, messages);
        result = resp?.content || '[Groq] No output.';
        tokens = resp?.usage || null;
        groqCost = resp?.usage?.total_cost || null;
        logs = resp?.logs || [];
      } else {
        result = `Backend '${nodeData.backend}' not implemented.`;
      }
      latency = Math.round(performance.now() - start);
      setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, output: result } } : n));
      setOutputLogs((logsArr) => [...logsArr, `[${context === 'flow' ? 'Flow' : 'Node'}] Output from ${label} (${nodeId}): ${result}`]);
      updateNodeExecData(nodeId, {
        model: nodeData.modelId,
        quant: nodeData.quant,
        backend: nodeData.backend,
        latency,
        tokens,
        logs,
        prompt,
        groqCost,
        error: null
      });
    } catch (err) {
      latency = Math.round(performance.now() - start);
      error = err?.message || String(err);
      setOutputLogs((logsArr) => [...logsArr, `[${context === 'flow' ? 'Flow' : 'Node'}] Error running ${label} (${nodeId}): ${error}`]);
      updateNodeExecData(nodeId, {
        model: nodeData.modelId,
        quant: nodeData.quant,
        backend: nodeData.backend,
        latency,
        tokens: null,
        logs: [],
        prompt,
        groqCost: null,
        error
      });
    }
    setRunningNodes((r) => ({ ...r, [nodeId]: false }));
  }, [setOutputLogs, setNodes, setNodeExecutionData]);

  // Run Flow with Data Passing and Type Validation
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
      // --- Runtime Type Validation ---
      let inputTypeExpected = node?.data?.inputType;
      let inputTypesActual = inputNodes.map(srcId => getType(contextData[srcId]));
      let typeMismatch = false;
      if (inputTypeExpected && inputTypesActual.length > 0) {
        for (let actualType of inputTypesActual) {
          if (!validateType(inputTypeExpected, actualType)) typeMismatch = true;
        }
      }
      if (typeMismatch) {
        setOutputLogs((logsArr) => [...logsArr, `[WARNING] Type mismatch at node ${nodeId}: expected '${inputTypeExpected}', got [${inputTypesActual.join(', ')}]`]);
        updateNodeExecData(nodeId, { warning: `Type mismatch: expected '${inputTypeExpected}', got [${inputTypesActual.join(', ')}]` });
      }
      if (node.type === 'start') {
        inputValue = node.data.input || '';
      } else if (inputNodes.length > 0) {
        inputValue = inputNodes.map(srcId => contextData[srcId]).join('\n');
      }
      let result = '';
      let latency = null;
      let tokens = null;
      let groqCost = null;
      let error = null;
      let logs = [];
      let prompt = inputValue;
      const start = performance.now();
      try {
        if (node.data.backend === 'ollama') {
          const messages = [
            { role: 'system', content: node.data.instructions || 'You are a helpful assistant.' },
            { role: 'user', content: inputValue || '' }
          ];
          const resp = await sendMessageToOllama(node.data.modelId, messages, {});
          result = resp?.content || '[Ollama] No output.';
          tokens = resp?.usage || null;
          logs = resp?.logs || [];
        } else if (node.data.backend === 'groq') {
          const messages = [
            { role: 'system', content: node.data.instructions || 'You are a helpful assistant.' },
            { role: 'user', content: inputValue || '' }
          ];
          const resp = await sendMessageToGroq(node.data.modelId, messages);
          result = resp?.content || '[Groq] No output.';
          tokens = resp?.usage || null;
          groqCost = resp?.usage?.total_cost || null;
          logs = resp?.logs || [];
        } else if (node.type === 'start') {
          result = inputValue;
        } else {
          result = `Backend '${node.data.backend}' not implemented.`;
        }
        contextData[nodeId] = result;
        setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, input: inputValue, output: result } } : n));
        setOutputLogs((logsArr) => [...logsArr, `[Flow]  Output from ${nodeId}: ${result}`]);
        nodeStatusMap[nodeId] = 'done';
        setNodeStatus({ ...nodeStatusMap });
        latency = Math.round(performance.now() - start);
        updateNodeExecData(nodeId, {
          model: node.data.modelId,
          quant: node.data.quant,
          backend: node.data.backend,
          latency,
          tokens,
          logs,
          prompt,
          groqCost,
          error: null
        });
      } catch (err) {
        latency = Math.round(performance.now() - start);
        error = err?.message || String(err);
        setOutputLogs((logsArr) => [...logsArr, `[Flow]  Error running ${nodeId}: ${error}`]);
        nodeStatusMap[nodeId] = 'error';
        setNodeStatus({ ...nodeStatusMap });
        updateNodeExecData(nodeId, {
          model: node.data.modelId,
          quant: node.data.quant,
          backend: node.data.backend,
          latency,
          tokens: null,
          logs: [],
          prompt,
          groqCost: null,
          error
        });
      }
    }
    setOutputLogs((logs) => [...logs, '--- Flow Complete ---']);
    setIsFlowRunning(false);
  }, [isFlowRunning, nodes, edges, setOutputLogs, setNodeStatus, topologicalSort, setNodes, setNodeExecutionData]);

  return {
    runningNodes,
    isFlowRunning,
    runNode,
    runFlow,
  };
}
