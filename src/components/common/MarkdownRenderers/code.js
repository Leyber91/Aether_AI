/**
 * Enhanced code renderer that handles both inline and block code
 * with robust error handling and proper DOM structure
 */
import React from 'react';

/**
 * Enhanced code renderer for Markdown code elements
 * @param {Object} props React component props
 * @param {boolean} props.inline Whether this is inline code
 * @param {string} props.className CSS class for the element
 * @param {boolean} props.isCodeBlock Whether this is a code block (not inline)
 * @param {React.ReactNode} props.children Child elements/content
 */
function CodeRenderer({ inline, className, isCodeBlock, children, ...props }) {
  // Defensive check for children
  if (!children) {
    return inline ? <code className="empty-code"></code> : <pre className="empty-code-block"></pre>;
  }

  // Convert children to string, handling arrays and other types safely
  const content = React.Children.toArray(children)
    .map(child => (typeof child === 'string' ? child : JSON.stringify(child)))
    .join('');

  // Extract language from className if provided (format: language-xyz)
  let language = null;
  if (className && className.startsWith('language-')) {
    language = className.replace('language-', '');
  }

  // Handle inline code (single backticks)
  if (inline) {
    return (
      <code 
        className={className ? `inline-code ${className}` : 'inline-code'} 
        {...props}
      >
        {content}
      </code>
    );
  }

  // Handle code blocks (triple backticks)
  try {
    return (
      <pre className={`code-block ${language ? `language-${language}` : ''} ${className || ''}`}>
        <code className={className || ''}>
          {content}
        </code>
        {language && (
          <div className="code-language-indicator">
            {language}
          </div>
        )}
      </pre>
    );
  } catch (error) {
    console.error('Error rendering code block:', error);
    // Fallback rendering if syntax highlighting fails
    return (
      <pre className={`code-block-fallback ${className || ''}`}>
        <code>{content}</code>
      </pre>
    );
  }
}

export default CodeRenderer;