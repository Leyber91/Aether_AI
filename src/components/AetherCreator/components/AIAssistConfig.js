import React, { useState } from 'react';
import { generateModelfile } from '../../../services/aetherCreatorService';
import styles from '../AetherCreator.module.css';

/**
 * AI-Assisted Modelfile Configuration Component
 * Uses AI to suggest optimal parameters, system prompts, and templates
 */
const AIAssistConfig = ({ 
  setNumCtx, 
  setNumGpu, 
  setTemperature, 
  setStopSequences, 
  setRepeatPenalty,
  setTopK,
  setTopP,
  setNumThread,
  setMirostat,
  setMirostatEta,
  setMirostatTau,
  setSystemPrompt,
  setTemplate,
  setOllamaModelName,
  setGeneratedModelfile
}) => {
  // State for the AI assistant form
  const [taskDescription, setTaskDescription] = useState('');
  const [baseModel, setBaseModel] = useState('');
  const [modelType, setModelType] = useState('general');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [hardwareConstraints, setHardwareConstraints] = useState({
    memory: '16GB', // Default to mid-range system
    gpu: 'RTX 3070', // Default to mid-range GPU
    cpu: 'Ryzen 7'   // Default to mid-range CPU
  });
  
  // State for the generation process
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  
  // Hardware constraint options
  const memoryOptions = ['8GB', '16GB', '32GB', '64GB'];
  const gpuOptions = ['None', 'GTX 1650', 'RTX 3060', 'RTX 3070', 'RTX 4070', 'RTX 4090', 'A100'];
  const cpuOptions = ['Core i5', 'Core i7', 'Core i9', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9', 'Threadripper'];
  
  // Model type options
  const modelTypeOptions = [
    { value: 'general', label: 'General Purpose' },
    { value: 'coding', label: 'Coding Assistant' },
    { value: 'creative', label: 'Creative Writing' },
    { value: 'chat', label: 'Conversational AI' },
    { value: 'science', label: 'Scientific Analysis' },
    { value: 'document', label: 'Document Processing' }
  ];
  
  // Apply the AI-generated configuration to AetherCreator
  const applyConfiguration = () => {
    if (!generationResult || !generationResult.parameters) {
      return;
    }
    
    const params = generationResult.parameters;
    
    // Apply parameters to parent component state
    setNumCtx(params.num_ctx || 2048);
    setNumGpu(params.num_gpu || 99);
    setTemperature(params.temperature || 0.7);
    if (params.stop_sequences && params.stop_sequences.length > 0) {
      setStopSequences(params.stop_sequences);
    }
    setRepeatPenalty(params.repeat_penalty || 1.1);
    setTopK(params.top_k || 40);
    setTopP(params.top_p || 0.9);
    setNumThread(params.num_thread || 0);
    setMirostat(params.mirostat || 0);
    setMirostatEta(params.mirostat_eta || 0.1);
    setMirostatTau(params.mirostat_tau || 5.0);
    
    // Apply system prompt and template
    if (generationResult.system_prompt) {
      setSystemPrompt(generationResult.system_prompt);
    }
    if (generationResult.template) {
      setTemplate(generationResult.template);
    }
    
    // Set the model name based on the task
    setOllamaModelName(generateModelName(baseModel, taskDescription));
    
    // If modelfile is available, set it directly
    if (generationResult.modelfile) {
      setGeneratedModelfile(generationResult.modelfile);
    }
  };
  
  // Generate a model name from the base model and task
  const generateModelName = (baseModel, taskDescription) => {
    // Extract base model name without version
    const baseName = baseModel.split(':')[0].replace(/\//g, '-');
    
    // Get task keyword (first meaningful word)
    let taskKeyword = taskDescription
      .toLowerCase()
      .split(/\s+/)
      .find(word => word.length > 3 && !['with', 'using', 'that', 'which', 'this', 'then', 'from', 'have'].includes(word)) || 'custom';
    
    // Sanitize the keyword
    taskKeyword = taskKeyword.replace(/[^a-z0-9]/g, '');
    
    return `${baseName}-${taskKeyword}`;
  };
  
  // Handle the generate button click
  const handleGenerate = async () => {
    // Validate inputs
    if (!taskDescription.trim()) {
      setGenerationError('Please provide a task description');
      return;
    }
    
    if (!baseModel.trim()) {
      setGenerationError('Please specify a base model');
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationResult(null);
    
    try {
      // Prepare the request data
      const requestData = {
        task_description: taskDescription,
        base_model: baseModel,
        model_type: modelType,
        hardware_constraints: hardwareConstraints,
        additional_requirements: additionalRequirements.trim() || null
      };
      
      // Call the API service
      const result = await generateModelfile(requestData);
      
      if (result.success) {
        setGenerationResult(result);
      } else {
        setGenerationError(result.message || 'Failed to generate configuration');
      }
    } catch (error) {
      console.error('Error generating Modelfile configuration:', error);
      setGenerationError(error.message || 'An error occurred while generating the configuration');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className={styles.aiAssistContainer}>
      <h3 className={styles.sectionTitle}>AI-Assisted Configuration</h3>
      <p className={styles.sectionDescription}>
        Let AI help you configure optimal parameters, system prompts, and templates for your specific use case.
      </p>
      
      <div className={styles.formGroup}>
        <label htmlFor="taskDescription" className={styles.label}>
          Task Description <span className={styles.required}>*</span>
        </label>
        <textarea
          id="taskDescription"
          className={styles.textarea}
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          placeholder="Describe what you want the model to do (e.g., 'Create a coding assistant that helps with JavaScript and explains concepts clearly')"
          rows={3}
          disabled={isGenerating}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="baseModel" className={styles.label}>
          Base Model <span className={styles.required}>*</span>
        </label>
        <input
          id="baseModel"
          type="text"
          className={styles.input}
          value={baseModel}
          onChange={(e) => setBaseModel(e.target.value)}
          placeholder="Enter the base model (e.g., llama3:8b, phi3:mini)"
          disabled={isGenerating}
        />
        <small className={styles.helperText}>
          This should match an available Ollama model tag
        </small>
      </div>
      
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="modelType" className={styles.label}>Model Type</label>
          <select
            id="modelType"
            className={styles.select}
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            disabled={isGenerating}
          >
            {modelTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="memory" className={styles.label}>System Memory</label>
          <select
            id="memory"
            className={styles.select}
            value={hardwareConstraints.memory}
            onChange={(e) => setHardwareConstraints({...hardwareConstraints, memory: e.target.value})}
            disabled={isGenerating}
          >
            {memoryOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="gpu" className={styles.label}>GPU</label>
          <select
            id="gpu"
            className={styles.select}
            value={hardwareConstraints.gpu}
            onChange={(e) => setHardwareConstraints({...hardwareConstraints, gpu: e.target.value})}
            disabled={isGenerating}
          >
            {gpuOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="cpu" className={styles.label}>CPU</label>
          <select
            id="cpu"
            className={styles.select}
            value={hardwareConstraints.cpu}
            onChange={(e) => setHardwareConstraints({...hardwareConstraints, cpu: e.target.value})}
            disabled={isGenerating}
          >
            {cpuOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="additionalRequirements" className={styles.label}>
          Additional Requirements
        </label>
        <textarea
          id="additionalRequirements"
          className={styles.textarea}
          value={additionalRequirements}
          onChange={(e) => setAdditionalRequirements(e.target.value)}
          placeholder="Any additional requirements (e.g., 'Minimize RAM usage', 'Optimize for speed', 'Support long context')"
          rows={2}
          disabled={isGenerating}
        />
      </div>
      
      <div className={styles.buttonContainer}>
        <button
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Configuration'}
        </button>
      </div>
      
      {generationError && (
        <div className={styles.errorMessage}>
          {generationError}
        </div>
      )}
      
      {generationResult && generationResult.success && (
        <div className={styles.resultContainer}>
          <h4 className={styles.resultTitle}>AI-Generated Configuration</h4>
          
          <div className={styles.resultSection}>
            <h5 className={styles.resultSectionTitle}>Modelfile</h5>
            <pre className={styles.codeBlock}>
              {generationResult.modelfile}
            </pre>
          </div>
          
          {generationResult.explanation && (
            <div className={styles.resultSection}>
              <h5 className={styles.resultSectionTitle}>Explanation</h5>
              <div className={styles.explanationBlock}>
                {Object.entries(generationResult.explanation).map(([key, value]) => (
                  value && (
                    <div key={key} className={styles.explanationItem}>
                      <strong>{key.replace(/_/g, ' ')}</strong>: {value}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
          
          <div className={styles.buttonContainer}>
            <button
              className={`${styles.button} ${styles.secondaryButton}`}
              onClick={applyConfiguration}
            >
              Apply Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistConfig;
