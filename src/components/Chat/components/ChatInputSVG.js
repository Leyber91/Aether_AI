// Fused SVG icons for ChatInput (blue/cyan glassy theme)
import React from 'react';

// Next Step (Suggestion) Icon: Lightbulb
export const NextStepsIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="10" fill="#e8f6ff"/>
    <path d="M11 6a4 4 0 0 1 2.7 6.98c-.19.17-.29.41-.22.65l.3 1.07a.5.5 0 0 1-.48.63h-4a.5.5 0 0 1-.48-.63l.3-1.07c.07-.24-.03-.48-.22-.65A4 4 0 0 1 11 6Zm-1 8h2m-2 2h2" stroke="#244e82" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Enhance Icon: Magic Wand
export const EnhanceIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="2" width="4" height="8" rx="2" fill="#a6f1ff"/>
    <rect x="2" y="9" width="8" height="4" rx="2" fill="#a6f1ff"/>
    <rect x="12" y="12" width="8" height="4" rx="2" fill="#74d0fc"/>
    <rect x="9" y="16" width="4" height="4" rx="2" fill="#74d0fc"/>
    <path d="M5 5l12 12" stroke="#244e82" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="16" cy="6" r="1" fill="#74d0fc"/>
    <circle cx="6" cy="16" r="1" fill="#a6f1ff"/>
  </svg>
);

// Send Icon: Paper Plane (keep existing, but tweak for clarity)
export const SendIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sendGrad" x1="0" y1="0" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a6f1ff"/>
        <stop offset="1" stopColor="#74d0fc"/>
      </linearGradient>
    </defs>
    <path d="M3 11l16-6-6 16-2.5-6.5L3 11z" fill="url(#sendGrad)" stroke="#244e82" strokeWidth="1.2"/>
  </svg>
);

// MCP Toggle Icon: Plug/Unplug (custom)
export const MCPToggleIcon = ({ size = 22, enabled = false }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="10" height="5" rx="2.5" fill={enabled ? "#74d0fc" : "#2a3650"} stroke="#244e82" strokeWidth="1.2"/>
    <rect x="9" y="5" width="4" height="6" rx="2" fill={enabled ? "#a6f1ff" : "#3d4a6b"} stroke="#244e82" strokeWidth="1.2"/>
    <circle cx="11" cy="17.5" r="1.2" fill={enabled ? "#74d0fc" : "#244e82"}/>
    <path d="M8 13v2m6-2v2" stroke={enabled ? "#a6f1ff" : "#244e82"} strokeWidth="1.2" strokeLinecap="round"/>
    <rect x="5.5" y="9.5" width="11" height="6" rx="3" stroke="#a6f1ff" strokeWidth="0.7" fill="none"/>
  </svg>
);
