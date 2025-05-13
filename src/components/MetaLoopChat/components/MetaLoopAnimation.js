import React, { useState, useEffect, useRef, memo, useLayoutEffect } from "react";

// --- OOP: AgentOrbit class encapsulates orbit logic for each agent ---
class AgentOrbit {
  constructor({ centerX, centerY, radius, color, label }) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.color = color;
    this.label = label;
  }
  // For orbiting: angle in radians (0 = right, -PI/2 = top)
  getPositionByAngle(angle) {
    return {
      x: this.centerX + Math.cos(angle) * this.radius,
      y: this.centerY + Math.sin(angle) * this.radius,
    };
  }
  // For transitions: t in [0,1], with optional easing
  getPositionByProgress(progress, easingFn = null) {
    const eased = easingFn ? easingFn(progress) : progress;
    const angle = eased * 2 * Math.PI - Math.PI / 2;
    return this.getPositionByAngle(angle);
  }
  getCenter() {
    return { x: this.centerX, y: this.centerY };
  }

  // Modular: Render the orbiting sphere for this agent
  renderOrbitingSphere({ progress, phase, easingFn, visiblePhases, r = 12, angle = null, extraProps = {} }) {
    if (!visiblePhases.includes(phase)) return null;
    const pos =
      angle !== null
        ? this.getPositionByAngle(angle)
        : this.getPositionByProgress(progress, easingFn);
    return (
      <circle
        cx={pos.x}
        cy={pos.y}
        r={r}
        fill={this.color}
        filter="url(#glow)"
        {...extraProps}
      />
    );
  }
}

/**
 * Animation component for MetaLoopLab
 * Displays the visual representation of agents communicating in a loop
 */
