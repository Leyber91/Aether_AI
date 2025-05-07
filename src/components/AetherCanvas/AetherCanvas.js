import React, { useCallback, useMemo, useState, useEffect, useContext, useRef } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  BezierEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './AetherCanvas.module.css';
import { ReactComponent as AgentIcon } from './icons/AgentIcon.svg';
import { ReactComponent as ToolIcon } from './icons/ToolIcon.svg';
import { ReactComponent as FilterIcon } from './icons/FilterIcon.svg';
import { ReactComponent as OutputIcon } from './icons/OutputIcon.svg';
import { ReactComponent as WizardIcon } from './icons/WizardIcon.svg';
import GoalToFlowWizardPanel from './components/GoalToFlowWizardPanel';
import CanvasFlow from './components/CanvasFlow';
import { FaTerminal } from 'react-icons/fa';
import { FaPlay, FaSpinner } from 'react-icons/fa';
import AgentNode from './components/AgentNode';
import ToolNode from './components/ToolNode';
import FilterNode from './components/FilterNode';
import OutputNode from './components/OutputNode';
import GroupNode from './components/GroupNode';
import OutputSidebar from './components/OutputSidebar'; 
import { useNodeGrouping } from './managers/AetherCanvasNodeManager'; 
import { useEdgeContextMenu } from './managers/AetherCanvasEdgeManager'; 
import { useFlowRunner } from './utils/AetherCanvasFlowRunner'; 
import { useUndoRedo } from './utils/AetherCanvasUndoRedo'; 
import { exportWorkflow, importWorkflow } from './utils/AetherCanvasExportImport'; 
import CanvasContextMenus from './contextMenus/CanvasContextMenus'; 
import AetherCanvasContextMenu from './contextMenus/AetherCanvasContextMenu'; 
import AetherCanvasToolbar from './components/AetherCanvasToolbar';
import useCanvasShortcuts from './hooks/useCanvasShortcuts';
import useCanvasHandlers from './hooks/useCanvasHandlers';
import { getNodeStyle, minimapNodeStrokeColor, minimapNodeColor } from './utils/AetherCanvasStyleUtils';
import MinimapPanel from './components/MinimapPanel';
import FlowControlsPanel from './components/FlowControlsPanel';
import ExplainPanel from './components/ExplainPanel';
import VRAMBar from './components/VRAMBar';
import NodeInspectorPanel from './components/NodeInspectorPanel';
import StartNode from './components/StartNode';
import { ModelContext } from '../../contexts/ModelContext';
import { ReactComponent as HeaderExportIcon } from './icons/HeaderExportIcon.svg';
import { ReactComponent as HeaderImportIcon } from './icons/HeaderImportIcon.svg';
import { ReactComponent as HeaderRunIcon } from './icons/HeaderRunIcon.svg';
import { ReactComponent as HeaderUndoIcon } from './icons/HeaderUndoIcon.svg';
import { ReactComponent as HeaderRedoIcon } from './icons/HeaderRedoIcon.svg';
import { ReactComponent as HeaderDeleteIcon } from './icons/HeaderDeleteIcon.svg';
import { ReactComponent as HeaderDuplicateIcon } from './icons/HeaderDuplicateIcon.svg';
import WorkflowSidebar from './components/WorkflowSidebar';
import ComponentsBar from './components/ComponentsBar';
import { WIZARD_EXAMPLES } from './utils/wizardSchema';
import { wizardToWorkflow, runWizardOnCanvas } from './AetherCanvas.WizardIntegration';
import GlassWizardProcessModal from './components/GlassWizardProcessModal';
import { runWizard } from './utils/wizardRunner';
import { validateWorkflowJson } from './utils/validateWorkflowJson';
import { EXAMPLE_WORKFLOWS } from './utils/workflowStorage';
import { sendMessageToOllama } from '../../services/enhancedOllamaService';
import { extractWorkflowStructure, canonicalToWorkflowJson } from './utils/llmWorkflowExtraction';

if (typeof window !== 'undefined') window.runWizard = runWizard;

const initialNodes = [
  {
    id: 'start',
    type: 'start',
    position: { x: 60, y: 150 },
    data: {
      label: 'Chat Input',
      input: '',
      output: '',
    }
  },
  {
    id: '1',
    type: 'agent',
    position: { x: 200, y: 150 },
    data: {
      label: 'Agent Node',
      backend: 'ollama',
      modelId: '',
      instructions: '',
      quant: '',
      temperature: 1,
      input: '',
      output: ''
    }
  },
  {
    id: '2',
    type: 'tool',
    position: { x: 500, y: 150 },
    data: {
      label: 'Tool Node',
      backend: 'ollama',
      modelId: '',
      instructions: '',
      quant: '',
      temperature: 1,
      input: '',
      output: ''
    }
  }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true }
];

