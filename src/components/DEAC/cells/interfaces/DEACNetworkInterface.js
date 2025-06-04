import React, { useState, useEffect } from 'react';
import { FiActivity, FiZap, FiEye, FiLayers } from 'react-icons/fi';
import DynamicNetworkEngine from '../network/DynamicNetworkEngine';
import DEACInspectorPanel from './DEACInspectorPanel';
import EvolutionControlTower from './EvolutionControlTower';
import MetaLoopCommunicationPanel from './MetaLoopCommunicationPanel';
import NetworkHealthMonitor from './NetworkHealthMonitor';
import DEACChatInterface from './DEACChatInterface';
import '../styles/core/BaseTheme.css';
import './DEACNetworkInterface.css';

/**
 * DEACNetworkInterface - Real living network with physics simulation
 * Chat and network now use WebSocket communication for live updates
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

  // DEAC Chat Integration State
  const [deacConversations, setDEACConversations] = useState([]);
  const [activeNodeChat, setActiveNodeChat] = useState(null);
  
  // WebSocket State
  const [wsConnection, setWsConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/deac-network');
      
      ws.onopen = () => {
        console.log('🌐 Connected to DEAC Network WebSocket');
        setIsConnected(true);
        setWsConnection(ws);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.onclose = () => {
        console.log('🌐 Disconnected from DEAC Network WebSocket');
        setIsConnected(false);
        setWsConnection(null);
        // Attempt reconnection after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('🌐 WebSocket error:', error);
      };

    } catch (error) {
      console.error('🌐 Failed to connect WebSocket:', error);
      // Fallback to local simulation if WebSocket fails
      setTimeout(connectWebSocket, 5000);
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'network_update':
        if (data.nodes) setNetworkNodes(data.nodes);
        if (data.edges) setNetworkEdges(data.edges);
        break;
      case 'node_spawned':
        handleNodeSpawning(data.parentId, data.newNode);
        break;
      case 'node_evolved':
        handleNodeSpecialization(data.nodeId, data.enhancements);
        break;
      case 'communication':
        handleRealTimeCommunication(data);
        break;
      case 'health_update':
        setNetworkHealth(data.health);
        break;
    }
  };

  const sendWebSocketMessage = (message) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify(message));
    }
  };

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
          },
          // DEAC Chat Properties
          personality: 'Analytical and methodical, focuses on logical problem-solving',
          specialization: 'Strategic planning and system architecture',
          conversationHistory: []
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
          },
          // DEAC Chat Properties
          personality: 'Creative and intuitive, explores novel approaches',
          specialization: 'Innovation and creative problem-solving',
          conversationHistory: []
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
          },
          // DEAC Chat Properties
          personality: 'Adaptive and experimental, constantly evolving approaches',
          specialization: 'Evolution and adaptation strategies',
          conversationHistory: []
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

    // Send initial network to WebSocket
    sendWebSocketMessage({
      type: 'initialize_network',
      nodes: validatedNodes,
      edges: primordialEdges
    });
  };

  // DEAC Chat Integration Functions
  const handleDEACChatMessage = async (message, targetNodeId = null) => {
    // If no target specified, use the selected DEAC or broadcast to network
    const actualTarget = targetNodeId || selectedDEAC?.id || 'network';
    
    // Add user message to communication log
    addCommunicationLog({
      type: 'user-chat',
      source: 'user',
      target: actualTarget,
      message: message,
      timestamp: new Date()
    });

    // Send to WebSocket for AI processing
    sendWebSocketMessage({
      type: 'chat_message',
      message: message,
      target: actualTarget,
      timestamp: new Date()
    });

    // Process message through DEAC network
    if (actualTarget === 'network') {
      return await handleNetworkBroadcast(message);
    } else {
      return await handleDirectDEACChat(message, actualTarget);
    }
  };

  const handleNetworkBroadcast = async (message) => {
    // Trigger visual network activity
    networkNodes.forEach((node, index) => {
      setTimeout(() => {
        if (window.deacNetworkEngine) {
          window.deacNetworkEngine.triggerMessage('user', node.id);
        }
      }, index * 200);
    });

    // Broadcast to all active nodes and get collective response
    const responses = [];
    
    for (const node of networkNodes) {
      const nodeResponse = await generateDEACResponse(message, node);
      responses.push({
        nodeId: node.id,
        nodeName: node.data.name,
        response: nodeResponse
      });
      
      // Update node conversation history
      updateNodeConversationHistory(node.id, message, nodeResponse);
    }

    // Create a collective network response
    const networkResponse = `**Network Collective Response:**\n\n${responses.map(r => 
      `**${r.nodeName}:** ${r.response}`
    ).join('\n\n')}`;

    addCommunicationLog({
      type: 'network-response',
      source: 'network',
      target: 'user',
      message: networkResponse,
      timestamp: new Date()
    });

    return networkResponse;
  };

  const handleDirectDEACChat = async (message, nodeId) => {
    const targetNode = networkNodes.find(n => n.id === nodeId);
    if (!targetNode) return "DEAC node not found.";

    // Trigger visual communication
    if (window.deacNetworkEngine) {
      window.deacNetworkEngine.triggerMessage('user', nodeId);
    }

    const response = await generateDEACResponse(message, targetNode);
    
    // Update node conversation history
    updateNodeConversationHistory(nodeId, message, response);
    
    // Add response to communication log
    addCommunicationLog({
      type: 'deac-response',
      source: nodeId,
      target: 'user',
      message: response,
      timestamp: new Date()
    });

    // Check if message triggers evolution actions
    await checkForEvolutionTriggers(message, targetNode);

    return response;
  };

  const generateDEACResponse = async (message, node) => {
    // This would ideally connect to your AI backend, but for now we'll simulate DEAC responses
    const basePersonality = node.data.personality || 'Analytical and methodical';
    const specialization = node.data.specialization || 'General problem-solving';
    
    // Simulate different responses based on node personality and message content
    if (message.toLowerCase().includes('spawn') || message.toLowerCase().includes('create')) {
      return `[${node.data.name}] ${basePersonality}. I can help you spawn a specialized node. Based on your request, I recommend creating a ${getRecommendedSpecialization(message)} node. Shall I initiate the spawning process?`;
    }
    
    if (message.toLowerCase().includes('evolve') || message.toLowerCase().includes('upgrade')) {
      return `[${node.data.name}] ${basePersonality}. I sense evolution potential in your request. My current capabilities include ${node.data.capabilities?.join(', ')}. I can evolve to better serve your needs. What specific enhancement would you like me to develop?`;
    }
    
    if (message.toLowerCase().includes('status') || message.toLowerCase().includes('health')) {
      return `[${node.data.name}] Current Status: ${node.data.state} | Generation: ${node.data.evolutionGeneration} | Specialization: ${specialization} | Internal Structure: ${node.data.internalStructure?.coreProcessors || 0} processors, ${node.data.internalStructure?.memoryBanks || 0} memory banks`;
    }

    // Default conversational response
    return `[${node.data.name}] ${basePersonality}. I'm specialized in ${specialization}. How can I assist you with this request: "${message}"?`;
  };

  const getRecommendedSpecialization = (message) => {
    if (message.toLowerCase().includes('analy')) return 'Analyzer';
    if (message.toLowerCase().includes('creat') || message.toLowerCase().includes('innov')) return 'Creator';
    if (message.toLowerCase().includes('monitor') || message.toLowerCase().includes('watch')) return 'Monitor';
    if (message.toLowerCase().includes('optim')) return 'Optimizer';
    return 'Specialist';
  };

  const updateNodeConversationHistory = (nodeId, userMessage, nodeResponse) => {
    setNetworkNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            conversationHistory: [
              ...(node.data.conversationHistory || []),
              { role: 'user', content: userMessage, timestamp: new Date() },
              { role: 'assistant', content: nodeResponse, timestamp: new Date() }
            ]
          }
        };
      }
      return node;
    }));
  };

  const checkForEvolutionTriggers = async (message, node) => {
    // Auto-trigger evolution based on chat content
    if (message.toLowerCase().includes('spawn') && message.toLowerCase().includes('node')) {
      setTimeout(() => handleNodeSpawning(node.id), 1000);
    }
    
    if (message.toLowerCase().includes('evolve') || message.toLowerCase().includes('upgrade')) {
      setTimeout(() => handleNodeSpecialization(node.id), 1000);
    }
  };

  // DEAC Selection Handler (Enhanced for Chat Integration)
  const handleDEACSelection = (nodeId) => {
    const selectedNode = networkNodes.find(node => node.id === nodeId);
    setSelectedDEAC(selectedNode);
    setActiveNodeChat(nodeId); // Set active chat target
    
    // Log selection event
    addCommunicationLog({
      type: 'system',
      source: 'interface',
      target: nodeId,
      message: `DEAC ${selectedNode?.data.name} selected for direct communication`,
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

    // Send evolution request to WebSocket
    sendWebSocketMessage({
      type: 'trigger_evolution',
      evolutionType: evolutionType,
      targetNodeId: targetNodeId,
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

  // Node Spawning Logic (Enhanced with real physics)
  const handleNodeSpawning = (parentId, newNodeData = null) => {
    const parentNode = networkNodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newNodeId = newNodeData?.id || `spawned-${Date.now()}`;
    
    const newNode = newNodeData || {
      id: newNodeId,
      type: 'specialized',
      position: { 
        x: (parentNode.position?.x || 0) + (Math.random() - 0.5) * 100, 
        y: (parentNode.position?.y || 0) + (Math.random() - 0.5) * 100 
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
        },
        // DEAC Chat Properties for spawned node
        personality: 'Focused and analytical, specialized in data processing',
        specialization: 'Data analysis and pattern recognition',
        conversationHistory: []
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
    
    // Trigger visual spawning animation
    if (window.deacNetworkEngine) {
      setTimeout(() => {
        window.deacNetworkEngine.triggerMessage(parentId, newNodeId);
      }, 500);
    }
    
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

  // Node Specialization Logic (Enhanced with visual feedback)
  const handleNodeSpecialization = (nodeId, enhancements = null) => {
    setNetworkNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        const enhancedNode = {
          ...node,
          data: {
            ...node.data,
            state: 'evolving',
            evolutionGeneration: (node.data?.evolutionGeneration || 0) + 1,
            capabilities: [...(node.data?.capabilities || []), 'enhanced-processing'],
            internalStructure: {
              ...(node.data?.internalStructure || {}),
              coreProcessors: (node.data?.internalStructure?.coreProcessors || 0) + 1,
              enhancementModules: (node.data?.internalStructure?.enhancementModules || 0) + 1,
              ...(enhancements?.internalStructure || {})
            }
          }
        };

        // Trigger visual evolution effect
        if (window.deacNetworkEngine) {
          window.deacNetworkEngine.triggerMessage(nodeId, nodeId);
        }

        return enhancedNode;
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

  // Real-time Communication Handler (from WebSocket)
  const handleRealTimeCommunication = (data) => {
    // Trigger visual communication in network
    if (window.deacNetworkEngine && data.sourceId && data.targetId) {
      window.deacNetworkEngine.triggerMessage(data.sourceId, data.targetId);
    }

    addCommunicationLog({
      type: 'metaloop',
      source: data.sourceId,
      target: data.targetId,
      message: data.message,
      timestamp: new Date(data.timestamp)
    });

    // Update edge message count
    setNetworkEdges(prev => prev.map(edge => {
      if ((edge.source === data.sourceId && edge.target === data.targetId) ||
          (edge.source === data.targetId && edge.target === data.sourceId)) {
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

  // MetaLoop Communication Handler
  const handleMetaLoopCommunication = (sourceId, targetId, message) => {
    // Send to WebSocket for processing
    sendWebSocketMessage({
      type: 'metaloop_communication',
      sourceId: sourceId,
      targetId: targetId,
      message: message,
      timestamp: new Date()
    });

    handleRealTimeCommunication({
      sourceId: sourceId,
      targetId: targetId,
      message: message?.content || message,
      timestamp: new Date()
    });
  };

  // Communication Log Helper
  const addCommunicationLog = (logEntry) => {
    setCommunicationLog(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  // Node Position Update Handler (from physics engine)
  const handleNodePositionUpdate = (nodeUpdates) => {
    setNetworkNodes(prev => prev.map(node => {
      const update = nodeUpdates.find(u => u.id === node.id);
      return update ? { ...node, position: update.position } : node;
    }));
  };

  return (
    <div className="deac-network-interface cellular-base">
      {/* Network Health Monitor - Top Bar */}
      <NetworkHealthMonitor 
        health={networkHealth}
        metaLoopActive={metaLoopActive}
        evolutionInProgress={evolutionInProgress}
        isConnected={isConnected}
      />

      {/* Main Split Layout - 40% Chat / 60% Network */}
      <div className="main-split-container">
        
        {/* Left Panel - DEAC Chat Interface (40%) */}
        <div className="chat-panel">
          <div className="panel-header">
            <h3>DEAC Network Chat</h3>
            <p>
              {activeNodeChat 
                ? `Chatting with ${networkNodes.find(n => n.id === activeNodeChat)?.data.name || 'DEAC'}`
                : 'Communicate with the entire DEAC network'
              }
            </p>
            {isConnected && <div className="connection-indicator">🟢 Live</div>}
          </div>
          <div className="chat-container-wrapper">
            <DEACChatInterface 
              networkNodes={networkNodes}
              selectedDEAC={selectedDEAC}
              activeNodeChat={activeNodeChat}
              onChatMessage={handleDEACChatMessage}
              onNodeSelect={setActiveNodeChat}
              communicationLog={communicationLog}
            />
          </div>
        </div>

        {/* Right Panel - Dynamic Network Visualization (60%) */}
        <div className="network-panel">
          {/* Dynamic Network Canvas - Real Physics */}
          <div className="network-canvas-zone">
            <DynamicNetworkEngine
              nodes={networkNodes}
              edges={networkEdges}
              onNodeClick={handleDEACSelection}
              onNodePositionUpdate={handleNodePositionUpdate}
              onCommunicate={handleMetaLoopCommunication}
            />
          </div>

          {/* Collapsible Control Panels */}
          <div className="control-panels-overlay">
            {/* Evolution Control Tower - Collapsible */}
            <div className="floating-panel evolution-panel">
              <EvolutionControlTower
                selectedDEAC={selectedDEAC}
                onEvolutionTrigger={handleEvolutionTrigger}
                onMetaLoopToggle={setMetaLoopActive}
                metaLoopActive={metaLoopActive}
                evolutionInProgress={evolutionInProgress}
                networkStats={networkHealth}
              />
            </div>

            {/* DEAC Inspector - Collapsible */}
            {selectedDEAC && (
              <div className="floating-panel inspector-panel">
                <DEACInspectorPanel
                  selectedDEAC={selectedDEAC}
                  onStructureModify={(changes) => {
                    // Handle internal structure modifications
                    console.log('Structure changes:', changes);
                  }}
                />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MetaLoop Communication Panel - Bottom (Hidden/Minimal) */}
      <div className="communication-zone-minimal">
        <MetaLoopCommunicationPanel
          communicationLog={communicationLog}
          onSendMessage={(targetId, message) => {
            handleMetaLoopCommunication('interface', targetId, { content: message });
          }}
          minimal={true}
        />
      </div>

    </div>
  );
};

export default DEACNetworkInterface; 