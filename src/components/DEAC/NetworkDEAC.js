import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Panel,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  FiCpu, 
  FiZap, 
  FiActivity, 
  FiPlay, 
  FiPause,
  FiRefreshCw,
  FiSettings,
  FiPlus,
  FiTarget,
  FiMessageCircle,
  FiTrendingUp
} from 'react-icons/fi';
import './NetworkDEAC.css';

// Network Node Components
import DEACNetworkNode from './components/DEACNetworkNode';
import ModelWizardPanel from './components/ModelWizardPanel';
import MetaLoopController from './components/MetaLoopController';
import NetworkEvolutionPanel from './components/NetworkEvolutionPanel';

/**
 * NetworkDEAC - Living Network Ecosystem Visualization
 * Transforms DEAC from dashboard to interconnected network of evolving AI entities
 */
const NetworkDEAC = () => {
  // Network State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [networkStatus, setNetworkStatus] = useState('initializing');
  const [evolutionState, setEvolutionState] = useState({
    isEvolving: false,
    activeConnections: 0,
    totalGenerations: 0,
    networkHealth: 100
  });

  // MetaLoop State
  const [metaLoopActive, setMetaLoopActive] = useState(false);
  const [communicationFlows, setCommunicationFlows] = useState([]);
  const [bidirectionalChannels, setBidirectionalChannels] = useState(new Map());

  // Model Wizard State
  const [modelWizardOpen, setModelWizardOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [modelGenerationQueue, setModelGenerationQueue] = useState([]);

  // Panels State
  const [showEvolutionPanel, setShowEvolutionPanel] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // API Base
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  /**
   * Initialize Primordial DEACs
   * Creates the initial network nodes that can evolve and spawn others
   */
  const initializePrimordialDEACs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/deac/network/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primordialCount: 3,
          networkTopology: 'triangular',
          enableMetaLoop: true
        })
      });

      if (response.ok) {
        const { primordialNodes, connections } = await response.json();
        
        // Create network nodes
        const networkNodes = primordialNodes.map((deac, index) => ({
          id: deac.id,
          type: 'deacNetwork',
          position: getPrimordialPosition(index, primordialNodes.length),
          data: {
            ...deac,
            isPrimordial: true,
            metaLoopEnabled: true,
            spawnCapacity: 3,
            connectionStrength: 1.0,
            evolutionGeneration: 0,
            specialization: null
          }
        }));

        // Create bidirectional edges
        const networkEdges = connections.map(conn => ({
          id: `edge-${conn.source}-${conn.target}`,
          source: conn.source,
          target: conn.target,
          type: 'metaLoop',
          animated: true,
          data: {
            connectionType: 'bidirectional',
            strength: conn.strength,
            messageFlow: []
          }
        }));

        setNodes(networkNodes);
        setEdges(networkEdges);
        setNetworkStatus('active');
        
        // Initialize MetaLoop channels
        initializeMetaLoopChannels(networkNodes, networkEdges);
      }
    } catch (error) {
      console.error('Failed to initialize primordial DEACs:', error);
      setNetworkStatus('error');
    }
  }, [API_BASE]);

  /**
   * Get position for primordial nodes in optimal network formation
   */
  const getPrimordialPosition = (index, total) => {
    const centerX = 400;
    const centerY = 300;
    const radius = 150;
    
    if (total === 1) return { x: centerX, y: centerY };
    
    const angle = (index * 2 * Math.PI) / total;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  /**
   * Initialize MetaLoop Bidirectional Communication Channels
   */
  const initializeMetaLoopChannels = useCallback((networkNodes, networkEdges) => {
    const channels = new Map();
    
    networkEdges.forEach(edge => {
      const channelId = `${edge.source}-${edge.target}`;
      channels.set(channelId, {
        source: edge.source,
        target: edge.target,
        messageQueue: [],
        isActive: false,
        lastCommunication: null,
        strength: edge.data.strength
      });
      
      // Create reverse channel for bidirectional communication
      const reverseChannelId = `${edge.target}-${edge.source}`;
      channels.set(reverseChannelId, {
        source: edge.target,
        target: edge.source,
        messageQueue: [],
        isActive: false,
        lastCommunication: null,
        strength: edge.data.strength
      });
    });
    
    setBidirectionalChannels(channels);
  }, []);

  /**
   * MetaLoop Communication Handler
   * Enables bidirectional message flow between nodes
   */
  const handleMetaLoopCommunication = useCallback(async (sourceId, targetId, message) => {
    const channelId = `${sourceId}-${targetId}`;
    const channel = bidirectionalChannels.get(channelId);
    
    if (!channel) return;
    
    try {
      // Send message through API
      const response = await fetch(`${API_BASE}/deac/network/communicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId,
          targetId,
          message,
          channelStrength: channel.strength
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update communication flows for visualization
        setCommunicationFlows(prev => [...prev, {
          id: Date.now(),
          sourceId,
          targetId,
          message: message.content,
          response: result.response,
          timestamp: new Date(),
          strength: channel.strength
        }]);
        
        // Update channel state
        const updatedChannels = new Map(bidirectionalChannels);
        updatedChannels.set(channelId, {
          ...channel,
          isActive: true,
          lastCommunication: new Date(),
          messageQueue: [...channel.messageQueue, { message, response: result.response }]
        });
        setBidirectionalChannels(updatedChannels);
        
        // Trigger response if bidirectional
        if (result.shouldRespond) {
          setTimeout(() => {
            handleMetaLoopCommunication(targetId, sourceId, {
              content: result.response,
              type: 'response',
              originalMessage: message
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('MetaLoop communication error:', error);
    }
  }, [bidirectionalChannels, API_BASE]);

  /**
   * Node Spawning Logic
   * Creates new specialized nodes based on network conditions
   */
  const spawnSpecializedNode = useCallback(async (parentNodeId, specializationType) => {
    try {
      // Request Model Wizard to create specialized model
      const modelResponse = await fetch(`${API_BASE}/model-wizard/create-specialized`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentNodeId,
          specializationType,
          baseModel: 'llama3.2',
          networkContext: { nodes: nodes.length, activeConnections: edges.length }
        })
      });
      
      if (modelResponse.ok) {
        const { modelId, modelPath } = await modelResponse.json();
        
        // Create specialized DEAC node
        const response = await fetch(`${API_BASE}/deac/network/spawn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parentId: parentNodeId,
            specialization: specializationType,
            modelId,
            modelPath,
            networkPosition: 'auto'
          })
        });
        
        if (response.ok) {
          const newNode = await response.json();
          
          // Calculate position near parent
          const parentNode = nodes.find(n => n.id === parentNodeId);
          const spawnPosition = {
            x: parentNode.position.x + (Math.random() - 0.5) * 200,
            y: parentNode.position.y + (Math.random() - 0.5) * 200
          };
          
          // Add new node to network
          const networkNode = {
            id: newNode.id,
            type: 'deacNetwork',
            position: spawnPosition,
            data: {
              ...newNode,
              isPrimordial: false,
              parentId: parentNodeId,
              specialization: specializationType,
              metaLoopEnabled: true,
              spawnCapacity: 1,
              connectionStrength: 0.8,
              evolutionGeneration: parentNode.data.evolutionGeneration + 1
            }
          };
          
          setNodes(prev => [...prev, networkNode]);
          
          // Create connection to parent
          const parentConnection = {
            id: `edge-${parentNodeId}-${newNode.id}`,
            source: parentNodeId,
            target: newNode.id,
            type: 'specialized',
            animated: true,
            data: {
              connectionType: 'parent-child',
              strength: 0.9,
              specializationType
            }
          };
          
          setEdges(prev => [...prev, parentConnection]);
          
          // Update evolution state
          setEvolutionState(prev => ({
            ...prev,
            totalGenerations: prev.totalGenerations + 1,
            activeConnections: prev.activeConnections + 1
          }));
        }
      }
    } catch (error) {
      console.error('Node spawning error:', error);
    }
  }, [nodes, edges, API_BASE]);

  /**
   * Autonomous Network Evolution
   * Monitors network and triggers spawning/optimization
   */
  const triggerNetworkEvolution = useCallback(async () => {
    if (!metaLoopActive) return;
    
    setEvolutionState(prev => ({ ...prev, isEvolving: true }));
    
    try {
      // Analyze network for evolution opportunities
      const response = await fetch(`${API_BASE}/deac/network/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map(n => ({ id: n.id, data: n.data })),
          edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, data: e.data })),
          communicationFlows: communicationFlows.slice(-10) // Last 10 communications
        })
      });
      
      if (response.ok) {
        const analysis = await response.json();
        
        // Execute evolution recommendations
        for (const recommendation of analysis.recommendations) {
          switch (recommendation.type) {
            case 'spawn_specialist':
              await spawnSpecializedNode(recommendation.parentId, recommendation.specialization);
              break;
            case 'strengthen_connection':
              // Strengthen existing connection
              setEdges(prev => prev.map(edge => 
                edge.id === recommendation.edgeId 
                  ? { ...edge, data: { ...edge.data, strength: Math.min(1.0, edge.data.strength + 0.1) }}
                  : edge
              ));
              break;
            case 'create_connection':
              // Create new connection between nodes
              const newConnection = {
                id: `edge-${recommendation.sourceId}-${recommendation.targetId}`,
                source: recommendation.sourceId,
                target: recommendation.targetId,
                type: 'evolved',
                animated: true,
                data: {
                  connectionType: 'evolved',
                  strength: 0.5,
                  reason: recommendation.reason
                }
              };
              setEdges(prev => [...prev, newConnection]);
              break;
          }
        }
        
        // Update network health
        setEvolutionState(prev => ({
          ...prev,
          networkHealth: analysis.networkHealth,
          isEvolving: false
        }));
      }
    } catch (error) {
      console.error('Network evolution error:', error);
      setEvolutionState(prev => ({ ...prev, isEvolving: false }));
    }
  }, [nodes, edges, communicationFlows, metaLoopActive, API_BASE, spawnSpecializedNode]);

  /**
   * Handle connections between nodes
   */
  const onConnect = useCallback((connection) => {
    const newEdge = {
      ...connection,
      id: `edge-${connection.source}-${connection.target}`,
      type: 'bidirectional',
      animated: true,
      data: {
        connectionType: 'manual',
        strength: 0.7,
        messageFlow: []
      }
    };
    
    setEdges(prev => addEdge(newEdge, prev));
    
    // Initialize MetaLoop channel for new connection
    const channelId = `${connection.source}-${connection.target}`;
    const reverseChannelId = `${connection.target}-${connection.source}`;
    
    setBidirectionalChannels(prev => {
      const updated = new Map(prev);
      updated.set(channelId, {
        source: connection.source,
        target: connection.target,
        messageQueue: [],
        isActive: false,
        lastCommunication: null,
        strength: 0.7
      });
      updated.set(reverseChannelId, {
        source: connection.target,
        target: connection.source,
        messageQueue: [],
        isActive: false,
        lastCommunication: null,
        strength: 0.7
      });
      return updated;
    });
  }, []);

  /**
   * Handle node selection
   */
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  /**
   * Custom node types for the network
   */
  const nodeTypes = useMemo(() => ({
    deacNetwork: (props) => (
      <DEACNetworkNode
        {...props}
        onCommunicate={handleMetaLoopCommunication}
        onSpawnSpecialized={spawnSpecializedNode}
        communicationFlows={communicationFlows.filter(
          flow => flow.sourceId === props.id || flow.targetId === props.id
        )}
        isSelected={selectedNodeId === props.id}
        metaLoopActive={metaLoopActive}
      />
    )
  }), [handleMetaLoopCommunication, spawnSpecializedNode, communicationFlows, selectedNodeId, metaLoopActive]);

  /**
   * Custom edge types for MetaLoop connections
   */
  const edgeTypes = useMemo(() => ({
    metaLoop: ({ id, sourceX, sourceY, targetX, targetY, data }) => {
      const strength = data?.strength || 0.5;
      const isActive = bidirectionalChannels.get(`${data?.source}-${data?.target}`)?.isActive;
      
      return (
        <g>
          <path
            id={id}
            d={`M ${sourceX},${sourceY} Q ${(sourceX + targetX) / 2},${(sourceY + targetY) / 2 - 30} ${targetX},${targetY}`}
            fill="none"
            stroke={isActive ? "#7ad0ff" : "#4a9eff"}
            strokeWidth={2 + strength * 2}
            strokeOpacity={0.6 + strength * 0.4}
            className={isActive ? "metaloop-active" : "metaloop-inactive"}
          />
          {isActive && (
            <circle r="3" fill="#7ad0ff" opacity="0.8">
              <animateMotion dur="2s" repeatCount="indefinite">
                <mpath href={`#${id}`} />
              </animateMotion>
            </circle>
          )}
        </g>
      );
    },
    specialized: ({ sourceX, sourceY, targetX, targetY, data }) => (
      <path
        d={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
        fill="none"
        stroke="#ffe066"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.7"
      />
    ),
    evolved: ({ sourceX, sourceY, targetX, targetY, data }) => (
      <path
        d={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
        fill="none"
        stroke="#7affc3"
        strokeWidth="2"
        opacity="0.8"
      />
    )
  }), [bidirectionalChannels]);

  // Initialize network on mount
  useEffect(() => {
    initializePrimordialDEACs();
  }, [initializePrimordialDEACs]);

  // Auto-evolution when MetaLoop is active
  useEffect(() => {
    if (!metaLoopActive) return;
    
    const evolutionInterval = setInterval(() => {
      triggerNetworkEvolution();
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(evolutionInterval);
  }, [metaLoopActive, triggerNetworkEvolution]);

  return (
    <div className="network-deac-container">
      {/* Header */}
      <div className="network-deac-header">
        <div className="header-left">
          <FiCpu className="main-icon" />
          <div>
            <h1>DEAC Network Ecosystem</h1>
            <p>Living AI Conglomerate with Bidirectional MetaLoop Communication</p>
          </div>
        </div>
        
        <div className="header-controls">
          <div className="status-indicator">
            <div className={`status-dot ${networkStatus}`}></div>
            <span>{networkStatus}</span>
          </div>
          
          <button 
            className={`btn ${metaLoopActive ? 'btn-primary active' : 'btn-secondary'}`}
            onClick={() => setMetaLoopActive(!metaLoopActive)}
          >
            <FiZap /> MetaLoop {metaLoopActive ? 'Active' : 'Inactive'}
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => setModelWizardOpen(true)}
          >
            <FiSettings /> Model Wizard
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={triggerNetworkEvolution}
            disabled={evolutionState.isEvolving}
          >
            {evolutionState.isEvolving ? <FiRefreshCw className="spinning" /> : <FiTrendingUp />}
            Evolve Network
          </button>
        </div>
      </div>

      {/* Main Network Canvas */}
      <div className="network-canvas-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          attributionPosition="bottom-left"
        >
          <Background variant="dots" gap={20} size={1} color="#e1e5e9" />
          <Controls />
          <MiniMap 
            nodeColor="#7ad0ff"
            nodeStrokeColor="#4a9eff"
            nodeStrokeWidth={2}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          
          {/* Network Status Panel */}
          <Panel position="top-right" className="network-status-panel">
            <div className="panel-content">
              <h3><FiActivity /> Network Status</h3>
              <div className="status-grid">
                <div className="status-item">
                  <span className="label">Nodes:</span>
                  <span className="value">{nodes.length}</span>
                </div>
                <div className="status-item">
                  <span className="label">Connections:</span>
                  <span className="value">{edges.length}</span>
                </div>
                <div className="status-item">
                  <span className="label">Generations:</span>
                  <span className="value">{evolutionState.totalGenerations}</span>
                </div>
                <div className="status-item">
                  <span className="label">Health:</span>
                  <span className="value">{evolutionState.networkHealth}%</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Side Panels */}
      {showEvolutionPanel && (
        <NetworkEvolutionPanel
          evolutionState={evolutionState}
          communicationFlows={communicationFlows}
          onClose={() => setShowEvolutionPanel(false)}
        />
      )}

      {/* Model Wizard Modal */}
      {modelWizardOpen && (
        <ModelWizardPanel
          availableModels={availableModels}
          nodes={nodes}
          onCreateModel={(config) => {
            setModelGenerationQueue(prev => [...prev, config]);
          }}
          onClose={() => setModelWizardOpen(false)}
        />
      )}

      {/* MetaLoop Controller */}
      <MetaLoopController
        isActive={metaLoopActive}
        channels={bidirectionalChannels}
        onChannelInteraction={handleMetaLoopCommunication}
      />
    </div>
  );
};

export default NetworkDEAC; 