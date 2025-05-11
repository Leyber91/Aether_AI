import React from 'react';

/**
 * Animated banner component for MetaLoopLab
 * Contains the infinity animation and title
 */
export default function MetaLoopBanner() {
    return (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, minHeight: 64, position: 'relative' }}>
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
                <h1 style={{ background: 'var(--header-text-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900, fontSize: 36, letterSpacing: 2, margin: 0, padding: 0, textShadow: '0 4px 32px #0a1120', lineHeight: 1.1, animation: 'fadein 1s' }}>MetaLoopLab</h1> 
                <div style={{ color: 'var(--space-text-secondary)', fontSize: 18, marginTop: 2, fontWeight: 500, letterSpacing: 0.5 }}> 
                    AI model conversations in infinite creative loops 
                </div> 
            </div>
        </div>
    );
}
