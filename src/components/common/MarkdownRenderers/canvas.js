// Custom markdown renderer for Canvas blocks
import React, { useEffect, useRef } from 'react';

// Usage: place a Canvas code block in markdown: ```canvas ... ```
// The value should be JavaScript code to draw on the canvas
export default function CanvasRenderer({ value }) {
  const canvasRef = useRef();
  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        // eslint-disable-next-line no-new-func
        const draw = new Function('canvas', value);
        draw(canvasRef.current);
      } catch (e) {
        // Optionally display error
      }
    }
  }, [value]);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <canvas ref={canvasRef} width={400} height={200} style={{ border: '1px solid #444', background: '#181c24', borderRadius: 8, maxWidth: '100%' }} />
    </div>
  );
}