const MetaLoopAnimation = memo(function MetaLoopAnimation({ streamingActive, messages, running, currentStreamMsg, activeMode }) {
  // Determine if we are in reflector mode
  const isReflectorMode = activeMode === 'Self-Evolving Reflector';
  // Phases: idle, orbitA, orbitR, orbitB, transitionToA, transitionToRfromA, transitionToB, transitionToRfromB
  const [phase, setPhase] = useState('idle');
  // DEBUG: Log top-level render state for orbiting logic
  // (This will print on every render)
  // Remove after debugging

  // Track last direction for reflector phase alternation
  const lastReflectorDirection = useRef('AtoR');
  // --- Easing Functions ---
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }
  
    // Responsive agent positions and orbit radius
  const svgRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(900); // Default for SSR
  const viewBoxHeight = 340;

  // Use the actual measured width for the SVG and all calculations
  const effectiveWidth = containerWidth || 900;

  useEffect(() => {
    function handleResize() {
      if (svgRef.current) {
        setContainerWidth(svgRef.current.clientWidth || 900);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Padding as fraction of width (e.g. 10%)
  // Use fixed percentages of the viewBox for agent positions, so always centered
  const agentAX = 0.20 * effectiveWidth;
  const agentBX = 0.80 * effectiveWidth;
  const agentAY = viewBoxHeight / 2;
  const agentBY = viewBoxHeight / 2;
  // Center position for Agent R
  const agentRX = effectiveWidth / 2;
  const agentRY = viewBoxHeight / 2;
  // Orbit radius as a fraction of available width (max 1/6th of width, min 40)
  const ORBIT_RADIUS = Math.max(40, Math.min((effectiveWidth * 0.68) / 6, 80));

  // OOP: Instantiate AgentOrbit objects for each agent
  const agentAOrbit = new AgentOrbit({ centerX: agentAX, centerY: agentAY, radius: ORBIT_RADIUS, color: '#74d0fc', label: 'Agent A' });
  const agentBOrbit = new AgentOrbit({ centerX: agentBX, centerY: agentBY, radius: ORBIT_RADIUS, color: '#f7b267', label: 'Agent B' });
  const agentROrbit = new AgentOrbit({ centerX: agentRX, centerY: agentRY, radius: ORBIT_RADIUS, color: '#b474fc', label: 'Agent R' });
  // For compatibility with old code
  const agentA = { x: agentAX, y: agentAY, color: '#74d0fc', label: 'Agent A' };
  const agentB = { x: agentBX, y: agentBY, color: '#f7b267', label: 'Agent B' };
  const agentR = { x: agentRX, y: agentRY, color: '#b474fc', label: 'Agent R' };

  const [progress, setProgress] = useState(0); // 0-1
  // ORBIT_RADIUS is now responsive, see above.
  const ORBIT_DURATION = 2.5; // seconds per orbit
  const TRANSITION_DURATION = 0.9; // seconds for agent <-> agent transitions
  // Direct animation angle for Agent R - updated continuously by RAF
  const [agentRAnimationAngle, setAgentRAnimationAngle] = useState(0);
  // Setup reference for the animation loop
  const animationRunningRef = useRef(false);
  // --- Animate R orbit angle ---
  useEffect(() => {
    if (!isReflectorMode) return;
    let raf;
    let lastTime = performance.now();
    function animateR(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setAgentRAnimationAngle(a => (a + dt * (2 * Math.PI / ORBIT_DURATION)) % (2 * Math.PI));
      raf = requestAnimationFrame(animateR);
    }
    raf = requestAnimationFrame(animateR);
    return () => raf && cancelAnimationFrame(raf);
  }, [isReflectorMode, ORBIT_DURATION]);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  const prevStreamingActive = useRef(false);
  const prevMessagesLength = useRef(messages.length);
  const animationRef = useRef({ raf: null, last: null });

  // Phase Determination Effect
  // Only count finalized messages (exclude pending node)
  const finalizedMessages = messages.filter(m => !m.__pending);
  
  useEffect(() => {
    const currentMessagesLength = finalizedMessages.length;
    // DEBUG: Log relevant props and phase change triggers
    // console.log('[MetaLoopAnimation] running:', running, 'streamingActive:', streamingActive, 'phase:', phase, 'messages.length:', currentMessagesLength);

    if (!running) {
      if (phase !== 'idle') {
        // console.log('[MetaLoopAnimation] Animation stopped, switching to idle phase');
        setPhase('idle');
      }
      prevStreamingActive.current = false;
      prevMessagesLength.current = currentMessagesLength;
      return;
    }

    const startedStreaming = streamingActive && !prevStreamingActive.current;
    const stoppedStreaming = !streamingActive && prevStreamingActive.current;

    // Direct fix for initialization: If we're in reflector mode and streaming has just started
    // and we're in idle phase, immediately set a phase based on current agent
    if (isReflectorMode && phase === 'idle' && currentStreamMsg) {
      const agent = currentStreamMsg.agent;
      if (agent === 'Agent R') {
        setPhase('orbitR');
        setProgress(0);
        // Animation is running continuously, no need to start it
      } else if (agent === 'Agent A') {
        setPhase('orbitA');
        setProgress(0);
      } else if (agent === 'Agent B') {
        setPhase('orbitB');
        setProgress(0);
      }
    }
    
    // FIX #1: Only apply startedStreaming logic in standard mode, never in reflector mode
    if (!isReflectorMode) {
      if (startedStreaming) {
        const nextAgentIsA = currentMessagesLength % 2 === 0;
        const transitionPhase = nextAgentIsA ? 'transitionToA' : 'transitionToB';
        // console.log(`[MetaLoopAnimation] Streaming started. Transition phase: ${transitionPhase}`);
        setPhase(transitionPhase);
        setProgress(0); // Reset progress for new transition
      } else if (stoppedStreaming) {
        if (phase !== 'idle') {
          // console.log('[MetaLoopAnimation] Streaming stopped. Switching to idle phase');
          setPhase('idle');
          setProgress(0);
        }
      }
    } else {
      // In reflector mode, only handle idle state when streaming stops
      if (stoppedStreaming) {
        if (phase !== 'idle') {
          setPhase('idle');
          setProgress(0);
        }
      }
      // IMPORTANT: Do NOT set phase on startedStreaming in reflector mode
      // This allows the agent-specific effects to handle transitions properly
    }

    prevStreamingActive.current = streamingActive;
    prevMessagesLength.current = currentMessagesLength;
  }, [running, streamingActive, finalizedMessages.length, phase, isReflectorMode]); // Depend on finalizedMessages.length

  // --- NEW: Synchronize orbit phase with current streaming agent ---
  // Track previous streaming agent
  const prevStreamAgentRef = useRef(null);
  useEffect(() => {
    if (!running || !streamingActive) return;

    // If Agent R becomes the current agent and we're not already orbiting R, force phase
    if (isReflectorMode && currentStreamMsg && currentStreamMsg.agent === 'Agent R' && phase !== 'orbitR') {
      console.log('[MetaLoopAnimation] FORCE orbitR:', { currentStreamMsg, phase });
      setPhase('orbitR');
      setProgress(0);
      return;
    }

    const prevAgent = prevStreamAgentRef.current;
    const nextAgent = currentStreamMsg && currentStreamMsg.agent;
    
    // If no agent info or already in transition, just update ref and return
    if (!nextAgent || phase.startsWith('transition')) {
      prevStreamAgentRef.current = nextAgent;
      return;
    }
    
    // FIX #2: Improved transition animation logic between agents
    if (isReflectorMode) {
      if (prevAgent !== nextAgent) {
        // Determine transition phase based on agent change
        if (prevAgent === 'Agent A' && nextAgent === 'Agent R') {
          setPhase('transitionToRfromA');
          setProgress(0);
        } else if (prevAgent === 'Agent R' && nextAgent === 'Agent B') {
          setPhase('transitionToB');
          // The dedicated Agent R animation will be stopped automatically
          setProgress(0);
        } else if (prevAgent === 'Agent B' && nextAgent === 'Agent R') {
          setPhase('transitionToRfromB');
          setProgress(0);
        } else if (prevAgent === 'Agent R' && nextAgent === 'Agent A') {
          setPhase('transitionToA');
          // The dedicated Agent R animation will be stopped automatically
          setProgress(0);
        } else if (prevAgent === null) {
          // FIX #4: Improved animation initialization in reflector mode
          // At the very start, determine the correct initial transition based on message pattern
          // (A → R → B → R ...)
          const lastIdx = finalizedMessages.length % 4;
          if (nextAgent === 'Agent A') {
            // If starting with A, either come from R or just orbit
            if (lastIdx === 3) {
              setPhase('transitionToA');
              setProgress(0);
            } else {
              // Start directly in orbit if it's the first message
              setPhase('orbitA');
              setProgress(0);
            }
          } else if (nextAgent === 'Agent R') {
            if (lastIdx === 0) {
              // R after A
              setPhase('transitionToRfromA');
              setProgress(0);
            } else if (lastIdx === 2) {
              // R after B
              setPhase('transitionToRfromB');
              setProgress(0);
            } else {
              // Start directly in orbit if it's the initial state
              setPhase('orbitR');
              setProgress(0);
            }
          } else if (nextAgent === 'Agent B') {
            if (lastIdx === 1) {
              setPhase('transitionToB');
              setProgress(0);
            } else {
              // Start directly in orbit if it's the initial state
              setPhase('orbitB');
              setProgress(0);
            }
          }
        }
      } else {
        // If agent hasn't changed but we're in the wrong orbit phase, correct it
        if ((nextAgent === 'Agent A' && phase !== 'orbitA') ||
            (nextAgent === 'Agent R' && phase !== 'orbitR') ||
            (nextAgent === 'Agent B' && phase !== 'orbitB')) {
          // Only set orbit if not already in correct orbit
          setPhase(`orbit${nextAgent.slice(-1)}`);
          setProgress(0);
        }
      }
    } else {
      // Standard mode (A <-> B only)
      if (prevAgent !== nextAgent) {
        if (prevAgent === 'Agent A' && nextAgent === 'Agent B') {
          setPhase('transitionToB');
          setProgress(0);
        } else if ((prevAgent === 'Agent B' && nextAgent === 'Agent A') || prevAgent == null) {
          setPhase('transitionToA');
          setProgress(0);
        }
      } else {
        if ((nextAgent === 'Agent A' && phase !== 'orbitA') ||
            (nextAgent === 'Agent B' && phase !== 'orbitB')) {
          setPhase(`orbit${nextAgent.slice(-1)}`);
          setProgress(0);
        }
      }
    }
    
    prevStreamAgentRef.current = nextAgent;
  }, [currentStreamMsg, streamingActive, running, phase, isReflectorMode, finalizedMessages.length]);

  // Animation Loop Effect
  // SIMPLIFIED approach: Global animation loop that runs continuously once started
  useLayoutEffect(() => {
    // Define animation function
    function animationLoop(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;
      
      // Update Agent R animation angle - continuous orbit
      const angle = (elapsed % ORBIT_DURATION) / ORBIT_DURATION * 2 * Math.PI - Math.PI / 2;
      setAgentRAnimationAngle(angle);
      if (phase === 'orbitR') {
        console.log('[MetaLoopAnimation] Agent R Animation Loop: angle', angle);
      }
      
      // Continue the loop
      rafRef.current = requestAnimationFrame(animationLoop);
    }
    
    // Start animation loop if not running
    if (!animationRunningRef.current) {
      animationRunningRef.current = true;
      rafRef.current = requestAnimationFrame(animationLoop);
    }
    
    // Cleanup function
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      animationRunningRef.current = false;
    };
  }, [ORBIT_DURATION]);

  // Main animation loop effect
  useEffect(() => {
    // Force animation to start if we're in a valid phase but not yet running
    if (streamingActive && running && phase !== 'idle' && !animationRef.current.raf) {
      // This forces animation to start immediately when streaming begins
      animationRef.current.last = performance.now();
      animationRef.current.raf = requestAnimationFrame(tick);
    }
    
    if (phase === 'idle' || !running) { // Stop animation if idle or not running
      if (animationRef.current.raf) { 
        cancelAnimationFrame(animationRef.current.raf); 
        animationRef.current.raf = null; 
        animationRef.current.last = null; 
      }
      // console.log('[Anim Loop] STOPPED (Idle or Not Running)');
      return;
    }

    // console.log(`[Anim Loop] START/CONTINUE - Phase: ${phase}`);
    animationRef.current.last = performance.now();

    function tick(now) {
      const dt = (now - (animationRef.current.last || now)) / 1000;
      animationRef.current.last = now;

      setProgress(prev => {
        let duration = ORBIT_DURATION;
        if (phase.startsWith('transition')) duration = TRANSITION_DURATION;

        let nextProgress = prev + dt / duration;
        
        // Special handling for orbit phases
        if (isReflectorMode && phase === 'orbitR') {
          // For Agent R, let the separate animation handle it
          // Just keep progress at a reasonable value but don't advance it
          return 0.5; // Keep a constant progress value for orbitR
        }

        if (nextProgress >= 1) {
          // Phase transition logic when animation completes
          if (isReflectorMode) {
            if (phase === 'transitionToA') {
              setPhase('orbitA');
              return 0;
            } else if (phase === 'transitionToRfromA') {
              setPhase('orbitR');
              setProgress(0); // Ensure progress is reset
              // Animation is running continuously, no need to start it
              lastReflectorDirection.current = 'AtoR';
              return 0;
            } else if (phase === 'transitionToB') {
              setPhase('orbitB');
              return 0;
            } else if (phase === 'transitionToRfromB') {
              setPhase('orbitR');
              setProgress(0); // Ensure progress is reset
              // Animation is running continuously, no need to start it
              lastReflectorDirection.current = 'BtoR';
              return 0;
            } else if (phase === 'orbitR') {
              // Only advance from orbitR if the current agent is no longer Agent R
              if (currentStreamMsg && currentStreamMsg.agent !== 'Agent R') {
                if (lastReflectorDirection.current === 'AtoR') {
                  setPhase('transitionToBfromR');
                  return 0;
                } else if (lastReflectorDirection.current === 'BtoR') {
                  setPhase('transitionToAfromR');
                  return 0;
                }
              }
              // If Agent R is still active, keep orbiting
              // Return 0 to reset progress and stay in orbit
              return 0;
            }
          } else {
            if (phase === 'transitionToA') {
              setPhase('orbitA');
              return 0;
            } else if (phase === 'transitionToB') {
              setPhase('orbitB');
              return 0;
            }
          }
          return 0;
        }
            
        if (phase === 'transitionToA') {
          // console.log(`[MetaLoopAnimation] phase: ${phase}, progress:`, nextProgress.toFixed(2));
        }
        return nextProgress;
      });
      animationRef.current.raf = requestAnimationFrame(tick);
    }
    
    animationRef.current.raf = requestAnimationFrame(tick);
    return () => { 
      if (animationRef.current.raf) cancelAnimationFrame(animationRef.current.raf); 
    };
  }, [phase, running, streamingActive]); // React to phase, running, and check streamingActive on transition end

  // Calculate ball position based on phase
  // --- Trail State ---
  const [trail, setTrail] = useState([]); // [{x, y, opacity}]
  const TRAIL_LENGTH = 16;
  let x, y, activeAgentColor = '#888';
  let orbitingAgentX = agentA.x, orbitingAgentY = agentA.y; // Default for glow effect

  if (phase === 'orbitA') {
    orbitingAgentX = agentAOrbit.centerX; orbitingAgentY = agentAOrbit.centerY; activeAgentColor = agentAOrbit.color;
    const pos = agentAOrbit.getPositionByProgress(progress, easeInOutCubic);
    x = pos.x; y = pos.y;
  } else if (phase === 'orbitR') {
  }

  // --- Update Trail ---
  useEffect(() => {
    if (phase === 'idle') {
      setTrail([]);
      return;
    }
    setTrail(prev => {
      const next = [...prev, { x, y, opacity: 1 }];
      while (next.length > TRAIL_LENGTH) next.shift();
      // Fade opacities
      return next.map((pt, idx) => ({ ...pt, opacity: (idx + 1) / next.length * 0.7 }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y, phase]);

  return (
    <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${effectiveWidth} ${viewBoxHeight}`} preserveAspectRatio="xMidYMid meet" style={{ background: 'rgba(24,34,54,0.93)', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(74,211,250,0.15)', display: 'block', width: '100%', height: '100%' }}>
      <defs>
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="coloredBlur"/>
          <feComposite in="SourceGraphic" in2="coloredBlur" operator="over" />
        </filter>
        {/* Agent gradients */}
        <radialGradient id="agentAGradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
          <stop offset="30%" stopColor="#74d0fc" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#74d0fc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="agentBGradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
          <stop offset="30%" stopColor="#f7b267" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#f7b267" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background circles */}
      {/* Agent A */}
      <circle cx={agentA.x} cy={agentA.y} r={phase === 'orbitA' || phase === 'transitionToB' ? 44 : 38} fill="url(#agentAGradient)" fillOpacity={phase === 'orbitA' ? 0.22 : 0.14} stroke={agentA.color} strokeWidth={phase === 'orbitA' ? 5 : 2.5} strokeOpacity={phase === 'orbitA' ? 1 : 0.6} filter={phase === 'orbitA' ? 'url(#glow)' : undefined} style={{ transition: 'r 0.25s, fill-opacity 0.25s, stroke-width 0.25s' }} />
      <circle cx={agentA.x} cy={agentA.y} r={28} fill="#0a121e" fillOpacity={0.6} stroke={agentA.color} strokeWidth={2} />
      <text x={agentA.x} y={agentA.y + 7} textAnchor="middle" fontSize="1.3em" fill={agentA.color} fontWeight="bold" opacity={phase === 'orbitA' || phase === 'transitionToB' ? 1 : 0.7}>{agentA.label}</text>
      {/* Agent R (Reflector) - only show in reflector mode */}
      {isReflectorMode && (
        <g>
          <circle cx={agentR.x} cy={agentR.y} r={38} fill="#1c0a2e" fillOpacity={0.58} stroke={agentR.color} strokeWidth={4} strokeOpacity={0.85} filter="url(#glow)" />
          <circle cx={agentR.x} cy={agentR.y} r={28} fill="#0a121e" fillOpacity={0.7} stroke={agentR.color} strokeWidth={2} />
          <text x={agentR.x} y={agentR.y + 7} textAnchor="middle" fontSize="1.3em" fill={agentR.color} fontWeight="bold" opacity={1}>{agentR.label}</text>
        </g>
      )}
      {/* Agent B */}
      <circle cx={agentB.x} cy={agentB.y} r={phase === 'orbitB' || phase === 'transitionToA' ? 44 : 38} fill="url(#agentBGradient)" fillOpacity={phase === 'orbitB' ? 0.22 : 0.14} stroke={agentB.color} strokeWidth={phase === 'orbitB' ? 5 : 2.5} strokeOpacity={phase === 'orbitB' ? 1 : 0.6} filter={phase === 'orbitB' ? 'url(#glow)' : undefined} style={{ transition: 'r 0.25s, fill-opacity 0.25s, stroke-width 0.25s' }} />
      <circle cx={agentB.x} cy={agentB.y} r={28} fill="#0a121e" fillOpacity={0.6} stroke={agentB.color} strokeWidth={2} />
      <text x={agentB.x} y={agentB.y + 7} textAnchor="middle" fontSize="1.3em" fill={agentB.color} fontWeight="bold" opacity={phase === 'orbitB' || phase === 'transitionToA' ? 1 : 0.7}>{agentB.label}</text>
      
      {/* Message Nodes Row */}
      {messages.length > 0 && (
        <g>
          {/* Draw lines between consecutive message nodes */}
          {messages.length > 1 && messages.map((msg, idx) => {
            if (idx === 0) return null;
             if (isReflectorMode) {
              // Three-agent mode (A-R-B-R)
              const nodeOrder = [agentAOrbit, agentROrbit, agentBOrbit, agentROrbit];
              const getNode = i => nodeOrder[i % 4];
              const x1 = getNode(idx - 1).centerX;
              const y1 = getNode(idx - 1).centerY + 80;
              const x2 = getNode(idx).centerX;
              const y2 = getNode(idx).centerY + 80;
              const prevColor = messages[idx - 1].agent === 'Agent A' ? agentAOrbit.color : messages[idx - 1].agent === 'Agent B' ? agentBOrbit.color : agentROrbit.color;
              return (
                <line key={`line-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${prevColor}55`} strokeWidth={2} />
              );
            } else {
              // Standard two-agent mode
              const total = messages.length;
              const frac1 = total === 1 ? 0.5 : (idx - 1) / (total - 1);
              const frac2 = total === 1 ? 0.5 : idx / (total - 1);
              const x1 = agentAOrbit.centerX + frac1 * (agentBOrbit.centerX - agentAOrbit.centerX);
              const x2 = agentAOrbit.centerX + frac2 * (agentBOrbit.centerX - agentAOrbit.centerX);
              const y1 = agentAOrbit.centerY + 80;
              const y2 = y1;
              const prevColor = messages[idx - 1].agent === 'Agent A' ? agentAOrbit.color : agentBOrbit.color;
              return (
                <line key={`line-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${prevColor}55`} strokeWidth={1.5} />
              );
            }
          })}
          {/* Message nodes themselves */}
          {messages.map((msg, idx) => {
             if (isReflectorMode) {
              // Three-agent mode
              const nodeOrder = [agentAOrbit, agentROrbit, agentBOrbit, agentROrbit];
              const getNode = i => nodeOrder[i % 4];
              const nodeX = getNode(idx).centerX;
              const nodeY = getNode(idx).centerY + 80;
              const color = msg.agent === 'Agent A' ? agentAOrbit.color : msg.agent === 'Agent B' ? agentBOrbit.color : agentROrbit.color;
              const isActive = currentStreamMsg && (msg.agent === currentStreamMsg.agent && msg.model === currentStreamMsg.model && msg.text === currentStreamMsg.text);
              const isPending = msg.__pending;
              return (
                <g key={`node-${idx}`}>
                  {isPending ? (
                    <g>
                      <circle cx={nodeX} cy={nodeY} r={10} fill={color} fillOpacity={0.45} stroke="#fff" strokeWidth={2} opacity={0.65} />
                      {/* SVG Spinner */}
                      <circle cx={nodeX} cy={nodeY} r={13} fill="none" stroke={color} strokeWidth={2} strokeDasharray="10 12" strokeLinecap="round" opacity={0.7}>
                        <animateTransform attributeName="transform" type="rotate" from={`0 ${nodeX} ${nodeY}`} to={`360 ${nodeX} ${nodeY}`} dur="0.9s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  ) : (
                    <circle cx={nodeX} cy={nodeY} r={10} fill={color} stroke="#fff" strokeWidth={2} opacity={0.93} />
                  )}
                  <text x={nodeX} y={nodeY + 25} textAnchor="middle" fontSize="0.8em" fill={color} opacity={0.8}>
                    {`${msg.agent} ${isPending ? '...' : `(step ${idx + 1})`}`}
                  </text>
                </g>
              );
            } else {
              // Standard two-agent mode
              const total = messages.length;
              const frac = total === 1 ? 0.5 : idx / (total - 1);
              const nodeX = agentAOrbit.centerX + frac * (agentBOrbit.centerX - agentAOrbit.centerX);
              const nodeY = agentAOrbit.centerY + 80;
              const color = msg.agent === 'Agent A' ? agentAOrbit.color : agentBOrbit.color;
              const isActive = currentStreamMsg && (msg.agent === currentStreamMsg.agent && msg.model === currentStreamMsg.model && msg.text === currentStreamMsg.text);
              const isPending = msg.__pending;
              return (
                <g key={`node-${idx}`}>
                  {isPending ? (
                    <g>
                      <circle cx={nodeX} cy={nodeY} r={10} fill={color} fillOpacity={0.45} stroke="#fff" strokeWidth={2} opacity={0.65} />
                      <circle cx={nodeX} cy={nodeY} r={13} fill="none" stroke={color} strokeWidth={2} strokeDasharray="10 12" strokeLinecap="round" opacity={0.7}>
                        <animateTransform attributeName="transform" type="rotate" from={`0 ${nodeX} ${nodeY}`} to={`360 ${nodeX} ${nodeY}`} dur="0.9s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  ) : (
                    <circle cx={nodeX} cy={nodeY} r={10} fill={color} stroke="#fff" strokeWidth={2} opacity={0.93} />
                  )}
                  <text x={nodeX} y={nodeY + 25} textAnchor="middle" fontSize="0.8em" fill={color} opacity={0.8}>
                    {`${msg.agent} ${isPending ? '...' : `(step ${idx + 1})`}`}
                  </text>
                </g>
              );
            }
          })}
        </g>
      )}
      
      {/* Orbit path indicators */}
      <circle cx={agentAOrbit.centerX} cy={agentAOrbit.centerY} r={agentAOrbit.radius} fill="transparent" stroke={agentAOrbit.color} strokeWidth={1.5} strokeDasharray="3,3" opacity={(phase === 'orbitA' || phase === 'transitionToB') ? 0.6 : 0.2} />
      {isReflectorMode && (
        <circle cx={agentROrbit.centerX} cy={agentROrbit.centerY} r={agentROrbit.radius} fill="transparent" stroke={agentROrbit.color} strokeWidth={1.5} strokeDasharray="3,3" opacity={(phase === 'orbitR' || phase === 'transitionToRfromA' || phase === 'transitionToRfromB') ? 0.6 : 0.2} />
      )}
      <circle cx={agentBOrbit.centerX} cy={agentBOrbit.centerY} r={agentBOrbit.radius} fill="transparent" stroke={agentBOrbit.color} strokeWidth={1.5} strokeDasharray="3,3" opacity={(phase === 'orbitB' || phase === 'transitionToA') ? 0.6 : 0.2} />
      {isReflectorMode && Array.from({ length: 12 }).map((_, i) => {
        // Animate the dots by adding the global animated angle
        const angle = agentRAnimationAngle + (i / 12) * 2 * Math.PI - Math.PI / 2;
        const pos = agentROrbit.getPositionByAngle(angle);
        return (
          <circle
            key={'r-orbit-dot-' + i}
            cx={pos.x}
            cy={pos.y}
            r={6}
            fill={agentROrbit.color}
            fillOpacity={0.18}
            filter="url(#glow)"
          />
        );
      })}
      {/* Modular: Orbiting sphere for A, B, or R */}
      {agentAOrbit.renderOrbitingSphere({ progress, phase, easingFn: easeInOutCubic, visiblePhases: ['orbitA'] })}
      {agentBOrbit.renderOrbitingSphere({ progress, phase, easingFn: easeInOutCubic, visiblePhases: ['orbitB'] })}
      {agentROrbit.renderOrbitingSphere({ angle: agentRAnimationAngle, phase, visiblePhases: ['orbitR'] })}
      
      {/* Trail */}
      {trail.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={13 - (trail.length - i) * 0.7} fill="#fff" fillOpacity={pt.opacity * 0.5} filter="url(#glow)" />
      ))}
      
      {/* Main floating ball that moves between agents */}
      {isReflectorMode ? (
        <g>
          {(() => {
            if (phase === 'orbitR') {
              console.log('[MetaLoopAnimation] ORBITR CIRCLE', { x, y, agentRAnimationAngle, phase });
            }
            return null;
          })()}
          <circle cx={x} cy={y} r={15 + (phase !== 'idle' ? 2 * Math.abs(Math.sin(progress * Math.PI * 2)) : 0)} fill={phase === 'orbitA' || phase === 'transitionToA' ? '#74d0fc' : phase === 'orbitB' || phase === 'transitionToB' ? '#f7b267' : phase === 'orbitR' || phase === 'transitionToRfromA' || phase === 'transitionToRfromB' ? '#b474fc' : '#fff'} fillOpacity={phase !== 'idle' ? 0.97 : 0.6} stroke={phase === 'orbitA' || phase === 'transitionToA' ? '#74d0fc' : phase === 'orbitB' || phase === 'transitionToB' ? '#f7b267' : phase === 'orbitR' || phase === 'transitionToRfromA' || phase === 'transitionToRfromB' ? '#b474fc' : activeAgentColor} strokeWidth={phase !== 'idle' ? 4.5 : 1} strokeOpacity={phase !== 'idle' ? 1 : 0.5} filter="url(#glow)" />
          {/* Special pulse/glow when orbiting Agent R */}
          {(phase === 'orbitR') && (
            <circle cx={agentR.x} cy={agentR.y} r={50 + 8 * Math.abs(Math.sin(progress * Math.PI * 2))} fill="none" stroke="#b474fc" strokeWidth="3.5" strokeOpacity={0.36 + 0.18 * Math.abs(Math.sin(progress * Math.PI * 2))} filter="url(#glow)" />
          )}
          {/* Particle burst/shockwave when arriving at agent */}
          {(phase === 'transitionToA' && progress > 0.97) && Array.from({ length: 14 }).map((_, i) => (
            <circle key={'burstA' + i} cx={agentA.x + ORBIT_RADIUS * Math.cos((i / 14) * 2 * Math.PI)} cy={agentA.y + ORBIT_RADIUS * Math.sin((i / 14) * 2 * Math.PI)} r={5 + 3 * Math.random()} fill="#74d0fc" fillOpacity={0.22 + 0.22 * Math.random()} filter="url(#glow)" />
          ))}
          {(phase === 'transitionToB' && progress > 0.97) && Array.from({ length: 14 }).map((_, i) => (
            <circle key={'burstB' + i} cx={agentB.x + ORBIT_RADIUS * Math.cos((i / 14) * 2 * Math.PI)} cy={agentB.y + ORBIT_RADIUS * Math.sin((i / 14) * 2 * Math.PI)} r={5 + 3 * Math.random()} fill="#f7b267" fillOpacity={0.22 + 0.22 * Math.random()} filter="url(#glow)" />
          ))}
          {(phase === 'transitionToRfromA' && progress > 0.97) && Array.from({ length: 14 }).map((_, i) => (
            <circle key={'burstRfromA' + i} cx={agentR.x + ORBIT_RADIUS * Math.cos((i / 14) * 2 * Math.PI)} cy={agentR.y + ORBIT_RADIUS * Math.sin((i / 14) * 2 * Math.PI)} r={5 + 3 * Math.random()} fill="#b474fc" fillOpacity={0.22 + 0.22 * Math.random()} filter="url(#glow)" />
          ))}
          {(phase === 'transitionToRfromB' && progress > 0.97) && Array.from({ length: 14 }).map((_, i) => (
            <circle key={'burstRfromB' + i} cx={agentR.x + ORBIT_RADIUS * Math.cos((i / 14) * 2 * Math.PI)} cy={agentR.y + ORBIT_RADIUS * Math.sin((i / 14) * 2 * Math.PI)} r={5 + 3 * Math.random()} fill="#b474fc" fillOpacity={0.22 + 0.22 * Math.random()} filter="url(#glow)" />
          ))}
          {/* Animated agent glow ring */}
          {(phase === 'orbitA' || phase === 'orbitB' || phase === 'orbitR' || phase === 'transitionToA' || phase === 'transitionToB' || phase === 'transitionToRfromA' || phase === 'transitionToRfromB') && (
            <circle cx={orbitingAgentX} cy={orbitingAgentY} r={45 + 2 * Math.abs(Math.sin(progress * Math.PI))} fill="transparent" stroke={activeAgentColor} strokeWidth="2" strokeOpacity="0.4" filter="url(#glow)" />
          )}
        </g>
      ) : (
        <g>
          <circle
            cx={x}
            cy={y}
            r={15 + (phase !== 'idle' ? 2 * Math.abs(Math.sin(progress * Math.PI * 2)) : 0)}
            fill={
              phase === 'orbitA' || phase === 'transitionToA' ? '#74d0fc' :
              phase === 'orbitB' || phase === 'transitionToB' ? '#f7b267' :
              phase === 'orbitR' || phase === 'transitionToRfromA' || phase === 'transitionToRfromB' ? '#b474fc' :
              '#fff'
            }
            fillOpacity={phase !== 'idle' ? 0.97 : 0.6}
            stroke={
              phase === 'orbitA' || phase === 'transitionToA' ? '#74d0fc' :
              phase === 'orbitB' || phase === 'transitionToB' ? '#f7b267' :
              phase === 'orbitR' || phase === 'transitionToRfromA' || phase === 'transitionToRfromB' ? '#b474fc' :
              activeAgentColor
            }
            strokeWidth={phase !== 'idle' ? 4.5 : 1}
            strokeOpacity={phase !== 'idle' ? 1 : 0.5}
            filter="url(#glow)"
          />
          {/* Particle burst/shockwave when arriving at agent (A/B only) */}
          {(phase === 'transitionToA' && progress > 0.97) && Array.from({ length: 14 }).map((_, i) => (
            <circle key={'burstA' + i} cx={agentA.x + ORBIT_RADIUS * Math.cos((i / 14) * 2 * Math.PI)} cy={agentA.y + ORBIT_RADIUS * Math.sin((i / 14) * 2 * Math.PI)} r={5 + 3 * Math.random()} fill="#74d0fc" fillOpacity={0.22 + 0.22 * Math.random()} filter="url(#glow)" />
          ))}
          {(phase === 'transitionToB' && progress > 0.97) && Array.from({ length: 14 }).map((_, i) => (
            <circle key={'burstB' + i} cx={agentB.x + ORBIT_RADIUS * Math.cos((i / 14) * 2 * Math.PI)} cy={agentB.y + ORBIT_RADIUS * Math.sin((i / 14) * 2 * Math.PI)} r={5 + 3 * Math.random()} fill="#f7b267" fillOpacity={0.22 + 0.22 * Math.random()} filter="url(#glow)" />
          ))}
          {/* Animated agent glow ring (A/B only) */}
          {(phase === 'orbitA' || phase === 'orbitB' || phase === 'transitionToA' || phase === 'transitionToB') && (
            <circle cx={orbitingAgentX} cy={orbitingAgentY} r={45 + 2 * Math.abs(Math.sin(progress * Math.PI))} fill="transparent" stroke={activeAgentColor} strokeWidth="2" strokeOpacity="0.4" filter="url(#glow)" />
          )}
        </g>
      )}
    </svg>
  );
});

export default MetaLoopAnimation;
