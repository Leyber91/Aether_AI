import React, { useState, useEffect } from 'react';
import { FiActivity, FiZap, FiEye, FiLayers } from 'react-icons/fi';
import NetworkCanvas from '../network/NetworkCanvas';
import DEACInspectorPanel from './DEACInspectorPanel';
import EvolutionControlTower from './EvolutionControlTower';
import MetaLoopCommunicationPanel from './MetaLoopCommunicationPanel';
import NetworkHealthMonitor from './NetworkHealthMonitor';
import '../styles/core/BaseTheme.css';
import './DEACNetworkInterface.css';

/**
 * DEACNetworkInterface - The ultimate living interface
 * Embodies the complete DEAC vision in a cellular architecture
 */
const DEACNetworkInterface = () => {
  // Living Network State
  const [selectedDEAC, setSelectedDEAC] = useState(null);
  const [networkNodes, setNetworkNodes] = useState([]);
  const [networkEdges, setNetworkEdges] = useState([]);
  const [metaLoopActive, setMetaLoopActive] = useState(false);
  const [evolutionInProgress, setEvolutionInProgress] = useState(false);
  const [communicationLog, setCommunicationLog] = useState([]);
  const [networkHealth, setNetworkHealth] = useState({
    activeNodes: 0,
    totalCommunications: 0,
    evolutionGeneration: 0,
    healthScore: 100
  });

  // Initialize Primordial Triangle Network
  useEffect(() => {
    initializePrimordialNetwork();
  }, []);

  const initializePrimordialNetwork = () => {
    const primordialNodes = [
      {
        id: 'genesis-1',
        type: 'primordial',
        position: { x: 400, y: 100 },
        data: {
          name: 'Genesis Alpha',
          state: 'ready',
          evolutionGeneration: 0,
          capabilities: ['spawning', 'evolution', 'communication'],
          internalStructure: {
            coreProcessors: 3,
            memoryBanks: 5,
            communicationChannels: 8
          }
        }
      },
      {
        id: 'genesis-2',
        type: 'primordial',
        position: { x: 200, y: 300 },
        data: {
          name: 'Genesis Beta',
          state: 'thinking',
          evolutionGeneration: 0,
          capabilities: ['spawning', 'evolution', 'communication'],
          internalStructure: {
            coreProcessors: 3,
            memoryBanks: 5,
            communicationChannels: 8
          }
        }
      },
      {
        id: 'genesis-3',
        type: 'primordial',
        position: { x: 600, y: 300 },
        data: {
          name: 'Genesis Gamma',
          state: 'evolving',
          evolutionGeneration: 0,
          capabilities: ['spawning', 'evolution', 'communication'],
          internalStructure: {
            coreProcessors: 3,
            memoryBanks: 5,
            communicationChannels: 8
          }
        }
      }
    ];

    const primordialEdges = [
      {
        id: 'meta-1-2',
        source: 'genesis-1',
        target: 'genesis-2',
        type: 'default',
        style: { stroke: '#4facfe', strokeWidth: 2 },
        data: { strength: 0.8, messageCount: 0 }
      },
      {
        id: 'meta-2-3',
        source: 'genesis-2',
        target: 'genesis-3',
        type: 'default', 
        style: { stroke: '#4facfe', strokeWidth: 2 },
        data: { strength: 0.7, messageCount: 0 }
      },
      {
        id: 'meta-3-1',
        source: 'genesis-3',
        target: 'genesis-1',
        type: 'default',
        style: { stroke: '#4facfe', strokeWidth: 2 },
        data: { strength: 0.9, messageCount: 0 }
      }
    ];

    // Defensive check to ensure all nodes have valid positions
    const validatedNodes = primordialNodes.map(node => ({
      ...node,
      position: node.position || { x: 0, y: 0 },
      data: node.data || {}
    }));

    setNetworkNodes(validatedNodes);
    setNetworkEdges(primordialEdges);
    setNetworkHealth(prev => ({ ...prev, activeNodes: validatedNodes.length }));
  };

  // DEAC Selection Handler
  const handleDEACSelection = (nodeId) => {
    const selectedNode = networkNodes.find(node => node.id === nodeId);
    setSelectedDEAC(selectedNode);
    
    // Log selection event
    addCommunicationLog({
      type: 'system',
      source: 'interface',
      target: nodeId,
      message: `DEAC ${selectedNode?.data.name} selected for inspection`,
      timestamp: new Date()
    });
  };

  // Evolution Trigger Handler
  const handleEvolutionTrigger = (evolutionType, targetNodeId) => {
    setEvolutionInProgress(true);
    
    addCommunicationLog({
      type: 'evolution',
      source: 'control-tower',
      target: targetNodeId,
      message: `Initiating ${evolutionType} evolution...`,
      timestamp: new Date()
    });

    // Simulate evolution process
    setTimeout(() => {
      if (evolutionType === 'spawn') {
        handleNodeSpawning(targetNodeId);
      } else if (evolutionType === 'specialize') {
        handleNodeSpecialization(targetNodeId);
      }
      setEvolutionInProgress(false);
    }, 2000);
  };

  // Node Spawning Logic
  const handleNodeSpawning = (parentId) => {
    const parentNode = networkNodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newNodeId = `spawned-${Date.now()}`;
    
    const newNode = {
      id: newNodeId,
      type: 'specialized',
      position: { 
        x: (parentNode.position?.x || 0) + 150, 
        y: (parentNode.position?.y || 0) + 100 
      },
      data: {
        name: `Analyzer-${newNodeId.slice(-4)}`,
        state: 'ready',
        evolutionGeneration: (parentNode.data?.evolutionGeneration || 0) + 1,
        parentId: parentId,
        specialization: 'analyzer',
        capabilities: ['data-analysis', 'pattern-recognition'],
        internalStructure: {
          coreProcessors: 2,
          memoryBanks: 3,
          communicationChannels: 4,
          analysisEngines: 2
        }
      }
    };

    const newEdge = {
      id: `spawn-${parentId}-${newNodeId}`,
      source: parentId,
      target: newNodeId,
      type: 'default',
      style: { stroke: '#7affc3', strokeWidth: 2 },
      data: { strength: 1.0, messageCount: 0 }
    };

    setNetworkNodes(prev => [...prev, newNode]);
    setNetworkEdges(prev => [...prev, newEdge]);
    
    addCommunicationLog({
      type: 'spawn',
      source: parentId,
      target: newNodeId,
      message: `Spawned new Analyzer node: ${newNode.data.name}`,
      timestamp: new Date()
    });

    setNetworkHealth(prev => ({
      ...prev,
      activeNodes: prev.activeNodes + 1,
      evolutionGeneration: Math.max(prev.evolutionGeneration, newNode.data.evolutionGeneration)
    }));
  };

  // Node Specialization Logic
  const handleNodeSpecialization = (nodeId) => {
    setNetworkNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            state: 'evolving',
            evolutionGeneration: (node.data?.evolutionGeneration || 0) + 1,
            capabilities: [...(node.data?.capabilities || []), 'enhanced-processing'],
            internalStructure: {
              ...(node.data?.internalStructure || {}),
              coreProcessors: (node.data?.internalStructure?.coreProcessors || 0) + 1,
              enhancementModules: (node.data?.internalStructure?.enhancementModules || 0) + 1
            }
          }
        };
      }
      return node;
    }));

    addCommunicationLog({
      type: 'specialization',
      source: 'control-tower',
      target: nodeId,
      message: `Node specialized with enhanced capabilities`,
      timestamp: new Date()
    });
  };

  // MetaLoop Communication Handler
  const handleMetaLoopCommunication = (sourceId, targetId, message) => {
    addCommunicationLog({
      type: 'metaloop',
      source: sourceId,
      target: targetId,
      message: message?.content || message,
      timestamp: new Date()
    });

    // Update edge message count
    setNetworkEdges(prev => prev.map(edge => {
      if ((edge.source === sourceId && edge.target === targetId) ||
          (edge.source === targetId && edge.target === sourceId)) {
        return {
          ...edge,
          data: { 
            ...edge.data, 
            messageCount: (edge.data?.messageCount || 0) + 1,
            lastActivity: new Date()
          }
        };
      }
      return edge;
    }));

    setNetworkHealth(prev => ({
      ...prev,
      totalCommunications: prev.totalCommunications + 1
    }));
  };

  // Communication Log Helper
  const addCommunicationLog = (logEntry) => {
    setCommunicationLog(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  // Nodes Change Handler (for ReactFlow)
  const handleNodesChange = (changes) => {
    setNetworkNodes(nds => 
      changes.reduce((acc, change) => {
        if (change.type === 'position' && change.position) {
          return acc.map(node => 
            node.id === change.id 
              ? { ...node, position: change.position }
              : node
          );
        }
        return acc;
      }, nds)
    );
  };

  // Edges Change Handler (for ReactFlow)
  const handleEdgesChange = (changes) => {
    setNetworkEdges(eds => 
      changes.reduce((acc, change) => {
        if (change.type === 'remove') {
          return acc.filter(edge => edge.id !== change.id);
        }
        return acc;
      }, eds)
    );
  };

  return (
    <div className="deac-network-interface cellular-base">
      {/* Network Health Monitor - Top Bar */}
      <NetworkHealthMonitor 
        health={networkHealth}
        metaLoopActive={metaLoopActive}
        evolutionInProgress={evolutionInProgress}
      />

      {/* Main Interface Grid */}
      <div className="interface-grid">
        
        {/* Evolution Control Tower - Left Panel */}
        <div className="control-tower-zone">
          <EvolutionControlTower
            selectedDEAC={selectedDEAC}
            onEvolutionTrigger={handleEvolutionTrigger}
            onMetaLoopToggle={setMetaLoopActive}
            metaLoopActive={metaLoopActive}
            evolutionInProgress={evolutionInProgress}
            networkStats={networkHealth}
          />
        </div>

        {/* Network Canvas - Center Visualization */}
        <div className="network-canvas-zone">
          <NetworkCanvas
            nodes={networkNodes}
            edges={networkEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeClick={handleDEACSelection}
            onCommunicate={handleMetaLoopCommunication}
            metaLoopActive={metaLoopActive}
          />
        </div>

        {/* DEAC Inspector - Right Panel */}
        <div className="inspector-zone">
          <DEACInspectorPanel
            selectedDEAC={selectedDEAC}
            onStructureModify={(changes) => {
              // Handle internal structure modifications
              console.log('Structure changes:', changes);
            }}
          />
        </div>

      </div>

      {/* MetaLoop Communication Panel - Bottom */}
      <div className="communication-zone">
        <MetaLoopCommunicationPanel
          communicationLog={communicationLog}
          onSendMessage={(targetId, message) => {
            handleMetaLoopCommunication('interface', targetId, { content: message });
          }}
        />
      </div>

    </div>
  );
};

export default DEACNetworkInterface; 