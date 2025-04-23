import React from 'react';

export const GroqIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="groqGlow" cx="50%" cy="50%" r="80%">
        <stop offset="0%" stopColor="#a6f1ff" stopOpacity="0.8" />
        <stop offset="80%" stopColor="#244e82" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#121826" stopOpacity="0.1" />
      </radialGradient>
    </defs>
    <circle cx="16" cy="16" r="13" fill="url(#groqGlow)" />
    <path d="M10 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#74d0fc" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <circle cx="16" cy="17" r="2.5" fill="#74d0fc" fillOpacity="0.92" />
    <ellipse cx="16" cy="10.5" rx="2.5" ry="1.2" fill="#a6f1ff" opacity="0.7" />
  </svg>
);

export const OllamaIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ollamaGlow" cx="50%" cy="50%" r="80%">
        <stop offset="0%" stopColor="#a6f1ff" stopOpacity="0.7" />
        <stop offset="80%" stopColor="#244e82" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#121826" stopOpacity="0.05" />
      </radialGradient>
    </defs>
    <ellipse cx="16" cy="18" rx="11" ry="8" fill="url(#ollamaGlow)" />
    <ellipse cx="16" cy="18" rx="6.5" ry="5.2" fill="#74d0fc" fillOpacity="0.13" />
    <ellipse cx="16" cy="14" rx="3.3" ry="2.1" fill="#a6f1ff" fillOpacity="0.12" />
    <rect x="13.5" y="9.5" width="5" height="6" rx="2.5" fill="#a6f1ff" fillOpacity="0.45" />
    <ellipse cx="16" cy="9.5" rx="2.2" ry="1.1" fill="#a6f1ff" opacity="0.7" />
  </svg>
);
