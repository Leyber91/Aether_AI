import React, { useState, useEffect } from 'react';
import styles from './AetherCreator.module.css'; // Import the CSS module
import { importHfModel, startQloraFinetune } from '../../services/aetherCreatorService'; // Services for Tier 2 functionality
import Tooltip from './components/Tooltip'; // Import Tooltip from new location
import Tier1ConfigForm from './components/Tier1ConfigForm'; // Import Tier1ConfigForm
import ModelfileOutput from './components/ModelfileOutput'; // Import ModelfileOutput
import Tier2GGUFImporter from './components/Tier2GGUFImporter'; // Import GGUF Importer
import Tier2QLoRAConfig from './components/Tier2QLoRAConfig'; // Import QLoRA Config
import ModelSelector from '../ModelSelector/ModelSelector'; // Premium Model Selector
import AetherCreatorTabs from './AetherCreatorTabs';
import PresetSelector from './components/PresetSelector'; // Import PresetSelector for enhanced preset functionality

const AetherCreator = () => {
  // --- Tier 2 Import Status ---
  const [importStatusMessage, setImportStatusMessage] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  
  // --- Tier 1 State (Managed by AetherCreator, passed to Tier1ConfigForm) ---
  const [ggufPath, setGgufPath] = useState('');
  const [numCtx, setNumCtx] = useState(2048);
  const [numGpu, setNumGpu] = useState(99);
  const [temperature, setTemperature] = useState(0.7);
  const [stopSequences, setStopSequences] = useState([]);
  const [currentStopInput, setCurrentStopInput] = useState('');
  const [repeatPenalty, setRepeatPenalty] = useState(1.1);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [template, setTemplate] = useState('');
  const [adapterPath, setAdapterPath] = useState('');
  const [topK, setTopK] = useState(40);
  const [topP, setTopP] = useState(0.9);
  const [numThread, setNumThread] = useState(0);
  const [mirostat, setMirostat] = useState(0);
  const [mirostatEta, setMirostatEta] = useState(0.1);
  const [mirostatTau, setMirostatTau] = useState(5.0);
  const [selectedPreset, setSelectedPreset] = useState('');
  
  // --- Output State ---
  const [generatedModelfile, setGeneratedModelfile] = useState('');
  const [ollamaModelName, setOllamaModelName] = useState('my-custom-model');
  const [ollamaCreateCommand, setOllamaCreateCommand] = useState('');

  // --- Tier 2 State (Shared or Orchestrated by AetherCreator) ---
  const [hfModelId, setHfModelId] = useState(''); // Shared with QLoRA form
  const [quantizationType, setQuantizationType] = useState('Q4_K_M'); // Default quantization type
  const [datasetPath, setDatasetPath] = useState(''); // For QLoRA fine-tuning
  const [qloraParams, setQloraParams] = useState({
    rank: 8,
    alpha: 16,
    targetModules: 'q_proj,v_proj',
    learningRate: 0.0002,
    epochs: 3,
    batchSize: 1
  }); // QLoRA parameters

  const [userPresets, setUserPresets] = useState(() => {
    // Load saved user presets from localStorage if they exist
    const savedPresets = localStorage.getItem('aetherCreatorUserPresets');
    return savedPresets ? JSON.parse(savedPresets) : {};
  });

  // Combine built-in presets with user presets
  const presets = {
    default: {
      label: "Default Balanced",
      values: {} 
    },
    codingFocus: {
      label: "Coding Focus",
      values: {} 
    },
    creativeWriting: {
      label: "Creative Writing",
      values: {} 
    },
    maxSpeed: {
      label: "Maximum Speed / Minimalist",
      values: {} 
    },
    qaAssistant: {
      label: "Q&A Assistant",
      values: {}
    },
    instructFollow: {
      label: "Instruction Following",
      values: {}
    },
    longContext: {
      label: "Long Context",
      values: {}
    },
    ...userPresets
  };

  presets.default.values = {
    numCtx: 2048, numGpu: 99, temperature: 0.7, stopSequences: [], repeatPenalty: 1.1,
    topK: 40, topP: 0.9, numThread: 0, mirostat: 0, mirostatEta: 0.1, mirostatTau: 5.0,
    systemPrompt: '', template: '', adapterPath: '',
  };
  presets.codingFocus.values = {
    numCtx: 4096, numGpu: 99, temperature: 0.2, stopSequences: ['<|file_separator|>'], repeatPenalty: 1.15,
    topK: 10, topP: 0.5, numThread: 0, mirostat: 0, mirostatEta: 0.1, mirostatTau: 5.0,
    systemPrompt: 'You are an expert coding assistant. Provide clean, efficient, and well-commented code.',
    template: '{{ if .System }}SYSTEM: {{ .System }}{{ end }}\nUSER: {{ .Prompt }}\nASSISTANT:', adapterPath: '',
  };
  presets.creativeWriting.values = {
    numCtx: 3072, numGpu: 99, temperature: 0.9, stopSequences: ['### End of Story'], repeatPenalty: 1.2,
    topK: 50, topP: 0.95, numThread: 0, mirostat: 1, mirostatEta: 0.15, mirostatTau: 4.5,
    systemPrompt: 'You are a master storyteller. Weave a captivating narrative based on the user prompt.',
    template: '{{ if .System }}Genre: Fiction\n{{ .System }}{{ end }}\nPrompt: {{ .Prompt }}\nStory:\n', adapterPath: '',
  };
  presets.maxSpeed.values = {
    numCtx: 1024, numGpu: 99, temperature: 0.5, stopSequences: [], repeatPenalty: 1.0,
    topK: 0, topP: 1.0, numThread: 0, mirostat: 0, mirostatEta: 0.1, mirostatTau: 5.0,
    systemPrompt: '', template: '{{ .Prompt }}', adapterPath: '',
  };
  presets.qaAssistant.values = {
    numCtx: 4096, numGpu: 99, temperature: 0.3, stopSequences: ['USER:', 'QUESTION:'], repeatPenalty: 1.18,
    topK: 30, topP: 0.5, numThread: 0, mirostat: 0, mirostatEta: 0.1, mirostatTau: 5.0,
    systemPrompt: 'You are an AI assistant designed to provide accurate, factual answers to questions. Acknowledge when you don\'t know something rather than guessing.',
    template: '{{ if .System }}SYSTEM: {{ .System }}{{ end }}\nQUESTION: {{ .Prompt }}\nANSWER:', adapterPath: '',
  };
  presets.instructFollow.values = {
    numCtx: 8192, numGpu: 99, temperature: 0.4, stopSequences: ['###'], repeatPenalty: 1.1,
    topK: 40, topP: 0.6, numThread: 0, mirostat: 0, mirostatEta: 0.1, mirostatTau: 5.0,
    systemPrompt: 'You are a helpful AI assistant that follows instructions precisely. You perform tasks exactly as specified, breaking down complex requests into methodical steps.',
    template: '{{ if .System }}SYSTEM: {{ .System }}\n{{ end }}INSTRUCTION: {{ .Prompt }}\nRESPONSE:', adapterPath: '',
  };
  presets.longContext.values = {
    numCtx: 16384, numGpu: 99, temperature: 0.6, stopSequences: [], repeatPenalty: 1.05,
    topK: 40, topP: 0.8, numThread: 0, mirostat: 0, mirostatEta: 0.1, mirostatTau: 5.0,
    systemPrompt: 'You are an AI designed to work with long documents and complex information. You can maintain context over lengthy inputs and provide comprehensive analysis.',
    template: '{{ if .System }}INSTRUCTIONS: {{ .System }}{{ end }}\nDOCUMENT: {{ .Prompt }}\nANALYSIS:', adapterPath: '',
  };


  const handlePresetChange = (event) => {
    const presetKey = event.target.value;
    setSelectedPreset(presetKey);
    if (presets[presetKey]) {
      const presetValues = presets[presetKey].values;
      setNumCtx(presetValues.numCtx);
      setNumGpu(presetValues.numGpu);
      setTemperature(presetValues.temperature);
      setStopSequences(Array.isArray(presetValues.stopSequences) ? [...presetValues.stopSequences] : []);
      setCurrentStopInput('');
      setRepeatPenalty(presetValues.repeatPenalty);
      setTopK(presetValues.topK);
      setTopP(presetValues.topP);
      setNumThread(presetValues.numThread);
      setMirostat(presetValues.mirostat);
      setMirostatEta(presetValues.mirostatEta);
      setMirostatTau(presetValues.mirostatTau);
      setSystemPrompt(presetValues.systemPrompt);
      setTemplate(presetValues.template);
      setAdapterPath(presetValues.adapterPath);
    }
  };
  
  // Save current configuration as a custom preset
  const handleSaveCustomPreset = (presetName) => {
    const customPresetKey = `custom_${Date.now()}`;
    const newCustomPreset = {
      [customPresetKey]: {
        label: presetName,
        values: {
          numCtx, numGpu, temperature, stopSequences: [...stopSequences],
          repeatPenalty, topK, topP, numThread, mirostat, mirostatEta, mirostatTau,
          systemPrompt, template, adapterPath
        }
      }
    };
    
    // Update user presets
    const updatedUserPresets = { ...userPresets, ...newCustomPreset };
    setUserPresets(updatedUserPresets);
    
    // Save to localStorage
    localStorage.setItem('aetherCreatorUserPresets', JSON.stringify(updatedUserPresets));
    
    // Select the new preset
    setSelectedPreset(customPresetKey);
    
    // Show success message (could be a toast notification)
    console.log(`Custom preset "${presetName}" saved successfully`);
  };
  
  // Handle Tier 2 HF model import
  const handleImportHfModel = async () => {
    if (!hfModelId) {
      setImportStatusMessage('Please enter a valid Hugging Face model ID');
      return;
    }
    
    setIsImporting(true);
    setImportStatusMessage(`Starting import of ${hfModelId}...`);
    setImportProgress(0);
    
    try {
      // Simulate or actually call the import service
      const result = await importHfModel(hfModelId, quantizationType, (progress) => {
        setImportProgress(progress);
        setImportStatusMessage(`Importing ${hfModelId}: ${progress}% complete`);
      });
      
      if (result.success) {
        setGgufPath(result.ggufPath);
        setImportStatusMessage(`Import successful! GGUF model saved to: ${result.ggufPath}`);
      } else {
        setImportStatusMessage(`Import failed: ${result.error}`);
      }
    } catch (error) {
      setImportStatusMessage(`Import error: ${error.message}`);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };
  
  // Handle QLoRA fine-tuning
  const handleStartQloraFinetune = async () => {
    if (!hfModelId) {
      setImportStatusMessage('Please enter a valid Hugging Face model ID for fine-tuning');
      return;
    }
    
    if (!datasetPath) {
      setImportStatusMessage('Please select a dataset for fine-tuning');
      return;
    }
    
    setIsImporting(true);
    setImportStatusMessage(`Starting QLoRA fine-tuning for ${hfModelId}...`);
    setImportProgress(0);
    
    try {
      // Call the QLoRA fine-tuning service
      const result = await startQloraFinetune(hfModelId, datasetPath, qloraParams, (progress) => {
        setImportProgress(progress);
        setImportStatusMessage(`Fine-tuning progress: ${progress}%`);
      });
      
      if (result.success) {
        setAdapterPath(result.adapterPath);
        setImportStatusMessage(`Fine-tuning successful! Adapter saved to: ${result.adapterPath}`);
      } else {
        setImportStatusMessage(`Fine-tuning failed: ${result.error}`);
      }
    } catch (error) {
      setImportStatusMessage(`Fine-tuning error: ${error.message}`);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  useEffect(() => {
    // If any Tier 1 parameter changes AND a preset was selected, deselect the preset
    // to indicate custom configuration.
    if (selectedPreset !== '') {
        setSelectedPreset('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Do not include selectedPreset in dependency array to avoid loop with handlePresetChange
    ggufPath, numCtx, numGpu, temperature, stopSequences, repeatPenalty,
    topK, topP, numThread, mirostat, mirostatEta, mirostatTau,
    systemPrompt, template, adapterPath
  ]);

  const handleGenerateModelfile = () => {
    let modelfileContent = `FROM ${ggufPath || '/path/to/your/model.gguf'}\n`;
    if (systemPrompt.trim() !== '') modelfileContent += `SYSTEM """${systemPrompt}"""\n`;
    if (template.trim() !== '') modelfileContent += `TEMPLATE """${template}"""\n`;
    if (adapterPath.trim() !== '') modelfileContent += `ADAPTER ${adapterPath}\n`;
    modelfileContent += `PARAMETER num_ctx ${numCtx}\n`;
    modelfileContent += `PARAMETER num_gpu ${numGpu}\n`;
    modelfileContent += `PARAMETER temperature ${temperature}\n`;
    stopSequences.forEach(seq => {
      if (seq.trim() !== '') {
        const formattedSeq = seq.includes(' ') || seq.includes('\\') || seq.includes('"') ? `"${seq.replace(/"/g, '\\"')}"` : seq;
        modelfileContent += `PARAMETER stop ${formattedSeq}\n`;
      }
    });
    modelfileContent += `PARAMETER repeat_penalty ${repeatPenalty}\n`;
    modelfileContent += `PARAMETER top_k ${topK}\n`;
    modelfileContent += `PARAMETER top_p ${topP}\n`;
    if (numThread > 0) modelfileContent += `PARAMETER num_thread ${numThread}\n`;
    modelfileContent += `PARAMETER mirostat ${mirostat}\n`;
    if (mirostat !== 0) {
      modelfileContent += `PARAMETER mirostat_eta ${mirostatEta}\n`;
      modelfileContent += `PARAMETER mirostat_tau ${mirostatTau}\n`;
    }
    setGeneratedModelfile(modelfileContent);

    const tempModelfileName = 'Modelfile_AetherCreator.txt';
    const createCommand = `ollama create ${ollamaModelName || 'my-custom-model'} -f ${tempModelfileName}`;
    setOllamaCreateCommand(createCommand + `\n\n# Note: Save the Modelfile content above as '${tempModelfileName}' or use the download button and adjust the path.`);
  };

  const handleAddStopSequence = () => {
    if (currentStopInput.trim() !== '' && !stopSequences.includes(currentStopInput.trim())) {
      setStopSequences([...stopSequences, currentStopInput.trim()]);
      setCurrentStopInput('');
    }
  };

  const handleRemoveStopSequence = (indexToRemove) => {
    setStopSequences(stopSequences.filter((_, index) => index !== indexToRemove));
  };

  const handleCopyToClipboard = (textToCopy, type) => {
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => console.log(`${type} copied to clipboard!`))
        .catch(err => console.error(`Failed to copy ${type}: `, err));
    }
  };
  
  const handleDownloadModelfile = () => {
    if (generatedModelfile) {
      const blob = new Blob([generatedModelfile], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Modelfile_AetherCreator.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={styles.aetherCreatorContainer}>
      <div className={styles.mainPanel}>
        <div className={styles.pageHeader}>
          <h1 className={styles.mainTitle}>AetherCreator - Ollama Modelfile Generator</h1>
          <p className={styles.subtitle}>Configure and generate optimized Ollama Modelfiles.</p>
        </div>
        <AetherCreatorTabs
          // Tier 1 props
          ggufPath={ggufPath}
          setGgufPath={setGgufPath}
          presets={presets}
          selectedPreset={selectedPreset}
          handlePresetChange={handlePresetChange}
          handleSaveCustomPreset={handleSaveCustomPreset}
          numCtx={numCtx}
          setNumCtx={setNumCtx}
          numGpu={numGpu}
          setNumGpu={setNumGpu}
          temperature={temperature}
          setTemperature={setTemperature}
          repeatPenalty={repeatPenalty}
          setRepeatPenalty={setRepeatPenalty}
          topK={topK}
          setTopK={setTopK}
          topP={topP}
          setTopP={setTopP}
          numThread={numThread}
          setNumThread={setNumThread}
          mirostat={mirostat}
          setMirostat={setMirostat}
          mirostatEta={mirostatEta}
          setMirostatEta={setMirostatEta}
          mirostatTau={mirostatTau}
          setMirostatTau={setMirostatTau}
          systemPrompt={systemPrompt}
          setSystemPrompt={setSystemPrompt}
          template={template}
          setTemplate={setTemplate}
          adapterPath={adapterPath}
          setAdapterPath={setAdapterPath}
          stopSequences={stopSequences}
          setStopSequences={setStopSequences}
          currentStopInput={currentStopInput}
          setCurrentStopInput={setCurrentStopInput}
          handleAddStopSequence={handleAddStopSequence}
          handleRemoveStopSequence={handleRemoveStopSequence}
          handleGenerateModelfile={handleGenerateModelfile}
          
          // Tier 2 props
          hfModelId={hfModelId}
          setHfModelId={setHfModelId}
          importStatusMessage={importStatusMessage}
          setImportStatusMessage={setImportStatusMessage}
          importProgress={importProgress}
          isImporting={isImporting}
          quantizationType={quantizationType}
          setQuantizationType={setQuantizationType}
          datasetPath={datasetPath}
          setDatasetPath={setDatasetPath}
          qloraParams={qloraParams}
          setQloraParams={setQloraParams}
          handleImportHfModel={handleImportHfModel}
          handleStartQloraFinetune={handleStartQloraFinetune}
        />
      </div>
      <div className={styles.outputPanel}>
        <ModelfileOutput
          generatedModelfile={generatedModelfile}
          ollamaModelName={ollamaModelName}
          setOllamaModelName={setOllamaModelName}
          ollamaCreateCommand={ollamaCreateCommand}
          handleCopyToClipboard={handleCopyToClipboard}
          handleDownloadModelfile={handleDownloadModelfile}
        />
      </div>
    </div>
  );
};

export default AetherCreator;