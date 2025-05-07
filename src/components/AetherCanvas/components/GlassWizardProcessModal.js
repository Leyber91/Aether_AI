import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import MarkdownRenderer from '../../common/MarkdownRenderer';

/**
 * Glassmorphic Wizard Progress Modal
 * @param {Object} props
 * @param {boolean} props.open
 * @param {function} props.onCancel
 * @param {function} props.onUseWorkflow
 * @param {Array} props.steps - Array of { step, input, output, status, prompt }
 * @param {boolean} props.running
 * @param {string} props.finalOutput
 * @param {string} props.finalLabel
 */
export default function GlassWizardProcessModal({
  open,
  onCancel,
  onUseWorkflow,
  steps = [],
  running,
  finalOutput,
  finalLabel = 'Workflow Schema',
}) {
  if (!open) return null;
  return (
    <div className="glass-modal-overlay">
      <div className="glass-modal">
        <h2>AI Wizard Progress</h2>
        {/* Progress Bar */}
        <div className="glass-wizard-progress-bar-container">
          <div className="glass-wizard-progress-bar-bg">
            <div className="glass-wizard-progress-bar" style={{ width: `${Math.round((steps.filter(s => s.status === 'done').length / steps.length) * 100)}%` }} />
          </div>
          <span className="glass-wizard-progress-bar-label">{steps.filter(s => s.status === 'done').length} / {steps.length} steps complete</span>
        </div>
        {running && (
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <FaSpinner className="spin" style={{fontSize:32, color:'#7ad0ff', filter:'drop-shadow(0 0 8px #7ad0ff88)'}} />
            <span style={{color:'#7ad0ff', fontWeight:600}}>Processing Wizard Steps...</span>
          </div>
        )}
        <div className="glass-modal-scroll-container">
          <ol style={{listStyle:'none',padding:0,margin:0}}>
            {steps.map(({ step, input, output, status, prompt }, idx) => (
              <li key={step.id} className="glass-step">
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <b>Step {idx+1}: {step.instructions || step.type || step.id}</b>
                  <span style={{marginLeft:4, color:'#888', minWidth: 90, display: 'inline-block'}}>
                    {status === 'running' && <span style={{color:'#7ad0ff'}}><FaSpinner className="spin" /> Running...</span>}
                    {status === 'done' && <span style={{color:'#4caf50'}}>✔️ Done</span>}
                    {status === 'error' && <span style={{color:'#ff5f5f'}}>❌ Error</span>}
                  </span>
                </div>
                <details style={{marginTop:2}} open={status === 'running' || status === 'error' || (idx === 2 && status !== 'done')}>
                  <summary style={{cursor:'pointer'}}>Show Input/Output</summary>
                  <div style={{fontSize:'0.96em',marginTop:2}}>
                    <div><b>Prompt:</b> <pre style={{whiteSpace:'pre-wrap', color:'#8fd6ff'}}>{input}</pre></div>
                    {prompt && prompt.length > 0 && (
                      <div style={{marginTop:6, marginBottom:6}}>
                        <b>LLM Messages:</b>
                        <div style={{background:'rgba(35,37,58,0.7)',borderRadius:6,padding:8,marginTop:2}}>
                          {prompt.map((msg, i) => (
                            <div key={i} style={{marginBottom:4}}>
                              <span style={{color:'#7ad0ff',fontWeight:600}}>[{msg.role}]</span>
                              <pre style={{display:'inline',whiteSpace:'pre-wrap',color:'#c7eaff',marginLeft:4}}>{msg.content}</pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="output-streaming">
                      <b>Output:</b>
                      <div style={{whiteSpace:'pre-wrap', position:'relative'}}>
                        <MarkdownRenderer content={output} />
                        {status === 'running' && <span className="streaming-cursor">&#9608;</span>}
                        {/* Force streaming cursor for step 3 while running or if not done */}
                        {idx === 2 && status !== 'done' && <span className="streaming-cursor">&#9608;</span>}
                      </div>
                    </div>
                  </div>
                  {status === 'error' && (
                    <div style={{ color: '#ff6a6a', marginTop: 4 }}>
                      <strong>Error:</strong> {output}
                    </div>
                  )}
                </details>
              </li>
            ))}
          </ol>
        </div>
        <div style={{marginTop:24,display:'flex',justifyContent:'flex-end',gap:0}}>
          <button
            onClick={onCancel}
            disabled={running}
            className="glass-modal-cancel-btn"
            style={{
              background: 'linear-gradient(90deg, #2a3147 60%, #23304a 100%)',
              color: '#b6f0ff',
              border: 'none',
              borderRadius: '8px',
              padding: '11px 36px',
              fontWeight: 600,
              fontSize: '1.07em',
              letterSpacing: '0.01em',
              boxShadow: running ? 'none' : '0 2px 16px 0 rgba(31,38,135,0.13)',
              opacity: running ? 0.5 : 1,
              cursor: running ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s cubic-bezier(0.7,0.2,0.3,0.8)',
              outline: 'none',
              marginRight: 0
            }}
          >
            Cancel
          </button>
        </div>
      </div>
      <style>{`
        .glass-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(20, 24, 40, 0.18);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .glass-modal {
          min-width: 420px;
          max-width: 90vw;
          max-height: 92vh;
          background: rgba(30, 40, 60, 0.45);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(16px) saturate(180%);
          border-radius: 18px;
          border: 1.5px solid rgba(122, 208, 255, 0.18);
          padding: 32px 32px 24px 32px;
          display: flex;
          flex-direction: column;
        }
        .glass-modal-scroll-container {
          overflow-y: auto;
          max-height: 60vh;
          min-height: 120px;
          margin-top: 8px;
          margin-bottom: 8px;
        }
        .glass-step details {
          background: rgba(30,40,60,0.23);
          border-radius: 8px;
          padding: 8px 12px 8px 12px;
          margin-bottom: 8px;
          box-shadow: 0 2px 8px 0 rgba(31,38,135,0.07);
        }
        .output-streaming {
          background: rgba(20,24,40,0.11);
          border-radius: 6px;
          padding: 8px 10px;
          margin-top: 4px;
          font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
          font-size: 0.98em;
          color: #c7eaff;
        }
        .spin {
          animation: spin 1.1s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .streaming-cursor {
          display: inline-block;
          width: 10px;
          margin-left: 2px;
          color: #7ad0ff;
          background: none;
          animation: blink-cursor 1s steps(2, start) infinite;
        }
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .glass-wizard-progress-bar-container {
          margin-bottom: 12px;
        }
        .glass-wizard-progress-bar-bg {
          width: 100%;
          height: 7px;
          background: rgba(122,208,255,0.14);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 4px;
        }
        .glass-wizard-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #7ad0ff 60%, #b6f0ff 100%);
          transition: width 0.4s cubic-bezier(0.7,0.2,0.3,0.8);
        }
        .glass-wizard-progress-bar-label {
          font-size: 0.98em;
          color: #7ad0ff;
          margin-left: 2px;
        }
        .glass-modal-cancel-btn {
          background: linear-gradient(90deg, #2a3147 60%, #23304a 100%);
          color: #b6f0ff;
          border: none;
          border-radius: 8px;
          padding: 11px 36px;
          font-weight: 600;
          font-size: 1.07em;
          letter-spacing: 0.01em;
          box-shadow: 0 2px 16px 0 rgba(31,38,135,0.13);
          opacity: 1;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.7,0.2,0.3,0.8);
          outline: none;
          margin-right: 0;
        }
        .glass-modal-cancel-btn:active {
          background: linear-gradient(90deg, #1e253b 60%, #1b2336 100%);
        }
        @media (max-width: 600px) {
          .glass-modal {
            min-width: 95vw;
            padding: 20px 4vw 18px 4vw;
          }
          .glass-modal-scroll-container {
            max-height: 44vh;
          }
        }
      `}</style>
    </div>
  );
}
