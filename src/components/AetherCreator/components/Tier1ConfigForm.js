import React from 'react';
import styles from '../AetherCreator.module.css';
import Tooltip from './Tooltip';
import PresetSelector from './PresetSelector';

const Tier1ConfigForm = (props) => {
  const {
    // GGUF Path
    ggufPath, setGgufPath,
    // Presets
    presets, selectedPreset, handlePresetChange,
    handleSaveCustomPreset,
    // Parameters
    numCtx, setNumCtx,
    numGpu, setNumGpu,
    temperature, setTemperature,
    repeatPenalty, setRepeatPenalty,
    topK, setTopK,
    topP, setTopP,
    numThread, setNumThread,
    mirostat, setMirostat,
    mirostatEta, setMirostatEta,
    mirostatTau, setMirostatTau,
    // Directives
    systemPrompt, setSystemPrompt,
    template, setTemplate,
    adapterPath, setAdapterPath,
    // Stop Sequences
    stopSequences, currentStopInput, setCurrentStopInput,
    handleAddStopSequence, handleRemoveStopSequence,
    // Generate action
    handleGenerateModelfile,
  } = props;

  return (
    <>
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          Load Parameter Preset:
          <Tooltip text="Select a preset to quickly populate parameters.">
            <span className={styles.tooltipIcon}>(?)</span>
          </Tooltip>
        </label>
        <PresetSelector presets={presets} selectedPreset={selectedPreset} handlePresetChange={handlePresetChange} />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="ggufPath" className={styles.inputLabel}>
          Path to GGUF Model (FROM):
          <Tooltip text="Local path to your .gguf model file or a model name from Ollama library.">
            <span className={styles.tooltipIcon}>(?)</span>
          </Tooltip>
        </label>
        <input type="text" id="ggufPath" name="ggufPath" placeholder="/path/to/your/model.gguf" value={ggufPath} onChange={(e) => setGgufPath(e.target.value)} className={styles.inputControl} />
      </div>

      {/* Parameter Grid */}
      <div className={styles.gridTwoCols}>
        <div className={styles.inputGroup}>
          <label htmlFor="numCtx" className={styles.inputLabel}>Context Window (num_ctx): <Tooltip text="Max tokens for context. Default: 2048."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
          <input type="number" id="numCtx" value={numCtx} onChange={(e) => setNumCtx(Math.max(0, parseInt(e.target.value,10) || 0))} className={styles.inputControl} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="numGpu" className={styles.inputLabel}>GPU Layers (num_gpu): <Tooltip text="Layers to offload to GPU. -1 for all. Default: 99."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
          <input type="number" id="numGpu" value={numGpu} onChange={(e) => setNumGpu(parseInt(e.target.value,10) || 0)} className={styles.inputControl} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="temperature" className={styles.inputLabel}>Temperature: <Tooltip text="Output randomness. 0.1-0.5 focused, 0.8+ creative. Default: 0.7."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
          <input type="number" step="0.01" id="temperature" value={temperature} onChange={(e) => setTemperature(Math.max(0, parseFloat(e.target.value) || 0))} className={styles.inputControl} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="repeatPenalty" className={styles.inputLabel}>Repeat Penalty: <Tooltip text="Penalizes token repetition. Default: 1.1."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
          <input type="number" step="0.01" id="repeatPenalty" value={repeatPenalty} onChange={(e) => setRepeatPenalty(Math.max(0, parseFloat(e.target.value) || 0))} className={styles.inputControl} />
        </div>
      </div>

      {/* Directives: SYSTEM, TEMPLATE, ADAPTER */}
      <div className={styles.inputGroup}>
        <label htmlFor="systemPrompt" className={styles.inputLabel}>SYSTEM Prompt: <Tooltip text="Sets context, personality for the AI."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
        <textarea id="systemPrompt" placeholder="Define system message..." value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={3} className={styles.textareaControl} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="template" className={styles.inputLabel}>TEMPLATE Definition: <Tooltip text="Full prompt template. Must include {{.Prompt}}."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
        <textarea id="template" placeholder="{{.System}} {{.Prompt}}" value={template} onChange={(e) => setTemplate(e.target.value)} rows={3} className={styles.textareaControl} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="adapterPath" className={styles.inputLabel}>ADAPTER Path (optional): <Tooltip text="Path to LoRA/QLoRA adapter file."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
        <input type="text" id="adapterPath" placeholder="/path/to/adapter.bin" value={adapterPath} onChange={(e) => setAdapterPath(e.target.value)} className={styles.inputControl} />
      </div>

      {/* Advanced Parameters Grid */}
      <div className={styles.gridThreeCols}>
        <div className={styles.inputGroup}>
          <label htmlFor="topK" className={styles.inputLabel}>Top K (top_k): <Tooltip text="Sample from K most likely tokens. 0 to disable. Default: 40."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
          <input type="number" id="topK" value={topK} onChange={(e) => setTopK(Math.max(0, parseInt(e.target.value,10) || 0))} className={styles.inputControl} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="topP" className={styles.inputLabel}>Top P (top_p): <Tooltip text="Sample from smallest set exceeding P probability. 1.0 to disable. Default: 0.9."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
          <input type="number" step="0.01" id="topP" value={topP} onChange={(e) => setTopP(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))} className={styles.inputControl} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="numThread" className={styles.inputLabel}>CPU Threads (num_thread): <Tooltip text="CPU threads for computation. 0 for default."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
          <input type="number" id="numThread" value={numThread} onChange={(e) => setNumThread(Math.max(0, parseInt(e.target.value,10) || 0))} className={styles.inputControl} />
        </div>
      </div>
      <div className={`${styles.gridThreeCols} ${styles.mirostatConditionalContainer}`}>
        <div className={styles.inputGroup}>
          <label htmlFor="mirostat" className={styles.inputLabel}>Mirostat Mode: <Tooltip text="0: Disabled, 1: Mirostat, 2: Mirostat 2.0. Default: 0."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
          <select id="mirostat" value={mirostat} onChange={(e) => setMirostat(parseInt(e.target.value,10))} className={styles.selectControl}>
            <option value="0">0: Disabled</option>
            <option value="1">1: Mirostat</option>
            <option value="2">2: Mirostat 2.0</option>
          </select>
        </div>
        {mirostat !== 0 ? (
          <>
            <div className={styles.inputGroup}>
              <label htmlFor="mirostatEta" className={styles.inputLabel}>Mirostat Eta (η): <Tooltip text="Mirostat learning rate. Default: 0.1."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
              <input type="number" step="0.01" id="mirostatEta" value={mirostatEta} onChange={(e) => setMirostatEta(Math.max(0, parseFloat(e.target.value) || 0))} className={styles.inputControl} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="mirostatTau" className={styles.inputLabel}>Mirostat Tau (τ): <Tooltip text="Mirostat target perplexity. Default: 5.0."><span className={styles.tooltipIcon}>(?)</span></Tooltip></label>
              <input type="number" step="0.01" id="mirostatTau" value={mirostatTau} onChange={(e) => setMirostatTau(Math.max(0, parseFloat(e.target.value) || 0))} className={styles.inputControl} />
            </div>
          </>
        ) : (<><div /><div /></>)} {/* Placeholders for grid structure */}
      </div>

      {/* Stop Sequences */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          Stop Sequences (optional):
          <Tooltip text="Text sequences to make the model stop generating.">
            <span className={styles.tooltipIcon}>(?)</span>
          </Tooltip>
        </label>
        <div className={styles.stopSequenceInputRow}>
          <input type="text" placeholder='e.g., "User:" or <|eot_id|>' value={currentStopInput} onChange={(e) => setCurrentStopInput(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { handleAddStopSequence(); e.preventDefault(); } }} className={`${styles.inputControl} ${styles.stopSequenceInput}`} />
          <button onClick={handleAddStopSequence} type="button" className={`${styles.button} ${styles.addStopButton}`}>Add Stop</button>
        </div>
        <div className={styles.stopSequencesContainer}>
          {stopSequences.map((seq, index) => (
            <div key={index} className={styles.stopSequenceTag}>
              <span>{seq}</span>
              <button onClick={() => handleRemoveStopSequence(index)} type="button" className={styles.removeStopButton} title="Remove stop sequence">&times;</button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Generate Modelfile Button */}
      <div className={styles.generateButtonContainer}>
        <button 
          onClick={handleGenerateModelfile}
          className={styles.generateButton}
          type="button"
        >
          <span className={styles.generateIcon}>⚙️</span>
          Generate Modelfile
          <span className={styles.arrowRightIcon}>→</span>
        </button>
      </div>
    </>
  );
};

export default Tier1ConfigForm; 