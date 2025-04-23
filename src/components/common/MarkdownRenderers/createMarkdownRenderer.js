import React from 'react';

/**
 * Factory to create simple markdown renderers for tags with a className.
 * @param {string} tag - The HTML tag to render.
 * @param {string} className - The className to apply.
 * @returns {React.FC}
 */
export default function createMarkdownRenderer(tag, className) {
  const Renderer = React.forwardRef((props, ref) => {
    const Tag = tag;
    return <Tag ref={ref} className={className} {...props} />;
  });
  Renderer.displayName = `${tag.charAt(0).toUpperCase() + tag.slice(1)}MarkdownRenderer`;
  return Renderer;
}
