// Utility for Markdown renderers: split children at block elements
import React from 'react';

export const blockTags = [
  'div', 'pre', 'table', 'ul', 'ol', 'hr', 'blockquote', 'canvas',
  'CodeRenderer', 'PreRenderer', 'VisualCodeRenderer', 'SvgRenderer', 'CanvasRenderer'
];

export function isBlock(child) {
  if (typeof child === 'string') {
    const trimmed = child.trim();
    if (trimmed.startsWith('```') || /^\s{4,}/.test(trimmed)) return true;
    return false;
  }
  if (!React.isValidElement(child)) return false;
  const tag = child.type && (child.type.displayName || child.type.name || child.type);
  return blockTags.includes(tag);
}

/**
 * Check if children array contains specific block elements
 * @param {Array|Object} children React children to check
 * @param {Array} tagNames Array of specific tag names to look for
 * @returns {boolean} True if any child matches the specified tag names
 */
export function containsBlockElement(children, tagNames = blockTags) {
  // Handle case of single child
  if (!children) return false;
  
  // Convert to array for easier processing
  const childArray = React.Children.toArray(children);
  
  // Check each child recursively
  return childArray.some(child => {
    // Check direct element type
    if (React.isValidElement(child)) {
      const tag = child.type && (child.type.displayName || child.type.name || child.type);
      
      // Direct match
      if (tagNames.includes(tag)) {
        return true;
      }
      
      // Check if this element contains the specified blocks in its children
      if (child.props && child.props.children) {
        return containsBlockElement(child.props.children, tagNames);
      }
    }
    
    // Check string content for code blocks
    if (typeof child === 'string' && tagNames.includes('pre')) {
      const trimmed = child.trim();
      return trimmed.startsWith('```') || /^\s{4,}/.test(trimmed);
    }
    
    return false;
  });
}

// Splits children into runs of inline and block elements
export function splitAtBlocks(children) {
  const arr = React.Children.toArray(children);
  const result = [];
  let inlineBuffer = [];

  arr.forEach((child, idx) => {
    if (isBlock(child)) {
      if (inlineBuffer.length > 0) {
        result.push({ type: 'inline', children: [...inlineBuffer] });
        inlineBuffer = [];
      }
      result.push({ type: 'block', children: [child] });
    } else {
      inlineBuffer.push(child);
    }
  });
  if (inlineBuffer.length > 0) {
    result.push({ type: 'inline', children: [...inlineBuffer] });
  }
  return result;
}
