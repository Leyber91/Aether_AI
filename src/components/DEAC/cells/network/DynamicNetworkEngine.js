import React, { useEffect, useRef, useState } from 'react';

/**
 * DynamicNetworkEngine - Real physics-based network visualization
 * Actual moving nodes with force-directed layout and WebSocket updates
 */
class NetworkPhysics {
  constructor(canvas, onNodeUpdate) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onNodeUpdate = onNodeUpdate;
    this.nodes = [];
    this.edges = [];
    this.running = false;
    this.mousePos = { x: 0, y: 0 };
    this.selectedNode = null;
    this.isDragging = false;
    
    // Physics constants
    this.springConstant = 0.001;
    this.repulsionConstant = 50000;
    this.damping = 0.95;
    this.centralForce = 0.0001;
    
    this.setupEventListeners();
    this.resize();
  }

  setupEventListeners() {
    // Mouse interaction
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Touch interaction for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // Resize handling
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }

  addNode(node) {
    const physicsNode = {
      ...node,
      x: node.position?.x || this.centerX + (Math.random() - 0.5) * 200,
      y: node.position?.y || this.centerY + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
      fx: 0,
      fy: 0,
      radius: this.getNodeRadius(node),
      mass: this.getNodeMass(node),
      pulsePhase: Math.random() * Math.PI * 2,
      communicationLevel: 0,
      lastActivity: Date.now()
    };
    
    this.nodes.push(physicsNode);
    return physicsNode;
  }

  addEdge(edge) {
    this.edges.push({
      ...edge,
      strength: edge.data?.strength || 0.5,
      messageCount: edge.data?.messageCount || 0,
      pulseProgress: 0,
      lastMessage: Date.now()
    });
  }

  getNodeRadius(node) {
    const baseRadius = 30;
    const typeMultiplier = node.type === 'primordial' ? 1.2 : 1.0;
    const generationBonus = (node.data?.evolutionGeneration || 0) * 3;
    return baseRadius * typeMultiplier + generationBonus;
  }

  getNodeMass(node) {
    return this.getNodeRadius(node) / 10;
  }

  updateNodes(newNodes) {
    // Update existing nodes or add new ones
    newNodes.forEach(newNode => {
      const existingNode = this.nodes.find(n => n.id === newNode.id);
      if (existingNode) {
        // Update properties but keep physics state
        Object.assign(existingNode, newNode, {
          x: existingNode.x,
          y: existingNode.y,
          vx: existingNode.vx,
          vy: existingNode.vy
        });
      } else {
        this.addNode(newNode);
      }
    });

    // Remove nodes that no longer exist
    this.nodes = this.nodes.filter(node => 
      newNodes.some(newNode => newNode.id === node.id)
    );
  }

  updateEdges(newEdges) {
    this.edges = newEdges.map(edge => {
      const existingEdge = this.edges.find(e => e.id === edge.id);
      return existingEdge ? { ...existingEdge, ...edge } : { ...edge, pulseProgress: 0 };
    });
  }

  simulateMessage(sourceId, targetId) {
    const edge = this.edges.find(e => 
      (e.source === sourceId && e.target === targetId) ||
      (e.source === targetId && e.target === sourceId)
    );
    
    if (edge) {
      edge.pulseProgress = 0;
      edge.lastMessage = Date.now();
      edge.messageCount = (edge.messageCount || 0) + 1;
    }

    // Update node communication levels
    const sourceNode = this.nodes.find(n => n.id === sourceId);
    const targetNode = this.nodes.find(n => n.id === targetId);
    
    if (sourceNode) {
      sourceNode.communicationLevel = Math.min(1, sourceNode.communicationLevel + 0.3);
      sourceNode.lastActivity = Date.now();
    }
    if (targetNode) {
      targetNode.communicationLevel = Math.min(1, targetNode.communicationLevel + 0.3);
      targetNode.lastActivity = Date.now();
    }
  }

  applyForces() {
    // Reset forces
    this.nodes.forEach(node => {
      node.fx = 0;
      node.fy = 0;
    });

    // Central attraction (keeps network centered)
    this.nodes.forEach(node => {
      const dx = this.centerX - node.x;
      const dy = this.centerY - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const force = this.centralForce * distance;
        node.fx += (dx / distance) * force;
        node.fy += (dy / distance) * force;
      }
    });

    // Node repulsion
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const node1 = this.nodes[i];
        const node2 = this.nodes[j];
        
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < 200) {
          const force = this.repulsionConstant / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          node1.fx -= fx;
          node1.fy -= fy;
          node2.fx += fx;
          node2.fy += fy;
        }
      }
    }

    // Edge springs
    this.edges.forEach(edge => {
      const sourceNode = this.nodes.find(n => n.id === edge.source);
      const targetNode = this.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetDistance = 150 + (edge.strength || 0.5) * 50;
        
        if (distance > 0) {
          const force = this.springConstant * (distance - targetDistance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          sourceNode.fx += fx;
          sourceNode.fy += fy;
          targetNode.fx -= fx;
          targetNode.fy -= fy;
        }
      }
    });
  }

  updatePhysics() {
    this.applyForces();
    
    // Update velocities and positions
    this.nodes.forEach(node => {
      if (!node.isDragging) {
        node.vx += node.fx / node.mass;
        node.vy += node.fy / node.mass;
        
        // Apply damping
        node.vx *= this.damping;
        node.vy *= this.damping;
        
        // Update positions
        node.x += node.vx;
        node.y += node.vy;
        
        // Boundary constraints
        const margin = node.radius + 10;
        node.x = Math.max(margin, Math.min(this.canvas.width - margin, node.x));
        node.y = Math.max(margin, Math.min(this.canvas.height - margin, node.y));
      }
      
      // Update pulse phase
      node.pulsePhase += 0.1;
      
      // Decay communication level
      const timeSinceActivity = Date.now() - node.lastActivity;
      node.communicationLevel = Math.max(0, node.communicationLevel - timeSinceActivity / 10000);
    });

    // Update edge animations
    this.edges.forEach(edge => {
      edge.pulseProgress += 0.02;
      if (edge.pulseProgress > 1) edge.pulseProgress = 0;
    });
  }

  getNodeColor(node) {
    const baseColors = {
      'primordial': { r: 79, g: 172, b: 254 },
      'specialized': { r: 122, g: 255, b: 195 },
      'evolved': { r: 168, g: 85, b: 247 }
    };
    
    const color = baseColors[node.type] || baseColors.specialized;
    const activity = node.communicationLevel;
    
    return {
      r: Math.min(255, color.r + activity * 100),
      g: Math.min(255, color.g + activity * 50),
      b: Math.min(255, color.b + activity * 50)
    };
  }

  drawNode(node) {
    const color = this.getNodeColor(node);
    const alpha = 0.8 + Math.sin(node.pulsePhase) * 0.2;
    
    // Node glow
    const gradient = this.ctx.createRadialGradient(
      node.x, node.y, 0,
      node.x, node.y, node.radius * 2
    );
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
    gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Node core
    this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Node border
    this.ctx.strokeStyle = `rgba(${color.r + 50}, ${color.g + 50}, ${color.b + 50}, 1)`;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Communication indicator
    if (node.communicationLevel > 0.1) {
      const commRadius = node.radius * (1 + node.communicationLevel * 0.5);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${node.communicationLevel})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, commRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // Node label
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(node.data?.name || node.id, node.x, node.y + 4);
  }

  drawEdge(edge) {
    const sourceNode = this.nodes.find(n => n.id === edge.source);
    const targetNode = this.nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;
    
    const alpha = 0.3 + (edge.strength || 0.5) * 0.5;
    const timeSinceMessage = Date.now() - (edge.lastMessage || 0);
    const messageGlow = Math.max(0, 1 - timeSinceMessage / 2000);
    
    // Edge line
    this.ctx.strokeStyle = `rgba(79, 172, 254, ${alpha + messageGlow * 0.5})`;
    this.ctx.lineWidth = 2 + messageGlow * 3;
    this.ctx.beginPath();
    this.ctx.moveTo(sourceNode.x, sourceNode.y);
    this.ctx.lineTo(targetNode.x, targetNode.y);
    this.ctx.stroke();
    
    // Message pulse
    if (edge.pulseProgress < 1 && edge.pulseProgress > 0) {
      const pulseX = sourceNode.x + (targetNode.x - sourceNode.x) * edge.pulseProgress;
      const pulseY = sourceNode.y + (targetNode.y - sourceNode.y) * edge.pulseProgress;
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.beginPath();
      this.ctx.arc(pulseX, pulseY, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw edges first
    this.edges.forEach(edge => this.drawEdge(edge));
    
    // Draw nodes
    this.nodes.forEach(node => this.drawNode(node));
  }

  start() {
    this.running = true;
    this.animate();
  }

  stop() {
    this.running = false;
  }

  animate() {
    if (!this.running) return;
    
    this.updatePhysics();
    this.draw();
    
    // Notify parent of position updates
    if (this.onNodeUpdate) {
      const nodeUpdates = this.nodes.map(node => ({
        id: node.id,
        position: { x: node.x, y: node.y }
      }));
      this.onNodeUpdate(nodeUpdates);
    }
    
    requestAnimationFrame(() => this.animate());
  }

  // Mouse interaction methods
  getNodeAt(x, y) {
    return this.nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.selectedNode = this.getNodeAt(x, y);
    if (this.selectedNode) {
      this.isDragging = true;
      this.selectedNode.isDragging = true;
      this.canvas.style.cursor = 'grabbing';
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.isDragging && this.selectedNode) {
      this.selectedNode.x = x;
      this.selectedNode.y = y;
      this.selectedNode.vx = 0;
      this.selectedNode.vy = 0;
    } else {
      const nodeAt = this.getNodeAt(x, y);
      this.canvas.style.cursor = nodeAt ? 'grab' : 'default';
    }
  }

  handleMouseUp() {
    if (this.selectedNode) {
      this.selectedNode.isDragging = false;
    }
    this.isDragging = false;
    this.selectedNode = null;
    this.canvas.style.cursor = 'default';
  }

  // Touch handlers
  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.handleMouseUp();
  }
}

