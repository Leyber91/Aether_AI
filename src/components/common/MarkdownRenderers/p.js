/**
 * Custom paragraph renderer for MarkdownRenderer
 */
import React from 'react';
import createMarkdownRenderer from './createMarkdownRenderer.js';

const P = createMarkdownRenderer('p', 'md-paragraph');

function ParagraphRenderer(props) {
  // If any child is a block element, avoid wrapping in <p>
  const hasBlock = React.Children.toArray(props.children).some(child => {
    if (!React.isValidElement(child)) return false;
    const tag = child.type && (child.type.displayName || child.type.name || child.type);
    return ['div', 'pre', 'table', 'ul', 'ol', 'hr', 'blockquote'].includes(tag);
  });

  if (hasBlock) {
    // Just return children without wrapping
    return <>{props.children}</>;
  }
  // Otherwise, wrap in <p>
  return <P {...props} />;
}

export default ParagraphRenderer;
