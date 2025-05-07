// Custom markdown renderer for SVG blocks
import React, { useEffect, useRef, useState } from 'react';

// Usage: place an SVG code block in markdown: ```svg ... ```
export default function SvgRenderer({ value }) {
  const svgContainerRef = useRef(null);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: '100%', height: 'auto' });
  
  useEffect(() => {
    try {
      if (!svgContainerRef.current || !value) return;
      
      // Parse the SVG to extract viewBox or width/height for proper sizing
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(value, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      
      if (svgElement) {
        // Extract dimensions
        const viewBox = svgElement.getAttribute('viewBox');
        const width = svgElement.getAttribute('width');
        const height = svgElement.getAttribute('height');
        
        // Set dimensions for container
        if (width && height) {
          setDimensions({
            width: width.includes('%') ? width : 'auto',
            height: height.includes('%') ? height : 'auto',
            aspectRatio: parseFloat(width) / parseFloat(height) || 'auto'
          });
        } else if (viewBox) {
          const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
          if (vbWidth && vbHeight) {
            setDimensions({
              width: '100%',
              height: 'auto',
              aspectRatio: vbWidth / vbHeight
            });
          }
        }
        
        // Process animations
        const animateElements = svgContainerRef.current.querySelectorAll('animate, animateTransform, animateMotion');
        animateElements.forEach(element => {
          // Restart animation by cloning and replacing
          if (element.parentNode) {
            const parent = element.parentNode;
            const newElement = element.cloneNode(true);
            parent.replaceChild(newElement, element);
          }
        });
        
        // Add accessibility attributes if missing
        const svgInDom = svgContainerRef.current.querySelector('svg');
        if (svgInDom) {
          if (!svgInDom.getAttribute('role')) {
            svgInDom.setAttribute('role', 'img');
          }
          if (!svgInDom.getAttribute('aria-label')) {
            svgInDom.setAttribute('aria-label', 'SVG Illustration');
          }
        }
      }
    } catch (err) {
      console.error('Error processing SVG:', err);
      setError(err.message);
    }
  }, [value]);
  
  if (error) {
    return (
      <div className="svg-renderer-error" style={{ 
        padding: '15px',
        margin: '10px 0',
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        border: '1px solid rgba(255, 0, 0, 0.2)',
        borderRadius: '8px',
        color: '#d32f2f'
      }}>
        <p>Error rendering SVG: {error}</p>
        <details>
          <summary>View SVG Code</summary>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{value}</pre>
        </details>
      </div>
    );
  }
  
  return (
    <div className="markdown-svg-container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      width: '100%', 
      margin: '20px 0'
    }}>
      <div
        ref={svgContainerRef}
        className="markdown-svg-renderer"
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ 
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio: dimensions.aspectRatio,
          maxWidth: '100%', 
          maxHeight: 600,
          overflow: 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
    </div>
  );
}
