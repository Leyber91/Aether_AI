/**
 * Enhanced Markdown Renderer
 * Provides a robust rendering of markdown with special handling for
 * code blocks, SVG content, and other edge cases
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlockRenderer from './CodeBlockRenderer';
import './MarkdownRenderer.css';

/**
 * Safely sanitize SVG content string without React hooks
 * This is a pure function that can be called anywhere
 */
function sanitizeSvgString(svgContent) {
  if (!svgContent) return '';
  
  try {
    // Fix common attribute issues
    let fixed = svgContent
      // Fix empty attributes
      .replace(/([a-z-]+)=""/gi, '$1="0"')
      .replace(/([a-z-]+)="\s*"/gi, '$1="0"')
      // Specifically fix common SVG attribute errors
      .replace(/cx=""/g, 'cx="0"')
      .replace(/cy=""/g, 'cy="0"')
      .replace(/r=""/g, 'r="0"')
      .replace(/x=""/g, 'x="0"')
      .replace(/y=""/g, 'y="0"')
      .replace(/width=""/g, 'width="100%"')
      .replace(/height=""/g, 'height="100%"')
      // Fix namespaced attributes
      .replace(/xlink:href="/g, 'href="')
      // Fix self-closing tags that React doesn't like
      .replace(/<(path|rect|circle|line|polyline|polygon|ellipse|text|tspan|stop|animate|animateTransform|animateMotion)([^>]*?)\/>/gi, '<$1$2></$1>')
      // Fix path data issues - more comprehensive approach
      .replace(/d="([^"]*)"/g, (match, pathData) => {
        try {
          // Clean up path data to ensure valid numbers
          const cleanedPathData = pathData
            // Remove ellipses or other placeholder text that might appear in code examples
            .replace(/\.\.\.|…/g, ' ')
            // Replace spaces between numbers with commas
            .replace(/(\d+)\s+(\d+)/g, '$1,$2')
            // Remove spaces after commas
            .replace(/,\s+/g, ',')
            // Remove spaces before commas
            .replace(/\s+,/g, ',')
            // Replace invalid separators
            .replace(/[^\d\w\s.,\-+MLHVCSQTAZ]/gi, ' ')
            // Fix multiple consecutive spaces
            .replace(/\s+/g, ' ')
            .trim();
          
          return `d="${cleanedPathData}"`;
        } catch (err) {
          console.error('Error cleaning path data:', err);
          return 'd="M0,0"'; // Return a simple valid path as fallback
        }
      });
    
    // Add accessibility attributes
    if (!fixed.includes('role=')) {
      fixed = fixed.replace(/<svg/, '<svg role="img" ');
    }
    
    // Ensure width and height are defined
    if (!fixed.includes('width=') && !fixed.includes('height=')) {
      fixed = fixed.replace(/<svg/, '<svg width="100%" height="100%" ');
    }
    
    // Remove any external stylesheet references
    fixed = fixed.replace(/<link[^>]*href=['"]styles\.css['"][^>]*>/gi, '');
    fixed = fixed.replace(/<link[^>]*rel=['"]stylesheet['"][^>]*>/gi, '');
    
    // Add inline styles to SVG to prevent external CSS dependencies
    if (!fixed.includes('style=')) {
      fixed = fixed.replace(/<svg/, '<svg style="max-width:100%;height:auto;display:block;margin:0 auto;" ');
    }
    
    // Adjust viewBox if not present
    if (!fixed.includes('viewBox=')) {
      fixed = fixed.replace(/<svg/, '<svg viewBox="0 0 100 100" ');
    }
    
    return fixed;
  } catch (err) {
    console.error('SVG sanitization failed:', err);
    return '<svg width="100" height="100" viewBox="0 0 100 100"><text x="10" y="50">SVG Error</text></svg>';
  }
}

/**
 * Safely sanitize HTML content string without React hooks
 * This is a pure function that can be called anywhere
 */
function sanitizeHtmlString(htmlContent) {
  if (!htmlContent) return '';
  
  try {
    // Very basic sanitization - for production, use a proper sanitizer library
    let sanitized = htmlContent
      // Remove script tags completely
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers
      .replace(/\son\w+="[^"]*"/gi, '')
      // Remove iframe tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove object tags
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      // Remove embed tags
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      // Replace external stylesheets with scoped style tags to prevent 404 errors
      .replace(/<link[^>]*href=['"]([^'"]+\.(css|stylesheet))['"][^>]*>/gi, '<style>/* External stylesheet removed - styles scoped to container */</style>');
    
    // Fix global style leakage by scoping style tags
    sanitized = sanitized.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, styleContent) => {
      // Replace global selectors with scoped selectors
      let scopedStyles = styleContent
        // Look for svg { ... } and replace with .markdown-content .html-renderer svg { ... }
        .replace(/svg\s*{([^}]*)}/gi, '.markdown-content .html-renderer svg {$1}')
        // Look for circle, rect, path etc. and scope them
        .replace(/(circle|rect|path|text|line|polyline|polygon|ellipse)\s*{([^}]*)}/gi, 
                '.markdown-content .html-renderer $1 {$2}')
        // Look for #id selectors and scope them
        .replace(/#([a-zA-Z][\w-]*)\s*{([^}]*)}/gi, 
                '.markdown-content .html-renderer #$1 {$2}')
        // Look for .class selectors and scope them
        .replace(/\.([a-zA-Z][\w-]*)\s*{([^}]*)}/gi, 
                '.markdown-content .html-renderer .$1 {$2}')
        // Handle any unscoped tag selectors (e.g., body, div, p)
        .replace(/\b(body|html|div|p|span|a|button|input|textarea|table|tr|td|th|ul|ol|li|h[1-6])\b\s*{([^}]*)}/gi, 
                '.markdown-content .html-renderer $1 {$2}');
      
      return `<style>${scopedStyles}</style>`;
    });
    
    // Fix SVG elements in HTML content - but don't use SVGRenderer component here (to avoid hook rules violation)
    sanitized = sanitized.replace(/(<svg[\s\S]*?<\/svg>)/gi, (match, svgContent) => {
      return sanitizeSvgString(svgContent);
    });
    
    return sanitized;
  } catch (err) {
    console.error('HTML sanitization error:', err);
    return '<div class="html-error">HTML rendering error</div>';
  }
}

