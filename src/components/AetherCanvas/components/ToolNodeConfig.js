import React, { useState } from 'react';
import sidebarStyles from '../AetherCanvas.Sidebar.module.css';
import { FaQuestionCircle, FaEye, FaEyeSlash, FaExclamationTriangle, FaCopy, FaEraser } from 'react-icons/fa';

const BACKENDS = [
  { label: 'Ollama', value: 'ollama' },
  { label: 'Groq', value: 'groq' },
  { label: 'Custom', value: 'custom' },
];

const IO_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Object', value: 'object' },
  { label: 'Array', value: 'array' },
  { label: 'File', value: 'file' },
];

function isSensitiveKey(key) {
  return /api|token|secret|key|password/i.test(key);
}

export default function ToolNodeConfig({ node, onChange, onRun, loading, error, previewData }) {
  const { label = '', id = '', backend = '', model = '', parameters = [], script = '', errorHandling = '', chaining = '', instructions = '', inputType = '', outputType = '', warning = '' } = node.data || {};
  const [paramList, setParamList] = useState(parameters.length ? parameters : [{ key: '', value: '' }]);
  const [showParam, setShowParam] = useState(Array(paramList.length).fill(false));

  // Parameter logic
  const handleParamChange = (idx, field, value) => {
    const updated = paramList.map((p, i) => i === idx ? { ...p, [field]: value } : p);
    setParamList(updated);
    onChange({ parameters: updated });
  };
  const addParam = () => {
    const updated = [...paramList, { key: '', value: '' }];
    setParamList(updated);
    setShowParam([...showParam, false]);
    onChange({ parameters: updated });
  };
  const removeParam = idx => {
    const updated = paramList.filter((_, i) => i !== idx);
    setParamList(updated);
    setShowParam(showParam.filter((_, i) => i !== idx));
    onChange({ parameters: updated });
  };
  const toggleShowParam = idx => {
    setShowParam(showParam.map((val, i) => i === idx ? !val : val));
  };
  const clearAll = () => {
    setParamList([{ key: '', value: '' }]);
    setShowParam([false]);
    onChange({
      label: '', id: '', backend: '', model: '', parameters: [{ key: '', value: '' }], script: '', errorHandling: '', chaining: '', instructions: '', inputType: '', outputType: ''
    });
  };
  const copyConfig = () => {
    const config = { label, id, backend, model, parameters: paramList, script, errorHandling, chaining, instructions, inputType, outputType };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  };

  return (
    <div className={sidebarStyles.sidebarPanel}>
      {warning && (
        <div className={sidebarStyles.sidebarWarning}><FaExclamationTriangle style={{marginRight: 6}} />{warning}</div>
      )}
      {error && (
        <div className={sidebarStyles.sidebarError}><FaExclamationTriangle style={{marginRight: 6}} />{error}</div>
      )}
      <div className={sidebarStyles.sidebarActions} style={{marginBottom: 10, display: 'flex', gap: 8}}>
        <button type="button" className={sidebarStyles.iconBtn} title="Clear all fields" onClick={clearAll}><FaEraser /></button>
        <button type="button" className={sidebarStyles.iconBtn} title="Copy config to clipboard" onClick={copyConfig}><FaCopy /></button>
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Label <FaQuestionCircle title="A human-readable name for this node." style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
        <input className={sidebarStyles.sidebarInput} type="text" value={label} onChange={e => onChange({ label: e.target.value })} placeholder="Node label (e.g. Tool, API Call)" required />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Unique ID <FaQuestionCircle title="A unique identifier for referencing this node." style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
        <input className={sidebarStyles.sidebarInput} type="text" value={id} onChange={e => onChange({ id: e.target.value })} placeholder="Unique node ID" required />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Input Type <FaQuestionCircle title="The type of data this node expects as input." style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
        <select className={sidebarStyles.sidebarSelect} value={inputType} onChange={e => onChange({ inputType: e.target.value })} required>
          <option value="">Select input type</option>
          {IO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Output Type <FaQuestionCircle title="The type of data this node will output." style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
        <select className={sidebarStyles.sidebarSelect} value={outputType} onChange={e => onChange({ outputType: e.target.value })} required>
          <option value="">Select output type</option>
          {IO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Backend <FaQuestionCircle title="The service or engine to use for this tool (e.g. Ollama, Groq, Custom)." style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
        <select className={sidebarStyles.sidebarSelect} value={backend} onChange={e => onChange({ backend: e.target.value })} required>
          <option value="">Select backend</option>
          {BACKENDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Model <FaQuestionCircle title="The specific model or service to use (e.g. llama3.2:1b, gpt-4, etc.)." style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
        <input className={sidebarStyles.sidebarInput} type="text" value={model} onChange={e => onChange({ model: e.target.value })} placeholder="e.g. llama3.2:1b, gpt-4, etc." />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
          <label className={sidebarStyles.sidebarLabel}>Parameters <FaQuestionCircle title="Key-value pairs to configure the tool. Sensitive keys are masked." style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
          <button type="button" className={sidebarStyles.iconBtn} title="Add Parameter" onClick={addParam} style={{marginLeft: 4, fontSize: 18}}>+</button>
        </div>
        {paramList.map((param, idx) => (
          <div key={idx} className={sidebarStyles.paramRow}>
            <input className={sidebarStyles.sidebarInput} type="text" value={param.key} onChange={e => handleParamChange(idx, 'key', e.target.value)} placeholder="Key" style={{ flex: 1 }} />
            {isSensitiveKey(param.key) ? (
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <input className={sidebarStyles.sidebarInput} type={showParam[idx] ? 'text' : 'password'} value={param.value} onChange={e => handleParamChange(idx, 'value', e.target.value)} placeholder="Value (masked)" style={{ flex: 1 }} />
                <button type="button" className={sidebarStyles.iconBtn} onClick={() => toggleShowParam(idx)} title={showParam[idx] ? 'Hide' : 'Show'} style={{marginLeft: 4}}>{showParam[idx] ? <FaEyeSlash /> : <FaEye />}</button>
              </div>
            ) : (
              <input className={sidebarStyles.sidebarInput} type="text" value={param.value} onChange={e => handleParamChange(idx, 'value', e.target.value)} placeholder="Value" style={{ flex: 1 }} />
            )}
            <button type="button" className={sidebarStyles.iconBtn} onClick={() => removeParam(idx)} title="Remove Parameter" style={{ color: '#e55', marginLeft: 4 }}>&times;</button>
          </div>
        ))}
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Instructions <FaQuestionCircle title="Describe what this tool should do or its intended behavior." style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
        <textarea className={sidebarStyles.sidebarTextarea} value={instructions} onChange={e => onChange({ instructions: e.target.value })} rows={3} placeholder="Describe what this tool should do..." />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Custom Script (JS) <FaQuestionCircle title="Optional: Write a JS function: (input, params) => { return ... }" style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
        <textarea className={sidebarStyles.sidebarTextarea} value={script} onChange={e => onChange({ script: e.target.value })} rows={4} placeholder="Write a JS function: (input, params) => { return ... }" />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Error Handling <FaQuestionCircle title="Instructions for handling tool errors or fallbacks." style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
        <textarea className={sidebarStyles.sidebarTextarea} value={errorHandling} onChange={e => onChange({ errorHandling: e.target.value })} rows={2} placeholder="Instructions for handling tool errors or fallbacks..." />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Chaining (Next Node IDs) <FaQuestionCircle title="Comma-separated node IDs for chaining output to other nodes." style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
        <input className={sidebarStyles.sidebarInput} type="text" value={chaining} onChange={e => onChange({ chaining: e.target.value })} placeholder="Comma-separated node IDs for chaining..." />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Preview (read-only) <FaQuestionCircle title="Shows the output of the last run for this node." style={{marginLeft: 4, color: '#7ad0ff'}} /></label>
        <textarea className={sidebarStyles.sidebarTextarea} value={previewData || ''} readOnly rows={3} placeholder="Preview will appear here after running the node..." />
      </div>
      <div className={sidebarStyles.sidebarActions}>
        <button type="button" className={sidebarStyles.runNodeBtn} onClick={onRun} disabled={loading}>{loading ? 'Running...' : 'Run Tool'}</button>
      </div>
    </div>
  );
}
