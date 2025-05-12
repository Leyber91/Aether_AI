import React, { useRef, useEffect } from "react";

/**
 * Modular chat/conversation UI for MetaLoopLab
 * Handles scroll-to-bottom, streaming, error, and empty state
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
            background: message.agent === "Agent A" ? "rgba(116, 208, 252, 0.1)" : "rgba(247, 178, 103, 0.1)",
            border: `1px solid ${message.agent === "Agent A" ? "#74d0fc" : "#f7b267"}`,
            opacity: currentStreamMsg && message === currentStreamMsg ? 0.7 : 1,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "monospace",
            fontSize: 15,
            color: "#e0f0ff"
          }}
        >
          <strong style={{ color: message.agent === "Agent A" ? "#74d0fc" : "#f7b267" }}>
            {message.agent || "System"}
            {message.model ? ` (${message.model})` : ""}
            {currentStreamMsg && message === currentStreamMsg ? " (Streaming...)" : ""}:
          </strong>
          <div style={{ marginTop: 5 }}>{message.text}</div>
          {message.structured && typeof message.structured === "object" && Object.keys(message.structured).length > 0 && (
            <div style={{ marginTop: 12, padding: 12, background: "#1e2736", borderRadius: 7, fontSize: 15, color: "#8ef", border: "1px solid #4ad3fa33" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Structured Output:</div>
              <table style={{ width: "100%", color: "#b3e6ff", fontSize: 15, borderCollapse: "collapse" }}>
                <tbody>
                  {Object.entries(message.structured).map(([key, value]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 600, paddingRight: 12, verticalAlign: "top", whiteSpace: "nowrap" }}>{key}:</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>{typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}</td>
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
            background: currentStreamMsg.agent === "Agent A" ? "rgba(116, 208, 252, 0.1)" : "rgba(247, 178, 103, 0.1)",
            border: `1px solid ${currentStreamMsg.agent === "Agent A" ? "#74d0fc" : "#f7b267"}`,
            opacity: 0.7,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "monospace",
            fontSize: 15,
            color: "#e0f0ff"
          }}
        >
          <strong style={{ color: currentStreamMsg.agent === "Agent A" ? "#74d0fc" : "#f7b267" }}>
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

export default MetaLoopChat;
