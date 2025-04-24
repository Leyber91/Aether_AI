import React, { useState } from 'react';
import sidebarStyles from '../AetherCanvas.Sidebar.module.css';

const OUTPUT_FORMATS = [
  { label: 'JSON', value: 'json' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'CSV', value: 'csv' },
  { label: 'Plain Text', value: 'text' },
  { label: 'Custom Script', value: 'custom' },
  { label: 'LLM Transformation', value: 'llm' },
];

const OUTPUT_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Object', value: 'object' },
  { label: 'Array', value: 'array' },
  { label: 'File', value: 'file' },
];

export default function OutputNodeConfig({ node, onChange, onRun, loading, error, previewData }) {
  const { label = '', id = '', format = '', script = '', llmModel = '', instructions = '', preview = '', errorHandling = '', inputType = '', outputType = '' } = node.data || {};
  const [showScriptEditor, setShowScriptEditor] = useState(format === 'custom');
  const [showLLMOptions, setShowLLMOptions] = useState(format === 'llm');

  // Handle format change
  const handleFormatChange = e => {
    const value = e.target.value;
    onChange({ format: value });
    setShowScriptEditor(value === 'custom');
    setShowLLMOptions(value === 'llm');
  };

  return (
    <div className={sidebarStyles.sidebarPanel}>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Label</label>
        <input className={sidebarStyles.sidebarInput} type="text" value={label} onChange={e => onChange({ label: e.target.value })} placeholder="Node label (e.g. Output, Final Step)" />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Unique ID</label>
        <input className={sidebarStyles.sidebarInput} type="text" value={id} onChange={e => onChange({ id: e.target.value })} placeholder="Unique node ID" />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Input Type</label>
        <select className={sidebarStyles.sidebarSelect} value={inputType} onChange={e => onChange({ inputType: e.target.value })}>
          <option value="">Select input type</option>
          {OUTPUT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Output Type</label>
        <select className={sidebarStyles.sidebarSelect} value={outputType} onChange={e => onChange({ outputType: e.target.value })}>
          <option value="">Select output type</option>
          {OUTPUT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Output Format</label>
        <select className={sidebarStyles.sidebarSelect} value={format} onChange={handleFormatChange}>
          <option value="">Select format</option>
          {OUTPUT_FORMATS.map(fmt => (
            <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
          ))}
        </select>
      </div>
      {showScriptEditor && (
        <div className={sidebarStyles.sidebarSection}>
          <label className={sidebarStyles.sidebarLabel}>Custom Script (JS)</label>
          <textarea className={sidebarStyles.sidebarTextarea} value={script} onChange={e => onChange({ script: e.target.value })} rows={4} placeholder="Write a JS function: (output) => { return ... }" />
        </div>
      )}
      {showLLMOptions && (
        <div className={sidebarStyles.sidebarSection}>
          <label className={sidebarStyles.sidebarLabel}>LLM Model</label>
          <input className={sidebarStyles.sidebarInput} type="text" value={llmModel} onChange={e => onChange({ llmModel: e.target.value })} placeholder="e.g. llama3.2:1b, gpt-4, etc." />
          <label className={sidebarStyles.sidebarLabel} style={{marginTop: '8px'}}>Transformation Instructions</label>
          <textarea className={sidebarStyles.sidebarTextarea} value={instructions} onChange={e => onChange({ instructions: e.target.value })} rows={3} placeholder="Describe how to transform the output using the LLM..." />
        </div>
      )}
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Error Handling</label>
        <textarea className={sidebarStyles.sidebarTextarea} value={errorHandling} onChange={e => onChange({ errorHandling: e.target.value })} rows={2} placeholder="Instructions for handling output errors or fallbacks..." />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Preview (read-only)</label>
        <textarea className={sidebarStyles.sidebarTextarea} value={previewData || preview} readOnly rows={3} placeholder="Preview will appear here after running the node..." />
      </div>
      <div className={sidebarStyles.sidebarActions}>
        <button type="button" className={sidebarStyles.runNodeBtn} onClick={onRun} disabled={loading}>{loading ? 'Running...' : 'Run Output'}</button>
      </div>
      {error && <div className={sidebarStyles.sidebarError}>{error}</div>}
    </div>
  );
}
