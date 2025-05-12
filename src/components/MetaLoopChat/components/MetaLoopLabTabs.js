import React from "react";

/**
 * Tab selector for MetaLoopLab modes
 * @param {string[]} modes - List of mode names
 * @param {string} activeMode - Currently selected mode
 * @param {function} onSwitch - Callback when mode changes
 */
export default function MetaLoopLabTabs({ modes, activeMode, onSwitch }) {
  return (
    <div style={{ display: 'flex', gap: 18, marginBottom: 18, padding: '0 8px' }}>
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => onSwitch(mode)}
          style={{
            padding: '10px 26px',
            fontSize: 18,
            fontWeight: 700,
            borderRadius: 14,
            border: activeMode === mode ? '2px solid #74d0fc' : '2px solid #22304a',
            background: activeMode === mode ? 'linear-gradient(90deg, #22304a 80%, #74d0fc33 100%)' : '#182436',
            color: activeMode === mode ? '#74d0fc' : '#a6f1ff',
            cursor: activeMode === mode ? 'default' : 'pointer',
            boxShadow: activeMode === mode ? '0 2px 12px #74d0fc22' : 'none',
            outline: 'none',
            transition: 'all 0.15s',
          }}
          disabled={activeMode === mode}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
