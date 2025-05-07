// Custom markdown renderer for JS code blocks
import React, { useEffect, useRef } from 'react';

// Usage: place a JS code block in markdown: ```js ... ```
export default function JsRenderer({ value }) {
  const iframeRef = useRef();
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    // Wait for iframe to be ready
    const tryInject = () => {
      const doc = iframe.contentDocument;
      if (!doc) {
        // Retry after a short delay if doc is not ready
        setTimeout(tryInject, 10);
        return;
      }
      doc.open();
      doc.write(`<script>${value}<\/script>`);
      doc.close();
    };
    tryInject();
    // Cleanup: blank the iframe on unmount or value change
    return () => {
      if (iframe && iframe.contentDocument) {
        iframe.contentDocument.open();
        iframe.contentDocument.write("");
        iframe.contentDocument.close();
      }
    };
  }, [value]);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <iframe
        ref={iframeRef}
        title="js-sandbox"
        sandbox="allow-scripts"
        style={{ width: 400, height: 200, border: '1px solid #444', background: '#181c24', borderRadius: 8, maxWidth: '100%' }}
      />
    </div>
  );
}
