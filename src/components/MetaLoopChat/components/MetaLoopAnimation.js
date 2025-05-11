import React, { useState, useEffect, useRef, memo } from "react";

/**
 * Animation component for MetaLoopLab
 * Displays the visual representation of agents communicating in a loop
 */
const MetaLoopAnimation = memo(function MetaLoopAnimation({ streamingActive, messages, running, currentStreamMsg }) {
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
  // Orbit radius as a fraction of available width (max 1/6th of width, min 40)
  const ORBIT_RADIUS = Math.max(40, Math.min((effectiveWidth * 0.68) / 6, 80));

  const agentA = { x: agentAX, y: agentAY, color: '#74d0fc', label: 'Agent A' };
  const agentB = { x: agentBX, y: agentBY, color: '#f7b267', label: 'Agent B' };


  
  // Phases: idle, orbitA, orbitB, transitionToA, transitionToB
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0); // 0-1
  // ORBIT_RADIUS is now responsive, see above.
  const ORBIT_DURATION = 2.5; // seconds per orbit
  const TRANSITION_DURATION = 0.9; // seconds for A <-> B transition

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

    prevStreamingActive.current = streamingActive;
    prevMessagesLength.current = currentMessagesLength;
  }, [running, streamingActive, finalizedMessages.length, phase]); // Depend on finalizedMessages.length

  // --- NEW: Alternate phase based on finalizedMessages.length ---
  useEffect(() => {
    if (!running || !streamingActive) return;
    // Don't interrupt transitions already in progress
    if (phase === 'transitionToA' || phase === 'transitionToB') return;
    // Decide which agent should be active based on parity
    if (finalizedMessages.length % 2 === 0) {
      if (phase !== 'orbitA') {
        // console.log('[MetaLoopAnimation] Switching to Agent A (orbitA)');
        setPhase('transitionToA');
        setProgress(0);
      }
    } else {
      if (phase !== 'orbitB') {
        // console.log('[MetaLoopAnimation] Switching to Agent B (orbitB)');
        setPhase('transitionToB');
        setProgress(0);
      }
    }
  }, [finalizedMessages.length, running, streamingActive, phase]);

  // Animation Loop Effect
  useEffect(() => {
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
        if (phase === 'transitionToA' || phase === 'transitionToB') duration = TRANSITION_DURATION;

        let nextProgress = prev + dt / duration;

        if (nextProgress >= 1) {
          // DEBUG: Log phase completion
          if (phase === 'transitionToA') {
            // console.log('[MetaLoopAnimation] transitionToA complete. Next phase:', streamingActive ? 'orbitA' : 'idle');
            setPhase(streamingActive ? 'orbitA' : 'idle');
            return 0;
          } else if (phase === 'transitionToB') {
            // console.log('[MetaLoopAnimation] transitionToB complete. Next phase:', streamingActive ? 'orbitB' : 'idle');
            setPhase(streamingActive ? 'orbitB' : 'idle');
            return 0;
          } else if (phase === 'orbitA' || phase === 'orbitB') {
            // console.log(`[MetaLoopAnimation] ${phase} orbit complete. Looping.`);
            return 0;
          }
          return 0;
        }
        // Only log occasionally to avoid spam
        if (Math.abs(nextProgress - Math.round(nextProgress * 10) / 10) < 0.01) {
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
    orbitingAgentX = agentA.x; orbitingAgentY = agentA.y; activeAgentColor = agentA.color;
    const angle = easeInOutCubic(progress) * 2 * Math.PI - Math.PI / 2;
    x = orbitingAgentX + Math.cos(angle) * ORBIT_RADIUS;
    y = orbitingAgentY + Math.sin(angle) * ORBIT_RADIUS;
  } else if (phase === 'orbitB') {
    orbitingAgentX = agentB.x; orbitingAgentY = agentB.y; activeAgentColor = agentB.color;
    const angle = easeInOutCubic(progress) * 2 * Math.PI - Math.PI / 2;
    x = orbitingAgentX + Math.cos(angle) * ORBIT_RADIUS;
    y = orbitingAgentY + Math.sin(angle) * ORBIT_RADIUS;
  } else if (phase === 'transitionToA') { // Moving B -> A
    const startX = agentB.x + ORBIT_RADIUS; const startY = agentB.y;
    const endX = agentA.x + ORBIT_RADIUS; const endY = agentA.y;
    const controlX = (agentB.x + agentA.x) / 2; const controlY = Math.min(agentB.y, agentA.y) - 80;
    const t = easeInOutSine(progress);
    x = (1 - t) ** 2 * startX + 2 * (1 - t) * t * controlX + t ** 2 * endX;
    y = (1 - t) ** 2 * startY + 2 * (1 - t) * t * controlY + t ** 2 * endY;
    activeAgentColor = agentB.color; // Color of the sender
    orbitingAgentX = agentB.x; orbitingAgentY = agentB.y; // Glow around sender
  } else if (phase === 'transitionToB') { // Moving A -> B
    const startX = agentA.x + ORBIT_RADIUS; const startY = agentA.y;
    const endX = agentB.x + ORBIT_RADIUS; const endY = agentB.y;
    const controlX = (agentA.x + agentB.x) / 2; const controlY = Math.min(agentA.y, agentB.y) - 80;
    const t = easeInOutSine(progress);
    x = (1 - t) ** 2 * startX + 2 * (1 - t) * t * controlX + t ** 2 * endX;
    y = (1 - t) ** 2 * startY + 2 * (1 - t) * t * controlY + t ** 2 * endY;
    activeAgentColor = agentA.color; // Color of the sender
    orbitingAgentX = agentA.x; orbitingAgentY = agentA.y; // Glow around sender
  } else { // idle
    const lastAgentIsB = messages.length > 0 && (messages.length % 2 !== 0);
    const restingAgent = lastAgentIsB ? agentB : agentA;
    x = restingAgent.x + ORBIT_RADIUS; y = restingAgent.y;
    orbitingAgentX = restingAgent.x; orbitingAgentY = restingAgent.y;
    activeAgentColor = '#888';
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
      <circle cx={agentA.x} cy={agentA.y} r={phase === 'orbitA' || phase === 'transitionToB' ? 44 : 38} fill="url(#agentAGradient)" fillOpacity={phase === 'orbitA' ? 0.22 : 0.14} stroke={agentA.color} strokeWidth={phase === 'orbitA' ? 5 : 2.5} strokeOpacity={phase === 'orbitA' ? 1 : 0.6} filter={phase === 'orbitA' ? 'url(#glow)' : undefined} style={{ transition: 'r 0.25s, fill-opacity 0.25s, stroke-width 0.25s' }} />
      <circle cx={agentA.x} cy={agentA.y} r={28} fill="#0a121e" fillOpacity={0.6} stroke={agentA.color} strokeWidth={2} />
      <text x={agentA.x} y={agentA.y + 7} textAnchor="middle" fontSize="1.3em" fill={agentA.color} fontWeight="bold" opacity={phase === 'orbitA' || phase === 'transitionToB' ? 1 : 0.7}>{agentA.label}</text>
      
      <circle cx={agentB.x} cy={agentB.y} r={phase === 'orbitB' || phase === 'transitionToA' ? 44 : 38} fill="url(#agentBGradient)" fillOpacity={phase === 'orbitB' ? 0.22 : 0.14} stroke={agentB.color} strokeWidth={phase === 'orbitB' ? 5 : 2.5} strokeOpacity={phase === 'orbitB' ? 1 : 0.6} filter={phase === 'orbitB' ? 'url(#glow)' : undefined} style={{ transition: 'r 0.25s, fill-opacity 0.25s, stroke-width 0.25s' }} />
      <circle cx={agentB.x} cy={agentB.y} r={28} fill="#0a121e" fillOpacity={0.6} stroke={agentB.color} strokeWidth={2} />
      <text x={agentB.x} y={agentB.y + 7} textAnchor="middle" fontSize="1.3em" fill={agentB.color} fontWeight="bold" opacity={phase === 'orbitB' || phase === 'transitionToA' ? 1 : 0.7}>{agentB.label}</text>
      
      {/* Message Nodes Row */}
      {messages.length > 0 && (
        <g>
          {/* Draw lines between consecutive message nodes */}
          {messages.length > 1 && messages.map((msg, idx) => {
            if (idx === 0) return null;
            
            // Evenly space nodes between agentA.x and agentB.x
            const total = messages.length;
            const frac1 = total === 1 ? 0.5 : (idx - 1) / (total - 1);
            const frac2 = total === 1 ? 0.5 : idx / (total - 1);
            const x1 = agentA.x + frac1 * (agentB.x - agentA.x);
            const x2 = agentA.x + frac2 * (agentB.x - agentA.x);
            const y1 = agentA.y + 80; // 80px below agents
            const y2 = y1;
            
            const color = msg.agent === 'Agent A' ? agentA.color : agentB.color;
            const prevColor = messages[idx - 1].agent === 'Agent A' ? agentA.color : agentB.color;
            
            return (
              <line key={`line-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${prevColor}55`} strokeWidth={1.5} />
            );
          })}
          
          {/* Message nodes themselves */}
          {messages.map((msg, idx) => {
            // Evenly space nodes between agentA.x and agentB.x
            const total = messages.length;
            const frac = total === 1 ? 0.5 : idx / (total - 1);
            const nodeX = agentA.x + frac * (agentB.x - agentA.x);
            const nodeY = agentA.y + 80; // 80px below agents
            const color = msg.agent === 'Agent A' ? agentA.color : agentB.color;
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
          })}
        </g>
      )}
      
      {/* Orbit path indicators */}
      <circle cx={agentA.x} cy={agentA.y} r={ORBIT_RADIUS} fill="transparent" stroke={agentA.color} strokeWidth={1.5} strokeDasharray="3,3" opacity={(phase === 'orbitA' || phase === 'transitionToB') ? 0.6 : 0.2} />
      <circle cx={agentB.x} cy={agentB.y} r={ORBIT_RADIUS} fill="transparent" stroke={agentB.color} strokeWidth={1.5} strokeDasharray="3,3" opacity={(phase === 'orbitB' || phase === 'transitionToA') ? 0.6 : 0.2} />
      
      {/* Trail */}
      {trail.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={13 - (trail.length - i) * 0.7} fill="#fff" fillOpacity={pt.opacity * 0.5} filter="url(#glow)" />
      ))}
      
      {/* Main floating ball that moves between agents */}
      <circle cx={x} cy={y} r={15 + (phase !== 'idle' ? 2 * Math.abs(Math.sin(progress * Math.PI * 2)) : 0)} fill={phase === 'transitionToA' || phase === 'orbitA' ? '#74d0fc' : phase === 'transitionToB' || phase === 'orbitB' ? '#f7b267' : '#fff'} fillOpacity={phase !== 'idle' ? 0.97 : 0.6} stroke={phase === 'transitionToA' || phase === 'orbitA' ? '#74d0fc' : phase === 'transitionToB' || phase === 'orbitB' ? '#f7b267' : activeAgentColor} strokeWidth={phase !== 'idle' ? 4.5 : 1} strokeOpacity={phase !== 'idle' ? 1 : 0.5} filter="url(#glow)" />
      
      {/* Particle burst/shockwave when arriving at agent */}
      {(phase === 'transitionToA' && progress > 0.97) && Array.from({ length: 14 }).map((_, i) => (
        <circle key={'burstA' + i} cx={agentA.x + ORBIT_RADIUS * Math.cos((i / 14) * 2 * Math.PI)} cy={agentA.y + ORBIT_RADIUS * Math.sin((i / 14) * 2 * Math.PI)} r={5 + 3 * Math.random()} fill="#74d0fc" fillOpacity={0.22 + 0.22 * Math.random()} filter="url(#glow)" />
      ))}
      
      {(phase === 'transitionToB' && progress > 0.97) && Array.from({ length: 14 }).map((_, i) => (
        <circle key={'burstB' + i} cx={agentB.x + ORBIT_RADIUS * Math.cos((i / 14) * 2 * Math.PI)} cy={agentB.y + ORBIT_RADIUS * Math.sin((i / 14) * 2 * Math.PI)} r={5 + 3 * Math.random()} fill="#f7b267" fillOpacity={0.22 + 0.22 * Math.random()} filter="url(#glow)" />
      ))}
      
      {/* Animated agent glow ring */}
      {(phase === 'orbitA' || phase === 'orbitB' || phase === 'transitionToA' || phase === 'transitionToB') && (
        <circle cx={orbitingAgentX} cy={orbitingAgentY} r={45 + 2 * Math.abs(Math.sin(progress * Math.PI))} fill="transparent" stroke={activeAgentColor} strokeWidth="2" strokeOpacity="0.4" filter="url(#glow)" />
      )}
    </svg>
  );
});

export default MetaLoopAnimation;
