// --- Imports ---
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../api/apiService";
import LoopHistory from "../History/LoopHistory";
import processGraph from "../../processGraph";

import MetaLoopChat from "./MetaLoopChat";
import MetaLoopAnimation from "./components/MetaLoopAnimation";
import MetaLoopBanner from "./components/MetaLoopBanner";

// Custom hooks and utilities
import { useMetaLoopOrchestration } from "./hooks/useMetaLoopOrchestration";

/**
 * MetaLoopLab Component (Main)
 * Central component for the meta-loop functionality
 */
export default function MetaLoopLab({ fullPage }) {
    // State for model data
    const [ollamaModels, setOllamaModels] = useState([]);
    const [groqModels, setGroqModels] = useState([]);

    // Fetch models on component mount
    useEffect(() => {
        fetch(`${API_BASE_URL}/models/ollama`)
            .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
            .then(data => setOllamaModels(Array.isArray(data) ? data : []))
            .catch(err => { console.warn("Ollama models fetch failed:", err); setOllamaModels([]); });
        fetch(`${API_BASE_URL}/models/groq`)
            .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
            .then(data => setGroqModels(Array.isArray(data) ? data : []))
            .catch(err => { console.warn("Groq models fetch failed:", err); setGroqModels([]); });
    }, []);

    // Helper function for model options
    function getModelOptionsList(provider) {
        if (provider === "ollama") return ollamaModels.map(m => ({ id: m.name, name: m.name }));
        if (provider === "groq") return groqModels.map(m => ({ id: m.id, name: m.id }));
        return [];
    }
    
    // Use the orchestration hook to manage loop state and logic
    const {
        // State
        modelA,
        modelB,
        seedPrompt,
        messages,
        running,
        providerA,
        providerB,
        currentStreamMsg,
        error,
        maxSteps,
        endless,
        currentStep,
        streamingActive,
        
        // Setters
        setModelA,
        setModelB,
        setSeedPrompt,
        setProviderA,
        setProviderB,
        setMaxSteps,
        setEndless,
        
        // Actions
        startLoop,
        handleStop
    } = useMetaLoopOrchestration({ processGraph, initialSeedPrompt: "" });
    
    // Main render

  // --- Main Render ---
  return (
    <div className="meta-loop-lab space-bg" style={{ minHeight: '100vh', width: '100vw', display: 'grid', gridTemplateRows: 'auto 1fr', padding: 0, overflow: 'hidden', background: 'radial-gradient(ellipse at 60% 30%, #22304a 60%, #10141f 100%)' }}>
      {/* Banner/Header */}
      <div style={{ padding: '32px 64px 0 64px', width: '100%', flexShrink: 0, background: 'linear-gradient(90deg, rgba(20,28,40,0.94) 80%, rgba(116,208,252,0.07) 100%)', zIndex: 2, borderBottom: '1.5px solid #2b3c53', boxShadow: '0 2px 12px 0 rgba(74,211,250,0.09)' }}>
        <MetaLoopBanner />
      </div>
      {/* Main Content Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '20vw 80vw',
        gap: 0,
        height: '100%',
        width: '100%',
        background: 'transparent',
        alignItems: 'stretch',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 0 32px 0 rgba(74,211,250,0.05)',
        borderRadius: 24,
      }}>
        {/* Controls/Sidebar */}
        <div style={{
          padding: '0 32px',
          borderRight: '2px solid #2b3c53',
          background: 'linear-gradient(120deg, rgba(26,34,51,0.95) 80%, rgba(34,48,74,0.98) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          height: '100%',
          zIndex: 2,
          boxShadow: '2px 0 32px 0 rgba(74,211,250,0.10)',
          borderTopLeftRadius: 24,
          borderBottomLeftRadius: 24,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}>
          {/* Controls */}
          <div style={{
            background: 'rgba(28, 44, 74, 0.85)',
            borderRadius: 18,
            boxShadow: '0 4px 32px 0 rgba(74,211,250,0.10)',
            padding: '28px 18px 22px 18px',
            margin: '32px 0 0 0',
            border: '1.5px solid rgba(116,208,252,0.10)',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            width: '100%',
            flexShrink: 0,
          }}>
            {/* Model Selectors */}
            <div style={{ display: 'flex', gap: 18, marginBottom: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontWeight: 600, color: '#74d0fc', marginBottom: 6, display: 'block', fontSize: 18, letterSpacing: 0.2 }}>Provider A</label>
                <select value={providerA} onChange={e => { setProviderA(e.target.value); setModelA(""); }} style={{ width: '100%', fontSize: 18, padding: 12, borderRadius: 10, border: '1.5px solid #4ad3fa88', background: '#192436', color: '#a6f1ff', marginBottom: 10 }}> <option value="ollama">Ollama</option> </select>
                <label style={{ fontWeight: 600, color: '#74d0fc', marginBottom: 6, display: 'block', fontSize: 18, letterSpacing: 0.2 }}>Model A</label>
                <select value={modelA} onChange={e => setModelA(e.target.value)} style={{ width: '100%', fontSize: 18, padding: 12, borderRadius: 10, border: '1.5px solid #4ad3fa88', background: '#192436', color: '#a6f1ff' }}> <option value="">Select Model A</option> {getModelOptionsList(providerA).map(m => <option key={m.id} value={m.id}>{m.name}</option>)} </select>
              </div>
              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontWeight: 600, color: '#f7b267', marginBottom: 6, display: 'block', fontSize: 18, letterSpacing: 0.2 }}>Provider B</label>
                <select value={providerB} onChange={e => { setProviderB(e.target.value); setModelB(""); }} style={{ width: '100%', fontSize: 18, padding: 12, borderRadius: 10, border: '1.5px solid #f7b26788', background: '#192436', color: '#a6f1ff', marginBottom: 10 }}> <option value="ollama">Ollama</option> </select>
                <label style={{ fontWeight: 600, color: '#f7b267', marginBottom: 6, display: 'block', fontSize: 18, letterSpacing: 0.2 }}>Model B</label>
                <select value={modelB} onChange={e => setModelB(e.target.value)} style={{ width: '100%', fontSize: 18, padding: 12, borderRadius: 10, border: '1.5px solid #f7b26788', background: '#192436', color: '#a6f1ff' }}> <option value="">Select Model B</option> {getModelOptionsList(providerB).map(m => <option key={m.id} value={m.id}>{m.name}</option>)} </select>
              </div>
            </div>
            {/* Seed Prompt */}
            <div style={{ marginBottom: 14, width: '100%' }}>
              <label style={{ fontWeight: 600, color: '#74d0fc', marginBottom: 4, display: 'block', fontSize: 15 }}>Seed Prompt</label>
              <textarea value={seedPrompt} onChange={e => setSeedPrompt(e.target.value)} rows={2} style={{ width: '100%', fontSize: 15, borderRadius: 7, padding: 8, background: '#192436', color: '#a6f1ff', border: '1px solid #4ad3fa55', resize: 'vertical', minHeight: 44 }} placeholder="Enter initial topic..." disabled={running} autoFocus />
            </div>
            {/* Loop Controls */}
            <div style={{ display: 'flex', gap: 18, marginBottom: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ minWidth: 120, flex: '0 0 120px', marginRight: 14 }}> <label style={{ fontWeight: 600, color: '#74d0fc', marginBottom: 4, display: 'block', fontSize: 15 }}>Max Steps</label> <input type="number" min={1} max={100} value={maxSteps} disabled={endless || running} onChange={e => setMaxSteps(Math.max(1, Math.min(100, Number(e.target.value))))} style={{ width: '100%', fontSize: 15, padding: 8, borderRadius: 7, border: '1px solid #4ad3fa55', background: endless ? '#222a36' : '#192436', color: endless ? '#aaa' : '#a6f1ff', opacity: endless ? 0.5 : 1 }} /> </div>
              <div style={{ minWidth: 110, flex: '0 0 110px', marginRight: 14, display: 'flex', alignItems: 'center', gap: 6 }}> <input type="checkbox" id="endless" checked={endless} disabled={running} onChange={e => setEndless(e.target.checked)} style={{ marginRight: 7, accentColor: '#74d0fc', width: 18, height: 18 }} /> <label htmlFor="endless" style={{ fontWeight: 600, color: '#74d0fc', fontSize: 15, cursor: running ? 'not-allowed' : 'pointer', userSelect: 'none' }}> Endless </label> </div>
              <div style={{ flex: 1 }} />
              <button onClick={startLoop} disabled={running || !modelA || !modelB || !seedPrompt} style={{ flex: 1, padding: '10px 0', fontSize: 16, borderRadius: 7, background: '#74d0fc', color: '#182c3d', fontWeight: 700, border: 'none', boxShadow: '0 2px 8px #4ad3fa33', opacity: running || !modelA || !modelB || !seedPrompt ? 0.6 : 1, cursor: running || !modelA || !modelB || !seedPrompt ? 'not-allowed' : 'pointer' }}> {running ? 'Running...' : 'Start Loop'} </button>
              <button onClick={handleStop} disabled={!running} style={{ flex: 1, padding: '10px 0', fontSize: 16, borderRadius: 7, background: running ? '#ff6a6a' : '#aaa', color: '#fff', fontWeight: 700, border: 'none', opacity: !running ? 0.6 : 1, cursor: !running ? 'not-allowed' : 'pointer' }}> Stop </button>
            </div>
            {running && ( <div style={{ margin: '0 0 12px 0', color: '#74d0fc', fontWeight: 600, fontSize: 16, textAlign: 'right' }}> Step: {currentStep}{!endless && ` / ${maxSteps}`} </div> )}
            {error && <div style={{ color: '#ff6a6a', marginBottom: 10, fontWeight: 600 }}>Error: {error}</div>}
          </div>
        </div>
        {/* Animation & Chat Area */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          width: '100%',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          background: 'linear-gradient(120deg, #192436 80%, #22304a 100%)',
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          boxShadow: '0 0 32px 0 rgba(74,211,250,0.08)',
        }}>
          {/* Animation Area */}
          <div style={{
            width: '100%',
            minHeight: 320,
            height: '32vh',
            maxHeight: 400,
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(90deg, rgba(24,34,54,0.99) 80%, rgba(116,208,252,0.06) 100%)',
            position: 'relative',
            zIndex: 1,
            borderBottom: '2px solid #27334a',
            marginBottom: 0,
            borderTopRightRadius: 24,
            borderTopLeftRadius: 0,
            padding: '0 42px',
            overflow: 'hidden',
          }}>
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MetaLoopAnimation
                streamingActive={streamingActive}
                messages={
                  currentStreamMsg && streamingActive
                    ? [...messages, { ...currentStreamMsg, __pending: true }]
                    : messages
                }
                running={running}
                currentStreamMsg={currentStreamMsg}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
          {/* Conversation Panel */}
          <div style={{
            flex: '1 1 0%',
            display: 'flex',
            flexDirection: 'column',
            padding: '0px 42px 36px',
            width: '100%',
            minHeight: 0,
            height: 'calc(100vh - 110px - 32vh)',
            maxHeight: 'calc(100vh - 110px - 32vh)',
            overflow: 'hidden',
            borderBottomRightRadius: 24,
            background: 'rgba(25, 36, 54, 0.98)',
            boxSizing: 'border-box',
            position: 'relative', // for absolute border
          }}>
            <label style={{
              color: 'var(--space-text-secondary)',
              fontWeight: 600,
              fontSize: 18,
              marginBottom: 8,
              display: 'block',
              flexShrink: 0,
              borderBottom: '1.5px solid #22304a',
              paddingBottom: 6,
              marginTop: 6,
            }}>Conversation</label>
            <div style={{
              flex: '1 1 0%',
              minHeight: 0,
              overflowY: 'auto',
              background: 'var(--glass-bg)',
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--glass-border-accent)',
              boxShadow: 'rgba(99, 102, 241, 0.06) 0px 4px 24px',
              padding: '16px',
              marginBottom: 8,
              width: '100%',
              boxSizing: 'border-box',
              paddingBottom: 32,
            }}>
              <MetaLoopChat
                messages={messages}
                currentStreamMsg={currentStreamMsg}
                running={running}
                error={error}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}