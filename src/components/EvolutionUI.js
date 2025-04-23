// EvolutionUI.js
// Floating UI controls for mutation rate, evolution speed, god mode, and bloom toggle
import React, { useState } from 'react';

export default function EvolutionUI({ mutationRate, setMutationRate, evolutionSpeed, setEvolutionSpeed, godMode, setGodMode, bloom, setBloom }) {
  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, background: 'rgba(16,32,48,0.86)', borderRadius: 12, padding: 18, color: '#00eaff', fontFamily: 'monospace', boxShadow: '0 4px 24px #0008' }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Evolution Controls</div>
      <div style={{ marginBottom: 10 }}>
        <label>Mutation Rate: {mutationRate.toFixed(3)}</label><br />
        <input type="range" min={0.001} max={0.1} step={0.001} value={mutationRate} onChange={e => setMutationRate(parseFloat(e.target.value))} style={{ width: 120 }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>Evolution Speed: {evolutionSpeed}x</label><br />
        <input type="range" min={1} max={10} step={1} value={evolutionSpeed} onChange={e => setEvolutionSpeed(parseInt(e.target.value))} style={{ width: 120 }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label><input type="checkbox" checked={godMode} onChange={e => setGodMode(e.target.checked)} /> God Mode</label>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label><input type="checkbox" checked={bloom} onChange={e => setBloom(e.target.checked)} /> Bloom Effect</label>
      </div>
    </div>
  );
}
