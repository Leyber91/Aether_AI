import React from 'react';

const VisualCodeRenderer = ({ children, className, ...props }) => (
  <pre className={className} {...props}>
    <code>{children}</code>
  </pre>
);

export default VisualCodeRenderer;
