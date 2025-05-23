import React, { useState, useEffect, useRef } from 'react';
import { FiCode, FiPlay, FiCopy, FiDownload, FiZoomIn, FiZoomOut, FiMaximize, FiMinimize } from 'react-icons/fi';
import mermaid from 'mermaid';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import './CodeBlockRenderer.css';

// Initialize mermaid configuration
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  logLevel: 'error',
  securityLevel: 'loose',
  fontFamily: 'var(--font-mono)',
  themeVariables: {
    primaryColor: '#30a5da',
    primaryTextColor: '#fff',
    primaryBorderColor: '#7a9ae0',
    lineColor: '#f8b73e',
    secondaryColor: '#006d92',
    tertiaryColor: '#202334'
  }
});

/**
 * Simple plain text renderer without any code block styling
 */
const PlainTextRenderer = ({ content }) => {
  return <span className="plain-text">{content}</span>;
};

/**
 * Simple inline code renderer for HTML tags and short snippets
 */
const SimpleCodeRenderer = ({ content }) => {
  return <code className="simple-inline-code">{content}</code>;
};

/**
 * Full-featured code block renderer with toggle functionality
 */
const FullCodeBlockRenderer = ({ language, content, filename }) => {
  // All hooks are declared unconditionally at the top level
  const [isRendered, setIsRendered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [renderError, setRenderError] = useState(null);
  const [renderedContent, setRenderedContent] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const renderContainerRef = useRef(null);
  const codeId = useRef(`code-${Math.random().toString(36).substring(2, 9)}`).current;

  // Determine if content is renderable
  const isRenderableLanguage = ['html', 'css', 'svg', 'mermaid', 'javascript', 'js'].includes(language);

  // Better language detection for unmarked or incorrectly marked code blocks
  useEffect(() => {
    // Detect language if none is specified or if it's a commonly misidentified type
    if ((!language || language === 'text' || language === 'xml') && content) {
      // Enhanced SVG detection (most important to detect first)
      if (/<svg[\s\S]*?(?:<\/svg>|width=|height=|viewBox)/i.test(content)) {
        language = 'svg';
      } 
      // HTML detection
      else if (/<html[\s\S]*?<\/html>/i.test(content) || 
               /<body[\s\S]*?<\/body>/i.test(content) || 
               /<!DOCTYPE html>/i.test(content)) {
        language = 'html';
      } 
      // CSS detection
      else if (/<style[\s\S]*?<\/style>/i.test(content) || 
               /\{[\s\S]*?color:[\s\S]*?\}/i.test(content) ||
               /\{[\s\S]*?margin:[\s\S]*?\}/i.test(content) ||
               /\{[\s\S]*?padding:[\s\S]*?\}/i.test(content)) {
        language = 'css';
      } 
      // JavaScript detection
      else if (/function[\s\S]*?\([\s\S]*?\)[\s\S]*?\{/i.test(content) || 
               /const[\s\S]*?=[\s\S]*?=>/i.test(content) ||
               /var[\s\S]*?=[\s\S]*?function/i.test(content) ||
               /let[\s\S]*?=[\s\S]*?new /i.test(content)) {
        language = 'javascript';
      } 
      // Mermaid detection
      else if (/graph[\s\S]*?;|sequenceDiagram|classDiagram|flowchart/i.test(content)) {
        language = 'mermaid';
      }
    }
  }, [content, language]);

  // Handle copying code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(content)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code:', err);
      });
  };

  // Handle downloading code
  const handleDownloadCode = () => {
    const extension = language === 'js' ? 'js' : 
                      language === 'css' ? 'css' : 
                      language === 'svg' ? 'svg' : 
                      language === 'mermaid' ? 'mmd' : 'txt';
    
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || `code-snippet.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle zooming in and out
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 20, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 20, 60));
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Add keyboard listener for ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent scrolling when in fullscreen
      document.body.style.overflow = 'hidden';
      // Add class to body for additional styling
      document.body.classList.add('has-fullscreen-code');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore scrolling when exiting fullscreen
      document.body.style.overflow = '';
      // Remove class from body
      document.body.classList.remove('has-fullscreen-code');
    };
  }, [isFullscreen]);

  // Prism highlight effect
  useEffect(() => {
    if (!showPreview && renderContainerRef.current) {
      Prism.highlightAllUnder(renderContainerRef.current);
    }
  }, [showPreview, content, language]);

  // Render the content based on language
  useEffect(() => {
    if (!isRendered || !isRenderableLanguage || !renderContainerRef.current) {
      return;
    }

    const container = renderContainerRef.current;
    container.innerHTML = '';
    setRenderError(null);

    // Create a resizable container for content
    const resizableContainer = document.createElement('div');
    resizableContainer.className = 'resizable-content';
    
    // Add size indicator that updates as container is resized
    const sizeIndicator = document.createElement('div');
    sizeIndicator.className = 'size-indicator';
    sizeIndicator.textContent = 'Drag to resize';
    resizableContainer.appendChild(sizeIndicator);
    
    // Update size indicator when container is resized
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        sizeIndicator.textContent = `${Math.round(width)}px × ${Math.round(height)}px`;
      }
    });
    
    resizeObserver.observe(resizableContainer);
    
    // Add resizable container to the parent container
    container.appendChild(resizableContainer);
    
    // We'll render content within the resizable container
    const contentContainer = resizableContainer;

    try {
      switch (language) {
        case 'html':
          // Create sandbox for HTML content using srcdoc instead of direct document manipulation
          const iframe = document.createElement('iframe');
          iframe.title = "HTML Preview";
          iframe.sandbox = "allow-scripts allow-same-origin"; // Allow scripts but restrict top navigation etc.
          iframe.style.width = '100%';
          iframe.style.minHeight = '200px'; // Ensure it's at least this tall
          iframe.style.maxHeight = '600px'; // Limit initial growth, user can resize container
          iframe.style.border = 'none';
          iframe.style.borderRadius = '8px';
          iframe.style.backgroundColor = '#24283b'; // Fallback, should be styled by srcdoc
          iframe.style.display = 'block'; // Ensure it behaves as a block element
          
          // Determine if this is likely SVG inside HTML
          const containsSvg = /<svg[\s\S]*?>[\s\S]*?<\/svg>/i.test(content);
          
          // Use srcdoc attribute with dark theme styling
          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  :root {
                    color-scheme: dark;
                  }
                  
                  body { 
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    margin: 0; 
                    padding: 16px; 
                    line-height: 1.5;
                    background-color: #24283b;
                    color: #c0caf5;
                  }
                  
                  * { box-sizing: border-box; }
                  
                  /* Dark theme defaults */
                  a { color: #7aa2f7; }
                  h1, h2, h3, h4, h5, h6 { color: #bb9af7; }
                  hr { border-color: #565f89; }
                  code { 
                    background-color: #1a1b26; 
                    padding: 0.2em 0.4em;
                    border-radius: 3px;
                    font-family: monospace;
                  }
                  pre {
                    background-color: #1a1b26;
                    padding: 1em;
                    border-radius: 8px;
                    overflow-x: auto;
                  }
                  table {
                    border-collapse: collapse;
                    width: 100%;
                  }
                  th, td {
                    border: 1px solid #565f89;
                    padding: 8px;
                  }
                  th {
                    background-color: #1a1b26;
                  }
                  img {
                    max-width: 100%;
                    height: auto;
                  }
                  button, input, select, textarea {
                    background-color: #1a1b26;
                    border: 1px solid #565f89;
                    color: #c0caf5;
                    border-radius: 4px;
                    padding: 8px;
                  }
                  button {
                    cursor: pointer;
                    background-color: #7aa2f7;
                    color: #1a1b26;
                    border: none;
                    font-weight: bold;
                  }
                  button:hover {
                    background-color: #6b93e8;
                  }
                  
                  /* SVG styling */
                  svg {
                    max-width: 100%;
                    height: auto;
                    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
                  }
                  svg circle:not([fill]), svg rect:not([fill]), svg path:not([fill]), 
                  svg polygon:not([fill]), svg ellipse:not([fill]) {
                    fill: #7aa2f7;
                  }
                  svg line:not([stroke]), svg path:not([stroke]), 
                  svg polyline:not([stroke]), svg circle:not([stroke]) {
                    stroke: #bb9af7;
                  }
                  svg text {
                    fill: #c0caf5;
                  }
                </style>
              </head>
              <body>${content}</body>
            </html>
          `;
          
          // Set the srcdoc property
          iframe.srcdoc = htmlContent;
          contentContainer.appendChild(iframe);
          setRenderedContent('HTML preview loaded');
          break;

        case 'css':
          // Create an iframe for isolated CSS rendering with dark theme
          const cssIframe = document.createElement('iframe');
          cssIframe.title = "CSS Preview";
          cssIframe.style.width = '100%';
          cssIframe.style.minHeight = '200px';
          cssIframe.style.maxHeight = '600px';
          cssIframe.style.border = 'none';
          cssIframe.style.borderRadius = '8px';
          cssIframe.style.backgroundColor = '#24283b';
          cssIframe.style.display = 'block';
          
          // Sanitize CSS to prevent security issues
          const sanitizedCSS = content
            .replace(/@import\s+url/gi, '/* @import url - removed for security */')
            .replace(/position\s*:\s*fixed/gi, 'position: relative')
            .replace(/position\s*:\s*absolute/gi, 'position: relative')
            .replace(/top\s*:\s*0/gi, '/* top: 0 - removed */');
          
          // Prepare CSS content with dark theme styling
          const cssDocContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  :root {
                    color-scheme: dark;
                  }
                  
                  body { 
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    margin: 0; 
                    padding: 16px; 
                    line-height: 1.5;
                    background-color: #24283b;
                    color: #c0caf5;
                  }
                  
                  * { box-sizing: border-box; }
                  
                  .css-preview-title {
                    color: #bb9af7;
                    font-size: 1.2rem;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #565f89;
                    padding-bottom: 0.5rem;
                  }
                  
                  .css-preview-section {
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    background-color: #1a1b26;
                    border-radius: 8px;
                  }
                  
                  .css-demo {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    margin-bottom: 1rem;
                  }
                  
                  .css-box {
                    width: 100px;
                    height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #3d59a1;
                    color: white;
                    border-radius: 8px;
                    font-weight: bold;
                  }
                  
                  .css-sample-text {
                    line-height: 1.6;
                    margin: 1rem 0;
                  }
                  
                  .css-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 1rem;
                  }
                  
                  .css-button {
                    padding: 0.5rem 1rem;
                    background-color: #7aa2f7;
                    color: #1a1b26;
                    border: none;
                    border-radius: 4px;
                    font-weight: bold;
                    cursor: pointer;
                  }
                  
                  /* Apply user CSS after our base styles */
                  ${sanitizedCSS}
                </style>
              </head>
              <body>
                <div class="css-preview-title">CSS Preview</div>
                
                <div class="css-preview-section">
                  <div class="css-demo">
                    <div class="css-box">Box 1</div>
                    <div class="css-box">Box 2</div>
                    <div class="css-box">Box 3</div>
                  </div>
                </div>
                
                <div class="css-preview-section">
                  <p class="css-sample-text">This is a sample paragraph with <strong>bold</strong>, <em>italic</em>, and <a href="#">link</a> elements to demonstrate text styling.</p>
                  
                  <div class="css-buttons">
                    <button class="css-button">Button 1</button>
                    <button class="css-button">Button 2</button>
                    <button class="css-button">Button 3</button>
                  </div>
                </div>
              </body>
            </html>
          `;
          
          cssIframe.srcdoc = cssDocContent;
          contentContainer.appendChild(cssIframe);
          setRenderedContent('CSS preview loaded');
          break;

        case 'svg':
          // Safely render SVG using iframe for isolation with dark theme
          const svgIframe = document.createElement('iframe');
          svgIframe.title = "SVG Preview";
          svgIframe.style.width = '100%';
          svgIframe.style.minHeight = '150px'; // SVGs can sometimes be smaller initially
          svgIframe.style.maxHeight = '600px';
          svgIframe.style.border = 'none';
          svgIframe.style.backgroundColor = 'transparent';
          svgIframe.className = 'svg-iframe';
          svgIframe.style.display = 'block';
          
          contentContainer.appendChild(svgIframe);
          
          // Prepare SVG content with dark theme-friendly background
          // Fix common SVG formatting issues
          let svgContent = content;
          
          // If SVG doesn't have proper xmlns, add it
          if (!svgContent.includes('xmlns="http://www.w3.org/2000/svg"')) {
            svgContent = svgContent.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
          }
          
          // Add viewBox if missing
          if (!svgContent.includes('viewBox')) {
            // Try to extract width and height
            const widthMatch = svgContent.match(/width="([^"]+)"/);
            const heightMatch = svgContent.match(/height="([^"]+)"/);
            if (widthMatch && heightMatch) {
              const width = parseInt(widthMatch[1], 10) || 100;
              const height = parseInt(heightMatch[1], 10) || 100;
              svgContent = svgContent.replace(/<svg/i, `<svg viewBox="0 0 ${width} ${height}"`);
            } else {
              // Default viewBox
              svgContent = svgContent.replace(/<svg/i, '<svg viewBox="0 0 100 100"');
            }
          }
          
          // Use srcdoc for safer SVG rendering with dark theme
          const svgDocContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  :root {
                    color-scheme: dark;
                  }
                  
                  body { 
                    margin: 0; 
                    padding: 0;
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    background-color: #1a1b26; 
                    color: #c0caf5;
                    overflow: hidden;
                  }
                  
                  /* Create a wrapper div for the SVG */
                  .svg-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    overflow: hidden;
                  }
                  
                  /* Better SVG rendering */
                  svg { 
                    max-width: 100%; 
                    max-height: 100%;
                    object-fit: contain;
                    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
                  }
                  
                  /* Better animations for SVG elements */
                  svg * {
                    transform-origin: center;
                  }
                  
                  /* Default styling for SVG elements */
                  svg circle:not([fill]), svg rect:not([fill]), svg path:not([fill]), 
                  svg polygon:not([fill]), svg ellipse:not([fill]) {
                    fill: #7aa2f7;
                  }
                  svg line:not([stroke]), svg path:not([stroke]), 
                  svg polyline:not([stroke]), svg circle:not([stroke]) {
                    stroke: #bb9af7;
                  }
                  svg text {
                    fill: #c0caf5;
                  }
                  
                  /* Handle zoom styling */
                  #zoom-style {
                    /* This will be dynamically populated by the zoom controller */
                  }
                </style>
                <!-- Empty style tag for dynamic zoom level -->
                <style id="zoom-style"></style>
              </head>
              <body>
                <div class="svg-container">${svgContent}</div>
              </body>
            </html>
          `;
          
          svgIframe.srcdoc = svgDocContent;
          setRenderedContent('SVG preview loaded');
          break;

        case 'mermaid':
          // Render mermaid diagram
          const mermaidDiv = document.createElement('div');
          mermaidDiv.className = 'mermaid-diagram';
          mermaidDiv.id = `mermaid-${codeId}`;
          contentContainer.appendChild(mermaidDiv);
          
          try {
            // Initialize mermaid with each render to ensure it's available
            if (typeof mermaid.render === 'function') {
              mermaid.render(`mermaid-svg-${codeId}`, content)
                .then(({ svg }) => {
                  mermaidDiv.innerHTML = svg;
                  setRenderedContent(svg);
                })
                .catch(err => {
                  console.error('Mermaid rendering error:', err);
                  setRenderError('Failed to render Mermaid diagram. Please check your syntax.');
                });
            } else {
              // Fallback if mermaid.render is not available
              mermaidDiv.innerHTML = '<div class="mermaid-error">Mermaid rendering library not available</div>';
              setRenderError('Mermaid rendering library not available.');
            }
          } catch (error) {
            console.error('Mermaid processing error:', error);
            mermaidDiv.innerHTML = `<div class="mermaid-error">Error rendering diagram: ${error.message}</div>`;
            setRenderError(`Failed to process Mermaid diagram: ${error.message}`);
          }
          break;

        case 'javascript':
        case 'js':
          // For JavaScript, create a console output display with safer execution
          const consoleOutputDiv = document.createElement('div');
          consoleOutputDiv.className = 'js-console-output';
          
          const consoleHeader = document.createElement('div');
          consoleHeader.className = 'js-console-header';
          consoleHeader.textContent = 'Console Output';
          
          const consoleContent = document.createElement('div');
          consoleContent.className = 'js-console-content';
          
          consoleOutputDiv.appendChild(consoleHeader);
          consoleOutputDiv.appendChild(consoleContent);
          contentContainer.appendChild(consoleOutputDiv);
          
          // Create a sandboxed environment for safer JS display (no execution for security)
          try {
            // Create a "simulated" output instead of actual execution
            const displayCode = () => {
              const logEntry = document.createElement('div');
              logEntry.className = 'js-console-entry js-console-info';
              logEntry.textContent = 'JavaScript code preview (code not executed for security reasons)';
              consoleContent.appendChild(logEntry);
              
              // Show what would happen when code is executed
              const codeAnalysis = document.createElement('div');
              codeAnalysis.className = 'js-console-entry js-console-log';
              
              // Simple code analysis
              let analysis = 'Code contains: ';
              if (content.includes('function')) analysis += 'functions, ';
              if (content.includes('class')) analysis += 'classes, ';
              if (content.includes('const')) analysis += 'constants, ';
              if (content.includes('let')) analysis += 'variables, ';
              if (content.includes('for') || content.includes('while')) analysis += 'loops, ';
              if (content.includes('if') || content.includes('else')) analysis += 'conditionals, ';
              if (content.includes('fetch')) analysis += 'network requests, ';
              if (content.includes('document.')) analysis += 'DOM manipulation, ';
              if (content.includes('addEventListener')) analysis += 'event listeners, ';
              
              codeAnalysis.textContent = analysis.endsWith(', ') ? analysis.slice(0, -2) : analysis;
              consoleContent.appendChild(codeAnalysis);
              
              // Add button to run in separate window (with warning)
              const runButton = document.createElement('button');
              runButton.className = 'js-run-button';
              runButton.textContent = 'Run in separate window (Caution: only run code you trust)';
              runButton.onclick = () => {
                const popup = window.open('', '_blank', 'width=800,height=600');
                if (popup) {
                  popup.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>JavaScript Code Execution</title>
                        <style>
                          body { font-family: monospace; padding: 20px; }
                          #console { background: #f0f0f0; padding: 10px; border: 1px solid #ccc; margin-top: 10px; }
                          pre { margin: 0; white-space: pre-wrap; }
                        </style>
                      </head>
                      <body>
                        <h3>Code Execution Results:</h3>
                        <div id="console"></div>
                        <script>
                          const originalConsole = console;
                          console = {
                            log: function(...args) {
                              const el = document.createElement('pre');
                              el.textContent = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                              document.getElementById('console').appendChild(el);
                              originalConsole.log(...args);
                            },
                            error: function(...args) {
                              const el = document.createElement('pre');
                              el.style.color = 'red';
                              el.textContent = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                              document.getElementById('console').appendChild(el);
                              originalConsole.error(...args);
                            },
                            warn: function(...args) {
                              const el = document.createElement('pre');
                              el.style.color = 'orange';
                              el.textContent = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
                              document.getElementById('console').appendChild(el);
                              originalConsole.warn(...args);
                            }
                          };
                          
                          try {
                            ${content}
                          } catch(error) {
                            console.error('Error:', error.message);
                          }
                        </script>
                      </body>
                    </html>
                  `);
                } else {
                  alert('Could not open window. Please check your popup blocker settings.');
                }
              };
              consoleContent.appendChild(runButton);
            };
            
            displayCode();
            setRenderedContent(consoleOutputDiv);
          } catch (error) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'js-console-entry js-console-error';
            errorMsg.textContent = `Error: ${error.toString()}`;
            consoleContent.appendChild(errorMsg);
            setRenderError(`Failed to analyze JavaScript: ${error.toString()}`);
          }
          break;

        default:
          setRenderError('This language cannot be rendered as preview.');
          break;
      }
    } catch (error) {
      console.error('Rendering error:', error);
      setRenderError(`Failed to render: ${error.toString()}`);
      
      // Clear the resizable container if there's an error
      container.innerHTML = '';
      
      // Add error message directly to the main container
      const errorDiv = document.createElement('div');
      errorDiv.className = 'render-error';
      errorDiv.innerHTML = `<p>${error.toString()}</p>`;
      container.appendChild(errorDiv);
    }
    
    // Cleanup function to disconnect the ResizeObserver
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isRendered, language, content, codeId, isRenderableLanguage]);

  // Apply zoom level to rendered content whenever it changes
  useEffect(() => {
    if (renderContainerRef.current) {
      const container = renderContainerRef.current;
      const resizableContainer = container.querySelector('.resizable-content');
      const iframe = container.querySelector('iframe');

      if (iframe) {
        if (isFullscreen) {
          // In fullscreen, remove inline height to let CSS control it fully.
          // The CSS uses calc(100vh - Ypx) !important for height.
          iframe.style.removeProperty('height');
          iframe.style.removeProperty('min-height');
          iframe.style.removeProperty('max-height');
        } else {
          // Only apply JS height calculations if NOT in fullscreen
          try {
            iframe.onload = () => {
              try {
                if (iframe.contentDocument) {
                  const scaleStyle = iframe.contentDocument.getElementById('zoom-style') || iframe.contentDocument.createElement('style');
                  scaleStyle.id = 'zoom-style';
                  scaleStyle.textContent = `
                    body {
                      zoom: ${zoomLevel / 100};
                      -moz-transform: scale(${zoomLevel / 100});
                      -moz-transform-origin: 0 0;
                      transform-origin: 0 0;
                      width: ${100 * (100 / zoomLevel)}%; /* Adjust width for zoom */
                      height: ${100 * (100 / zoomLevel)}%; /* Adjust height for zoom */
                      overflow: auto; /* Allow scrollbars inside iframe body if content overflows */
                    }
                  `;
                  if (!iframe.contentDocument.head.contains(scaleStyle)) {
                    iframe.contentDocument.head.appendChild(scaleStyle);
                  }
                }
              } catch (e) {
                console.warn('Could not access iframe content document for zoom styling:', e);
              }
            };
            // Trigger onload if already loaded, for dynamic content changes
            if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
              iframe.onload();
            }

            // Update iframe size based on zoom and available space in container (non-fullscreen only)
            let targetHeight = '300px'; // Default non-fullscreen height
            if (resizableContainer && resizableContainer.clientHeight > 0) {
              // Base height on resizable container, ensuring it's reasonable
              targetHeight = `${Math.min(600, Math.max(200, resizableContainer.clientHeight - 20))}px`;
            } else {
              // Fallback if resizable container has no height yet, adjust with zoom
              targetHeight = `${Math.min(600, Math.max(200, 300 * (zoomLevel / 100)))}px`;
            }
            iframe.style.height = targetHeight;
            // Ensure min/max set during creation are respected or re-applied if needed
            iframe.style.minHeight = language === 'svg' ? '150px' : '200px';
            iframe.style.maxHeight = '600px';

          } catch (e) {
            console.error('Error applying zoom/height to iframe in non-fullscreen:', e);
          }
        }
      }

      // Apply zoom to the resizable container for non-iframe content (e.g. raw code, mermaid)
      if (resizableContainer) {
        if (zoomLevel !== 100) {
          resizableContainer.classList.add('zoomed');
          // For non-iframe content, direct scale might be acceptable, or adjust font size etc.
          // This example focuses on ensuring iframe zoom doesn't conflict with direct scaling of resizableContainer
        } else {
          resizableContainer.classList.remove('zoomed');
        }
      }
    }
  }, [zoomLevel, isRendered, renderedContent, isFullscreen, language]);

  return (
    <div className={`code-block-container ${isRendered ? 'rendered-mode' : 'code-mode'} ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      <div className="code-block-header">
        <div className="code-language-label" data-language={language || 'text'}>{language || 'text'}</div>
        <div className="code-block-actions">
          {isRenderableLanguage && (
            <button 
              className={`toggle-render-btn ${isRendered ? 'active' : ''}`}
              onClick={() => setIsRendered(!isRendered)}
              title={isRendered ? "View source code" : "View rendered output"}
            >
              {isRendered ? <FiCode /> : <FiPlay />}
              <span>{isRendered ? "Source" : "Preview"}</span>
            </button>
          )}
          
          {isRendered && (
            <>
              <button 
                className="zoom-out-btn"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 60}
                title="Zoom out"
              >
                <FiZoomOut />
              </button>
              <div className="zoom-level">{zoomLevel}%</div>
              <button 
                className="zoom-in-btn"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                title="Zoom in"
              >
                <FiZoomIn />
              </button>
              <button 
                className="fullscreen-btn"
                onClick={handleFullscreenToggle}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <FiMinimize /> : <FiMaximize />}
              </button>
            </>
          )}
          
          <button 
            className={`code-block-action${showPreview ? ' active' : ''}`}
            title={showPreview ? 'Show Code' : 'Show Preview'}
            onClick={() => setShowPreview(prev => !prev)}
            aria-label={showPreview ? 'Show Code' : 'Show Preview'}
          >
            {showPreview ? <FiCode /> : <FiPlay />}
          </button>
          
          <button 
            className={`copy-code-btn ${isCopied ? 'copied' : ''}`}
            onClick={handleCopyCode}
            title="Copy code to clipboard"
          >
            <FiCopy />
            <span>{isCopied ? "Copied!" : "Copy"}</span>
          </button>
          <button 
            className="download-code-btn"
            onClick={handleDownloadCode}
            title="Download code"
          >
            <FiDownload />
            <span>Download</span>
          </button>
        </div>
      </div>
      
      <div className="code-block-content-wrapper">
        <div
          className={`code-block-content code-block-fade${showPreview ? ' code-block-hide' : ''}`}
          ref={renderContainerRef}
          style={{ display: showPreview ? 'none' : 'block' }}
        >
          <pre className={`language-${language}`}><code className={`language-${language}`}>{content}</code></pre>
        </div>
        <div
          className={`code-block-preview code-block-fade${showPreview ? ' code-block-show' : ''}`}
          style={{ display: showPreview ? 'block' : 'none' }}
        >
          {/* Existing preview rendering logic here (iframe/svg etc.) */}
          {/* ... */}
        </div>
      </div>
    </div>
  );
};