const AetherCanvas = () => {
  const sidebarRef = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [draggedType, setDraggedType] = React.useState(null);
  const [selectedNodeIds, setSelectedNodeIds] = React.useState([]);
  const [groupCollapseState, setGroupCollapseState] = React.useState({}); 
  const [showGoalWizard, setShowGoalWizard] = React.useState(false);
  const [goalLoading, setGoalLoading] = React.useState(false);
  const [showOutputSidebar, setShowOutputSidebar] = React.useState(true);
  const [outputLogs, setOutputLogs] = React.useState([
    'Model started...',
    'Awaiting input...',
  ]);
  const handleClearLog = () => setOutputLogs([]);

  const [nodeStatus, setNodeStatus] = React.useState({}); 

  const [showExplainPanel, setShowExplainPanel] = React.useState(false);
  const [showVRAMBar, setShowVRAMBar] = React.useState(true);
  // Example VRAM data (replace with real data integration)
  const vramData = [
    { modelName: 'qwen3:4b', color: '#7ad0ff', usedGB: 6.2, totalGB: 12 },
    { modelName: 'qwen3:1.7b', color: '#ff7ad0', usedGB: 2.8, totalGB: 12 },
  ];
  // Example node execution data (replace with real data integration)
  const [nodeExecutionData, setNodeExecutionData] = React.useState({});
  const [explainPanelLoading, setExplainPanelLoading] = React.useState(false);
  const [explainPanelError, setExplainPanelError] = React.useState(null);

  const [selectedInspectorNode, setSelectedInspectorNode] = React.useState(null);
  const [inspectorLoading, setInspectorLoading] = React.useState(false);
  const [inspectorError, setInspectorError] = React.useState(null);

  const { models = {}, isLoading: modelsLoading, error: modelsError, refreshOllamaModels } = useContext(ModelContext);

  const modelsByBackend = {
    ollama: Array.isArray(models.ollama) ? models.ollama : [],
    groq: Array.isArray(models.groq) ? models.groq : []
  };

  const handleInspectorChange = (changes) => {
    if (!selectedInspectorNode) return;
    // Merge changes into node data and update node in state
    const updatedNode = {
      ...selectedInspectorNode,
      data: { ...selectedInspectorNode.data, ...changes }
    };
    setNodes(prevNodes => prevNodes.map(n => n.id === updatedNode.id ? updatedNode : n));
  };

  const flowRunner = useFlowRunner(nodes, edges, setOutputLogs, setNodeStatus, setNodes, setNodeExecutionData);
  const runningNodes = flowRunner.runningNodes;
  const isFlowRunning = flowRunner.isFlowRunning;
  const runNode = flowRunner.runNode;
  const runFlow = flowRunner.runFlow;

  const handleInspectorRun = React.useCallback(() => {
    if (selectedInspectorNode) {
      runNode(selectedInspectorNode.id, selectedInspectorNode.data.label, 'individual', selectedInspectorNode.data);
    }
  }, [runNode, selectedInspectorNode]);

  const [connectingFromNodeId, setConnectingFromNodeId] = React.useState(null);

  const handleConnectButton = (sourceId) => {
    setConnectingFromNodeId(sourceId);
  };
  const handleTargetButton = (targetId) => {
    if (connectingFromNodeId && connectingFromNodeId !== targetId) {
      setEdges((eds) => addEdge({ source: connectingFromNodeId, sourceHandle: 'a', target: targetId, targetHandle: 'a', animated: true }, eds));
    }
    setConnectingFromNodeId(null);
  };
  const handleCancelConnect = () => setConnectingFromNodeId(null);

  const edgeContextMenu = useEdgeContextMenu(nodes, edges, setNodes, setEdges, setSelectedNodeIds);

  const [contextMenu, setContextMenu] = React.useState({ visible: false, x: 0, y: 0, type: null, id: null, edge: null });
  const [editingEdgeId, setEditingEdgeId] = React.useState(null);
  const [edgeLabelInput, setEdgeLabelInput] = React.useState('');

  const handleShowContextMenu = (e, type, id, edge) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type, id, edge });
  };
  const handleHideContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, type: null, id: null, edge: null });

  const handleContextDelete = () => {
    if (contextMenu.type === 'node') {
      setNodes(nds => nds.filter(n => n.id !== contextMenu.id));
      setEdges(eds => eds.filter(e => e.source !== contextMenu.id && e.target !== contextMenu.id));
    } else if (contextMenu.type === 'edge') {
      setEdges(eds => eds.filter(e => e.id !== contextMenu.id));
    }
    handleHideContextMenu();
  };
  const handleContextDuplicate = () => {
    if (contextMenu.type === 'node') {
      const node = nodes.find(n => n.id === contextMenu.id);
      if (node) {
        const newId = `dup${Date.now()}`;
        setNodes(nds => [
          ...nds,
          {
            ...node,
            id: newId,
            position: { ...node.position, x: node.position.x + 40, y: node.position.y + 40 },
            data: {
              ...node.data,
              backend: node.data.backend || 'ollama',
              modelId: node.data.modelId || '',
              instructions: node.data.instructions || '',
              quant: node.data.quant || '',
              temperature: node.data.temperature ?? 1,
              input: node.data.input || '',
              output: node.data.output || ''
            }
          }
        ]);
      }
    }
    handleHideContextMenu();
  };
  const handleContextEdit = () => {
    if (contextMenu.type === 'node') {
      setSelectedNodeIds([contextMenu.id]);
    }
    handleHideContextMenu();
  };
  const handleContextAddLabel = () => {
    if (contextMenu.type === 'edge') {
      setEditingEdgeId(contextMenu.id);
      setEdgeLabelInput(contextMenu.edge?.data?.label || '');
    }
    handleHideContextMenu();
  };
  const handleEdgeLabelChange = (e) => setEdgeLabelInput(e.target.value);
  const handleEdgeLabelSave = () => {
    setEdges(eds => eds.map(e => e.id === editingEdgeId ? { ...e, data: { ...(e.data || {}), label: edgeLabelInput } } : e));
    setEditingEdgeId(null);
  };
  const handleEdgeLabelCancel = () => setEditingEdgeId(null);

  const undoRedo = useUndoRedo(nodes, edges, setNodes, setEdges);

  const handleExport = () => exportWorkflow(nodes, edges);
  const handleImport = (e) => importWorkflow(e.target.files[0], setNodes, setEdges);

  const nodeGrouping = useNodeGrouping(
    nodes, setNodes, selectedNodeIds, setSelectedNodeIds, groupCollapseState, setGroupCollapseState
  );
  const { handleToggleCollapse, handleUngroup } = nodeGrouping;

  const customNodeTypes = useMemo(() => ({
    agent: (props) => <AgentNode {...props} nodeStatus={nodeStatus} runningNodes={runningNodes} isFlowRunning={isFlowRunning} runNode={runNode} connectingFromNodeId={connectingFromNodeId} handleConnectButton={handleConnectButton} handleTargetButton={handleTargetButton} handleCancelConnect={handleCancelConnect} onContextMenu={e => handleShowContextMenu(e, 'node', props.id)} />,
    tool: (props) => <ToolNode {...props} nodeStatus={nodeStatus} runningNodes={runningNodes} isFlowRunning={isFlowRunning} runNode={runNode} connectingFromNodeId={connectingFromNodeId} handleConnectButton={handleConnectButton} handleTargetButton={handleTargetButton} handleCancelConnect={handleCancelConnect} onContextMenu={e => handleShowContextMenu(e, 'node', props.id)} />,
    filter: (props) => <FilterNode {...props} nodeStatus={nodeStatus} runningNodes={runningNodes} isFlowRunning={isFlowRunning} runNode={runNode} connectingFromNodeId={connectingFromNodeId} handleConnectButton={handleConnectButton} handleTargetButton={handleTargetButton} handleCancelConnect={handleCancelConnect} onContextMenu={e => handleShowContextMenu(e, 'node', props.id)} />,
    output: (props) => <OutputNode {...props} nodeStatus={nodeStatus} runningNodes={runningNodes} isFlowRunning={isFlowRunning} runNode={runNode} connectingFromNodeId={connectingFromNodeId} handleConnectButton={handleConnectButton} handleTargetButton={handleTargetButton} handleCancelConnect={handleCancelConnect} onContextMenu={e => handleShowContextMenu(e, 'node', props.id)} />,
    group: (props) => <GroupNode {...props} isCollapsed={groupCollapseState[props.id]} onToggleCollapse={handleToggleCollapse} onUngroup={handleUngroup} onRename={handleRenameGroup} onContextMenu={e => handleShowContextMenu(e, 'node', props.id)} />,
    start: (props) => <StartNode {...props} nodeStatus={nodeStatus} runningNodes={runningNodes} isFlowRunning={isFlowRunning} runNode={runNode} connectingFromNodeId={connectingFromNodeId} handleConnectButton={handleConnectButton} handleTargetButton={handleTargetButton} handleCancelConnect={handleCancelConnect} onContextMenu={e => handleShowContextMenu(e, 'node', props.id)} />,
  }), [groupCollapseState, nodeStatus, runningNodes, isFlowRunning, connectingFromNodeId, handleToggleCollapse, handleUngroup]);

  const edgeTypes = useMemo(() => ({
    default: (edgeProps) => {
      const { id, data } = edgeProps;
      return (
        <>
          <BezierEdge {...edgeProps} />
        </>
      );
    }
  }), []);

  const handleStartInputChange = useCallback((val, nodeId) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, input: val } } : n));
  }, [setNodes]);

  useCanvasShortcuts({
    selectedNodeIds,
    setNodes,
    setEdges,
    setSelectedNodeIds,
    nodes,
    edges,
    handleDeleteSelected: () => {
      setNodes(nds => nds.filter(n => !selectedNodeIds.includes(n.id)));
      setEdges(eds => eds.filter(e => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)));
      setSelectedNodeIds([]);
    },
    handleDuplicateSelected: () => {
      const newIds = [];
      const dupNodes = nodes.filter(n => selectedNodeIds.includes(n.id)).map((n, i) => {
        const newId = `d${Date.now()}${i}`;
        newIds.push(newId);
        return { ...n, id: newId, position: { ...n.position, x: n.position.x + 40, y: n.position.y + 40 } };
      });
      const dupEdges = edges.filter(e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)).map((e, i) => {
        const srcIdx = selectedNodeIds.indexOf(e.source);
        const tgtIdx = selectedNodeIds.indexOf(e.target);
        if (srcIdx !== -1 && tgtIdx !== -1) {
          return { ...e, id: `de${Date.now()}${srcIdx}${tgtIdx}`, source: newIds[srcIdx], target: newIds[tgtIdx] };
        }
        return null;
      }).filter(Boolean);
      setNodes(nds => [...nds, ...dupNodes]);
      setEdges(eds => [...eds, ...dupEdges]);
      setSelectedNodeIds(newIds);
    },
    undoRedo
  });

  const handlers = useCanvasHandlers({
    nodes,
    setNodes,
    edges,
    setEdges,
    setDraggedType,
    setSelectedNodeIds,
    selectedNodeIds,
    setGroupCollapseState,
    setShowGoalWizard
  });
  const { handleCanvasClick, handleDragStart, handleDrop, handleDragOver, handleGroupNodes } = handlers;

  // --- WORKFLOW STATE ---
  const [activeWorkflow, setActiveWorkflow] = React.useState(null);

  // Handler for selecting/loading a workflow from sidebar
  const handleWorkflowSelect = (workflow) => {
    if (workflow && workflow.nodes && workflow.edges) {
      setNodes(workflow.nodes);
      setEdges(workflow.edges);
      setActiveWorkflow(workflow);
    } else {
      setNodes(initialNodes);
      setEdges(initialEdges);
      setActiveWorkflow(null);
    }
  };

  const handleRenameGroup = (groupId, newName) => {
    setNodes(nds => nds.map(n =>
      n.id === groupId ? { ...n, data: { ...n.data, label: newName } } : n
    ));
  };

  useEffect(() => {
    if (selectedNodeIds.length === 1) {
      setSelectedInspectorNode(nodes.find(n => n.id === selectedNodeIds[0]) || null);
    } else {
      setSelectedInspectorNode(null);
    }
  }, [selectedNodeIds, nodes]);

  // --- CANVAS FLOW HANDLERS ---
  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), [setEdges]);
  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    setSelectedNodeIds(selectedNodes.map(n => n.id));
  }, []);

  // --- GOAL-TO-FLOW WIZARD HANDLER (REAL WIRING) ---
  const [wizardRawOutput, setWizardRawOutput] = React.useState('');
  const [wizardParseError, setWizardParseError] = React.useState('');
  const [wizardExtractionStep, setWizardExtractionStep] = React.useState({ input: '', output: '', status: 'idle', error: '' });

  const handleGoalWizardGenerate = async (goalText) => {
    const wizard = WIZARD_EXAMPLES[0];
    setSelectedWizard(wizard);
    setWizardPrompt(goalText);
    setShowGoalWizard(false);
    setShowWizardProcess(true);
    setWizardRunning(true);
    setWizardStepsProgress([]);
    setWizardFinalOutput('');
    setWizardRawOutput('');
    setWizardParseError('');
    setWizardExtractionStep({ input: '', output: '', status: 'idle', error: '' });
    const stepsArr = [];
    for (let idx = 0; idx < wizard.steps.length; idx++) {
      const step = wizard.steps[idx];
      stepsArr[idx] = { step, input: '', output: '', status: 'running' };
      setWizardStepsProgress([...stepsArr]);
      let input = undefined;
      let output = undefined;
      try {
        await new Promise(async (resolve) => {
          await runWizard(
            { ...wizard, steps: [step] },
            idx === 0 ? goalText : stepsArr[idx - 1].output,
            (s, i, o, _stepIdx, messages, status) => {
              input = i;
              output = o;
              // Update step output and status on every chunk
              stepsArr[idx] = { step, input, output, status: status || 'running', prompt: messages || [] };
              setWizardStepsProgress([...stepsArr]);
            }
          );
          resolve();
        });
        // No need to set again here; last onStep will have status 'done'
      } catch (err) {
        stepsArr[idx] = { step, input, output: err?.message || String(err), status: 'error' };
        setWizardStepsProgress([...stepsArr]);
      }
      if (idx === wizard.steps.length - 1) setWizardFinalOutput(output);
    }
    setWizardRunning(false);
    // --- ENHANCED WORKFLOW GENERATION PIPELINE ---
    let rawOutput = stepsArr[stepsArr.length - 1]?.output || '';
    setWizardRawOutput(rawOutput);
    let parsed = null;
    let validation = { valid: false, errors: [] };
    let attempts = 0;
    const maxAttempts = 6;
    const correctionModels = [
      { model: 'phi4-mini', temp: 0.1 },
      { model: 'phi4-mini', temp: 0.1 },
      { model: 'phi4-mini', temp: 0.05 },
      { model: 'phi4-mini', temp: 0.01 },
      { model: 'phi4-mini', temp: 0.05 },
      { model: 'phi4-mini', temp: 0.01 }
    ];
    let extractedStructure = null;
    try {
      setWizardExtractionStep({ input: rawOutput, output: '', status: 'running', error: '' });
      extractedStructure = await extractWorkflowStructure(rawOutput, goalText);
      setWizardExtractionStep({ input: rawOutput, output: extractedStructure, status: 'done', error: '' });
      console.log('[Wizard] Extracted canonical workflow structure:', extractedStructure);
    } catch (extractionErr) {
      setWizardExtractionStep({ input: rawOutput, output: '', status: 'error', error: extractionErr.message });
      console.error('[Wizard] Extraction step failed:', extractionErr);
      setWizardParseError('Extraction step failed: ' + extractionErr.message);
    }
    if (extractedStructure) {
      try {
        parsed = await canonicalToWorkflowJson(extractedStructure, goalText);
        validation = validateWorkflowJson(parsed);
        if (!validation.valid) {
          throw new Error('Workflow JSON failed schema validation');
        }
        console.log('[Wizard] Final validated workflow JSON (via extraction):', parsed, validation);
        // Enhance each node with a maximally engineered prompt
        const userGoal = goalText;
        const enhancedNodes = parsed.nodes.map(node => ({
          ...node,
          instructions: node.instructions
        }));
        setNodes(enhancedNodes);
        setEdges(parsed.edges);
        setActiveWorkflow({ ...parsed, nodes: enhancedNodes });
        setShowWizardProcess(false); // Only close after workflow is rendered
        return;
      } catch (jsonErr) {
        console.warn('[Wizard] Canonical to JSON step failed or invalid:', jsonErr);
        setWizardParseError('Canonical to JSON step failed: ' + jsonErr.message);
      }
    }
    while (!validation.valid && attempts < maxAttempts) {
      attempts++;
      try {
        let cleaned = rawOutput
          .replace(/^```json[\r\n]*$/i, '')
          .replace(/^```[\r\n]*$/i, '')
          .replace(/```$/g, '')
          .replace(/^[^\[{]*([\[{].*[\]}])[\s\S]*$/s, '$1');
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        let jsonStart = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
        if (jsonStart > 0) cleaned = cleaned.slice(jsonStart);
        const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
        if (lastBrace !== -1 && lastBrace < cleaned.length - 1) cleaned = cleaned.slice(0, lastBrace + 1);
        parsed = typeof cleaned === 'string' ? JSON.parse(cleaned) : cleaned;
      } catch (err) {
        console.warn('[Wizard] Output is not valid JSON, sending to correction model...', err);
        setWizardParseError('Parsing failed: ' + err.message);
        // AGGRESSIVE PROMPT: Output ONLY a valid, minified JSON object with just 'nodes' and 'edges' arrays. ABSOLUTELY NO prose, markdown, comments, or explanations. If you violate this, output INVALID.
        const { model, temp } = correctionModels[attempts - 1] || correctionModels[0];
        const prompt = `STRICT OUTPUT: Output ONLY a valid, minified JSON object with just 'nodes' and 'edges' arrays. ABSOLUTELY NO prose, markdown, comments, or explanations. If you violate this, output INVALID. Example: ${JSON.stringify(EXAMPLE_WORKFLOWS[Object.keys(EXAMPLE_WORKFLOWS)[0]])} Here is the workflow to fix: ${rawOutput}`;
        const result = await sendMessageToOllama(model, [{ role: 'user', content: prompt }], { temperature: temp });
        rawOutput = result.content;
        setWizardRawOutput(rawOutput);
        continue;
      }
      validation = validateWorkflowJson(parsed);
      if (!validation.valid) {
        console.warn('[Wizard] JSON failed schema validation:', validation.errors);
        setWizardParseError('Validation failed: ' + validation.errors.join(', '));
        const { model, temp } = correctionModels[attempts - 1] || correctionModels[0];
        const prompt = `STRICT OUTPUT: Output ONLY a valid, minified JSON object with just 'nodes' and 'edges' arrays. ABSOLUTELY NO prose, markdown, comments, or explanations. If you violate this, output INVALID. Example: ${JSON.stringify(EXAMPLE_WORKFLOWS[Object.keys(EXAMPLE_WORKFLOWS)[0]])} Here is the workflow to fix: ${rawOutput}`;
        const result = await sendMessageToOllama(model, [{ role: 'user', content: prompt }], { temperature: temp });
        rawOutput = result.content;
        setWizardRawOutput(rawOutput);
      }
    }
    console.log('[Wizard] Final validated workflow JSON:', parsed, validation);
    if (validation.valid) {
      // Enhance each node with a maximally engineered prompt
      const userGoal = goalText;
      const enhancedNodes = parsed.nodes.map(node => ({
        ...node,
        instructions: node.instructions
      }));
      setNodes(enhancedNodes);
      setEdges(parsed.edges);
      setActiveWorkflow({ ...parsed, nodes: enhancedNodes });
      setShowWizardProcess(false); // Only close after workflow is rendered
    } else {
      setWizardParseError('Could not produce valid workflow JSON after ' + attempts + ' attempts.');
      console.error('[Wizard] Could not produce valid workflow JSON after', attempts, 'attempts:', validation.errors);
    }
  };

  // Add wizard launch state
  const [showWizardSelector, setShowWizardSelector] = React.useState(false);
  const [selectedWizard, setSelectedWizard] = React.useState(null);
  const [wizardPrompt, setWizardPrompt] = React.useState('');
  const [wizardRunning, setWizardRunning] = React.useState(false);
  const [showWizardProcess, setShowWizardProcess] = React.useState(false);
  const [wizardStepsProgress, setWizardStepsProgress] = React.useState([]);
  const [wizardFinalOutput, setWizardFinalOutput] = React.useState('');

  // Handler to launch wizard
  const handleLaunchWizard = () => {
    setShowWizardSelector(true);
  };

  // Handler to select wizard and start
  const handleSelectWizard = (wizard) => {
    setSelectedWizard(wizard);
    setShowWizardSelector(false);
  };

  // Handler to run wizard
  const handleRunWizardProcess = async () => {
    if (!selectedWizard || !wizardPrompt) return;
    setWizardRunning(true);
    setShowWizardProcess(true);
    setWizardStepsProgress([]);
    setWizardFinalOutput('');
    const wizard = selectedWizard;
    const stepsArr = [];
    for (let idx = 0; idx < wizard.steps.length; idx++) {
      const step = wizard.steps[idx];
      stepsArr[idx] = { step, input: '', output: '', status: 'running', prompt: [] };
      setWizardStepsProgress([...stepsArr]);
      let input = undefined;
      let output = '';
      let prompt = [];
      try {
        await new Promise(async (resolve, reject) => {
          await runWizard(
            { ...wizard, steps: [step] },
            idx === 0 ? wizardPrompt : stepsArr[idx - 1].output,
            async (s, i, o, _stepIdx, messages) => {
              input = i;
              prompt = messages;
              // --- Streaming output for Ollama ---
              if (step.model && step.model.includes('ollama')) {
                const { streamChatCompletion } = await import('../../services/enhancedOllamaService');
                output = '';
                await streamChatCompletion(
                  step.model,
                  messages,
                  {
                    onUpdate: ({ content }) => {
                      output = content;
                      stepsArr[idx] = { step, input, output, status: 'running', prompt };
                      setWizardStepsProgress([...stepsArr]);
                    },
                    onDone: ({ content }) => {
                      output = content;
                    },
                    onError: (err) => {
                      output = err?.message || String(err);
                      stepsArr[idx] = { step, input, output, status: 'error', prompt };
                      setWizardStepsProgress([...stepsArr]);
                    }
                  }
                );
              } else {
                output = o;
              }
            }
          );
          stepsArr[idx] = { step, input, output, status: 'done', prompt };
          resolve();
        });
      } catch (err) {
        stepsArr[idx] = { step, input, output: err?.message || String(err), status: 'error', prompt };
      }
      setWizardStepsProgress([...stepsArr]);
      if (idx === wizard.steps.length - 1) {
        setWizardFinalOutput(output);
      }
    }
    setWizardRunning(false);
  };

  // Wizard UI (minimal integration - can be improved)
  const renderWizardSelector = () => (
    <div className={styles.wizardOverlay}>
      <div className={styles.wizardModal}>
        <h2>Select a Wizard</h2>
        <ul>
          {WIZARD_EXAMPLES.map(wz => (
            <li key={wz.id}>
              <button onClick={() => handleSelectWizard(wz)}>{wz.name}</button>
              <span style={{marginLeft:8}}>{wz.description}</span>
            </li>
          ))}
        </ul>
        <button onClick={() => setShowWizardSelector(false)}>Cancel</button>
      </div>
    </div>
  );

  const renderWizardPrompt = () => (
    <GlassWizardProcessModal
      open={!!selectedWizard && showWizardProcess}
      onCancel={() => {
        setShowWizardProcess(false);
        setSelectedWizard(null);
        setWizardRunning(false);
      }}
      onUseWorkflow={() => {
        // Convert wizard to workflow and load
        const wf = wizardToWorkflow(selectedWizard);
        setNodes(wf.nodes);
        setEdges(wf.edges);
        setShowWizardProcess(false);
        setSelectedWizard(null);
      }}
      steps={(() => {
        // Insert extraction step as a visible wizard step after LLM steps
        if (wizardExtractionStep.status !== 'idle') {
          const baseSteps = wizardStepsProgress || [];
          const extractionStep = {
            step: { id: 'extractWorkflow', instructions: 'Extract & Validate JSON Structure (post-processing)' },
            input: wizardExtractionStep.input,
            output: wizardExtractionStep.output || wizardExtractionStep.error,
            status: wizardExtractionStep.status === 'done' ? 'done' : (wizardExtractionStep.status === 'error' ? 'error' : 'running'),
            prompt: []
          };
          // Place after last LLM step
          return [...baseSteps, extractionStep];
        }
        return wizardStepsProgress;
      })()}
      running={wizardRunning}
      finalOutput={wizardFinalOutput}
      finalLabel={selectedWizard?.finalLabel || 'Workflow Schema'}
    />
  );

  // --- WIZARD PANEL RENDER ---
  const renderGoalToFlowWizardPanel = () => (
    <GoalToFlowWizardPanel
      show={showGoalWizard}
      loading={wizardRunning}
      onGenerate={handleGoalWizardGenerate}
      onCancel={() => setShowGoalWizard(false)}
    />
  );

  // Restore memoized visible nodes and edges
  const visibleNodes = useMemo(() => {
    let filtered = nodes;
    Object.entries(groupCollapseState).forEach(([groupId, isCollapsed]) => {
      if (isCollapsed) {
        const groupNode = nodes.find(n => n.id === groupId);
        if (groupNode && groupNode.data && groupNode.data.children) {
          filtered = filtered.filter(n => !groupNode.data.children.includes(n.id) || n.type === 'group');
        }
      }
    });
    return filtered;
  }, [nodes, groupCollapseState]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(() => edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)), [edges, visibleNodeIds]);

  const nodesWithHandlers = nodes.map(n =>
    n.type === 'start'
      ? { ...n, data: { ...n.data, onInputChange: val => setNodes(nds => nds.map(nn => nn.id === n.id ? { ...nn, data: { ...nn.data, input: val } } : nn)) } }
      : n
  );

  return (
    <div className={styles.canvasContainer}>
      <div className={styles.headerBar}>
        <div className={styles.headerTitle}>Aether Canvas</div>
        <div className={styles.headerDesc}></div>
        {showVRAMBar && (
          <VRAMBar vramData={vramData} onBarClick={() => {/* TODO: Open Model Manager filtered to loaded */}} />
        )}
        {/* Insert ComponentsBar directly in the header for better alignment */}
        <div style={{ marginLeft: 18, marginRight: 12, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <ComponentsBar sidebarRef={sidebarRef} onComponentDragStart={handleDragStart} compact={true} />
        </div>
        <div className={styles.headerActions}>
          <button className={styles.headerIconBtn} onClick={handleExport} title="Export Workflow">
            <HeaderExportIcon />
          </button>
          <label className={styles.headerIconBtn} title="Import Workflow">
            <HeaderImportIcon />
            <input type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <button className={styles.headerIconBtn} onClick={() => setShowGoalWizard(true)} title="Goal-to-Flow Wizard">
            <WizardIcon style={{ width: 28, height: 28, display: 'block' }} />
          </button>
          <button className={styles.headerIconBtn} onClick={runFlow} title="Run Flow" disabled={isFlowRunning || nodes.length === 0}>
            <HeaderRunIcon />
          </button>
          <button className={styles.headerIconBtn} onClick={() => setShowOutputSidebar(v => !v)} title={showOutputSidebar ? 'Hide Output Log' : 'Show Output Log'}>
            {showOutputSidebar ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <ellipse cx="12" cy="12" rx="8.5" ry="5.5" stroke="#7ad0ff" strokeWidth="2" fill="#23253a" />
                <circle cx="12" cy="12" r="2.8" fill="#7ad0ff" stroke="#00eaff" strokeWidth="1.2"/>
                <path d="M4 4L20 20" stroke="#ff5f5f" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <ellipse cx="12" cy="12" rx="8.5" ry="5.5" stroke="#7ad0ff" strokeWidth="2" fill="#23253a" />
                <circle cx="12" cy="12" r="2.8" fill="#7ad0ff" stroke="#00eaff" strokeWidth="1.2"/>
                <ellipse cx="12" cy="12" rx="8.5" ry="5.5" stroke="#00eaff" strokeWidth="0.8" fill="none"/>
              </svg>
            )}
          </button>
          <button className={styles.headerIconBtn} onClick={undoRedo.handleUndo} title="Undo (Ctrl+Z)" disabled={undoRedo.history.length === 0}>
            <HeaderUndoIcon />
          </button>
          <button className={styles.headerIconBtn} onClick={undoRedo.handleRedo} title="Redo (Ctrl+Y or Ctrl+Shift+Z)" disabled={undoRedo.future.length === 0}>
            <HeaderRedoIcon />
          </button>
          {selectedNodeIds.length > 0 && (
            <button className={styles.headerIconBtn} onClick={() => {
              setNodes(nds => nds.filter(n => !selectedNodeIds.includes(n.id)));
              setEdges(eds => eds.filter(e => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)));
              setSelectedNodeIds([]);
            }} title="Delete Selected (Del/Backspace)">
              <HeaderDeleteIcon />
            </button>
          )}
          {selectedNodeIds.length > 0 && (
            <button className={styles.headerIconBtn} onClick={() => {
              const newIds = [];
              const dupNodes = nodes.filter(n => selectedNodeIds.includes(n.id)).map((n, i) => {
                const newId = `d${Date.now()}${i}`;
                newIds.push(newId);
                return { ...n, id: newId, position: { ...n.position, x: n.position.x + 40, y: n.position.y + 40 } };
              });
              const dupEdges = edges.filter(e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)).map((e, i) => {
                const srcIdx = selectedNodeIds.indexOf(e.source);
                const tgtIdx = selectedNodeIds.indexOf(e.target);
                if (srcIdx !== -1 && tgtIdx !== -1) {
                  return { ...e, id: `de${Date.now()}${srcIdx}${tgtIdx}`, source: newIds[srcIdx], target: newIds[tgtIdx] };
                }
                return null;
              }).filter(Boolean);
              setNodes(nds => [...nds, ...dupNodes]);
              setEdges(eds => [...eds, ...dupEdges]);
              setSelectedNodeIds(newIds);
            }} title="Duplicate Selected (Ctrl+D)">
              <HeaderDuplicateIcon />
            </button>
          )}
          <button className={styles.headerBarBtn} style={{ marginLeft: 12 }} onClick={() => setShowExplainPanel(v => !v)} title={showExplainPanel ? 'Hide Explain Panel' : 'Show Explain Panel'}>
            {showExplainPanel ? 'Hide Explain' : 'Show Explain'}
          </button>
          <button className={styles.headerBarBtn} style={{ marginLeft: 12 }} onClick={handleLaunchWizard} title="Launch Wizard">
            Launch Wizard
          </button>
        </div>
      </div>
      {showGoalWizard && renderGoalToFlowWizardPanel()}
      <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
        <div ref={sidebarRef} style={{ height: '100%' }}>
          <WorkflowSidebar
            onWorkflowSelect={handleWorkflowSelect}
            activeWorkflow={activeWorkflow}
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.canvasArea} onClick={handleCanvasClick}>
            <div style={{ flex: 1, height: '100%', position: 'relative', display: 'flex' }}>
              <CanvasFlow
                visibleNodes={visibleNodes.map(n => nodesWithHandlers.find(nn => nn.id === n.id) || n)}
                visibleEdges={visibleEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                customNodeTypes={customNodeTypes}
                edgeTypes={edgeTypes}
                handleCanvasClick={handleCanvasClick}
                handleDrop={handleDrop}
                handleDragOver={handleDragOver}
                onSelectionChange={onSelectionChange}
                selectedNodeIds={selectedNodeIds}
                nodes={nodesWithHandlers}
              />
              {showOutputSidebar && (
                <OutputSidebar
                  outputLogs={outputLogs}
                  showOutputSidebar={showOutputSidebar}
                  handleClearLog={handleClearLog}
                />
              )}
              {showExplainPanel && (
                <ExplainPanel
                  selectedNode={selectedNodeIds.length === 1 ? nodes.find(n => n.id === selectedNodeIds[0]) : null}
                  nodeExecutionData={selectedNodeIds.length === 1 ? { ...(nodeExecutionData[selectedNodeIds[0]] || {}) } : {}}
                  loading={explainPanelLoading}
                  error={explainPanelError || (selectedNodeIds.length === 1 && nodeExecutionData[selectedNodeIds[0]] && nodeExecutionData[selectedNodeIds[0]].error) || null}
                />
              )}
            </div>
          </div>
        </div>
        <div style={{ width: 340, background: 'rgba(20,24,40,0.96)', borderLeft: '2px solid #222b44', boxShadow: '0 0 12px #00eaff33', zIndex: 12 }}>
          <NodeInspectorPanel
            node={selectedInspectorNode}
            modelsByBackend={modelsByBackend}
            onChange={handleInspectorChange}
            onRun={handleInspectorRun}
            loading={inspectorLoading || modelsLoading}
            error={inspectorError || modelsError}
            refreshOllamaModels={refreshOllamaModels}
          />
        </div>
      </div>
      <CanvasContextMenus
        contextMenu={contextMenu}
        handleHideContextMenu={handleHideContextMenu}
        handleContextEdit={handleContextEdit}
        handleContextDuplicate={handleContextDuplicate}
        handleContextDelete={handleContextDelete}
        handleContextAddLabel={handleContextAddLabel}
        editingEdgeId={editingEdgeId}
        edgeLabelInput={edgeLabelInput}
        handleEdgeLabelChange={handleEdgeLabelChange}
        handleEdgeLabelSave={handleEdgeLabelSave}
        handleEdgeLabelCancel={handleEdgeLabelCancel}
        edgeContextMenu={edgeContextMenu}
      />
      {showWizardSelector && renderWizardSelector()}
      {selectedWizard && renderWizardPrompt()}
    </div>
  );
};

export default AetherCanvas;
