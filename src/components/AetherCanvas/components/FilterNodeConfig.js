import React, { useState } from 'react';
import sidebarStyles from '../AetherCanvas.Sidebar.module.css';

const IO_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Object', value: 'object' },
  { label: 'Array', value: 'array' },
  { label: 'File', value: 'file' },
];

export default function FilterNodeConfig({ node, onChange, onRun, loading, error, previewData }) {
  const { label = '', id = '', condition = '', instructions = '', script = '', branches = [], errorHandling = '', inputType = '', outputType = '' } = node.data || {};
  const [branchList, setBranchList] = useState(branches.length ? branches : [{ label: '', condition: '', target: '' }]);

  // Branch logic
  const handleBranchChange = (idx, field, value) => {
    const updated = branchList.map((b, i) => i === idx ? { ...b, [field]: value } : b);
    setBranchList(updated);
    onChange({ branches: updated });
  };
  const addBranch = () => {
    const updated = [...branchList, { label: '', condition: '', target: '' }];
    setBranchList(updated);
    onChange({ branches: updated });
  };
  const removeBranch = idx => {
    const updated = branchList.filter((_, i) => i !== idx);
    setBranchList(updated);
    onChange({ branches: updated });
  };

  return (
    <div className={sidebarStyles.sidebarPanel}>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Label</label>
        <input className={sidebarStyles.sidebarInput} type="text" value={label} onChange={e => onChange({ label: e.target.value })} placeholder="Node label (e.g. Filter, Condition)" />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Unique ID</label>
        <input className={sidebarStyles.sidebarInput} type="text" value={id} onChange={e => onChange({ id: e.target.value })} placeholder="Unique node ID" />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Input Type</label>
        <select className={sidebarStyles.sidebarSelect} value={inputType} onChange={e => onChange({ inputType: e.target.value })}>
          <option value="">Select input type</option>
          {IO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Output Type</label>
        <select className={sidebarStyles.sidebarSelect} value={outputType} onChange={e => onChange({ outputType: e.target.value })}>
          <option value="">Select output type</option>
          {IO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Condition (Expression or Script)</label>
        <textarea className={sidebarStyles.sidebarTextarea} value={condition} onChange={e => onChange({ condition: e.target.value })} rows={2} placeholder="e.g. input.includes('foo') or any JS expression..." />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Instructions</label>
        <textarea className={sidebarStyles.sidebarTextarea} value={instructions} onChange={e => onChange({ instructions: e.target.value })} rows={2} placeholder="Describe what this filter should do..." />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Custom Script (JS)</label>
        <textarea className={sidebarStyles.sidebarTextarea} value={script} onChange={e => onChange({ script: e.target.value })} rows={4} placeholder="Write a JS function: (input) => { return ... }" />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Branches (Conditional Outputs)</label>
        {branchList.map((branch, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'center' }}>
            <input className={sidebarStyles.sidebarInput} type="text" value={branch.label} onChange={e => handleBranchChange(idx, 'label', e.target.value)} placeholder="Label (e.g. Pass, Fail)" style={{ flex: 1 }} />
            <input className={sidebarStyles.sidebarInput} type="text" value={branch.condition} onChange={e => handleBranchChange(idx, 'condition', e.target.value)} placeholder="Condition (JS)" style={{ flex: 2 }} />
            <input className={sidebarStyles.sidebarInput} type="text" value={branch.target} onChange={e => handleBranchChange(idx, 'target', e.target.value)} placeholder="Target Node ID" style={{ flex: 1 }} />
            <button type="button" onClick={() => removeBranch(idx)} style={{ background: 'none', border: 'none', color: '#e55', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={addBranch} style={{ marginTop: 4, background: '#222c', border: 'none', color: '#7ad0ff', padding: '2px 8px', borderRadius: 4, cursor: 'pointer' }}>+ Add Branch</button>
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Error Handling</label>
        <textarea className={sidebarStyles.sidebarTextarea} value={errorHandling} onChange={e => onChange({ errorHandling: e.target.value })} rows={2} placeholder="Instructions for handling filter errors or fallbacks..." />
      </div>
      <div className={sidebarStyles.sidebarSection}>
        <label className={sidebarStyles.sidebarLabel}>Preview (read-only)</label>
        <textarea className={sidebarStyles.sidebarTextarea} value={previewData || ''} readOnly rows={3} placeholder="Preview will appear here after running the node..." />
      </div>
      <div className={sidebarStyles.sidebarActions}>
        <button type="button" className={sidebarStyles.runNodeBtn} onClick={onRun} disabled={loading}>{loading ? 'Running...' : 'Run Filter'}</button>
      </div>
      {error && <div className={sidebarStyles.sidebarError}>{error}</div>}
    </div>
  );
}