// Note: Removed SVGRenderer, HTMLRenderer, and MermaidRenderer components since we now use CodeBlockRenderer instead

// These utility functions are still useful for our content processing
function processHtmlContent(html) {
  if (!html) return '';
  return sanitizeHtmlString(html);
}

/**
 * Detect content type from string
 */
function detectContentType(content) {
  if (!content || typeof content !== 'string') return 'text';
  
  // Check for SVG
  if (/<svg[\s\S]*?<\/svg>/i.test(content)) {
    return 'svg';
  }
  
  // Check for Mermaid
  if (/^graph [A-Z]{2}/.test(content) || 
      /^sequenceDiagram/.test(content) || 
      /^gantt/.test(content) || 
      /^classDiagram/.test(content) ||
      /^flowchart [A-Z]{2}/.test(content)) {
    return 'mermaid';
  }
  
  // Check for HTML (has tags but is not just an SVG)
  if (/<([a-z][a-z0-9]*)\b[^>]*>(.*?)<\/\1>/i.test(content)) {
    return 'html';
  }
  
  // Check for CSS
  if (/(\.|#|@media|body|html)\s*\{[\s\S]*?\}/i.test(content)) {
    return 'css';
  }
  
  // Check for JavaScript
  if (/function\s+\w+\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|new [A-Z]\w+\(|class\s+\w+\s*\{|import\s+.*from/i.test(content)) {
    return 'javascript';
  }
  
  return 'text';
}

/**
 * Preprocesses markdown content to handle edge cases and detect content types
 */
function preprocessMarkdown(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let safeContent = content;
  
  // Process any HTML content to handle external resource references
  if (/<link[^>]*href=['"]([^'"]+)['"][^>]*>/i.test(safeContent) || 
      /<script[^>]*src=['"]([^'"]+)['"][^>]*><\/script>/i.test(safeContent)) {
    safeContent = processHtmlContent(safeContent);
  }
  
  // Detect standalone SVG, HTML, Mermaid, etc. content outside of code blocks
  if (!safeContent.includes('```')) {
    const contentType = detectContentType(safeContent);
    
    if (contentType !== 'text') {
      safeContent = `\`\`\`${contentType}\n${safeContent}\n\`\`\``;
    }
  }
  
  // Even more aggressive handling of pre tags to avoid nesting issues
  if (/<pre[\s\S]*?<\/pre>/gi.test(safeContent)) {
    // Replace any pre tags with special markers that will be outside paragraphs
    safeContent = safeContent.replace(/(<pre[\s\S]*?<\/pre>)/gi, '\n\n$1\n\n');
  }
  
  // Handle isolated code elements even more aggressively - crucial fix for pre in p nesting issue
  if (/<code[\s\S]*?<\/code>/gi.test(safeContent)) {
    // Make sure code blocks aren't nested in paragraphs - complete rewrite for better handling
    safeContent = safeContent.replace(/(<code[^>]*?>[\s\S]*?<\/code>)/gi, (match, codeBlock) => {
      // If it contains line breaks or pre tags, make sure it's not in a paragraph by adding newlines
      if (codeBlock.includes('\n') || codeBlock.includes('<pre') || codeBlock.length > 80) {
        return `\n\n${codeBlock}\n\n`;
      }
      // Short inline code without breaks can stay inline
      return codeBlock;
    });
  }
  
  // Fix potential nesting issues with other block elements - add more block elements that shouldn't be in paragraphs
  [
    'div', 'table', 'ul', 'ol', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'svg', 'iframe', 'form', 'canvas', 'figure', 'hr', 'fieldset'
  ].forEach(tag => {
    const pattern = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, 'gi');
    if (pattern.test(safeContent)) {
      safeContent = safeContent.replace(new RegExp(`(<${tag}[\\s\\S]*?<\\/${tag}>)`, 'gi'), '\n\n$1\n\n');
    }
  });
  
  // Fix mixed content with backtick code blocks
  safeContent = safeContent.replace(/(^|\n)```(\w+)?\n/g, '$1\n```$2\n');
  safeContent = safeContent.replace(/\n```(\n|$)/g, '\n```\n$1');
  
  // Special fix for code blocks containing SVG content
  safeContent = safeContent.replace(/```html\n([\s\S]*?<svg[\s\S]*?<\/svg>[\s\S]*?)\n```/gi, (match, htmlContent) => {
    // Process HTML content with SVG to sanitize it
    return `\`\`\`html\n${processHtmlContent(htmlContent)}\n\`\`\``;
  });
  
  return safeContent;
}

// This key function directly handles the DOM nesting issue
function fixDOMNestingIssues(content) {
  const BLOCK_ELEMENTS = [
    'address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div', 
    'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 
    'nav', 'noscript', 'ol', 'p', 'pre', 'section', 'table', 'tfoot', 
    'ul', 'video', 'svg'
  ];
  
  // Find content containing block elements  
  let modified = content;
  BLOCK_ELEMENTS.forEach(element => {
    const regex = new RegExp(`<${element}[\\s\\S]*?<\\/${element}>`, 'gi');
    if (regex.test(modified)) {
      // Add paragraph breaks around block elements
      modified = modified.replace(new RegExp(`(<${element}[\\s\\S]*?<\\/${element}>)`, 'gi'), '\n\n$1\n\n');
    }
  });
  
  // Fix ``` code blocks to ensure they're not in paragraphs
  modified = modified.replace(/(^|\n)```[\s\S]*?```(\n|$)/g, '\n\n$&\n\n');
  
  // Remove consecutive paragraph breaks to avoid empty paragraphs
  modified = modified.replace(/\n{3,}/g, '\n\n');
  
  return modified;
}

/**
 * Custom components factory to create renderers for different elements
 * This follows React's component composition pattern
 */
function createCustomComponents() {
  return {
    // Code renderer with special language handling
    code: ({ node, inline, className, children, ...props }) => {
      const content = Array.isArray(children) ? children.join('') : String(children || '');
      let language = className ? className.replace('language-', '') : '';
      
      // Override language detection for specific cases
      if (language === 'xml' && content.includes('<svg') && content.includes('</svg>')) {
        language = 'svg';
      }
      
      // Additional SVG detection - if language is not specified but content is SVG
      if ((!language || language === 'text' || language === 'xml') && 
          content.includes('<svg') && 
          (content.includes('</svg>') || content.includes('width=') || content.includes('height='))) {
        language = 'svg';
      }
      
      // Special handling for plain text - render it without code block styling
      if (language === 'plain text' || language === 'plaintext') {
        return <span className="plain-text">{content}</span>;
      }
      
      // Special case handling for short HTML tags and code fragments often used as examples
      const isHtmlTag = /^&lt;[a-z0-9]+(&gt;)?$/i.test(content) || // Single HTML tag
                        /^&lt;\/[a-z0-9]+&gt;$/i.test(content);     // Closing HTML tag
      
      const isCommonCodeSnippet = /^\.[a-z0-9]+$/i.test(content) ||  // CSS class or file extension
                                  /^#[a-z0-9]+$/i.test(content);     // CSS ID selector
                                  
      const isSimpleSyntax = content.trim().length < 20 && 
                             (isHtmlTag || isCommonCodeSnippet || 
                              content === 'plain text' || 
                              /^&lt;(head|style|script|html|body|div)&gt;$/i.test(content));
      
      if (inline || isSimpleSyntax) {
        // Single numbers, variable names, or short codes should always be inline
        // Criteria: Length < 40, no line breaks, and either:
        // 1. All digits (a number)
        // 2. A single word (variable, function name)
        // 3. Very short code (< 20 chars with no spaces - likely a prop or method)
        // 4. HTML tags and common web syntax elements
        const isJustANumber = /^-?\d+(\.\d+)?$/.test(content.trim());
        const isSingleWord = !content.includes(' ') && content.length < 20;
        const isShortCode = content.length < 40 && !content.includes('\n');
        
        if (isJustANumber || isSingleWord || isShortCode || isSimpleSyntax) {
          return (
            <code className={`inline-code ${className || ''}`} {...props}>
              {content}
            </code>
          );
        }
        
        // If it's "inline" but longer or has linebreaks, render as a block
        return <CodeBlockRenderer language={language || 'text'} content={content} />;
      }
      
      // Use our enhanced CodeBlockRenderer for all code blocks
      return <CodeBlockRenderer language={language} content={content} />;
    },
    
    // Custom paragraph with extreme DOM nesting protection
    p: ({ node, children, ...props }) => {
      // Use a function to check for block elements to avoid React hook rules violations
      const hasBlockElement = (() => {
        const childrenArray = React.Children.toArray(children);
        
        return childrenArray.some(child => {
          // Check for React elements that are block elements
          if (React.isValidElement(child)) {
            const type = child.type && typeof child.type === 'string' ? child.type.toLowerCase() : '';
            if (['pre', 'div', 'table', 'ul', 'ol', 'blockquote', 'code'].includes(type)) {
              return true;
            }
            
            // Check for component names
            const componentName = child.type && child.type.name ? child.type.name : '';
            if (componentName.includes('Renderer') || componentName.includes('Container') || componentName === 'CodeBlockRenderer') {
              return true;
            }
            
            // Check if the child has className containing 'block' or specific container classes
            const childClassName = child.props && child.props.className ? child.props.className : '';
            if (childClassName.includes('block') || 
                childClassName.includes('container') || 
                childClassName.includes('pre-') || 
                childClassName.includes('code-')) {
              return true;
            }
          }
          
          // Extremely aggressive check for HTML strings that might contain block elements
          if (typeof child === 'string') {
            return /<(pre|div|table|ul|ol|blockquote|code|h[1-6]|svg|canvas|figure|hr|iframe)[\s\S]*?>/i.test(child);
          }
          
          return false;
        });
      })();
      
      // If paragraph contains block elements, wrap children in a fragment instead of p
      if (hasBlockElement) {
        return <>{children}</>;
      }
      
      return <p {...props}>{children}</p>;
    },
    
    // Super safe pre renderer that is never nested improperly
    pre: ({ node, children, ...props }) => {
      // Direct child is likely a code element, so just return that without wrapping it
      // This prevents double-nesting of pre tags
      const childrenArray = React.Children.toArray(children);
      
      if (childrenArray.length === 1 && React.isValidElement(childrenArray[0])) {
        const child = childrenArray[0];
        
        // If child is a CodeBlockRenderer or a code element, return it directly
        if (child.type === 'code' || 
            (child.type && child.type.name === 'CodeBlockRenderer') ||
            (child.props && child.props.className && child.props.className.includes('code-block'))) {
          return child;
        }
      }
      
      // Only use a pre wrapper if really needed
      return (
        <div className="pre-wrapper">
          <pre className="pre-block" {...props}>{children}</pre>
        </div>
      );
    },
    
    // Simple table container for proper scrolling
    table: ({ children, ...props }) => (
      <div className="table-container">
        <table className="md-table" {...props}>{children}</table>
      </div>
    ),
    
    // Other basic renderers
    a: ({ href, children, ...props }) => {
      // Safe URL handling
      const safeHref = href || '#';
      const isExternal = safeHref.startsWith('http') || safeHref.startsWith('https');
      
      return (
        <a 
          href={safeHref} 
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="md-link" 
          {...props}
        >
          {children}
        </a>
      );
    },
    
    img: ({ src, alt, ...props }) => (
      <span className="image-container">
        <img 
          src={src || ''} 
          alt={alt || 'Image'} 
          className="md-image" 
          {...props} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.classList.add('image-error');
            e.target.alt = `Failed to load: ${alt || 'image'}`;
          }}
        />
      </span>
    ),
    
    // Simple heading components
    h1: ({ children, ...props }) => <h1 className="md-h1" {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 className="md-h2" {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 className="md-h3" {...props}>{children}</h3>,
    h4: ({ children, ...props }) => <h4 className="md-h4" {...props}>{children}</h4>,
    h5: ({ children, ...props }) => <h5 className="md-h5" {...props}>{children}</h5>,
    h6: ({ children, ...props }) => <h6 className="md-h6" {...props}>{children}</h6>,
    
    // Other simple elements
    blockquote: (props) => <blockquote className="md-blockquote" {...props} />,
    ul: (props) => <ul className="md-ul" {...props} />,
    ol: (props) => <ol className="md-ol" {...props} />,
    li: (props) => <li className="md-li" {...props} />,
    hr: (props) => <hr className="md-hr" {...props} />
  };
}

/**
 * Enhanced markdown renderer component
 */
function MarkdownRenderer({ content = '', className = '' }) {
  // Process content to handle edge cases and detect content types
  const safeContent = React.useMemo(() => {
    try {
      // Run both preprocessors to ensure DOM nesting is fixed
      const preprocessed = preprocessMarkdown(content);
      return fixDOMNestingIssues(preprocessed);
    } catch (error) {
      console.error('Error preprocessing markdown:', error);
      return String(content || '');
    }
  }, [content]);

  // Create custom components - moved to component level to avoid hook rule violations
  // This is only called once per component instance, not inside other hooks
  const components = React.useMemo(() => createCustomComponents(), []);

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        skipHtml={false}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
