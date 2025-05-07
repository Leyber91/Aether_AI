/**
 * Custom list item renderer for MarkdownRenderer
 */
import React from 'react';
import createMarkdownRenderer from './createMarkdownRenderer.js';
import { splitAtBlocks } from './utils.js';

function LiMarkdownRenderer(props) {
  // Split children at block elements
  const Li = createMarkdownRenderer('li', 'md-list-item');
  const segments = splitAtBlocks(props.children);
  return (
    <>
      {segments.map((seg, idx) =>
        seg.type === 'inline'
          ? <Li key={`li-${idx}`}>{seg.children}</Li>
          : seg.children.map((block, bidx) => <React.Fragment key={`block-${idx}-${bidx}`}>{block}</React.Fragment>)
      )}
    </>
  );
}

export default LiMarkdownRenderer;
