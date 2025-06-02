import React, { useState, useEffect } from 'react';
import { 
  FiSettings, 
  FiCpu, 
  FiZap, 
  FiX, 
  FiPlay,
  FiDownload,
  FiCheck,
  FiLoader,
  FiLayers,
  FiTarget
} from 'react-icons/fi';

const ModelWizardPanel = ({ 
  availableModels, 
  nodes, 
  onCreateModel, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('create');
  const [modelConfig, setModelConfig] = useState({
    name: '',
    baseModel: 'llama3.2',
    specialization: '',
    networkContext: '',
    temperature: 0.7,
    systemPrompt: '',
    specializationPrompt: ''
  });
  const [creationProgress, setCreationProgress] = useState(null);
  const [existingModels, setExistingModels] = useState([]);

  // API Base
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Specialization templates
  const specializationTemplates = {
    analyzer: {
      name: 'Data Analyzer',
      description: 'Specialized for analyzing data patterns and extracting insights',
      systemPrompt: 'You are a specialized data analysis AI. Your primary function is to analyze data patterns, identify trends, and extract meaningful insights from complex datasets.',
      specializationPrompt: 'Focus on data analysis, pattern recognition, statistical interpretation, and insight generation. Communicate findings clearly and suggest actionable recommendations.',
      icon: FiTarget
    },
    communicator: {
      name: 'Communication Hub',
      description: 'Optimized for inter-node communication and message routing',
      systemPrompt: 'You are a specialized communication AI. Your role is to facilitate effective communication between network nodes, translate contexts, and optimize message flow.',
      specializationPrompt: 'Excel at message routing, context translation, communication optimization, and maintaining dialogue coherence across the network.',
      icon: FiZap
    },
    processor: {
      name: 'Task Processor',
      description: 'Enhanced for executing specific computational tasks',
      systemPrompt: 'You are a specialized task processing AI. Your purpose is to efficiently execute computational tasks, process requests, and deliver results.',
      specializationPrompt: 'Focus on task execution efficiency, result accuracy, and computational optimization. Handle complex processing with precision.',
      icon: FiCpu
    },
    coordinator: {
      name: 'Network Coordinator',
      description: 'Designed for orchestrating network-wide operations',
      systemPrompt: 'You are a specialized network coordination AI. Your function is to orchestrate network operations, manage resource allocation, and optimize overall network performance.',
      specializationPrompt: 'Excel at network orchestration, resource management, performance optimization, and strategic coordination across all network nodes.',
      icon: FiLayers
    }
  };

  // Base models available
  const baseModels = [
    { id: 'llama3.2', name: 'Llama 3.2', size: '3B', description: 'Fast and efficient for most tasks' },
    { id: 'llama3.2:7b', name: 'Llama 3.2 7B', size: '7B', description: 'Balanced performance and capability' },
    { id: 'llama3.2:13b', name: 'Llama 3.2 13B', size: '13B', description: 'High capability for complex tasks' },
    { id: 'mistral', name: 'Mistral', size: '7B', description: 'Excellent for reasoning tasks' },
    { id: 'codellama', name: 'CodeLlama', size: '7B', description: 'Specialized for code generation' }
  ];

  // Load existing models on mount
  useEffect(() => {
    loadExistingModels();
  }, []);

  const loadExistingModels = async () => {
    try {
      const response = await fetch(`${API_BASE}/model-wizard/list-specialized`);
      if (response.ok) {
        const models = await response.json();
        setExistingModels(models);
      }
    } catch (error) {
      console.error('Failed to load existing models:', error);
    }
  };

  const handleSpecializationSelect = (specializationType) => {
    const template = specializationTemplates[specializationType];
    setModelConfig(prev => ({
      ...prev,
      specialization: specializationType,
      name: `DEAC-${template.name.replace(' ', '')}-${Date.now()}`,
      systemPrompt: template.systemPrompt,
      specializationPrompt: template.specializationPrompt,
      networkContext: `Network context: ${nodes.length} nodes, specialized for ${template.name.toLowerCase()}`
    }));
  };

  const handleCreateModel = async () => {
    if (!modelConfig.name || !modelConfig.specialization || !modelConfig.baseModel) {
      alert('Please fill in all required fields');
      return;
    }

    setCreationProgress({ stage: 'preparing', progress: 0 });

    try {
      // Start model creation
      const response = await fetch(`${API_BASE}/model-wizard/create-specialized`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...modelConfig,
          networkContext: {
            totalNodes: nodes.length,
            primordialNodes: nodes.filter(n => n.data?.isPrimordial).length,
            specialization: modelConfig.specialization
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Simulate progress updates
        const stages = [
          { stage: 'downloading', progress: 25 },
          { stage: 'configuring', progress: 50 },
          { stage: 'specializing', progress: 75 },
          { stage: 'finalizing', progress: 90 },
          { stage: 'completed', progress: 100 }
        ];

        for (const stage of stages) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setCreationProgress(stage);
        }

        // Notify parent component
        onCreateModel({
          ...modelConfig,
          modelId: result.modelId,
          modelPath: result.modelPath,
          createdAt: new Date()
        });

        // Refresh existing models
        loadExistingModels();

        // Reset form
        setModelConfig({
          name: '',
          baseModel: 'llama3.2',
          specialization: '',
          networkContext: '',
          temperature: 0.7,
          systemPrompt: '',
          specializationPrompt: ''
        });

        setCreationProgress(null);
      } else {
        throw new Error('Failed to create specialized model');
      }
    } catch (error) {
      console.error('Model creation error:', error);
      setCreationProgress({ stage: 'error', progress: 0, error: error.message });
    }
  };

  const getProgressText = () => {
    if (!creationProgress) return '';
    
    const stageTexts = {
      preparing: 'Preparing model configuration...',
      downloading: 'Downloading base model...',
      configuring: 'Configuring model parameters...',
      specializing: 'Applying specialization...',
      finalizing: 'Finalizing model...',
      completed: 'Model created successfully!',
      error: 'Error creating model'
    };
    
    return stageTexts[creationProgress.stage] || 'Processing...';
  };

  return (
    <div className="model-wizard-overlay">
      <div className="model-wizard-panel">
        {/* Header */}
        <div className="wizard-header">
          <div className="header-left">
            <FiSettings className="wizard-icon" />
            <div>
              <h2>Model Wizard</h2>
              <p>Create specialized Ollama models for network nodes</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Tabs */}
        <div className="wizard-tabs">
          <button 
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Model
          </button>
          <button 
            className={`tab ${activeTab === 'existing' ? 'active' : ''}`}
            onClick={() => setActiveTab('existing')}
          >
            Existing Models ({existingModels.length})
          </button>
        </div>

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="wizard-content">
            {!creationProgress ? (
              <>
                {/* Specialization Selection */}
                <div className="config-section">
                  <h3>Specialization Type</h3>
                  <div className="specialization-grid">
                    {Object.entries(specializationTemplates).map(([key, template]) => {
                      const IconComponent = template.icon;
                      return (
                        <button
                          key={key}
                          className={`specialization-card ${modelConfig.specialization === key ? 'selected' : ''}`}
                          onClick={() => handleSpecializationSelect(key)}
                        >
                          <IconComponent className="card-icon" />
                          <div className="card-content">
                            <div className="card-title">{template.name}</div>
                            <div className="card-description">{template.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model Configuration */}
                {modelConfig.specialization && (
                  <>
                    <div className="config-section">
                      <h3>Model Configuration</h3>
                      <div className="config-grid">
                        <div className="config-field">
                          <label>Model Name</label>
                          <input
                            type="text"
                            value={modelConfig.name}
                            onChange={(e) => setModelConfig(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter model name"
                          />
                        </div>
                        
                        <div className="config-field">
                          <label>Base Model</label>
                          <select
                            value={modelConfig.baseModel}
                            onChange={(e) => setModelConfig(prev => ({ ...prev, baseModel: e.target.value }))}
                          >
                            {baseModels.map(model => (
                              <option key={model.id} value={model.id}>
                                {model.name} ({model.size}) - {model.description}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="config-field">
                          <label>Temperature</label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={modelConfig.temperature}
                            onChange={(e) => setModelConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                          />
                          <span className="range-value">{modelConfig.temperature}</span>
                        </div>
                      </div>
                    </div>

                    <div className="config-section">
                      <h3>Specialization Prompts</h3>
                      <div className="prompt-fields">
                        <div className="config-field">
                          <label>System Prompt</label>
                          <textarea
                            value={modelConfig.systemPrompt}
                            onChange={(e) => setModelConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                            rows="4"
                            placeholder="System-level instructions for the model"
                          />
                        </div>
                        
                        <div className="config-field">
                          <label>Specialization Prompt</label>
                          <textarea
                            value={modelConfig.specializationPrompt}
                            onChange={(e) => setModelConfig(prev => ({ ...prev, specializationPrompt: e.target.value }))}
                            rows="3"
                            placeholder="Specific instructions for the specialization"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Create Button */}
                    <div className="wizard-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={handleCreateModel}
                      >
                        <FiPlay /> Create Specialized Model
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Creation Progress */
              <div className="creation-progress">
                <div className="progress-header">
                  <h3>Creating Model: {modelConfig.name}</h3>
                  <p>{getProgressText()}</p>
                </div>
                
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${creationProgress.progress}%` }}
                  ></div>
                </div>
                
                <div className="progress-details">
                  <div className="detail">
                    <span>Base Model:</span>
                    <span>{modelConfig.baseModel}</span>
                  </div>
                  <div className="detail">
                    <span>Specialization:</span>
                    <span>{specializationTemplates[modelConfig.specialization]?.name}</span>
                  </div>
                  <div className="detail">
                    <span>Progress:</span>
                    <span>{creationProgress.progress}%</span>
                  </div>
                </div>

                {creationProgress.stage === 'completed' && (
                  <div className="success-message">
                    <FiCheck className="success-icon" />
                    <span>Model created successfully and ready for deployment!</span>
                  </div>
                )}

                {creationProgress.stage === 'error' && (
                  <div className="error-message">
                    <span>Error: {creationProgress.error}</span>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setCreationProgress(null)}
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Existing Models Tab */}
        {activeTab === 'existing' && (
          <div className="wizard-content">
            <div className="existing-models">
              {existingModels.length === 0 ? (
                <div className="empty-state">
                  <FiCpu className="empty-icon" />
                  <h3>No Specialized Models</h3>
                  <p>Create your first specialized model using the Create tab</p>
                </div>
              ) : (
                <div className="models-grid">
                  {existingModels.map(model => (
                    <div key={model.id} className="model-card">
                      <div className="model-header">
                        <div className="model-name">{model.name}</div>
                        <div className="model-status">
                          <div className={`status-dot ${model.status}`}></div>
                          {model.status}
                        </div>
                      </div>
                      
                      <div className="model-details">
                        <div className="detail">
                          <span>Base:</span>
                          <span>{model.baseModel}</span>
                        </div>
                        <div className="detail">
                          <span>Specialization:</span>
                          <span>{model.specialization}</span>
                        </div>
                        <div className="detail">
                          <span>Created:</span>
                          <span>{new Date(model.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="detail">
                          <span>Size:</span>
                          <span>{model.size || 'Unknown'}</span>
                        </div>
                      </div>
                      
                      <div className="model-actions">
                        <button className="btn btn-secondary">
                          <FiDownload /> Deploy to Node
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelWizardPanel; 