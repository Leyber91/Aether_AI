import React, { useEffect, useRef } from 'react';

/**
 * MessageFlowVisualizer Component
 * Renders a visualization of message flow between agents in MetaLoopLab
 * Implements Blueprint 3.3.3.d - Deep Observability, Introspection & Control
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.messages - List of messages to visualize
 * @param {string} props.currentStreamingAgent - Currently streaming agent (if any)
 * @param {boolean} props.running - Whether the loop is running
 * @param {Object} props.reflectorMemory - Optional reflector memory data
 * @returns {JSX.Element} - Rendered component
 */
const MessageFlowVisualizer = ({ 
  messages, 
  currentStreamingAgent, 
  running, 
  reflectorMemory 
}) => {
  const canvasRef = useRef(null);
  
  // Extract the unique agents from messages
  const getAgents = () => {
    const agentSet = new Set(messages.map(msg => msg.agent));
    return Array.from(agentSet);
  };
  
  // Get color for an agent
  const getAgentColor = (agent) => {
    if (agent === 'Agent A') return '#74d0fc';
    if (agent === 'Agent B') return '#f7b267'; 
    if (agent === 'Agent R' || agent?.includes('Reflect')) return '#9f85ff';
    if (agent?.includes('Meta')) return '#64ecaa';
    if (agent?.includes('System')) return '#aaa';
    return '#e0f0ff';
  };
  
  // Draw the flow visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const agents = getAgents();
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear the canvas
    ctx.fillStyle = '#192436';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Skip drawing if no messages or agents
    if (messages.length === 0 || agents.length === 0) {
      ctx.font = '14px Arial';
      ctx.fillStyle = '#aaa';
      ctx.textAlign = 'center';
      ctx.fillText('No message flow to visualize yet...', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    // Calculate positions for each agent
    const agentPositions = {};
    const xMargin = Math.min(canvas.width * 0.1, 50); // Adjusted margin
    const yMargin = Math.min(canvas.height * 0.1, 30); // Adjusted margin
    const agentNodeRadius = Math.min(Math.min(canvas.width, canvas.height) * 0.08, 20); // Corrected syntax

    agents.forEach((agent, index) => {
      let x, y;
      
      if (agents.length === 1) {
        x = canvas.width / 2;
        y = canvas.height / 2;
      } else if (agents.length === 2) {
        // Spread two agents horizontally
        x = xMargin + agentNodeRadius + (index * (canvas.width - 2 * xMargin - 2 * agentNodeRadius));
        y = canvas.height / 2;
      } else if (agents.length === 3) {
        // Special horizontal layout for 3 agents to maximize curve separation
        const totalWidthForNodes = canvas.width - 2 * xMargin - (agents.length * 2 * agentNodeRadius);
        const spacing = totalWidthForNodes / (agents.length - 1);
        
        x = xMargin + agentNodeRadius + (index * (2 * agentNodeRadius + spacing));
        y = canvas.height / 2; // Base vertical center

        // Vertically offset middle agent to encourage curve separation
        if (index === 1) { // Middle agent
          y = canvas.height / 2 - agentNodeRadius * 1.5; // Move up
        }
        // Optionally, could slightly offset first and third down if middle is up
        // else if (index === 0 || index === 2) {
        //   y = canvas.height / 2 + agentNodeRadius * 0.5; // Move slightly down
        // }

      } else { // Fallback to circular for > 3 agents
        const radiusX = canvas.width / 2 - xMargin - agentNodeRadius;
        const radiusY = canvas.height / 2 - yMargin - agentNodeRadius;
        const angle = (index / agents.length) * Math.PI * 2;
        x = canvas.width / 2 + Math.max(radiusX, agentNodeRadius) * Math.cos(angle);
        y = canvas.height / 2 + Math.max(radiusY, agentNodeRadius) * Math.sin(angle);
      }
      agentPositions[agent] = { x, y };
    });
    
    // Draw connections between agents (message flow)
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // No longer group connections; draw each step individually
    for (let i = 0; i < messages.length - 1; i++) {
      const sourceAgent = messages[i].agent;
      const targetAgent = messages[i+1].agent;

      const sourcePos = agentPositions[sourceAgent];
      const targetPos = agentPositions[targetAgent];

      if (!sourcePos || !targetPos) continue; // Skip if agent position is not found

      // Determine opacity based on message recency (more recent = more opaque)
      //讓最新的線條更不透明，舊的線條更透明
      const recencyFactor = (i + 1) / messages.length; // Normalized recency (0 to 1)
      const baseOpacity = 0.2;
      const maxOpacity = 0.9;
      const opacity = baseOpacity + (maxOpacity - baseOpacity) * recencyFactor;
      
      // Make line width slightly thinner for older messages
      const baseLineWidth = 1.5;
      const maxLineWidth = 3;
      const lineWidth = maxLineWidth - (maxLineWidth - baseLineWidth) * (1 - recencyFactor);

      // Dynamic curvature: alternate or vary based on index to separate lines
      // This attempts to make subsequent lines between same nodes take a slightly different path
      const baseCurvature = 0.5; // Base curvature value from previous attempt
      // Make curvature vary based on the index to avoid direct overlaps for sequential A->R, B->R, A->R
      // Example: slightly different curve for each segment. Could be (-1)^i * some_offset for control point.
      // Or, vary curvature magnitude slightly. Let's try varying magnitude.
      const curvatureVariation = (i % 3 - 1) * 0.15; // e.g., -0.15, 0, +0.15 cycling
      const dynamicCurvature = baseCurvature + curvatureVariation;

      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const normalX = -dy;
      const normalY = dx;
      
      const ctrlX = midX + normalX * dynamicCurvature;
      const ctrlY = midY + normalY * dynamicCurvature;
      
      ctx.strokeStyle = `${getAgentColor(sourceAgent)}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.quadraticCurveTo(ctrlX, ctrlY, targetPos.x, targetPos.y);
      ctx.stroke();
      
      // Draw arrowhead only for the most recent connection (or last few)
      // For simplicity, let's draw it for all, but it might get cluttered.
      // Or only for the very last one if (i === messages.length - 2)
      if (i === messages.length - 2 || recencyFactor > 0.8) { // Draw arrow for recent lines
        const arrowSize = 8;
        const angle = Math.atan2(targetPos.y - ctrlY, targetPos.x - ctrlX);
        ctx.fillStyle = ctx.strokeStyle; // Use the same color as the line for the arrow
        ctx.beginPath();
        ctx.moveTo(
          targetPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
          targetPos.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.lineTo(
          targetPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
          targetPos.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.fill();
      }
    }
    
    // Draw agent nodes
    agents.forEach(agent => {
      const pos = agentPositions[agent];
      
      // Draw node circle
      ctx.fillStyle = '#192436';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, agentNodeRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = getAgentColor(agent);
      ctx.lineWidth = 3;
      
      // Highlight current streaming agent
      if (agent === currentStreamingAgent) {
        ctx.setLineDash([5, 3]);
        ctx.lineWidth = 4;
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw agent label
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = getAgentColor(agent);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(agent, pos.x, pos.y);
      
      // Count messages from this agent
      const msgCount = messages.filter(msg => msg.agent === agent).length;
      
      // Draw message count
      ctx.font = '10px Arial';
      ctx.fillStyle = '#aaa';
      ctx.fillText(`${msgCount} msgs`, pos.x, pos.y + agentNodeRadius + 12);
    });
    
    // Draw reflector memory info if available
    if (reflectorMemory) {
      const cycleCount = reflectorMemory.loopCycles?.length || 0;
      const heuristicCount = reflectorMemory.learnedHeuristics?.length || 0;
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#9f85ff';
      ctx.textAlign = 'left';
      ctx.fillText(`Reflector Memory: ${cycleCount} cycles, ${heuristicCount} heuristics`, 10, canvas.height - 10);
    }
    
    // Running indicator
    if (running) {
      const pulseRadius = (Date.now() % 1000) / 1000 * 10 + 5;
      
      ctx.beginPath();
      ctx.arc(canvas.width - 20, 20, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(116, 208, 252, 0.3)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(canvas.width - 20, 20, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#74d0fc';
      ctx.fill();
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#74d0fc';
      ctx.textAlign = 'right';
      ctx.fillText('Running', canvas.width - 30, 24);
    }
  }, [messages, currentStreamingAgent, running, reflectorMemory]);
  
  return (
    <div className="message-flow-visualizer">
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#74d0fc',
          marginBottom: '5px'
        }}
      >
        Message Flow Visualization
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '180px',
          borderRadius: '8px',
          border: '1px solid #2b3c53',
          background: '#192436'
        }}
      />
    </div>
  );
};

export default MessageFlowVisualizer; 