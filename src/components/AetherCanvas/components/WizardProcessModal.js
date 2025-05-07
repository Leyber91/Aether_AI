import React from 'react';
import styles from '../AetherCanvas.module.css';
import { FaSpinner } from 'react-icons/fa';

/**
 * Modal to show live wizard step progress and final output.
 * @param {Object} props
 * @param {boolean} props.open
 * @param {function} props.onCancel
 * @param {function} props.onUseWorkflow
 * @param {Array} props.steps - Array of { step, input, output, status, prompt }
 * @param {boolean} props.running
 * @param {string} props.finalOutput
 * @param {string} props.finalLabel
 * @param {string} props.rawOutput
 * @param {string} props.parseError
 */
export default function WizardProcessModal({
  open,
  onCancel,
  onUseWorkflow,
  steps = [],
  running,
  finalOutput,
  finalLabel = 'Workflow Schema',
  rawOutput = '',
  parseError = '',
}) {
  if (!open) return null;
  return (
    <div className={styles.wizardOverlay}>
      <div className={styles.wizardModal}>
        <h2>AI Wizard Progress</h2>
        {running && (
          <div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:8,marginBottom:16}}>
            <FaSpinner className={styles.spin} style={{fontSize:32,color:'#7ad0ff'}} />
            <div style={{color:'#7ad0ff',fontWeight:600}}>Processing Wizard Steps...</div>
          </div>
        )}
        <ol className={styles.wizardStepList}>
          {steps.map(({ step, input, output, status, prompt }, idx) => (
            <li key={step.id} className={styles.wizardStepItem} style={{
              background: idx === steps.findIndex(s => s.status === 'running') ? 'rgba(122,208,255,0.08)' : 'transparent',
              borderRadius: 8,
              marginBottom: 10,
              padding: 12,
              transition: 'background 0.3s'
            }}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <b>Step {idx + 1}: {step.instructions || step.type || step.id}</b>
                <span style={{marginLeft:4, color:'#888', minWidth: 90, display: 'inline-block'}}>
                  {status === 'running' && <span style={{color:'#7ad0ff'}}><FaSpinner className={styles.spin} /> Running...</span>}
                  {status === 'done' && <span style={{color:'#4caf50'}}>✔️ Done</span>}
                  {status === 'error' && <span style={{color:'#ff5f5f'}}>❌ Error</span>}
                </span>
              </div>
              <details style={{marginTop:4}} open={status === 'running' || status === 'error'}>
                <summary style={{cursor:'pointer'}}>Show Input/Output</summary>
                <div style={{fontSize:'0.95em',marginTop:2}}>
                  <div><b>Prompt:</b> <pre style={{whiteSpace:'pre-wrap', color:'#8fd6ff'}}>{input}</pre></div>
                  {prompt && prompt.length > 0 && (
                    <div style={{marginTop:6, marginBottom:6}}>
                      <b>LLM Messages:</b>
                      <div style={{background:'#23253a',borderRadius:6,padding:8,marginTop:2}}>
                        {prompt.map((msg, i) => (
                          <div key={i} style={{marginBottom:4}}>
                            <span style={{color:'#7ad0ff',fontWeight:600}}>[{msg.role}]</span>
                            <pre style={{display:'inline',whiteSpace:'pre-wrap',color:'#c7eaff',marginLeft:4}}>{msg.content}</pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{background:'rgba(122,208,255,0.06)', borderRadius:6, marginTop:6, padding:8, color:'#c7eaff', fontSize:13, animation:'fadeIn 0.5s'}}>
                    <b>Output:</b>
                    <div style={{whiteSpace:'pre-wrap'}}>{output}</div>
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
        <div style={{marginTop:16}}>
          <h3>Result: {finalLabel}</h3>
          <textarea readOnly value={finalOutput || ''} rows={6} style={{width:'100%',background:'#f6f6f6'}} />
        </div>
        {/* Debug/Advanced Section */}
        {(rawOutput || parseError) && (
          <div style={{marginTop:24,padding:12,background:'#23253a',borderRadius:8}}>
            <h4 style={{color:'#7ad0ff',marginBottom:4}}>Advanced Debug Info</h4>
            {parseError && <div style={{color:'#ff5f5f',marginBottom:8}}><b>Parsing/Validation Error:</b> {parseError}</div>}
            {rawOutput && <div><b>Raw LLM Output:</b>
              <pre style={{whiteSpace:'pre-wrap',background:'#191a2a',color:'#fff',padding:8,borderRadius:4,maxHeight:180,overflow:'auto'}}>{rawOutput}</pre>
              <button style={{marginTop:6,fontSize:'0.95em'}} onClick={()=>{navigator.clipboard.writeText(rawOutput)}}>Copy Raw Output</button>
            </div>}
          </div>
        )}
        <div style={{marginTop:16,display:'flex',justifyContent:'flex-end',gap:8}}>
          <button onClick={onCancel} disabled={running} style={running ? {opacity:0.6,cursor:'not-allowed'} : {}}>Cancel</button>
          <button onClick={onUseWorkflow} disabled={running || !finalOutput} style={running ? {opacity:0.6,cursor:'not-allowed'} : {}}>Use as Workflow</button>
        </div>
        <style>
          {`
            .${styles.spin} {
              animation: spin 1s linear infinite;
            }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          `}
        </style>
      </div>
    </div>
  );
}
