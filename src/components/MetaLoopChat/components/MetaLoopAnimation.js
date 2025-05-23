import React, { useState, useEffect, useRef, memo, useLayoutEffect } from "react";
import AgentOrbit from "./AgentOrbit";
import { easeInOutCubic } from "./animationUtils";
import AgentNode from "./AgentNode";
import Trail from "./Trail";

/**
 * Animation component for MetaLoopLab
 * Displays the visual representation of agents communicating in a loop
 */
const MetaLoopAnimation = memo(function MetaLoopAnimation({ streamingActive, messages, running, currentStreamMsg, activeMode }) {
  const isReflectorMode = activeMode === 'Self-Evolving Reflector';
  const [phase, setPhase] = useState('idle');
  const lastReflectorDirection = useRef('AtoR');

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  const svgRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(900);
  const viewBoxHeight = 340;
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

  const agentAX = 0.20 * effectiveWidth;
  const agentBX = 0.80 * effectiveWidth;
  const agentAY = viewBoxHeight / 2;
  const agentBY = viewBoxHeight / 2;
  const agentRX = effectiveWidth / 2;
  const agentRY = viewBoxHeight / 2;
  const ORBIT_RADIUS = Math.max(40, Math.min((effectiveWidth * 0.68) / 6, 80));

  const agentAOrbit = new AgentOrbit({ centerX: agentAX, centerY: agentAY, radius: ORBIT_RADIUS, color: '#74d0fc', label: 'Agent A' });
  const agentBOrbit = new AgentOrbit({ centerX: agentBX, centerY: agentBY, radius: ORBIT_RADIUS, color: '#f7b267', label: 'Agent B' });
  const agentROrbit = new AgentOrbit({ centerX: agentRX, centerY: agentRY, radius: ORBIT_RADIUS, color: '#b474fc', label: 'Agent R' });

  // Legacy agent definitions (used for some visual elements like text labels, consider refactoring these to use AgentOrbit instances too)
  const agentA = { x: agentAX, y: agentAY, color: agentAOrbit.color, label: 'Agent A' };
  const agentB = { x: agentBX, y: agentBY, color: agentBOrbit.color, label: 'Agent B' };
  const agentR = { x: agentRX, y: agentRY, color: agentROrbit.color, label: 'Agent R' };


  const [progress, setProgress] = useState(0); // 0-1, for progress-based animations
  const ORBIT_DURATION = 2.5; // seconds per orbit
  const TRANSITION_DURATION = 0.9; // seconds for agent <-> agent transitions
  
  const [agentRAnimationAngle, setAgentRAnimationAngle] = useState(-Math.PI / 2); // Start at the top for R orbit
  const rafAngleRef = useRef(null); // RAF for Agent R's angle-based animation
  const lastTimeAngleRef = useRef(performance.now());


  // --- Animate Agent R orbit angle (angle-based animation) ---
  useEffect(() => {
    // This effect is responsible for the continuous rotation of Agent R's orbit
    // It only runs when in reflector mode and the phase is specifically 'orbitR'
    if (isReflectorMode && phase === 'orbitR') {
      lastTimeAngleRef.current = performance.now(); // Reset timer when starting
      const animateR = (now) => {
        const dt = (now - lastTimeAngleRef.current) / 1000;
        lastTimeAngleRef.current = now;
        setAgentRAnimationAngle(a => (a + dt * (2 * Math.PI / ORBIT_DURATION))); // Continuous angle increment, no modulo here to allow full rotation tracking if needed, SVG rendering will handle visual modulo.
        rafAngleRef.current = requestAnimationFrame(animateR);
      };
      rafAngleRef.current = requestAnimationFrame(animateR);
    } else {
      // If not in orbitR phase or not in reflector mode, cancel the animation frame.
      if (rafAngleRef.current) {
        cancelAnimationFrame(rafAngleRef.current);
        rafAngleRef.current = null;
      }
    }
    return () => {
      if (rafAngleRef.current) {
        cancelAnimationFrame(rafAngleRef.current);
        rafAngleRef.current = null;
      }
    };
  }, [isReflectorMode, phase, ORBIT_DURATION]); // Rerun if mode, phase, or duration changes

  const prevStreamingActive = useRef(false);
  const prevMessagesLength = useRef(messages.length);
  const animationRef = useRef({ raf: null, last: null }); // For progress-based animations

  const finalizedMessages = messages.filter(m => !m.__pending);

  // Phase Determination Effect
  useEffect(() => {
    const currentMessagesLength = finalizedMessages.length;
    if (!running) {
      if (phase !== 'idle') setPhase('idle');
      prevStreamingActive.current = false;
      prevMessagesLength.current = currentMessagesLength;
      return;
    }

    const startedStreaming = streamingActive && !prevStreamingActive.current;
    const stoppedStreaming = !streamingActive && prevStreamingActive.current;

    if (isReflectorMode && phase === 'idle' && currentStreamMsg) {
      const agent = currentStreamMsg.agent;
      if (agent === 'Agent R') {
        setPhase('orbitR');
        setProgress(0); 
        setAgentRAnimationAngle(-Math.PI / 2); // Reset angle for R orbit start
      } else if (agent === 'Agent A') {
        setPhase('orbitA');
        setProgress(0);
      } else if (agent === 'Agent B') {
        setPhase('orbitB');
        setProgress(0);
      }
    }
    
    if (!isReflectorMode) {
      if (startedStreaming) {
        const nextAgentIsA = currentMessagesLength % 2 === 0;
        const transitionPhase = nextAgentIsA ? 'transitionToA' : 'transitionToB';
        setPhase(transitionPhase);
        setProgress(0);
      } else if (stoppedStreaming && phase !== 'idle') {
        setPhase('idle');
        setProgress(0);
      }
    } else { // Reflector Mode
      if (stoppedStreaming && phase !== 'idle') {
        setPhase('idle');
        setProgress(0);
      }
      // In reflector mode, agent-specific effects handle transitions on new messages
    }

    prevStreamingActive.current = streamingActive;
    prevMessagesLength.current = currentMessagesLength;
  }, [running, streamingActive, finalizedMessages.length, phase, isReflectorMode, currentStreamMsg]);

  const REFLECTOR_AGENT_NAME = 'Self-Evolving Reflector';
  const prevStreamAgentRef = useRef(null);
  useEffect(() => {
    if (!running || !streamingActive) {
      console.log('[MetaLoopAnimation DEBUG] useEffect: Not running or not streaming. phase:', phase);
      return;
    }
    const prevAgent = prevStreamAgentRef.current;
    const nextAgent = currentStreamMsg?.agent;
    console.log('[MetaLoopAnimation DEBUG] useEffect: prevAgent:', prevAgent, 'nextAgent:', nextAgent, 'phase:', phase, 'isReflectorMode:', isReflectorMode);
    // Always update prevStreamAgentRef immediately
    prevStreamAgentRef.current = nextAgent;
    // If no agent or in transition, do nothing
    if (!nextAgent || phase.startsWith('transition')) {
      console.log('[MetaLoopAnimation DEBUG] useEffect: No nextAgent or in transition phase:', phase);
      return;
    }
    if (isReflectorMode) {
      // Handle Agent R transitions FIRST and UNCONDITIONALLY
      if (nextAgent === REFLECTOR_AGENT_NAME) {
        console.log('[MetaLoopAnimation DEBUG] Detected Agent R as nextAgent. prevAgent:', prevAgent, 'phase:', phase);
        if (phase !== 'orbitR' && !phase.startsWith('transitionToR')) {
          if (prevAgent === 'Agent A') {
            console.log('[MetaLoopAnimation DEBUG] Transitioning from A to R.');
            setPhase('transitionToRfromA');
          } else if (prevAgent === 'Agent B') {
            console.log('[MetaLoopAnimation DEBUG] Transitioning from B to R.');
            setPhase('transitionToRfromB');
          } else {
            console.log('[MetaLoopAnimation DEBUG] Forcing direct orbitR (no valid prevAgent).');
            setPhase('orbitR');
            setAgentRAnimationAngle(-Math.PI / 2);
          }
          setProgress(0);
        } else {
          console.log('[MetaLoopAnimation DEBUG] Already in orbitR or transitioning to R. phase:', phase);
        }
        return;
      }
      // Standard transitions for A/B
      if (prevAgent !== nextAgent) {
        console.log('[MetaLoopAnimation DEBUG] Standard transition. prevAgent:', prevAgent, 'nextAgent:', nextAgent, 'phase:', phase);
        if (prevAgent === REFLECTOR_AGENT_NAME && nextAgent === 'Agent B') {
          setPhase('transitionToBfromR');
          console.log('[MetaLoopAnimation DEBUG] transitionToBfromR');
        }
        else if (prevAgent === REFLECTOR_AGENT_NAME && nextAgent === 'Agent A') {
          setPhase('transitionToAfromR');
          console.log('[MetaLoopAnimation DEBUG] transitionToAfromR');
        }
        else if (prevAgent === null) {
          if (nextAgent === 'Agent A') { setPhase('orbitA'); console.log('[MetaLoopAnimation DEBUG] Initial orbitA'); }
          else if (nextAgent === 'Agent B') { setPhase('orbitB'); console.log('[MetaLoopAnimation DEBUG] Initial orbitB'); }
        }
        setProgress(0);
      } else {
        if (nextAgent === 'Agent A' && phase !== 'orbitA') { setPhase('orbitA'); setProgress(0); console.log('[MetaLoopAnimation DEBUG] Correcting to orbitA'); }
        else if (nextAgent === 'Agent B' && phase !== 'orbitB') { setPhase('orbitB'); setProgress(0); console.log('[MetaLoopAnimation DEBUG] Correcting to orbitB'); }
      }
    } else {
      // Standard mode (A <-> B)
      if (prevAgent !== nextAgent) {
        console.log('[MetaLoopAnimation DEBUG] Standard AB transition. prevAgent:', prevAgent, 'nextAgent:', nextAgent, 'phase:', phase);
        if (prevAgent === 'Agent A' && nextAgent === 'Agent B') { setPhase('transitionToB'); console.log('[MetaLoopAnimation DEBUG] transitionToB'); }
        else if ((prevAgent === 'Agent B' && nextAgent === 'Agent A') || prevAgent == null) { setPhase('transitionToA'); console.log('[MetaLoopAnimation DEBUG] transitionToA'); }
        setProgress(0);
      } else {
        if (nextAgent === 'Agent A' && phase !== 'orbitA') { setPhase('orbitA'); setProgress(0); console.log('[MetaLoopAnimation DEBUG] Correcting to orbitA (AB mode)'); }
        else if (nextAgent === 'Agent B' && phase !== 'orbitB') { setPhase('orbitB'); setProgress(0); console.log('[MetaLoopAnimation DEBUG] Correcting to orbitB (AB mode)'); }
      }
    }
  }, [currentStreamMsg, streamingActive, running, phase, isReflectorMode, finalizedMessages.length]);


  // Main animation loop effect (progress-based)
  useEffect(() => {
    if (phase === 'idle' || !running || phase === 'orbitR') { // Stop progress animation if idle, not running, or in orbitR (angle-driven)
      if (animationRef.current.raf) { 
        cancelAnimationFrame(animationRef.current.raf); 
        animationRef.current.raf = null; 
        animationRef.current.last = null; 
      }
      return;
    }

    // Start/Continue progress-based animation
    animationRef.current.last = performance.now();
    function tick(now) {
      const dt = (now - (animationRef.current.last || now)) / 1000;
      animationRef.current.last = now;

      setProgress(prev => {
        let duration = phase.startsWith('orbit') ? ORBIT_DURATION : TRANSITION_DURATION;
        // orbitR is handled by angle animation, so this part is skipped if phase === 'orbitR' due to the check at the start of useEffect.
        
        let nextProgress = prev + dt / duration;
        
        if (nextProgress >= 1) {
          if (isReflectorMode) {
            if (phase === 'transitionToAfromR') setPhase('orbitA');
            else if (phase === 'transitionToRfromA') {
              setPhase('orbitR');
              setAgentRAnimationAngle(-Math.PI/2); // Set initial angle for R's orbit
              lastReflectorDirection.current = 'AtoR';
            }
            else if (phase === 'transitionToBfromR') setPhase('orbitB');
            else if (phase === 'transitionToRfromB') {
              setPhase('orbitR');
              setAgentRAnimationAngle(-Math.PI/2); // Set initial angle for R's orbit
              lastReflectorDirection.current = 'BtoR';
            }
            // For orbitA, orbitB, they loop via progress reset. orbitR is handled by its own RAF.
            // Transitioning *from* orbitR is handled by currentStreamMsg effect.
          } else { // Standard Mode
            if (phase === 'transitionToA') setPhase('orbitA');
            else if (phase === 'transitionToB') setPhase('orbitB');
          }
          return 0; // Reset progress for next orbit/loop or end of transition
        }
        return nextProgress;
      });
      animationRef.current.raf = requestAnimationFrame(tick);
    }
    
    animationRef.current.raf = requestAnimationFrame(tick);
    return () => { 
      if (animationRef.current.raf) cancelAnimationFrame(animationRef.current.raf); 
    };
  }, [phase, running, streamingActive, isReflectorMode, ORBIT_DURATION, TRANSITION_DURATION]);


  // Calculate main ball position based on phase, progress, and angle
  let x, y, activeAgentColor = '#888';
  let orbitingAgentX = agentAOrbit.centerX, orbitingAgentY = agentAOrbit.centerY;

  if (phase === 'orbitA') {
    const pos = agentAOrbit.getPositionByProgress(progress, easeInOutCubic);
    x = pos.x; y = pos.y;
    activeAgentColor = agentAOrbit.color;
    orbitingAgentX = agentAOrbit.centerX; orbitingAgentY = agentAOrbit.centerY;
  } else if (phase === 'orbitB') {
    const pos = agentBOrbit.getPositionByProgress(progress, easeInOutCubic);
    x = pos.x; y = pos.y;
    activeAgentColor = agentBOrbit.color;
    orbitingAgentX = agentBOrbit.centerX; orbitingAgentY = agentBOrbit.centerY;
  } else if (phase === 'orbitR') {
    // MAIN FIX: Update main ball position for Agent R using angle
    const pos = agentROrbit.getPositionByAngle(agentRAnimationAngle);
    x = pos.x; y = pos.y;
    activeAgentColor = agentROrbit.color;
    orbitingAgentX = agentROrbit.centerX; orbitingAgentY = agentROrbit.centerY;
  } else if (phase === 'transitionToA') { // From B to A (standard)
    const start = agentBOrbit.getCenter(); const end = agentAOrbit.getCenter();
    const easedProgress = easeInOutCubic(progress);
    x = start.x + (end.x - start.x) * easedProgress;
    y = start.y + (end.y - start.y) * easedProgress;
    activeAgentColor = agentAOrbit.color; // Target color
  } else if (phase === 'transitionToB') { // From A to B (standard)
    const start = agentAOrbit.getCenter(); const end = agentBOrbit.getCenter();
    const easedProgress = easeInOutCubic(progress);
    x = start.x + (end.x - start.x) * easedProgress;
    y = start.y + (end.y - start.y) * easedProgress;
    activeAgentColor = agentBOrbit.color; // Target color
  } else if (phase === 'transitionToRfromA') {
    const start = agentAOrbit.getCenter(); const end = agentROrbit.getCenter();
    const easedProgress = easeInOutCubic(progress);
    x = start.x + (end.x - start.x) * easedProgress;
    y = start.y + (end.y - start.y) * easedProgress;
    activeAgentColor = agentROrbit.color;
  } else if (phase === 'transitionToRfromB') {
    const start = agentBOrbit.getCenter(); const end = agentROrbit.getCenter();
    const easedProgress = easeInOutCubic(progress);
    x = start.x + (end.x - start.x) * easedProgress;
    y = start.y + (end.y - start.y) * easedProgress;
    activeAgentColor = agentROrbit.color;
  } else if (phase === 'transitionToAfromR') {
    const start = agentROrbit.getCenter(); const end = agentAOrbit.getCenter();
    const easedProgress = easeInOutCubic(progress);
    x = start.x + (end.x - start.x) * easedProgress;
    y = start.y + (end.y - start.y) * easedProgress;
    activeAgentColor = agentAOrbit.color;
  } else if (phase === 'transitionToBfromR') {
    const start = agentROrbit.getCenter(); const end = agentBOrbit.getCenter();
    const easedProgress = easeInOutCubic(progress);
    x = start.x + (end.x - start.x) * easedProgress;
    y = start.y + (end.y - start.y) * easedProgress;
    activeAgentColor = agentBOrbit.color;
  } else { // Idle or other unhandled phases
    // Default to a central position or Agent A's position if idle
    const initialPos = agentAOrbit.getPositionByProgress(0, easeInOutCubic); // Default to Agent A start
    x = initialPos.x; y = initialPos.y;
    activeAgentColor = '#888'; // Neutral color
     if (phase !== 'idle') { // if not idle but an unknown phase, place at center
        x = effectiveWidth / 2;
        y = viewBoxHeight / 2;
     } else { // for idle, place near agent A for definite start
        const agentACenter = agentAOrbit.getCenter();
        x = agentACenter.x;
        y = agentACenter.y;
     }

  }


  // --- Trail State ---
  const [trail, setTrail] = useState([]);
  const TRAIL_LENGTH = 16;

  useEffect(() => {
    if (phase === 'idle' || x === undefined || y === undefined) {
      setTrail([]);
      return;
    }
    setTrail(prev => {
      const next = [...prev, { x, y, opacity: 1 }];
      while (next.length > TRAIL_LENGTH) next.shift();
      return next.map((pt, idx) => ({ ...pt, opacity: (idx + 1) / next.length * 0.7 }));
    });
  }, [x, y, phase]);

  // SVG Rendering
  return (
    <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${effectiveWidth} ${viewBoxHeight}`} preserveAspectRatio="xMidYMid meet" style={{ background: 'rgba(24,34,54,0.93)', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(74,211,250,0.15)', display: 'block', width: '100%', height: '100%' }}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="coloredBlur"/>
          <feComposite in="SourceGraphic" in2="coloredBlur" operator="over" />
        </filter>
        <radialGradient id="agentAGradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
          <stop offset="30%" stopColor="#74d0fc" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#74d0fc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="agentBGradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
          <stop offset="30%" stopColor="#f7b267" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#f7b267" stopOpacity="0" />
        </radialGradient>
         <radialGradient id="agentRGradient" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
          <stop offset="30%" stopColor={agentROrbit.color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={agentROrbit.color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background circles for Agents */}
      {/* Agent A */}
      <AgentNode
        x={agentA.x}
        y={agentA.y}
        color={agentA.color}
        label={agentA.label}
        active={phase === 'orbitA' || phase.endsWith('ToA') || phase.startsWith('transitionToB')}
        gradientId="agentAGradient"
      />
      
      {/* Agent R (Reflector) - only show in reflector mode */}
      {isReflectorMode && (
        <AgentNode
          x={agentR.x}
          y={agentR.y}
          color={agentR.color}
          label={agentR.label}
          active={phase === 'orbitR' || phase.includes('ToR')}
          gradientId="agentRGradient"
        />
      )}
      
      {/* Agent B */}
      <AgentNode
        x={agentB.x}
        y={agentB.y}
        color={agentB.color}
        label={agentB.label}
        active={phase === 'orbitB' || phase.endsWith('ToB') || phase.startsWith('transitionToA')}
        gradientId="agentBGradient"
      />
      
      {/* Message Nodes Row (Existing logic, assumed to be largely okay) */}
      {messages.length > 0 && (
         <g>
          {messages.length > 1 && messages.map((msg, idx) => {
            if (idx === 0) return null;
             if (isReflectorMode) {
              const totalMarkers = messages.length;
              const startX = agentAOrbit.centerX;
              const endX = agentBOrbit.centerX;
              const availableWidthForMarkers = endX - startX;
              let x1_pos, x2_pos;

              if (totalMarkers <= 1) {
                x1_pos = startX + availableWidthForMarkers / 2;
                x2_pos = startX + availableWidthForMarkers / 2;
              } else {
                x1_pos = startX + ((idx - 1) / (totalMarkers - 1)) * availableWidthForMarkers;
                x2_pos = startX + (idx / (totalMarkers - 1)) * availableWidthForMarkers;
              }

              const y_pos = agentAOrbit.centerY + 80; // Common Y position
              const prevColor = messages[idx - 1].agent === 'Agent A' ? agentAOrbit.color : messages[idx - 1].agent === 'Agent B' ? agentBOrbit.color : agentROrbit.color;
              return (
                <line key={`line-${idx}`} x1={x1_pos} y1={y_pos} x2={x2_pos} y2={y_pos} stroke={`${prevColor}55`} strokeWidth={2} />
              );
            } else {
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
          {messages.map((msg, idx) => {
             if (isReflectorMode) {
              const totalMarkers = messages.length;
              const startX = agentAOrbit.centerX;
              const endX = agentBOrbit.centerX;
              const availableWidthForMarkers = endX - startX;
              let nodeXPosition;

              if (totalMarkers === 1) {
                nodeXPosition = startX + availableWidthForMarkers / 2;
              } else {
                nodeXPosition = startX + (idx / (totalMarkers - 1)) * availableWidthForMarkers;
              }

              const nodeYPosition = agentAOrbit.centerY + 80; // Keep Y offset consistent (can be adjusted)
              const color = msg.agent === 'Agent A' ? agentAOrbit.color : msg.agent === 'Agent B' ? agentBOrbit.color : agentROrbit.color;
              const isPending = msg.__pending;
              return (
                <g key={`node-${idx}`}>
                  {isPending ? (
                    <g>
                      <circle cx={nodeXPosition} cy={nodeYPosition} r={10} fill={color} fillOpacity={0.45} stroke="#fff" strokeWidth={2} opacity={0.65} />
                      <circle cx={nodeXPosition} cy={nodeYPosition} r={13} fill="none" stroke={color} strokeWidth={2} strokeDasharray="10 12" strokeLinecap="round" opacity={0.7}>
                        <animateTransform attributeName="transform" type="rotate" from={`0 ${nodeXPosition} ${nodeYPosition}`} to={`360 ${nodeXPosition} ${nodeYPosition}`} dur="0.9s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  ) : (
                    <circle cx={nodeXPosition} cy={nodeYPosition} r={10} fill={color} stroke="#fff" strokeWidth={2} opacity={0.93} />
                  )}
                  <text x={nodeXPosition} y={nodeYPosition + 25} textAnchor="middle" fontSize="0.8em" fill={color} opacity={0.8}>
                    {`${msg.agent.replace('Agent ','').replace('Self-Evolving Reflector', 'R')} ${isPending ? '...' : `(${idx + 1})`}`}
                  </text>
                </g>
              );
            } else {
              const total = messages.length;
              const frac = total === 1 ? 0.5 : idx / (total - 1);
              const nodeX = agentAOrbit.centerX + frac * (agentBOrbit.centerX - agentAOrbit.centerX);
              const nodeY = agentAOrbit.centerY + 80;
              const color = msg.agent === 'Agent A' ? agentAOrbit.color : agentBOrbit.color;
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
                     {`${msg.agent.replace('Agent ','')} ${isPending ? '...' : `(${idx + 1})`}`}
                  </text>
                </g>
              );
            }
          })}
        </g>
      )}
      
      {/* Orbit path indicators */}
      <circle cx={agentAOrbit.centerX} cy={agentAOrbit.centerY} r={agentAOrbit.radius} fill="transparent" stroke={agentAOrbit.color} strokeWidth={1.5} strokeDasharray="3,3" opacity={(phase === 'orbitA' || phase.endsWith('ToA') || phase.startsWith('transitionToB')) ? 0.6 : 0.2} />
      {isReflectorMode && (
        <circle cx={agentROrbit.centerX} cy={agentROrbit.centerY} r={agentROrbit.radius} fill="transparent" stroke={agentROrbit.color} strokeWidth={1.5} strokeDasharray="3,3" opacity={(phase === 'orbitR' || phase.includes('ToR')) ? 0.6 : 0.2} />
      )}
      <circle cx={agentBOrbit.centerX} cy={agentBOrbit.centerY} r={agentBOrbit.radius} fill="transparent" stroke={agentBOrbit.color} strokeWidth={1.5} strokeDasharray="3,3" opacity={(phase === 'orbitB' || phase.endsWith('ToB') || phase.startsWith('transitionToA')) ? 0.6 : 0.2} />

      {/* Agent R orbiting dots - these are decorative and show the R orbit path is active */}
      {isReflectorMode && phase === 'orbitR' && Array.from({ length: 12 }).map((_, i) => {
        const angle = agentRAnimationAngle + (i / 12) * 2 * Math.PI; // Offset dots along the orbit
        const pos = agentROrbit.getPositionByAngle(angle);
        return (
          <circle
            key={'r-orbit-dot-' + i}
            cx={pos.x}
            cy={pos.y}
            r={3 + (i % 2)} // Vary size slightly
            fill={agentROrbit.color}
            fillOpacity={0.12 + (i % 3) * 0.05} // Vary opacity
          />
        );
      })}

      {/* Small spheres indicating the current ideal orbit position - these are more for debug/visual cue
          The MAIN floating ball is the primary visual indicator. These can be removed if too cluttered.
      */}
      {/* {agentAOrbit.renderOrbitingSphere({ progress, phase, easingFn: easeInOutCubic, visiblePhases: ['orbitA'], r:8 })}
      {agentBOrbit.renderOrbitingSphere({ progress, phase, easingFn: easeInOutCubic, visiblePhases: ['orbitB'], r:8 })}
      {isReflectorMode && agentROrbit.renderOrbitingSphere({ angle: agentRAnimationAngle, phase, visiblePhases: ['orbitR'], r:8 })} */}
      
      {/* Trail */}
      {trail.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={Math.max(1, 13 - (trail.length - i) * 0.7)} fill="#fff" fillOpacity={pt.opacity * 0.5} filter="url(#glow)" />
      ))}
      
      {/* Main floating ball that moves between agents */}
      {/* Trail effect behind the moving ball */}
      <Trail trail={trail} color={activeAgentColor} />
      {phase !== 'idle' && x !== undefined && y !== undefined && (
          <g>
            <circle 
                cx={x} 
                cy={y} 
                r={15 + (phase.startsWith('orbit') ? 2 * Math.abs(Math.sin((phase === 'orbitR' ? (agentRAnimationAngle / (2*Math.PI)) : progress) * Math.PI * 2)) : 0)} 
                fill={activeAgentColor} 
                fillOpacity={0.97} 
                stroke={activeAgentColor} 
                strokeWidth={4.5} 
                strokeOpacity={1} 
                filter="url(#glow)" 
            />
            {/* Pulse/glow for active agent */}
            {(phase.startsWith('orbit') || phase.startsWith('transition')) && (
                <circle 
                    cx={orbitingAgentX} 
                    cy={orbitingAgentY} 
                    r={45 + 3 * Math.abs(Math.sin((phase === 'orbitR' ? (agentRAnimationAngle / (2*Math.PI)) : progress) * Math.PI))} 
                    fill="transparent" 
                    stroke={activeAgentColor} 
                    strokeWidth="2.5" 
                    strokeOpacity="0.45" 
                    filter="url(#glow)" 
                />
            )}
            {/* Particle burst on arrival (simplified) */}
            {phase.startsWith('transitionTo') && progress > 0.97 && Array.from({ length: 10 }).map((_, i) => {
                let burstAgentX = 0, burstAgentY = 0, burstColor = activeAgentColor;
                if (phase.endsWith('ToA')) { burstAgentX = agentAOrbit.centerX; burstAgentY = agentAOrbit.centerY; burstColor = agentAOrbit.color; }
                else if (phase.endsWith('ToB')) { burstAgentX = agentBOrbit.centerX; burstAgentY = agentBOrbit.centerY; burstColor = agentBOrbit.color; }
                else if (phase.includes('ToR')) { burstAgentX = agentROrbit.centerX; burstAgentY = agentROrbit.centerY; burstColor = agentROrbit.color; }
                
                return (
                <circle 
                    key={'burst' + phase + i} 
                    cx={burstAgentX + (ORBIT_RADIUS/2 + Math.random()*ORBIT_RADIUS/2) * Math.cos((i / 10) * 2 * Math.PI + progress * Math.PI)} 
                    cy={burstAgentY + (ORBIT_RADIUS/2 + Math.random()*ORBIT_RADIUS/2) * Math.sin((i / 10) * 2 * Math.PI + progress * Math.PI)} 
                    r={2 + 4 * Math.random() * (1-progress)} 
                    fill={burstColor} 
                    fillOpacity={Math.max(0, (0.2 + 0.3 * Math.random()) * (1- (progress-0.97)*30 ))} // Fade out quickly
                 />
                )
            })}
          </g>
      )}
    </svg>
  );
});

export default MetaLoopAnimation;