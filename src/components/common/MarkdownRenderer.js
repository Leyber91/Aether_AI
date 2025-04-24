import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownRenderer.css';
// Modular custom renderers
import CodeRenderer from './MarkdownRenderers/code.js';
import ImgRenderer from './MarkdownRenderers/img.js';
import ParagraphRenderer from './MarkdownRenderers/p.js';
import HrRenderer from './MarkdownRenderers/hr.js';
import PreRenderer from './MarkdownRenderers/pre.js';
import LiRenderer from './MarkdownRenderers/li.js';
import OlRenderer from './MarkdownRenderers/ol.js';
import TheadRenderer from './MarkdownRenderers/thead.js';
import TrRenderer from './MarkdownRenderers/tr.js';
import SvgRenderer from './MarkdownRenderers/svg.js';
import CanvasRenderer from './MarkdownRenderers/canvas.js';

const MarkdownRenderer = ({ content }) => {
  // Defensive: ensure content is always a string
  let safeContent = content;
  if (typeof content !== 'string') {
    console.warn('[MarkdownRenderer] content is not a string:', content);
    safeContent = content && content.text ? String(content.text) : String(content || '');
  }
  const renderers = {
    code: ({ node, inline, className, children, ...props }) => (
      <CodeRenderer node={node} inline={inline} className={className} {...props}>
        {children}
      </CodeRenderer>
    ),
    img: ImgRenderer,
    p: ParagraphRenderer,
    hr: HrRenderer,
    pre: PreRenderer,
    li: LiRenderer,
    ol: OlRenderer,
    thead: TheadRenderer,
    tr: TrRenderer,
    // Headings
    h1: ({ node, children, ...props }) => <h1 className="md-heading md-h1" {...props}>{children}</h1>,
    h2: ({ node, children, ...props }) => <h2 className="md-heading md-h2" {...props}>{children}</h2>,
    h3: ({ node, children, ...props }) => <h3 className="md-heading md-h3" {...props}>{children}</h3>,
    h4: ({ node, children, ...props }) => <h4 className="md-heading md-h4" {...props}>{children}</h4>,
    h5: ({ node, children, ...props }) => <h5 className="md-heading md-h5" {...props}>{children}</h5>,
    h6: ({ node, children, ...props }) => <h6 className="md-heading md-h6" {...props}>{children}</h6>,
    // Lists
    ul: ({ node, ...props }) => <ul className="md-list" {...props} />,
    // Links
    a: ({ node, children, href, ...props }) => (
      <a 
        className="md-link" 
        href={href}
        target="_blank" 
        rel="noopener noreferrer" 
        {...props}
      >
        {children}
      </a>
    ),
    // Blockquotes
    blockquote: ({ node, ...props }) => <blockquote className="md-blockquote" {...props} />,
    // Tables
    table: ({ node, ...props }) => <table className="md-table" {...props} />,
    tbody: ({ node, ...props }) => <tbody className="md-tbody" {...props} />,
    th: ({ node, ...props }) => <th className="md-th" {...props} />,
    td: ({ node, ...props }) => <td className="md-td" {...props} />
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={renderers}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
