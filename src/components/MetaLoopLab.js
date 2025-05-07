import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../api/apiService";
import LoopHistory from "./History/LoopHistory";
import { getAgentSystemPrompt, parseAndValidateAgentOutput } from "../utils/structuredOutput";
import processGraph from "../processGraph";

/**
 * MetaLoopLab (Redesigned Minimal)
 * Clean, full-width, minimal: select Model A, Model B, enter prompt, run loop.
 */
export default function MetaLoopLab({ fullPage }) {
  const [modelA, setModelA] = useState("");
  const [modelB, setModelB] = useState("");
  const [seedPrompt, setSeedPrompt] = useState("");
  const [messages, setMessages] = useState([]); // [{agent, model, text}]
  const [running, setRunning] = useState(false);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [groqModels, setGroqModels] = useState([]);
  const [providerA, setProviderA] = useState("ollama");
  const [providerB, setProviderB] = useState("ollama");
  const [currentStreamMsg, setCurrentStreamMsg] = useState(null); // {agent, model, text}
  const [error, setError] = useState("");
  const [maxSteps, setMaxSteps] = useState(8);
  const [endless, setEndless] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef(null);
  const runningRef = useRef(false);

  // Fetch models from backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/models/ollama`)
      .then(r => r.json())
      .then(data => setOllamaModels(Array.isArray(data) ? data : []))
      .catch(() => setOllamaModels([]));
    fetch(`${API_BASE_URL}/models/groq`)
      .then(r => r.json())
      .then(data => setGroqModels(Array.isArray(data) ? data : []))
      .catch(() => setGroqModels([]));
  }, []);

  function getModelOptions(provider) {
    if (provider === "ollama") return ollamaModels.map(m => ({ id: m.name, name: m.name }));
    if (provider === "groq") return groqModels.map(m => ({ id: m.id, name: m.id }));
    return [];
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStreamMsg]);

  async function fetchOllamaStream(agent, model, input, history, onToken, signal) {
    // Compose messages: system prompt, history, user input
    const messages = [
      { role: "system", content: agent.systemPrompt },
      ...history,
      { role: "user", content: input }
    ];
    try {
      const res = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true }),
        signal
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      let decoder = new TextDecoder();
      let done = false;
      let fullText = "";
      let partial = "";
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          partial += chunk;
          const lines = partial.split("\n");
          partial = lines.pop();
          for (const line of lines) {
            if (line.trim() === "" || line.trim() === "[DONE]") continue;
            const jsonStr = line.startsWith("data: ") ? line.slice(6) : line;
            try {
              const data = JSON.parse(jsonStr);
              const token = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content || "";
              if (token) {
                fullText += token;
                onToken(fullText);
              }
            } catch (e) {
              // Ignore parse errors for non-JSON lines
            }
          }
        }
      }
      return fullText;
    } catch (err) {
      throw err;
    }
  }

  function handleStop() {
    runningRef.current = false;
    setRunning(false);
  }

  // --- Flexible trailing JSON parser (robust) ---
  /**
   * Extract the last valid JSON object from a string, ignoring code blocks and <think>...</think> tags.
   * Returns the parsed object, or null if not found/parsable.
   * Usage: Allows agents to reason freely, then pass structured handoff fields at the end.
   *
   * Example:
   *   "<think>...reasoning...</think>\n{\n  \"foo\": 1\n}"
   *   => { foo: 1 }
   */
  function extractTrailingJson(text) {
    if (!text || typeof text !== 'string') return null;
    // Remove code blocks and <think>...</think> tags
    let cleaned = text.replace(/```[\s\S]*?```/g, '')
                      .replace(/<think>[\s\S]*?<\/think>/gi, '');
    // Find last { ... } block
    const match = cleaned.match(/\{[\s\S]*\}$/);
    if (!match) return null;
    try {
      // Try to parse, trimming whitespace
      return JSON.parse(match[0].trim());
    } catch (e) {
      // Optionally: console.warn('Failed to parse trailing JSON:', e, match[0]);
      return null;
    }
  }

  // --- Format prior context for prompt construction ---
  function formatPriorContext(history) {
    return history.map((msg, i) => {
      let parts = [`Step ${i + 1}:`];
      parts.push(`Agent: ${msg.agent}`);
      parts.push(`Output: ${msg.text}`);
      if (msg.structured && typeof msg.structured === 'object') {
        parts.push('Structured Fields:');
        for (const [key, value] of Object.entries(msg.structured)) {
          parts.push(`  ${key}: ${JSON.stringify(value)}`);
        }
      }
      return parts.join('\n');
    }).join('\n\n');
  }

  // --- CORE PROCESS GRAPH EXECUTION LOGIC ---
  async function startLoop() {
    try {
      runningRef.current = true;
      setRunning(true);
      setError("");
      setMessages([]);
      setCurrentStep(0);
      let abortController = new AbortController();
      const { nodes, edges, entry } = processGraph;
      let nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
      let currentNodeId = entry;
      let history = [];
      let displayHistory = [];
      let step = 0;
      const stepLimit = endless ? Infinity : maxSteps;
      let context = seedPrompt;
      while (step < stepLimit && runningRef.current && currentNodeId) {
        setCurrentStep(step + 1);
        const node = nodeMap[currentNodeId];
        if (!node) break;
        // Compose prompt for this node
        let priorContext = formatPriorContext(displayHistory);
        let prompt = `You are the ${node.data.label} agent.\nInstructions: ${node.data.instructions}\n` +
          (priorContext ? `Previous steps:\n${priorContext}\n` : "") +
          `User prompt: ${seedPrompt}\nYour job: ${node.data.instructions}\n` +
          `If you have a decision or action, output a JSON object at the end with any fields you think are needed for the next agent. Otherwise, just output your reasoning.`;
        // Model/provider selection
        let model = node.data.backend === "ollama" ? modelA : modelB;
        let agent = { name: node.data.label, provider: node.data.backend, model, systemPrompt: prompt };
        let response = "";
        try {
          if (agent.provider === "ollama") {
            setCurrentStreamMsg({ agent: agent.name, model: agent.model, text: "" });
            response = await fetchOllamaStream(
              agent,
              agent.model,
              context,
              history,
              (partial) => setCurrentStreamMsg({ agent: agent.name, model: agent.model, text: partial }),
              abortController.signal
            );
            setCurrentStreamMsg(null);
          } else {
            response = "[Provider not implemented]";
          }
          // Extract trailing JSON if present
          let structured = extractTrailingJson(response);
          // Always display the raw text as before
          history.push({ role: "assistant", content: response, agent: agent.name, model: agent.model });
          displayHistory.push({ agent: agent.name, model: agent.model, text: response, structured });
          setMessages([...displayHistory]);
          // Determine next node
          let next = null;
          if (structured && structured.next_node && nodeMap[structured.next_node]) {
            next = structured.next_node;
          } else {
            // Default to first outgoing edge
            const edge = edges.find(e => e.source === currentNodeId);
            next = edge ? edge.target : null;
          }
          context = response;
          currentNodeId = next;
          step++;
        } catch (err) {
          displayHistory.push({ agent: agent.name, model: agent.model, text: `[Error: ${err?.message || err}]` });
          setMessages([...displayHistory]);
          setError(err?.message || String(err));
          break;
        }
      }
      setRunning(false);
      setCurrentStreamMsg(null);
      runningRef.current = false;
      setCurrentStep(0);
      // Save conversation to backend
      try {
        await fetch(`${API_BASE_URL}/loop_conversations/${Date.now()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              processGraph,
              seedPrompt,
              messages: displayHistory,
              timestamp: new Date().toISOString()
            })
          }
        );
      } catch (e) { }
    } catch (err) {
      setError("Critical error: " + (err?.message || err));
    }
  }

  // --- Updated MessageBlock to show agent, model, reasoning, and ALL structured fields ---
  function MessageBlock({ message, isStreaming = false }) {
    const [expanded, setExpanded] = useState(isStreaming);
    useEffect(() => { if (isStreaming) setExpanded(true); }, [isStreaming]);
    // Helper to pretty-print structured fields
    function renderStructured(structured) {
      if (!structured || typeof structured !== 'object') return null;
      // Show all fields, not just a hardcoded list
      return (
        <div style={{ marginTop: 12, padding: 12, background: '#1e2736', borderRadius: 7, fontSize: 15, color: '#8ef', border: '1px solid #4ad3fa33' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Structured Output:</div>
          <table style={{ width: '100%', color: '#b3e6ff', fontSize: 15, borderCollapse: 'collapse' }}>
            <tbody>
              {Object.entries(structured).map(([key, value]) => (
                <tr key={key}>
                  <td style={{ fontWeight: 600, paddingRight: 12, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{key}:</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <div className={`meta-message-block glass-panel gradient-border${expanded ? ' expanded' : ''}`} style={{ marginBottom: 16, transition: 'box-shadow 0.3s' }}>
        <div className="meta-message-header" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: 'var(--space-bg-tertiary)', borderRadius: 'var(--border-radius-md) var(--border-radius-md) 0 0', padding: '8px 16px', borderBottom: '1px solid var(--glass-border-accent)', userSelect: 'none', }} onClick={() => setExpanded(e => !e)}>
          <span style={{ fontWeight: 700, color: 'var(--space-accent-primary)', marginRight: 8 }}>{message.agent || `Agent`}</span>
          <span style={{ color: '#aaa', marginRight: 8, fontSize: 13 }}>{message.model}</span>
          <span style={{ color: 'var(--space-text-tertiary)', fontSize: 13, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{expanded ? 'Click to collapse' : 'Click to expand'}</span>
          <span style={{ fontSize: 18, marginLeft: 8 }}>{expanded ? '▼' : '▶'}</span>
        </div>
        {expanded && (
          <div className="meta-message-content" style={{ background: 'var(--glass-bg-lighter)', borderRadius: '0 0 var(--border-radius-md) var(--border-radius-md)', padding: 18, fontFamily: 'var(--font-mono)', color: 'var(--space-text-primary)', fontSize: 16, lineHeight: 1.7, boxShadow: '0 2px 12px rgba(99,102,241,0.08)', whiteSpace: 'pre-line', transition: 'background 0.2s', }}>
            {message.text}
            {renderStructured(message.structured)}
          </div>
        )}
      </div>
    );
  }

  // --- Enhanced SplitConversationPanel: show all messages in sequence, not just split left/right ---
  function SplitConversationPanel({ messages }) {
    return (
      <div style={{ width: '100%' }}>
        {messages.map((msg, idx) => (
          <MessageBlock key={idx} message={msg} isStreaming={false} />
        ))}
      </div>
    );
  }

  return (
    <div className="meta-loop-lab space-bg" style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'stretch', justifyContent: 'center', padding: 0, overflow: 'hidden' }}>
      <div className="meta-loop-container glass-panel gradient-border" style={{
        maxWidth: 1100,
        width: '100%',
        margin: '2vh auto',
        minHeight: '92vh',
        height: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: 0,
        overflow: 'hidden',
      }}>
        {/* --- Animated Banner --- */}
        <div style={{ padding: '32px 40px 0 40px', width: '100%', flexShrink: 0 }}>
          <MetaLoopBanner />
        </div>
        {/* --- Controls Panel (more compact, integrated) --- */}
        <div style={{ padding: '0 40px 0 40px', width: '100%', flexShrink: 0, marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 18, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontWeight: 600, color: '#74d0fc', marginBottom: 4, display: 'block', fontSize: 15 }}>Provider A</label>
              <select value={providerA} onChange={e => { setProviderA(e.target.value); setModelA(""); }} style={{ width: '100%', fontSize: 15, padding: 8, borderRadius: 7, border: '1px solid #4ad3fa55', background: '#192436', color: '#a6f1ff', marginBottom: 6 }}>
                <option value="ollama">Ollama</option>
                <option value="groq">Groq</option>
              </select>
              <label style={{ fontWeight: 600, color: '#74d0fc', marginBottom: 4, display: 'block', fontSize: 15 }}>Model A</label>
              <select value={modelA} onChange={e => setModelA(e.target.value)} style={{ width: '100%', fontSize: 15, padding: 8, borderRadius: 7, border: '1px solid #4ad3fa55', background: '#192436', color: '#a6f1ff' }}>
                <option value="">Select Model A</option>
                {getModelOptions(providerA).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontWeight: 600, color: '#74d0fc', marginBottom: 4, display: 'block', fontSize: 15 }}>Provider B</label>
              <select value={providerB} onChange={e => { setProviderB(e.target.value); setModelB(""); }} style={{ width: '100%', fontSize: 15, padding: 8, borderRadius: 7, border: '1px solid #4ad3fa55', background: '#192436', color: '#a6f1ff', marginBottom: 6 }}>
                <option value="ollama">Ollama</option>
                <option value="groq">Groq</option>
              </select>
              <label style={{ fontWeight: 600, color: '#74d0fc', marginBottom: 4, display: 'block', fontSize: 15 }}>Model B</label>
              <select value={modelB} onChange={e => setModelB(e.target.value)} style={{ width: '100%', fontSize: 15, padding: 8, borderRadius: 7, border: '1px solid #4ad3fa55', background: '#192436', color: '#a6f1ff' }}>
                <option value="">Select Model B</option>
                {getModelOptions(providerB).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          {/* Seed Prompt full-width, compact */}
          <div style={{ marginBottom: 14, width: '100%' }}>
            <label style={{ fontWeight: 600, color: '#74d0fc', marginBottom: 4, display: 'block', fontSize: 15 }}>Seed Prompt</label>
            <textarea
              value={seedPrompt}
              onChange={e => setSeedPrompt(e.target.value)}
              rows={2}
              style={{ width: '100%', fontSize: 15, borderRadius: 7, padding: 8, background: '#192436', color: '#a6f1ff', border: '1px solid #4ad3fa55', resize: 'vertical', minHeight: 44 }}
              placeholder="Enter a topic, question, or scenario for the models to discuss..."
              disabled={running}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 18, marginBottom: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ minWidth: 120, flex: '0 0 120px', marginRight: 14 }}>
              <label style={{ fontWeight: 600, color: '#74d0fc', marginBottom: 4, display: 'block', fontSize: 15 }}>Max Steps</label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxSteps}
                disabled={endless || running}
                onChange={e => setMaxSteps(Math.max(1, Math.min(100, Number(e.target.value))))}
                style={{ width: '100%', fontSize: 15, padding: 8, borderRadius: 7, border: '1px solid #4ad3fa55', background: endless ? '#222a36' : '#192436', color: endless ? '#aaa' : '#a6f1ff', opacity: endless ? 0.5 : 1 }}
              />
            </div>
            <div style={{ minWidth: 110, flex: '0 0 110px', marginRight: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                id="endless"
                checked={endless}
                disabled={running}
                onChange={e => setEndless(e.target.checked)}
                style={{ marginRight: 7, accentColor: '#74d0fc', width: 18, height: 18 }}
              />
              <label htmlFor="endless" style={{ fontWeight: 600, color: '#74d0fc', fontSize: 15, cursor: running ? 'not-allowed' : 'pointer', userSelect: 'none' }}>
                Endless
              </label>
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={startLoop}
              disabled={running || modelA === "" || modelB === "" || seedPrompt === ""}
              style={{ flex: 1, padding: '10px 0', fontSize: 16, borderRadius: 7, background: '#74d0fc', color: '#182c3d', fontWeight: 700, border: 'none', boxShadow: '0 2px 8px #4ad3fa33', opacity: running || modelA === "" || modelB === "" || seedPrompt === "" ? 0.6 : 1, cursor: running || modelA === "" || modelB === "" || seedPrompt === "" ? 'not-allowed' : 'pointer' }}
            >
              Start Loop
            </button>
            <button
              onClick={handleStop}
              disabled={!running}
              style={{ flex: 1, padding: '10px 0', fontSize: 16, borderRadius: 7, background: running ? '#e17' : '#aaa', color: '#fff', fontWeight: 700, border: 'none', opacity: !running ? 0.6 : 1, cursor: !running ? 'not-allowed' : 'pointer' }}
            >
              Stop
            </button>
          </div>
          {running && (
            <div style={{ margin: '0 0 12px 0', color: '#74d0fc', fontWeight: 600, fontSize: 16, textAlign: 'right' }}>
              Step: {currentStep}{!endless && ` / ${maxSteps}`}
            </div>
          )}

        </div>
        {/* Conversation Panel fills remaining height, never overflows the card */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 40px 40px 40px', width: '100%', minHeight: 0, overflow: 'hidden' }}>
          <label style={{ color: 'var(--space-text-secondary)', fontWeight: 600, fontSize: 18, marginBottom: 8, display: 'block' }}>Conversation</label>
          <div
            className="meta-messages-scroll"
            ref={scrollRef}
            style={{
              flex: 1,
              minHeight: 120,
              maxHeight: '100%',
              overflowY: 'auto',
              background: 'var(--glass-bg)',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--glass-border-accent)',
              boxShadow: '0 4px 24px rgba(99,102,241,0.06)',
              padding: 16,
              marginBottom: 8,
              transition: 'background 0.2s',
              boxSizing: 'border-box',
              width: '100%',
              minHeight: 0,
            }}
          >
            <SplitConversationPanel messages={messages} />
            {currentStreamMsg && (
              <MessageBlock key="streaming" message={currentStreamMsg} isStreaming={true} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Animated MetaLoopLab Banner ---
function MetaLoopBanner() {
  // Simple animated SVG loop (could be replaced with a more complex animation)
  return (
    <div style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      minHeight: 64,
      position: 'relative',
    }}>
      <svg width="200" height="56" viewBox="0 0 200 56" fill="none" style={{ marginRight: 22 }}>
        <g>
          <ellipse cx="28" cy="28" rx="26" ry="26" stroke="#74d0fc" strokeWidth="4" fill="none">
            <animateTransform attributeName="transform" type="rotate" from="0 28 28" to="360 28 28" dur="2.2s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="172" cy="28" rx="26" ry="26" stroke="#8b5cf6" strokeWidth="4" fill="none">
            <animateTransform attributeName="transform" type="rotate" from="360 172 28" to="0 172 28" dur="2.8s" repeatCount="indefinite" />
          </ellipse>
          <text x="100" y="36" textAnchor="middle" fontWeight="bold" fontSize="32" fill="#fff" style={{ letterSpacing: 2 }}>∞</text>
        </g>
      </svg>
      <div style={{ flex: 1 }}>
        <h1 style={{
          background: 'var(--header-text-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 900,
          fontSize: 36,
          letterSpacing: 2,
          margin: 0,
          padding: 0,
          textShadow: '0 4px 32px #0a1120',
          lineHeight: 1.1,
          animation: 'fadein 1s',
        }}>MetaLoopLab</h1>
        <div style={{ color: 'var(--space-text-secondary)', fontSize: 18, marginTop: 2, fontWeight: 500, letterSpacing: 0.5 }}>
          AI model conversations in infinite creative loops
        </div>
      </div>
    </div>
  );
}
