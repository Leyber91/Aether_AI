// Custom markdown renderer for CSS code blocks
import React from 'react';

// Usage: place a CSS code block in markdown: ```css ... ```
export default function CssRenderer({ value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <style>{value}</style>
      <pre className="markdown-css-renderer" style={{ maxWidth: '100%', maxHeight: 400, background: '#181c24', color: '#a6f1ff', borderRadius: 8, padding: 12 }}>{value}</pre>
    </div>
  );
}
