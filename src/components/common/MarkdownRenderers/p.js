/**
 * Custom paragraph renderer for MarkdownRenderer
 */
import React from 'react';
import createMarkdownRenderer from './createMarkdownRenderer.js';
import { splitAtBlocks } from './utils.js';

const P = createMarkdownRenderer('p', 'md-paragraph');

/**
 * Checks if a child element is or contains a code block
 * @param {*} child React child element
 * @returns {boolean} True if the child is or contains a code block
 */
function containsCodeBlock(child) {
  // Direct type check for pre and code elements
  if (React.isValidElement(child)) {
    const elementType = child.type && (typeof child.type === 'string' 
      ? child.type 
      : (child.type.displayName || child.type.name || child.type));
    
    // Check for pre tags, code tags, or components that might render these
    if (elementType === 'pre' || elementType === 'code' || 
        elementType === 'CodeRenderer' || elementType === 'CodeBlock') {
      return true;
    }
    
    // Check props for explicit code block markers
    if (child.props) {
      if (child.props.isCodeBlock === true || 
          child.props.className?.includes('code-block') ||
          child.props.className?.includes('language-')) {
        return true;
      }
      
      // Recursively check children if they exist
      if (child.props.children) {
        const childArray = Array.isArray(child.props.children) 
          ? child.props.children 
          : [child.props.children];
          
        return childArray.some(containsCodeBlock);
      }
    }
  }
  
  // Check strings for markdown code blocks
  if (typeof child === 'string') {
    return child.trim().startsWith('```') || child.includes('```');
  }
  
  return false;
}

/**
 * Enhanced paragraph renderer that ensures proper DOM nesting by:
 * 1. Detecting code/pre elements inside paragraph content
 * 2. Correctly handling SVG content
 * 3. Properly splitting mixed content to avoid invalid nesting
 */
function ParagraphRenderer(props) {
  // Safety check - if no children, render empty paragraph
  if (!props.children) {
    return <P></P>;
  }

  // Check if this paragraph contains SVG tags directly
  const hasSvgContent = props.children && 
    typeof props.children === 'string' && 
    /<svg[\s\S]*?<\/svg>/i.test(props.children);
  
  // If this paragraph contains direct SVG content, render it specially
  if (hasSvgContent) {
    return (
      <div className="svg-paragraph-container">
        <div 
          className="markdown-svg-renderer" 
          dangerouslySetInnerHTML={{ __html: props.children }}
          style={{ 
            maxWidth: '100%',
            margin: '20px 0',
            display: 'flex',
            justifyContent: 'center'
          }}
        />
      </div>
    );
  }
  
  // First, check if any of the children contain code blocks - do this thoroughly
  let hasCodeBlock = false;
  
  // If children is a string (direct text), check for code block markers
  if (typeof props.children === 'string') {
    hasCodeBlock = props.children.includes('```') || props.children.includes('`');
  } else {
    // Otherwise process the children array
    const childArray = React.Children.toArray(props.children);
    hasCodeBlock = childArray.some(containsCodeBlock);
  }
  
  // If we have code blocks, never render them within a paragraph
  if (hasCodeBlock) {
    const segments = splitAtBlocks(props.children);
    
    return (
      <>
        {segments.map((seg, idx) => {
          // Text segments get paragraphs, code blocks stay as themselves
          if (seg.type === 'inline' && seg.children) {
            // Skip empty text segments
            if (typeof seg.children === 'string' && seg.children.trim() === '') {
              return null;
            }
            return <P key={`p-${idx}`}>{seg.children}</P>;
          }
          // Code blocks or other block elements rendered directly
          return <React.Fragment key={`block-${idx}`}>{seg.children}</React.Fragment>;
        })}
      </>
    );
  }
  
  // Regular paragraph with no DOM nesting issues
  return <P>{props.children}</P>;
}

export default ParagraphRenderer;
