import React, { useRef, useEffect } from "react";

/**
 * Advanced modular chat/conversation UI for MetaLoopLab
 * Implements Blueprint 3.3.4 - Specialized UI for scape observation
 * Handles scroll-to-bottom, streaming, error, multi-modal content, and message typing
 * Props:
 *   - messages: Array of chat messages
 *   - currentStreamMsg: Streaming message (if any)
 *   - running: Whether loop is running
 *   - error: Error string (if any)
 */
const MetaLoopChat = ({ messages, currentStreamMsg, running, error }) => {
  const scrollRef = useRef(null);

  // Scroll to bottom on new message or stream
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    }
  }, [messages, currentStreamMsg]);

  // Helper function to render content based on type
  const renderMessageContent = (message) => {
    // Handle multi-modal content
    if (message.images && message.images.length > 0) {
      return (
        <>
          <div style={{ marginTop: 5, whiteSpace: "pre-wrap" }}>{message.text}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {message.images.map((img, i) => (
              <img 
                key={i} 
                src={img.url || img} 
                alt={img.alt || `Image ${i+1}`} 
                style={{ 
                  maxWidth: "100%", 
                  maxHeight: 300, 
                  borderRadius: 4, 
                  border: "1px solid rgba(255,255,255,0.1)" 
                }} 
              />
            ))}
          </div>
        </>
      );
    }
    
    // Standard text content
    return <div style={{ marginTop: 5 }}>{message.text}</div>;
  };

  // Get color based on agent type
  const getAgentColor = (agent) => {
    if (!agent) return "#aaa";
    
    if (agent.includes("Agent A") || agent === "Agent A") return "#74d0fc";
    if (agent.includes("Agent B") || agent === "Agent B") return "#f7b267";
    if (agent.includes("Agent R") || agent === "Agent R" || agent.includes("Reflector")) return "#9f85ff";
    if (agent.includes("Meta") || agent === "Meta Agent") return "#64ecaa";
    if (agent.includes("Critic") || agent === "Critic Agent") return "#ff8570";
    if (agent.includes("System")) return "#aaa";
    
    // Default color for unknown agents
    return "#e0f0ff";
  };

  // Get background color based on agent type
  const getAgentBackground = (agent) => {
    if (!agent) return "rgba(80, 80, 80, 0.1)";
    
    if (agent.includes("Agent A") || agent === "Agent A") return "rgba(116, 208, 252, 0.1)";
    if (agent.includes("Agent B") || agent === "Agent B") return "rgba(247, 178, 103, 0.1)";
    if (agent.includes("Agent R") || agent === "Agent R" || agent.includes("Reflector")) return "rgba(159, 133, 255, 0.1)";
    if (agent.includes("Meta") || agent === "Meta Agent") return "rgba(100, 236, 170, 0.1)";
    if (agent.includes("Critic") || agent === "Critic Agent") return "rgba(255, 133, 112, 0.1)";
    if (agent.includes("System")) return "rgba(80, 80, 80, 0.1)";
    
    // Default background for unknown agents
    return "rgba(224, 240, 255, 0.05)";
  };

  // Get border color based on agent type
  const getAgentBorder = (agent) => {
    if (!agent) return "#555";
    
    if (agent.includes("Agent A") || agent === "Agent A") return "#74d0fc";
    if (agent.includes("Agent B") || agent === "Agent B") return "#f7b267";
    if (agent.includes("Agent R") || agent === "Agent R" || agent.includes("Reflector")) return "#9f85ff";
    if (agent.includes("Meta") || agent === "Meta Agent") return "#64ecaa";
    if (agent.includes("Critic") || agent === "Critic Agent") return "#ff8570";
    if (agent.includes("System")) return "#555";
    
    // Default border for unknown agents
    return "#777";
  };

  // Get message type indicator
  const getMessageTypeIndicator = (message) => {
    if (message.type === "reflection") return "↻ REFLECTION";
    if (message.type === "critique") return "⚠ CRITIQUE";
    if (message.type === "analysis") return "⚙ ANALYSIS";
    if (message.type === "summary") return "◈ SUMMARY";
    if (message.type === "observation") return "👁 OBSERVATION";
    if (message.type === "question") return "? QUESTION";
    if (message.type === "action") return "▶ ACTION";
    
    // No type indicator for standard messages
    return null;
  };

  return (
    <div
      ref={scrollRef}
      className="meta-messages-scroll custom-scrollbar"
      style={{
        flex: "1 1 0%",
        minHeight: 0,
        overflowY: "auto",
        background: "var(--glass-bg)",
        borderRadius: "var(--border-radius-lg)",
        border: "1px solid var(--glass-border-accent)",
        boxShadow: "rgba(99, 102, 241, 0.06) 0px 4px 24px",
        padding: 16,
        marginBottom: 8,
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* Error display */}
      {error && (
        <div style={{ color: '#ff7676', background: '#2a1a1a', border: '1px solid #a33', borderRadius: 7, padding: 12, marginBottom: 10, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Chat messages */}
      {messages.map((message, idx) => (
        <div
          key={idx}
          style={{
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px",
            background: getAgentBackground(message.agent),
            border: `1px solid ${getAgentBorder(message.agent)}`,
            opacity: currentStreamMsg && message === currentStreamMsg ? 0.7 : 1,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "monospace",
            fontSize: 15,
            color: "#e0f0ff"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <strong style={{ color: getAgentColor(message.agent) }}>
              {message.agent || "System"}
              {message.model ? ` (${message.model})` : ""}
              {currentStreamMsg && message === currentStreamMsg ? " (Streaming...)" : ""}:
            </strong>
            
            {/* Message type indicator */}
            {getMessageTypeIndicator(message) && (
              <span style={{ 
                fontSize: 12, 
                color: getAgentColor(message.agent), 
                background: 'rgba(30,40,60,0.6)', 
                padding: '3px 6px', 
                borderRadius: 4,
                fontWeight: 600
              }}>
                {getMessageTypeIndicator(message)}
              </span>
            )}
          </div>
          
          {/* Message content (text or multi-modal) */}
          {renderMessageContent(message)}
          
          {/* Structured output */}
          {message.structured && typeof message.structured === "object" && Object.keys(message.structured).length > 0 && (
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              background: "#1e2736", 
              borderRadius: 7, 
              fontSize: 15, 
              color: "#8ef", 
              border: "1px solid #4ad3fa33"
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span>Structured Output:</span>
                <span style={{ 
                  fontSize: 12, 
                  color: "#aaa", 
                  fontStyle: "italic"
                }}>
                  {getStructuredType(message.structured)}
                </span>
              </div>
              <table style={{ width: "100%", color: "#b3e6ff", fontSize: 15, borderCollapse: "collapse" }}>
                <tbody>
                  {Object.entries(message.structured).map(([key, value]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 600, paddingRight: 12, verticalAlign: "top", whiteSpace: "nowrap" }}>{key}:</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>{formatStructuredValue(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Streaming message (if any, not duplicate) */}
      {currentStreamMsg && !messages.some(m => m.text === currentStreamMsg.text && m.agent === currentStreamMsg.agent) && (
        <div
          style={{
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px",
            background: getAgentBackground(currentStreamMsg.agent),
            border: `1px solid ${getAgentBorder(currentStreamMsg.agent)}`,
            opacity: 0.7,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "monospace",
            fontSize: 15,
            color: "#e0f0ff"
          }}
        >
          <strong style={{ color: getAgentColor(currentStreamMsg.agent) }}>
            {currentStreamMsg.agent || "System"}
            {currentStreamMsg.model ? ` (${currentStreamMsg.model})` : ""} (Streaming...):
          </strong>
          <div style={{ marginTop: 5 }}>{currentStreamMsg.text}</div>
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 && !currentStreamMsg && !running && !error && (
        <div style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic', padding: '2em 1em ' }}>
          Loop output will appear here...
        </div>
      )}
    </div>
  );
};

// Helper to format structured values with better display
const formatStructuredValue = (value) => {
  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      // Format arrays better
      if (value.length === 0) return "[]";
      if (typeof value[0] === "string" && value.every(item => typeof item === "string")) {
        // Simple string array formatting
        return value.map(item => `• ${item}`).join("\n");
      }
      // Complex array - use JSON pretty print
      return JSON.stringify(value, null, 2);
    } 
    // Objects - use JSON pretty print
    return JSON.stringify(value, null, 2);
  }
  // Simple values
  return String(value);
};

// Helper to determine the type of structured output
const getStructuredType = (structured) => {
  if (structured.memory_update) return "Memory Update";
  if (structured.heuristics) return "Heuristics";
  if (structured.analysis) return "Analysis";
  if (structured.cycleNumber || structured.cycle_number) return "Cycle Data";
  if (structured.decision || structured.reasoning) return "Reasoning";
  if (structured.evaluation) return "Evaluation";
  return "Data"; // Generic fallback
};

export default MetaLoopChat;
