// Custom markdown renderer for SVG blocks
import React from 'react';

// Usage: place an SVG code block in markdown: ```svg ... ```
export default function SvgRenderer({ value }) {
  // value is the SVG markup as a string
  // Use dangerouslySetInnerHTML for raw SVG rendering
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div
        className="markdown-svg-renderer"
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ maxWidth: '100%', maxHeight: 400 }}
      />
    </div>
  );
}
