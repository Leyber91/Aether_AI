// Custom markdown renderer for HTML code blocks
import React, { useEffect, useRef } from 'react';

// Usage: place an HTML code block in markdown: ```html ... ```
export default function HtmlRenderer({ value }) {
  const htmlContainerRef = useRef(null);
  
  useEffect(() => {
    // After the HTML is rendered, we may need to process scripts or other interactive elements
    if (htmlContainerRef.current) {
      // Find any SVG elements and ensure they have proper sizing
      const svgElements = htmlContainerRef.current.querySelectorAll('svg');
      svgElements.forEach(svg => {
        if (!svg.hasAttribute('width') && !svg.hasAttribute('height')) {
          svg.setAttribute('width', '100%');
          // Use a valid height value instead of 'auto' which is invalid for SVG
          svg.setAttribute('height', '100%');
          
          // Also add preserveAspectRatio to maintain proportions
          if (!svg.hasAttribute('preserveAspectRatio')) {
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          }
          
          // Ensure viewBox is set for proper scaling
          if (!svg.hasAttribute('viewBox') && 
              svg.hasAttribute('width') && 
              svg.hasAttribute('height')) {
            const w = parseInt(svg.getAttribute('width')) || 300;
            const h = parseInt(svg.getAttribute('height')) || 150;
            svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
          }
        }
        
        // Fix for SVG animations
        const animateElements = svg.querySelectorAll('animate, animateTransform, animateMotion');
        animateElements.forEach(element => {
          // Restart animation by cloning and replacing
          if (element.parentNode) {
            const parent = element.parentNode;
            const newElement = element.cloneNode(true);
            parent.replaceChild(newElement, element);
          }
        });
      });
    }
  }, [value]);

  // Safely sanitize HTML content if needed
  // This is a simple approach - consider using a proper sanitizer in production
  const sanitizedValue = value || '';

  return (
    <div className="html-renderer-container">
      <div
        ref={htmlContainerRef}
        className="markdown-html-renderer"
        dangerouslySetInnerHTML={{ __html: sanitizedValue }}
        style={{ 
          width: '100%',
          overflow: 'auto',
          position: 'relative'
        }}
      />
    </div>
  );
}
