import React, { useState, useEffect, useMemo } from 'react';
import MessageTypeSelector from './MessageTypeSelector';
import MessageFlowVisualizer from './MessageFlowVisualizer';
import { useMessageTypes } from '../hooks/useMessageTypes';

// Define some consistent styling variables
const panelStyle = {
  background: 'rgba(28, 44, 74, 0.85)', // Slightly darker than main bg
  borderRadius: '12px',
  border: '1px solid rgba(116, 208, 252, 0.2)',
  padding: '16px',
  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.2)'
};

const panelHeaderStyle = {
  color: '#a6f1ff',
  margin: '0 0 12px 0',
  fontSize: '18px',
  fontWeight: '600',
  letterSpacing: '0.5px',
  borderBottom: '1px solid rgba(116, 208, 252, 0.2)',
  paddingBottom: '10px'
};

const controlButtonStyle = {
  padding: '8px 14px',
  background: 'rgba(50, 70, 100, 0.6)',
  border: '1px solid rgba(116, 208, 252, 0.3)',
  borderRadius: '8px',
  color: '#a6f1ff',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const selectStyle = {
  padding: '8px 12px',
  background: 'rgba(25, 36, 54, 0.9)',
  border: '1px solid rgba(116, 208, 252, 0.3)',
  borderRadius: '8px',
  color: '#e0f0ff',
  flexGrow: 1, // Allow selects to grow
  minWidth: '150px', // Minimum width for selects
  transition: 'all 0.2s ease'
};

/**
 * AdvancedLabTab Component
 * Integrates all enhanced MetaLoopChat features in a dedicated tab interface
 * Implements Blueprint 3.3.3 - Advanced observability and experimentation
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.messages - List of messages to visualize
 * @param {Object} props.currentStreamMsg - Currently streaming message (if any)
 * @param {boolean} props.running - Whether the loop is running
 * @param {Object} props.reflectorMemory - Optional reflector memory
 * @param {Object} props.orchestration - Orchestration hooks and methods
 * @returns {JSX.Element} - Rendered component
 */
const AdvancedLabTab = ({ 
  messages = [], 
  currentStreamMsg, 
  running,
  reflectorMemory,
  orchestration = {}
}) => {
  const messageTypesHook = useMessageTypes();
  
  const [showVisualization, setShowVisualization] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState('flow');
  const [autoScroll, setAutoScroll] = useState(true);
  
  const currentStreamingAgent = currentStreamMsg?.agent || null;
  
  useEffect(() => {
    if (autoScroll) {
      const messageContainer = document.querySelector('.advanced-messages-container');
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }
  }, [autoScroll, messages]); // Dependency on messages to scroll when new ones arrive
  
  const stats = useMemo(() => {
    if (!messages || messages.length === 0) return {
      total: 0, byType: {}, byAgent: {}, avgLength: 0, structuredCount: 0, interactionPatterns: 0, estimatedTokens: 0, avgResponseTime: null, totalTime: null
    };
    
    const typeCount = {};
    messages.forEach(msg => { (typeCount[msg.type || 'standard'] = (typeCount[msg.type || 'standard'] || 0) + 1); });
    const agentCount = {};
    messages.forEach(msg => { (agentCount[msg.agent || 'unknown'] = (agentCount[msg.agent || 'unknown'] || 0) + 1); });
    const avgLength = messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0) / messages.length;
    const structuredCount = messages.filter(msg => msg.structured && Object.keys(msg.structured).length > 0).length;
    const agentPairs = new Set();
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].agent && messages[i+1].agent && messages[i].agent !== messages[i+1].agent) {
        agentPairs.add(`${messages[i].agent}->${messages[i+1].agent}`);
      }
    }
    const totalTextLength = messages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0);
    const estimatedTokens = Math.round(totalTextLength / 4);
    let avgResponseTime = null, totalTime = null;
    const validTimeMessages = messages.filter(msg => msg.timestamp);
    if (validTimeMessages.length > 1) {
      totalTime = Math.round((new Date(validTimeMessages[validTimeMessages.length - 1].timestamp).getTime() - new Date(validTimeMessages[0].timestamp).getTime()) / 1000);
      let totalDiffTime = 0, diffCount = 0;
      for (let i = 1; i < validTimeMessages.length; i++) {
        const diff = new Date(validTimeMessages[i].timestamp).getTime() - new Date(validTimeMessages[i-1].timestamp).getTime();
        if (diff > 0 && diff < 120000) { totalDiffTime += diff; diffCount++; }
      }
      if (diffCount > 0) avgResponseTime = Math.round(totalDiffTime / diffCount / 1000);
    }
    return {
      total: messages.length, byType: typeCount, byAgent: agentCount,
      avgLength: Math.round(avgLength), structuredCount, interactionPatterns: agentPairs.size,
      estimatedTokens, avgResponseTime, totalTime
    };
  }, [messages]);
  
  const filteredMessages = useMemo(() => messages.filter(msg => 
    (!selectedAgentFilter || msg.agent === selectedAgentFilter) && 
    (!selectedTypeFilter || msg.type === selectedTypeFilter)
  ), [messages, selectedAgentFilter, selectedTypeFilter]);

  const uniqueAgents = useMemo(() => Array.from(new Set(messages.map(m => m.agent).filter(Boolean))), [messages]);

  return (
    <div className="advanced-lab-tab" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      padding: '16px', // Overall padding for the tab content
      gap: '16px', // Gap between main sections
      overflow: 'hidden',
      background: 'rgba(16, 20, 31, 0.7)' // Slightly transparent main background
    }}>
      {/* Top Control Panel */}
      <div style={{...panelStyle, paddingBottom: '8px' }}>
        <h3 style={panelHeaderStyle}>Advanced Lab Controls</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', // Adjusted minmax
          gap: '12px'
        }}>
          <button
            onClick={() => setShowVisualization(!showVisualization)}
            style={{...controlButtonStyle, background: showVisualization ? 'rgba(116, 208, 252, 0.25)' : 'rgba(50, 70, 100, 0.6)'}}
            title={showVisualization ? "Hide Visualization Panel" : "Show Visualization Panel"}
          >
            <span>{showVisualization ? '🎨 Hide Viz' : '🎨 Show Viz'}</span>
          </button>
          <button
            onClick={() => setShowStatistics(!showStatistics)}
            style={{...controlButtonStyle, background: showStatistics ? 'rgba(116, 208, 252, 0.25)' : 'rgba(50, 70, 100, 0.6)'}}
            title={showStatistics ? "Hide Statistics Panel" : "Show Statistics Panel"}
          >
            <span>{showStatistics ? '📊 Hide Stats' : '📊 Show Stats'}</span>
          </button>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            style={{...controlButtonStyle, background: autoScroll ? 'rgba(116, 208, 252, 0.25)' : 'rgba(50, 70, 100, 0.6)'}}
            title={autoScroll ? "Disable Auto-Scroll" : "Enable Auto-Scroll"}
          >
            <span style={{ fontSize: '14px', lineHeight: 1 }}>{autoScroll ? '📜' : '⏸️'}</span>
            <span>Auto-Scroll: {autoScroll ? 'On' : 'Off'}</span>
          </button>
          
          <MessageTypeSelector
            selectedType={messageTypesHook.currentMessageType}
            onTypeChange={messageTypesHook.setCurrentMessageType}
            disabled={running}
            // Pass selectStyle for consistent styling with other selects in this panel
            customStyle={selectStyle} 
          />
        </div>
      </div>
      
      {/* Main Area: Visualization/Stats and Message List */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: (showVisualization || showStatistics) ? '1fr 300px' : '1fr', gap: '16px', overflow: 'hidden', minHeight: 0 }}>
        
        {/* Left Column: Message List (always visible) */}
        <div style={{...panelStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
           <div style={{
            ...panelHeaderStyle, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px' // Reduced margin for filter bar
          }}>
            <span>
              Enhanced Message View 
              {(selectedAgentFilter || selectedTypeFilter) && 
                <small style={{color: '#8899aa', fontWeight: 'normal'}}>
                    (Filtered)
                </small>}
            </span>
            {(selectedAgentFilter || selectedTypeFilter) && 
              <button
                onClick={() => { setSelectedAgentFilter(null); setSelectedTypeFilter(null); }}
                style={{...controlButtonStyle, padding: '4px 8px', fontSize: '12px', background: 'rgba(255,100,100,0.2)', borderColor: 'rgba(255,100,100,0.4)', color: '#ffdddd'}}
                title="Clear all filters"
              >
                Clear Filters 🗑️
              </button>
            }
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            paddingBottom: '10px',
            borderBottom: '1px solid rgba(116, 208, 252, 0.1)'
          }}>
            <select
              value={selectedAgentFilter || ''}
              onChange={(e) => setSelectedAgentFilter(e.target.value || null)}
              style={selectStyle}
              title="Filter messages by agent"
            >
              <option value="">All Agents ({uniqueAgents.length})</option>
              {uniqueAgents.map(agent => (
                <option key={agent} value={agent}>{agent} ({stats.byAgent[agent] || 0})</option>
              ))}
            </select>
            <select
              value={selectedTypeFilter || ''}
              onChange={(e) => setSelectedTypeFilter(e.target.value || null)}
              style={selectStyle}
              title="Filter messages by type"
            >
              <option value="">All Types ({Object.keys(stats.byType).length})</option>
              {stats.byType && Object.keys(stats.byType).map(type => (
                <option key={type} value={type}>
                  {messageTypesHook.getMessageTypeInfo(type).icon} {type.charAt(0).toUpperCase() + type.slice(1)} ({stats.byType[type]})
                </option>
              ))}
            </select>
          </div>
          <div className="advanced-messages-container" style={{ 
            flex: 1, 
            overflowY: 'auto', 
            paddingRight: '8px', 
            minHeight: 0, // Keep for flex shrinkage if parent allows
            height: '45vh', // Explicit height
            maxHeight: '45vh' // Ensure it doesn't exceed this
          }}>
            {filteredMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8899aa', fontStyle: 'italic', padding: '3em 1em' }}>
                No messages match your current filters, or no messages yet...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredMessages.map((message, idx) => (
                  <MessageCard 
                    key={`${message.timestamp}-${idx}`} // More robust key
                    message={message} 
                    isStreaming={currentStreamMsg && message.timestamp === currentStreamMsg.timestamp}
                    messageTypesHook={messageTypesHook}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visualization and/or Statistics (conditionally visible) */}
        {(showVisualization || showStatistics) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '5px' }}>
            {showVisualization && (
              <div style={{...panelStyle, flexShrink: 0 }}>
                <div style={{
                  ...panelHeaderStyle, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <span>Message Visualization</span>
                  <select
                    value={visualizationMode}
                    onChange={(e) => setVisualizationMode(e.target.value)}
                    style={{...selectStyle, flexGrow: 0, padding: '6px 10px', fontSize: '13px'}}
                    title="Select visualization mode"
                  >
                    <option value="flow">📊 Flow</option>
                    <option value="tree" disabled>🌳 Tree</option>
                    <option value="timeline" disabled>⏳ Timeline</option>
                  </select>
                </div>
                {visualizationMode === 'flow' && (
                  <MessageFlowVisualizer
                    messages={messages} // Pass all messages for overall flow
                    currentStreamingAgent={currentStreamingAgent}
                    running={running}
                    reflectorMemory={reflectorMemory}
                  />
                )}
                {(visualizationMode === 'tree' || visualizationMode === 'timeline') && (
                  <div style={emptyVisualizationStyle}>
                    {visualizationMode === 'tree' ? '🌳' : '⏳'} {visualizationMode.charAt(0).toUpperCase() + visualizationMode.slice(1)} visualization coming soon.
                  </div>
                )}
              </div>
            )}
            
            {showStatistics && (
              <div style={panelStyle}>
                <h3 style={panelHeaderStyle}>Conversation Statistics</h3>
                <table style={{ width: '100%', color: '#e0f0ff', fontSize: '13px', borderSpacing: '0 4px' }}>
                  <tbody>
                    {renderStatRow('Total Messages:', stats.total, '#️⃣')}
                    {renderStatRow('Avg Length:', `${stats.avgLength} chars`, '📏')}
                    {renderStatRow('Est. Tokens:', stats.estimatedTokens, '🪙')}
                    {renderStatRow('Structured Data:', stats.structuredCount, '📦')}
                    {renderStatRow('Interactions:', stats.interactionPatterns, '🔗')}
                    {stats.avgResponseTime !== null && renderStatRow('Avg Response:', `${stats.avgResponseTime}s`, '⏱️')}
                    {stats.totalTime !== null && renderStatRow('Total Time:', `${stats.totalTime}s`, '⏳')}
                  </tbody>
                </table>
                <h4 style={{ ...panelHeaderStyle, fontSize: '16px', marginTop: '16px', borderTop: '1px solid rgba(116, 208, 252, 0.1)', paddingTop: '12px' }}>Message Types:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {stats.byType && Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} style={{
                      ...controlButtonStyle,
                      background: selectedTypeFilter === type ? 'rgba(116, 208, 252, 0.2)' : 'rgba(50, 70, 100, 0.4)',
                      borderColor: selectedTypeFilter === type ? '#74d0fc' : 'rgba(116, 208, 252, 0.2)',
                      justifyContent: 'space-between',
                      padding: '6px 10px'
                    }}
                    onClick={() => setSelectedTypeFilter(selectedTypeFilter === type ? null : type)}
                    title={`Filter by ${type} type`}
                    >
                      <span style={{ color: messageTypesHook.getMessageTypeInfo(type).color || '#e0f0ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{messageTypesHook.getMessageTypeInfo(type).icon || '📝'}</span>
                        <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      </span>
                      <span style={{ fontWeight: '600', color: '#e0f0ff' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const emptyVisualizationStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '180px', // Ensure it takes some space
  color: '#a6f1ff',
  fontSize: '14px',
  border: '2px dashed rgba(116, 208, 252, 0.2)',
  borderRadius: '8px',
  padding: '10px',
  textAlign: 'center',
  opacity: 0.7
};

const renderStatRow = (label, value, icon = null) => (
  <tr>
    <td style={{ padding: '3px 0', fontWeight: '500', color: '#c0d0e0', display: 'flex', alignItems: 'center', gap: '6px' }}>
      {icon && <span style={{opacity: 0.7}}>{icon}</span>}
      {label}
    </td>
    <td style={{ padding: '3px 0', textAlign: 'right', color: '#e0f0ff', fontWeight: '600' }}>{value}</td>
  </tr>
);

/**
 * MessageCard Component
 * Displays a single message with enhanced features
 */
const MessageCard = ({ message, isStreaming, messageTypesHook }) => {
  const [expanded, setExpanded] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  
  const getAgentColor = (agent) => {
    if (!agent) return "#aaa";
    if (agent.includes("Agent A") || agent === "Agent A") return "#74d0fc";
    if (agent.includes("Agent B") || agent === "Agent B") return "#f7b267";
    if (agent.includes("Agent R") || agent === "Agent R" || agent.includes("Reflector")) return "#9f85ff";
    if (agent.includes("Meta") || agent === "Meta Agent") return "#64ecaa";
    if (agent.includes("Critic") || agent === "Critic Agent") return "#ff8570";
    if (agent.includes("System")) return "#aaa";
    return "#e0f0ff";
  };
  
  const getTypeInfo = (message) => {
    const defaultType = { icon: "📝", label: "STANDARD" };
    if (!message.type) return defaultType;
    if (messageTypesHook && messageTypesHook.getMessageTypeInfo) {
      const info = messageTypesHook.getMessageTypeInfo(message.type);
      return { icon: info.icon || defaultType.icon, label: info.label || message.type.toUpperCase() };
    }
    // Fallback if hook not working as expected (should not happen)
    const typeUpper = message.type.toUpperCase();
    if (message.type === "reflection") return { icon: "↻", label: typeUpper };
    if (message.type === "critique") return { icon: "⚠", label: typeUpper };
    if (message.type === "analysis") return { icon: "⚙", label: typeUpper };
    if (message.type === "summary") return { icon: "◈", label: typeUpper };
    if (message.type === "observation") return { icon: "👁", label: typeUpper };
    if (message.type === "question") return { icon: "?", label: typeUpper };
    if (message.type === "action") return { icon: "▶", label: typeUpper };
    return { icon: defaultType.icon, label: typeUpper };
  };
  
  const agentColor = getAgentColor(message.agent);
  const typeInfo = getTypeInfo(message);
  
  const getRgbaBackground = (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  };
  
  // Reusable button style for MessageCard internal buttons
  const cardButtonStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '26px', 
    height: '26px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    lineHeight: 1 // ensure emoji doesn't cause height issues
  };

  return (
    <div style={{
      padding: "12px 16px", // Adjusted padding
      borderRadius: "10px", 
      background: getRgbaBackground(agentColor),
      border: `1px solid ${agentColor}`,
      opacity: isStreaming ? 0.6 : 1, // Slightly more opacity for streaming
      position: 'relative',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            backgroundColor: agentColor, 
            display: 'inline-block', 
            flexShrink: 0 
          }} title={`Agent: ${message.agent}`}></span> 
          <strong style={{ color: agentColor, fontSize: '15px' }}>
            {message.agent || "System"}
            {message.model ? <span style={{fontSize: '12px', color: '#8899aa'}}>{` (${message.model})`}</span> : ""}
          </strong>
          {isStreaming && <span style={{fontSize: '12px', color: agentColor, opacity: 0.8}}>(Streaming...)</span>}
          {message.timestamp && (
            <span style={{ fontSize: 11, color: "#778899", marginLeft: 'auto' }}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {message.type && (
            <span style={{ 
              fontSize: 11, 
              color: typeInfo.color || agentColor, // Use type specific color if available from hook
              background: 'rgba(0,0,0,0.2)',
              padding: '3px 7px', 
              borderRadius: '10px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }} title={`Message Type: ${typeInfo.label}`}>
              <span>{typeInfo.icon}</span>
              <span>{typeInfo.label}</span>
            </span>
          )}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(message.text).then(() => {
                  const btn = document.activeElement; if (btn) { btn.innerHTML = '✅'; setTimeout(() => { btn.innerHTML = '📋'; }, 1000);}
                }).catch(err => console.error('Failed to copy text: ', err));
              }}
              title="Copy message text"
              style={cardButtonStyle}
            >
              📋
            </button>
            {message.structured && Object.keys(message.structured).length > 0 && (
              <button 
                onClick={() => setShowRawJson(!showRawJson)}
                title={showRawJson ? "Hide Raw JSON" : "Show Raw JSON"}
                style={{...cardButtonStyle, background: showRawJson ? 'rgba(116, 208, 252, 0.2)' : 'rgba(255,255,255,0.05)'}}
              >
                {showRawJson ? '</>' : 'json'}
              </button>
            )}
            <button 
              onClick={() => setExpanded(!expanded)}
              title={expanded ? "Collapse message" : "Expand message"}
              style={cardButtonStyle}
            >
              {expanded ? '−' : '+'}
            </button>
          </div>
        </div>
      </div>
      <div style={{
        fontSize: '14px',
        lineHeight: '1.55',
        color: "#d0e0f0",
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: expanded ? 'none' : '150px',
        overflow: 'hidden',
        position: 'relative',
        paddingBottom: expanded ? '0' : '5px'
      }}>
        {message.text}
        {!expanded && message.text && message.text.length > 200 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
            background: `linear-gradient(transparent, ${getRgbaBackground(agentColor).replace(", 0.1)", ", 0.8)")})`,
            pointerEvents: 'none'
          }} />
        )}
      </div>
      {expanded && message.images && message.images.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {message.images.map((img, i) => (
            <div key={i} style={{ position: 'relative', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', overflow:'hidden' }}>
              <img 
                src={img.url || img} alt={img.alt || `Image ${i+1}`} 
                style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '6px', display: 'block' }} 
              />
              <a href={img.url || img} target="_blank" rel="noopener noreferrer"
                style={{...imageLinkStyle, background: 'rgba(0,0,0,0.5)', width:'22px', height:'22px', fontSize:'13px'}}
                title="Open image in new tab"
              >↗️</a>
            </div>
          ))}
        </div>
      )}
      {expanded && message.structured && typeof message.structured === "object" && Object.keys(message.structured).length > 0 && (
        <div style={{
          marginTop: 12, padding: '12px', background: "rgba(10, 15, 25, 0.7)", 
          borderRadius: 8, fontSize: 13, color: "#b0c0d0", border: "1px solid rgba(116, 208, 252, 0.15)"
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', display: "flex", justifyContent: "space-between", alignItems: 'center', color: '#8cb2d0' }}>
            <span>{showRawJson ? 'Raw Message Object:' : 'Structured Output:'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {!showRawJson && (
                <span style={{ fontSize: 11, color: "#778899", fontStyle: "italic" }}>({getStructuredType(message.structured)})</span>
              )}
              <button 
                onClick={() => {
                  const dataToCopy = showRawJson ? JSON.stringify(message, null, 2) : JSON.stringify(message.structured, null, 2);
                  navigator.clipboard.writeText(dataToCopy).then(() => { 
                    const btn = document.activeElement; if(btn) { btn.innerHTML = '✅'; setTimeout(() => {btn.innerHTML = '📋'; }, 1000);}
                  }).catch(err => console.error('Failed to copy: ', err));
                }}
                title={showRawJson ? "Copy Raw JSON" : "Copy Structured JSON"}
                style={{...cardButtonStyle, fontSize:'13px', width:'22px', height:'22px'}}
              >📋</button>
            </div>
          </div>
          <pre style={{ margin: 0, fontSize: 12, maxHeight: '300px', overflow: 'auto', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
            {showRawJson ? JSON.stringify(message, null, 2) : JSON.stringify(message.structured, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const imageLinkStyle = {
  position: 'absolute',
  top: '6px',
  right: '6px',
  background: 'rgba(0,0,0,0.6)',
  color: 'white',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  textDecoration: 'none',
  transition: 'background-color 0.2s ease',
  border: '1px solid rgba(255,255,255,0.2)'
};

// getStructuredType helper function (ensure it's defined)
const getStructuredType = (structured) => {
  if (!structured) return "Unknown";
  if (structured.memory_update) return "Memory Update";
  if (structured.heuristics) return "Heuristics";
  if (structured.analysis) return "Analysis";
  if (structured.cycleNumber || structured.cycle_number) return "Cycle Data";
  if (structured.decision || structured.reasoning) return "Reasoning";
  if (structured.evaluation) return "Evaluation";
  if (structured.number && structured.components) return "Structured Data";
  return "Data";
};

export default AdvancedLabTab; 