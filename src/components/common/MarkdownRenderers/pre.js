/**
 * Enhanced PreRenderer for markdown pre blocks
 * Ensures proper rendering of code blocks with robust DOM structure
 */
import React, { useEffect, useRef } from 'react';

/**
 * PreRenderer component that handles <pre> tags in markdown
 * and ensures they don't get nested improperly
 */
function PreRenderer({ children, ...props }) {
  const preRef = useRef(null);
  
  // Handle any post-render adjustments needed
  useEffect(() => {
    if (!preRef.current) return;
    
    // Add proper classes to nested code elements if needed
    const codeElements = preRef.current.querySelectorAll('code');
    codeElements.forEach(codeEl => {
      if (!codeEl.className.includes('code-block')) {
        codeEl.classList.add('code-block-content');
      }
    });
    
    // Fix any formatting issues
    const preEl = preRef.current;
    if (preEl && !preEl.className.includes('pre-block')) {
      preEl.classList.add('pre-block');
    }
  }, []);
  
  // Handle special case for empty blocks
  if (!children) {
    return <pre ref={preRef} className="pre-block pre-empty" {...props}></pre>;
  }
  
  // Check if children is already a code block to avoid double wrapping
  const isChildrenCodeBlock = React.Children.toArray(children).some(child => 
    React.isValidElement(child) && 
    (child.type === 'code' || 
     (typeof child.type === 'function' && 
      (child.type.displayName === 'CodeRenderer' || child.type.name === 'CodeRenderer')))
  );
  
  // If children already contains code block, render directly to avoid nesting
  if (isChildrenCodeBlock) {
    return (
      <div className="pre-wrapper" ref={preRef}>
        {children}
      </div>
    );
  }
  
  // Otherwise wrap in a proper pre tag
  return (
    <pre 
      ref={preRef}
      className={`pre-block ${props.className || ''}`}
      {...props}
    >
      {children}
    </pre>
  );
}

export default PreRenderer;
