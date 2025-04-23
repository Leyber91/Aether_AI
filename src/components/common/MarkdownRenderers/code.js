/**
 * Custom code block renderer for MarkdownRenderer
 */
import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import atomOneDark from 'react-syntax-highlighter/dist/styles/atom-one-dark';
import { FiCopy } from 'react-icons/fi';
import { FiEye } from 'react-icons/fi';
import mermaid from 'mermaid';
import { MermaidErrorBoundary } from './MermaidErrorBoundary';

const SUPPORTED_RENDER_LANGS = ['svg', 'html', 'mermaid', 'js', 'javascript', 'css'];

const CodeRenderer = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : undefined;
  const [showRender, setShowRender] = React.useState(false);
  const [mermaidSvg, setMermaidSvg] = React.useState(null);
  const codeString = String(children).replace(/\n$/, '');

  const canRender = language && SUPPORTED_RENDER_LANGS.includes(language);

  // --- Ultra-Robust Mermaid Preprocessing & Iterative Repair ---
  function splitHeaderAndFirstNode(code) {
    // If header is mashed with node, separate them
    // e.g. 'graph TDA[...]' => 'graph TD\nA[...]'
    const headerPattern = /^(graph\s+(TD|LR|RL|BT|TB))([A-Za-z0-9_\[])/m;
    if (headerPattern.test(code)) {
      return code.replace(headerPattern, (m, h, d, rest) => `${h}\n${rest}`);
    }
    return code;
  }

  function preprocessMermaidCode(code) {
    let corrections = [];
    let cleaned = code.replace(/\r\n|\r/g, '\n').replace(/^[ \t]+|[ \t]+$/gm, '');
    cleaned = cleaned.replace(/^```mermaid[\r\n]+/, '').replace(/```$/, '');
    cleaned = cleaned.replace(/^\s+|\s+$/g, '');

    // 1. Header detection/repair
    cleaned = splitHeaderAndFirstNode(cleaned);
    const headerMatch = cleaned.match(/^(graph\s+(TD|LR|RL|BT|TB)\b.*)/m);
    if (!headerMatch) {
      corrections.push('Added missing Mermaid header (graph TD)');
      cleaned = 'graph TD\n' + cleaned;
    } else if (!/^graph\s+(TD|LR|RL|BT|TB)\s*$/m.test(headerMatch[1])) {
      let fixedHeader = headerMatch[1].match(/^graph\s+(TD|LR|RL|BT|TB)/);
      if (fixedHeader) {
        corrections.push('Fixed malformed Mermaid header');
        cleaned = cleaned.replace(headerMatch[1], fixedHeader[0] + '\n' + headerMatch[1].replace(fixedHeader[0], '').trim());
      }
    }

    // 2. Remove stray markdown/code lines
    cleaned = cleaned.split('\n').filter(line => {
      if (/^\s*([#`]|PS\s*$)/.test(line)) {
        corrections.push('Removed stray/invalid line: ' + line);
        return false;
      }
      if (/^[\s\W_]+$/.test(line)) {
        corrections.push('Removed non-mermaid line: ' + line);
        return false;
      }
      return true;
    }).join('\n');

    // 3. Bracket/parenthesis balancing (global)
    function balanceBrackets(str, open, close) {
      const openCount = (str.match(new RegExp(`\\${open}`, 'g')) || []).length;
      const closeCount = (str.match(new RegExp(`\\${close}`, 'g')) || []).length;
      if (openCount > closeCount) {
        corrections.push(`Auto-closed unmatched ${open} brackets`);
        str += close.repeat(openCount - closeCount);
      }
      return str;
    }
    cleaned = balanceBrackets(cleaned, '[', ']');
    cleaned = balanceBrackets(cleaned, '(', ')');
    cleaned = balanceBrackets(cleaned, '{', '}');

    // 4. Per-line: fix unclosed node label brackets
    cleaned = cleaned.split('\n').map(line => {
      // Only attempt if line contains a node label
      const nodeMatch = line.match(/\w+\[/);
      if (nodeMatch) {
        const open = (line.match(/\[/g) || []).length;
        const close = (line.match(/\]/g) || []).length;
        if (open > close) {
          corrections.push(`Auto-closed missing ']' in node label on line: ${line}`);
          return line + ']'.repeat(open - close);
        }
      }
      return line;
    }).join('\n');

    // 5. Remove non-printable/control chars
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    // 6. Remove lines with invalid node IDs (spaces, special chars)
    cleaned = cleaned.split('\n').filter(line => {
      if (/^[A-Za-z0-9_]+\s/.test(line)) return true;
      if (/-->|==>|-.+->/.test(line)) return true;
      if (/^[^\s\[]+\s+\[.*\]/.test(line)) return true;
      if (/\s{2,}/.test(line)) {
        corrections.push('Removed line with suspicious spacing: ' + line);
        return false;
      }
      return true;
    }).join('\n');

    return { cleaned, corrections };
  }

  // --- Iterative parse-and-comment-out ---
  async function tryParseWithLineCommenting(mermaid, code, maxAttempts = 5) {
    let lines = code.split('\n');
    let corrections = [];
    for (let attempt = 0; attempt < maxAttempts; ++attempt) {
      try {
        mermaid.parse(lines.join('\n'));
        return { cleaned: lines.join('\n'), corrections };
      } catch (err) {
        // Try to find error line from err.hash.loc.line (1-based)
        let errLine = err?.hash?.loc?.line;
        if (errLine && errLine <= lines.length) {
          corrections.push(`Commented out line ${errLine} due to parse error: ${lines[errLine-1]}`);
          lines[errLine-1] = '%% ' + lines[errLine-1];
        } else {
          // If no line info, comment out the first non-header line
          for (let i = 1; i < lines.length; ++i) {
            if (!lines[i].startsWith('%%')) {
              corrections.push(`Commented out line ${i+1} due to parse error: ${lines[i]}`);
              lines[i] = '%% ' + lines[i];
              break;
            }
          }
        }
      }
    }
    return { cleaned: lines.join('\n'), corrections, gaveUp: true };
  }

  React.useEffect(() => {
    if (showRender && language === 'mermaid') {
      let cancelled = false;
      (async () => {
        try {
          if (window && window.mermaid) {
            window.mermaid.parseError = () => {};
            window.mermaid.parseErrorMessage = () => {};
            const bombOverlay = document.querySelector('.mermaid .error-icon, .mermaid .error');
            if (bombOverlay && bombOverlay.parentNode) {
              bombOverlay.parentNode.removeChild(bombOverlay);
            }
          }
          mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict', suppressErrors: true });
          // --- Use advanced preprocessing ---
          let { cleaned: cleanedCode, corrections } = preprocessMermaidCode(codeString);
          if (!cleanedCode.trim()) {
            setMermaidSvg(`<div class='mermaid-error-box'><strong>No Mermaid code detected.</strong><br/>Paste or write a diagram to render.<br/><a href='https://mermaid-js.github.io/mermaid/#/flowchart' target='_blank' rel='noopener noreferrer' style='color:#7fd'>Mermaid Docs</a></div>`);
            return;
          }
          // --- Iterative parse-and-comment-out ---
          let parseSuccess = false;
          let gaveUp = false;
          try {
            mermaid.parse(cleanedCode);
            parseSuccess = true;
          } catch (err) {
            // Try iterative repair
            const result = await tryParseWithLineCommenting(mermaid, cleanedCode, 5);
            cleanedCode = result.cleaned;
            corrections = corrections.concat(result.corrections);
            gaveUp = result.gaveUp;
            try {
              mermaid.parse(cleanedCode);
              parseSuccess = true;
            } catch (err2) {
              let msg = err2?.message || err2;
              if (err2.hash && err2.hash.loc) {
                msg += `<br/><span style='opacity:0.8'>Line: ${err2.hash.loc.line}, Col: ${err2.hash.loc.column}</span>`;
              }
              if (corrections.length) {
                msg += `<br/><span style='color:#ff9'>Auto-corrections applied:<ul style=\'margin:0 0 0 1em;\'>${corrections.map(c => `<li>${c}</li>`).join('')}</ul></span>`;
              }
              msg += `<br/><a href='https://mermaid-js.github.io/mermaid/#/flowchart' target='_blank' rel='noopener noreferrer' style='color:#7fd'>Mermaid Docs</a>`;
              if (!cancelled) setMermaidSvg(`<div class='mermaid-error-box'><strong>Mermaid syntax error (after auto-repair):</strong><br/>${msg}</div>`);
              return;
            }
          }
          if (parseSuccess) {
            const uniqueId = `mermaid-svg-${Math.random().toString(36).substr(2, 9)}`;
            try {
              const { svg } = await mermaid.render(uniqueId, cleanedCode);
              if (!cancelled) setMermaidSvg(svg);
            } catch (err) {
              let msg = err?.message || err;
              if (corrections.length) {
                msg += `<br/><span style='color:#ff9'>Auto-corrections applied:<ul style=\'margin:0 0 0 1em;\'>${corrections.map(c => `<li>${c}</li>`).join('')}</ul></span>`;
              }
              msg += `<br/><a href='https://mermaid-js.github.io/mermaid/#/flowchart' target='_blank' rel='noopener noreferrer' style='color:#7fd'>Mermaid Docs</a>`;
              if (!cancelled) setMermaidSvg(`<div class='mermaid-error-box'><strong>Mermaid render error:</strong><br/>${msg}</div>`);
            }
          }
        } catch (err) {
          let msg = err?.message || err;
          msg += `<br/><a href='https://mermaid-js.github.io/mermaid/#/flowchart' target='_blank' rel='noopener noreferrer' style='color:#7fd'>Mermaid Docs</a>`;
          if (!cancelled) setMermaidSvg(`<div class='mermaid-error-box'><strong>Unexpected Mermaid error:</strong><br/>${msg}</div>`);
        }
      })();
      return () => { cancelled = true; };
    } else if (!showRender) {
      setMermaidSvg(null);
    }
    // eslint-disable-next-line
  }, [showRender, codeString, language]);

  let renderedOutput = null;
  if (showRender && language === 'svg') {
    renderedOutput = (
      <div className="code-render-visual-area">
        <div
          className="markdown-svg-renderer"
          dangerouslySetInnerHTML={{ __html: codeString }}
          style={{ maxWidth: '100%', maxHeight: 400 }}
        />
      </div>
    );
  } else if (showRender && language === 'html') {
    renderedOutput = (
      <div className="code-render-visual-area html-preview-area">
        <iframe
          title="HTML Render"
          style={{ width: '100%', minHeight: 420, minWidth: 200, border: 'none', borderRadius: '0.5em', background: '#181f2a' }}
          sandbox="allow-scripts allow-same-origin"
          srcDoc={codeString}
        />
      </div>
    );
  } else if (showRender && (language === 'js' || language === 'javascript')) {
    renderedOutput = (
      <div className="code-render-visual-area">
        <iframe
          title="JS Render"
          style={{ width: '100%', minHeight: 120, border: 'none', borderRadius: '0.5em', background: '#181f2a' }}
          sandbox="allow-scripts"
          srcDoc={`<script>${codeString}<\/script>`}
        />
      </div>
    );
  } else if (showRender && language === 'css') {
    renderedOutput = (
      <div className="code-render-visual-area">
        <iframe
          title="CSS Render"
          style={{ width: '100%', minHeight: 120, border: 'none', borderRadius: '0.5em', background: '#181f2a' }}
          sandbox="allow-same-origin"
          srcDoc={`<style>${codeString}<\/style><div class='css-preview'>CSS Preview Area</div>`}
        />
      </div>
    );
  } else if (showRender && language === 'mermaid') {
    renderedOutput = (
      <div className="code-render-visual-area">
        {mermaidSvg ? (
          <MermaidErrorBoundary>
            <div
              className="markdown-mermaid-renderer"
              dangerouslySetInnerHTML={{ __html: mermaidSvg }}
              style={{ width: '100%', maxWidth: 600, minHeight: 80 }}
            />
          </MermaidErrorBoundary>
        ) : (
          <div style={{ color: '#a6f1ff', textAlign: 'center', padding: '1em' }}>Rendering diagram...</div>
        )}
      </div>
    );
  }

  return !inline && language ? (
    <div className={`code-block-container${showRender ? ' code-block-visual-mode' : ''}`}>  {/* Visual mode class for styling */}
      <div className="code-header">
        <span className="code-language">{language}</span>
        <div className="code-header-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {canRender && (
            <button
              className="copy-button"
              onClick={() => setShowRender((v) => !v)}
              title={showRender ? `Hide ${language} output` : `Render ${language}`}
              aria-label={showRender ? `Hide ${language} output` : `Render ${language}`}
              style={{ marginRight: '0.1em' }}
            >
              <FiEye style={{ marginRight: '0.22em', fontSize: '1.08em', verticalAlign: 'middle' }} />
              <span style={{ verticalAlign: 'middle', fontWeight: 500, fontSize: '0.97em', opacity: 0.93 }}>{showRender ? 'Hide' : 'Render'}</span>
            </button>
          )}
          <button 
            className="copy-button"
            onClick={() => {
              navigator.clipboard.writeText(codeString);
            }}
            title="Copy code"
            aria-label="Copy code"
          >
            <FiCopy style={{marginRight: '0.25em', fontSize: '1.08em', verticalAlign: 'middle'}} />
            <span style={{verticalAlign: 'middle', fontWeight: 500, fontSize: '0.97em', opacity: 0.93}}>Copy</span>
          </button>
        </div>
      </div>
      {!showRender && (
        <SyntaxHighlighter
          style={atomOneDark}
          language={language}
          PreTag="div"
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      )}
      {showRender && renderedOutput}
    </div>
  ) : (
    <code className={`inline-code ${className || ''}`} {...props}>
      {children}
    </code>
  );
};

export default CodeRenderer;