/**
 * TextPanelRenderer for plain text blocks
 */
const TextPanelRenderer = ({ content }) => {
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };
  return (
    <div className="text-panel">
      <div className="text-panel-header">
        <span className="text-panel-icon" aria-label="Text Block">📝</span>
        <span className="text-panel-label">TEXT</span>
        <button className="text-panel-copy" onClick={handleCopy} title="Copy text" aria-label="Copy text">
          <FiCopy /> {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="text-panel-content">{content}</div>
    </div>
  );
};

/**
 * Main component that selects the appropriate renderer based on content type
 */
const CodeBlockRenderer = ({ language, content, filename }) => {
  // First check if this is plain text
  if (language === 'plain text' || language === 'plaintext') {
    return <TextPanelRenderer content={content} />;
  }
  
  // Check for simple HTML tags or short code snippets
  const isSimpleHtmlTag = /^<[a-z0-9]+>?$/i.test(content) || 
                          /^<\/[a-z0-9]+>$/i.test(content);
  const isSimpleCode = content.length < 25 || isSimpleHtmlTag || /^\.[\w]+$/.test(content);
  
  // Use simple inline renderer for short code snippets
  if (isSimpleCode) {
    return <SimpleCodeRenderer content={content} />;
  }
  
  // Default to full-featured code block renderer
  return <FullCodeBlockRenderer language={language} content={content} filename={filename} />;
};

export { TextPanelRenderer };
export default CodeBlockRenderer;