const DynamicNetworkEngine = ({ 
  nodes, 
  edges, 
  onNodeClick, 
  onNodePositionUpdate,
  onCommunicate 
}) => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      engineRef.current = new NetworkPhysics(
        canvasRef.current, 
        onNodePositionUpdate
      );
      engineRef.current.start();

      return () => {
        if (engineRef.current) {
          engineRef.current.stop();
        }
      };
    }
  }, []);

  useEffect(() => {
    if (engineRef.current && nodes) {
      engineRef.current.updateNodes(nodes);
    }
  }, [nodes]);

  useEffect(() => {
    if (engineRef.current && edges) {
      engineRef.current.updateEdges(edges);
    }
  }, [edges]);

  // Method to trigger message animation
  const triggerMessage = (sourceId, targetId) => {
    if (engineRef.current) {
      engineRef.current.simulateMessage(sourceId, targetId);
    }
  };

  // Expose trigger method to parent
  useEffect(() => {
    if (onCommunicate) {
      window.deacNetworkEngine = { triggerMessage };
    }
  }, [onCommunicate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background: 'transparent'
      }}
      onClick={(e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (engineRef.current) {
          const node = engineRef.current.getNodeAt(x, y);
          if (node && onNodeClick) {
            onNodeClick(node.id);
          }
        }
      }}
    />
  );
};

export default DynamicNetworkEngine; 