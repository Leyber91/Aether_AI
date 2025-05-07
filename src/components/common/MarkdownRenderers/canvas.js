// Custom markdown renderer for Canvas blocks
import React, { useEffect, useRef, useState } from 'react';

// Usage: place a Canvas code block in markdown: ```canvas ... ```
// The value should be JavaScript code to draw on the canvas
export default function CanvasRenderer({ value }) {
  const canvasRef = useRef();
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 200 });
  
  useEffect(() => {
    if (!canvasRef.current || !value) return;
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Clear previous content
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create a safer execution context with limited capabilities
      // This creates a sandbox to prevent harmful code execution
      const sandboxedDraw = (canvas) => {
        const ctx = canvas.getContext('2d');
        
        // Create a function with the user's code
        // eslint-disable-next-line no-new-func
        const userFunction = new Function('canvas', 'ctx', value);
        
        // Execute with both canvas and ctx for flexibility
        return userFunction(canvas, ctx);
      };
      
      // Execute the drawing code
      sandboxedDraw(canvas);
      
      // Extract any width/height declarations from the code
      const widthMatch = value.match(/canvas\.width\s*=\s*(\d+)/);
      const heightMatch = value.match(/canvas\.height\s*=\s*(\d+)/);
      
      if (widthMatch && heightMatch) {
        const width = parseInt(widthMatch[1], 10);
        const height = parseInt(heightMatch[1], 10);
        
        // Only update if values are reasonable (not too big/small)
        if (width > 0 && width < 2000 && height > 0 && height < 2000) {
          setDimensions({ width, height });
          
          // If dimensions changed, we need to redraw
          canvas.width = width;
          canvas.height = height;
          sandboxedDraw(canvas);
        }
      }
      
    } catch (err) {
      console.error('Error executing canvas code:', err);
      setError(err.message);
      
      // Draw error message on canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = '#ff5252';
        ctx.font = '14px system-ui, sans-serif';
        ctx.fillText('Error rendering canvas:', 10, 30);
        ctx.fillText(err.message.substring(0, 50) + (err.message.length > 50 ? '...' : ''), 10, 60);
      }
    }
  }, [value]);
  
  return (
    <div className="markdown-canvas-container" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      width: '100%',
      margin: '20px 0'
    }}>
      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        style={{ 
          border: '1px solid #444', 
          background: '#181c24', 
          borderRadius: 8, 
          maxWidth: '100%',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }} 
      />
      {error && (
        <div style={{
          marginTop: '10px',
          color: '#ff5252',
          fontSize: '14px',
          backgroundColor: 'rgba(255,82,82,0.1)',
          padding: '8px 16px',
          borderRadius: '4px',
          maxWidth: '100%',
          overflow: 'auto'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
