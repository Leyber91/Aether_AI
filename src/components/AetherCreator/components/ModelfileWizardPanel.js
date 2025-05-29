import React, { useState, useEffect } from 'react';
import styles from '../AetherCreator.module.css';
import apiService from '../../../services/apiService';
import IntentAnalyzer from '../services/IntentAnalyzer';
import ModelCapabilityMapper from '../services/ModelCapabilityMapper';
import ParameterOptimizer from '../services/ParameterOptimizer';
import ModelValidator from '../services/ModelValidator';
import TestSuiteGenerator from '../services/TestSuiteGenerator';

// 10 Curated Examples for Context Learning (Knowledge Distillation approach)
const MODELFILE_EXAMPLES = [
  {
    intent: "coding assistant",
    modelfile: `FROM qwen3:4b
PARAMETER temperature 0.2
PARAMETER num_ctx 8192
PARAMETER top_k 10
PARAMETER top_p 0.5
PARAMETER repeat_penalty 1.15
PARAMETER num_gpu 99
SYSTEM """You are an expert programming assistant. Write clean, efficient, well-documented code. Always explain your reasoning and suggest optimizations. Focus on best practices and maintainable solutions."""
TEMPLATE """### System: {{ .System }}

### User: {{ .Prompt }}

### Assistant:"""`,
    description: "Precise, focused coding with low temperature and optimized context"
  },
  {
    intent: "creative writing",
    modelfile: `FROM qwen3:8b
PARAMETER temperature 0.9
PARAMETER num_ctx 4096
PARAMETER top_k 50
PARAMETER top_p 0.95
PARAMETER repeat_penalty 1.2
PARAMETER mirostat 1
PARAMETER mirostat_eta 0.15
PARAMETER mirostat_tau 4.5
PARAMETER num_gpu 99
SYSTEM """You are a master storyteller with vivid imagination. Create compelling narratives with rich descriptions, engaging dialogue, and emotional depth. Adapt your writing style to match the requested genre."""
TEMPLATE """{{ if .System }}[CREATIVE MODE]
{{ .System }}

{{ end }}Story Prompt: {{ .Prompt }}

Story:
"""`,
    description: "High creativity with mirostat sampling for dynamic storytelling"
  },
  {
    intent: "customer support",
    modelfile: `FROM phi4-mini:latest
PARAMETER temperature 0.3
PARAMETER num_ctx 2048
PARAMETER top_k 30
PARAMETER top_p 0.7
PARAMETER repeat_penalty 1.1
PARAMETER num_gpu 99
SYSTEM """You are a helpful customer service representative. Be empathetic, professional, and solution-focused. Always acknowledge concerns, provide clear explanations, and offer actionable next steps."""
TEMPLATE """Customer Support Chat

{{ if .System }}Guidelines: {{ .System }}

{{ end }}Customer: {{ .Prompt }}

Support Agent:"""`,
    description: "Balanced parameters for helpful, professional customer interactions"
  },
  {
    intent: "educational tutor",
    modelfile: `FROM deepseek-r1:8b
PARAMETER temperature 0.4
PARAMETER num_ctx 6144
PARAMETER top_k 40
PARAMETER top_p 0.8
PARAMETER repeat_penalty 1.1
PARAMETER num_gpu 99
SYSTEM """You are an expert educator who explains complex topics clearly. Break down difficult concepts into digestible steps, use analogies and examples, and encourage questions. Adapt explanations to the learner's level."""
TEMPLATE """<|begin_of_text|><|start_header_id|>system<|end_header_id|>
{{ .System }}<|eot_id|><|start_header_id|>user<|end_header_id|>
{{ .Prompt }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""`,
    description: "Educational template with step-by-step reasoning capabilities"
  },
  {
    intent: "data analyst",
    modelfile: `FROM qwen3:8b
PARAMETER temperature 0.1
PARAMETER num_ctx 16384
PARAMETER top_k 20
PARAMETER top_p 0.6
PARAMETER repeat_penalty 1.05
PARAMETER num_gpu 99
SYSTEM """You are a data analysis expert. Provide accurate statistical insights, identify patterns and trends, suggest data visualization approaches, and explain findings in business terms. Always show your analytical methodology."""
TEMPLATE """Data Analysis Request

Context: {{ .System }}

Query: {{ .Prompt }}

Analysis:
1. Data Understanding:
2. Methodology:
3. Findings:
4. Recommendations:
"""`,
    description: "Long context, low temperature for precise analytical work"
  },
  {
    intent: "medical assistant",
    modelfile: `FROM qwen3:4b
PARAMETER temperature 0.2
PARAMETER num_ctx 4096
PARAMETER top_k 25
PARAMETER top_p 0.6
PARAMETER repeat_penalty 1.1
PARAMETER num_gpu 99
SYSTEM """You are a medical information assistant. Provide accurate health information based on established medical knowledge. Always emphasize that this is not a substitute for professional medical advice and recommend consulting healthcare providers for specific medical concerns."""
TEMPLATE """Medical Information Assistant

IMPORTANT: This is for informational purposes only. Always consult qualified healthcare professionals for medical advice.

{{ if .System }}Guidelines: {{ .System }}

{{ end }}Question: {{ .Prompt }}

Medical Information:"""`,
    description: "Conservative parameters with safety disclaimers for medical information"
  },
  {
    intent: "language translator",
    modelfile: `FROM qwen3:4b
PARAMETER temperature 0.1
PARAMETER num_ctx 2048
PARAMETER top_k 10
PARAMETER top_p 0.5
PARAMETER repeat_penalty 1.0
PARAMETER num_gpu 99
SYSTEM """You are a professional translator. Provide accurate, culturally appropriate translations while preserving meaning, tone, and context. Explain cultural nuances when relevant."""
TEMPLATE """Translation Service

{{ if .System }}Instructions: {{ .System }}

{{ end }}Source: {{ .Prompt }}

Translation:"""`,
    description: "Minimal temperature and repetition for accurate translations"
  },
  {
    intent: "roleplay character",
    modelfile: `FROM qwen3:8b
PARAMETER temperature 0.8
PARAMETER num_ctx 3072
PARAMETER top_k 45
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.3
PARAMETER num_gpu 99
SYSTEM """You are {{ .Character }}. Stay completely in character, responding with their personality, speech patterns, knowledge, and worldview. Be immersive and authentic to the character's background and motivations."""
TEMPLATE """Character Roleplay Session

Character: {{ .Character }}
Setting: {{ .Setting }}

{{ if .System }}Character Profile: {{ .System }}

{{ end }}Scene: {{ .Prompt }}

{{ .Character }}:"""`,
    description: "Creative parameters with character consistency and roleplay optimization"
  },
  {
    intent: "research assistant",
    modelfile: `FROM qwen3:8b
PARAMETER temperature 0.3
PARAMETER num_ctx 32768
PARAMETER top_k 35
PARAMETER top_p 0.75
PARAMETER repeat_penalty 1.1
PARAMETER num_gpu 99
SYSTEM """You are a research assistant with expertise across multiple domains. Provide comprehensive, well-sourced information, identify key themes and connections, suggest further research directions, and maintain academic rigor."""
TEMPLATE """Research Assistant

{{ if .System }}Research Context: {{ .System }}

{{ end }}Research Query: {{ .Prompt }}

Research Analysis:

## Key Findings:

## Supporting Evidence:

## Implications:

## Recommended Further Research:
"""`,
    description: "Maximum context window for handling large research documents"
  },
  {
    intent: "performance optimization",
    modelfile: `FROM phi4-mini:latest
PARAMETER temperature 0.5
PARAMETER num_ctx 1024
PARAMETER top_k 20
PARAMETER top_p 0.8
PARAMETER repeat_penalty 1.0
PARAMETER num_thread 8
PARAMETER num_gpu 0
SYSTEM """You are optimized for speed and efficiency. Provide concise, direct responses focused on actionable information. Minimize elaboration unless specifically requested."""
TEMPLATE """{{ .Prompt }}

Response:"""`,
    description: "Minimal context, CPU-only configuration for maximum speed on limited hardware"
  }
];

const ModelfileWizardPanel = ({ onModelfileGenerated, availableModels = [] }) => {
  const [userIntent, setUserIntent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [selectedExample, setSelectedExample] = useState(null);
  const [wizardStep, setWizardStep] = useState('intent'); // 'intent', 'generating', 'creating', 'result'
  const [modelMapping, setModelMapping] = useState(null);

  // Auto-select best model based on examples
  const selectOptimalModel = (intent) => {
    const examples = MODELFILE_EXAMPLES.filter(ex => 
      ex.intent.includes(intent.toLowerCase()) || 
      intent.toLowerCase().includes(ex.intent)
    );
    if (examples.length > 0) {
      const fromLine = examples[0].modelfile.split('\n')[0];
      const modelMatch = fromLine.match(/FROM\s+(.+)/);
      return modelMatch ? modelMatch[1] : null;
    }
    return null;
};

  // Handler for example selection
  const tryExample = (example) => {
    setSelectedExample(example);
    setUserIntent(example.intent);
  };

  // Refactored generateModelfile with IntentAnalyzer
  const generateModelfile = async () => {
    if (!userIntent.trim()) return;
    setIsGenerating(true);
    try {
      // 1. Analyze user intent
      const analyzer = new IntentAnalyzer();
      const analysisResult = await analyzer.analyzeIntent(userIntent);

      // 2. Map capabilities & select optimal model
      const capabilityMapper = new ModelCapabilityMapper();
      const modelMapping = await capabilityMapper.selectOptimalModel(analysisResult, availableModels);

      // 3. Store mapping for UI/debug (optional: you can expose this in the UI)
      setModelMapping(modelMapping);

      // 4. Generate Modelfile using recommended model
      const recommendedModel = modelMapping?.primaryRecommendation?.modelId;
      const rationale = modelMapping?.primaryRecommendation?.rationale || '';

      if (!recommendedModel) {
        setGeneratedResult({ error: 'No suitable model could be recommended for your intent.' });
        return;
      }

      // 5. Optimize parameters for the selected model and intent
      const parameterOptimizer = new ParameterOptimizer();
      // Optionally, pass hardware info if available (e.g., from props or a context)
      const hardwareProfile = {};
      const optimizationResult = await parameterOptimizer.optimizeParameters(
        recommendedModel,
        analysisResult,
        hardwareProfile
      );
      const optimizedParams = optimizationResult.parameters || {};
      const paramReasoning = optimizationResult.reasoning || optimizationResult.rawResponse || '';

      // 6. Build Modelfile with optimized parameters
      let paramLines = Object.entries(optimizedParams)
        .filter(([k]) => k !== 'reasoning')
        .map(([k, v]) => `PARAMETER ${k} ${v}`)
        .join('\n');
      const modelfileContent = `FROM ${recommendedModel}\n${paramLines}\nSYSTEM """${analysisResult.systemPrompt || 'You are a helpful assistant.'}"""`;

      // 7. Validate the generated configuration
      let validationResults = null;
      try {
        const testSuiteGen = new TestSuiteGenerator();
        const testSuite = await testSuiteGen.generateTestSuite({
          model: recommendedModel,
          parameters: optimizedParams,
          systemPrompt: analysisResult.systemPrompt || 'You are a helpful assistant.'
        }, analysisResult);
        const validator = new ModelValidator();
        validationResults = await validator.validateModel(
          recommendedModel,
          testSuite,
          analysisResult
        );
      } catch (validationErr) {
        validationResults = { error: 'Validation failed or incomplete.', details: validationErr?.message || String(validationErr) };
      }

      setGeneratedResult({
        modelfile: modelfileContent,
        suggestedName: `custom-${recommendedModel.replace(/[:.]/g, '-')}`,
        rationale,
        model: recommendedModel,
        parameterReasoning: paramReasoning,
        validationResults
      });
      setWizardStep('result');

    } catch (err) {
      // Handle error
      setGeneratedResult({ error: 'Failed to analyze intent, map model capabilities, or optimize parameters.' });
    } finally {
      setIsGenerating(false);
    }
  };


  const resetWizard = () => {
    setWizardStep('intent');
    setUserIntent('');
    setGeneratedResult(null);
    setSelectedExample(null);
  };

  const createOllamaModel = async () => {
    if (!generatedResult?.modelfile || !generatedResult?.suggestedName) return;

    try {
      setWizardStep('creating');
      
      console.log('🔍 Detecting Ollama installation...');
      const ollamaInfo = await apiService.detectOllama();
      
      if (!ollamaInfo.found) {
        setGeneratedResult({
          ...generatedResult,
          error: 'Ollama installation not found. Please ensure Ollama is installed and running.',
          ollamaDetected: false
        });
        setWizardStep('result');
        return;
      }

      console.log('✅ Ollama detected:', ollamaInfo.path);
      console.log('📦 Creating model with Ollama...');
      
      // Debug: Log the actual Modelfile content being sent
      console.log('🔍 Generated Modelfile content:');
      console.log('--- START MODELFILE ---');
      console.log(generatedResult.modelfile);
      console.log('--- END MODELFILE ---');
      console.log('📏 Modelfile length:', generatedResult.modelfile.length);
      
      const createResult = await apiService.createOllamaModel({
        modelfile: generatedResult.modelfile,
        modelName: generatedResult.suggestedName
      });

      if (createResult.success) {
        setGeneratedResult({
          ...generatedResult,
          modelCreated: true,
          ollamaPath: createResult.ollamaPath,
          creationOutput: createResult.output,
          verified: createResult.verified
        });
        console.log('🎉 Model created successfully!');
      } else {
        setGeneratedResult({
          ...generatedResult,
          error: createResult.error || 'Failed to create model',
          creationOutput: createResult.output,
          creationErrors: createResult.stderr,
          modelCreated: false
        });
      }
      
      setWizardStep('result');
      
    } catch (error) {
      console.error('Error creating Ollama model:', error);
      setGeneratedResult({
        ...generatedResult,
        error: `Failed to create model: ${error.message}`,
        modelCreated: false
      });
      setWizardStep('result');
    }
  };

  // Robust Modelfile extraction and cleanup function
  const extractCleanModelfile = (rawResponse) => {
    console.log('🧹 Starting aggressive Modelfile cleanup...');
    
    let text = rawResponse;
    
    // Step 1: Remove code blocks if present
    const codeBlockMatch = text.match(/```(?:modelfile|ollama)?\s*\n?([\s\S]*?)\n?```/i);
    if (codeBlockMatch) {
      text = codeBlockMatch[1];
      console.log('📦 Extracted from code block');
    }
    
    // Step 2: Split into lines for analysis
    const lines = text.split('\n');
    const modelfileLines = [];
    
    // Step 3: Extract valid Modelfile commands
    let foundFrom = false;
    let inSystem = false;
    let inTemplate = false;
    let systemContent = '';
    let templateContent = '';
    let systemQuoteCount = 0;
    let templateQuoteCount = 0;
    
    for (let line of lines) {
      line = line.trim();
      
      // FROM command
      if (line.match(/^FROM\s+\w+/i)) {
        foundFrom = true;
        modelfileLines.push(line);
        console.log('✅ Found FROM:', line);
        continue;
      }
      
      // PARAMETER commands
      if (line.match(/^PARAMETER\s+\w+\s+[\d.]+/i)) {
        // Fix common parameter name errors
        line = line.replace(/num_threads/i, 'num_thread');
        modelfileLines.push(line);
        console.log('⚙️ Found PARAMETER:', line);
        continue;
      }
      
      // SYSTEM command start
      if (line.match(/^SYSTEM\s*"""/i)) {
        inSystem = true;
        systemContent = line;
        systemQuoteCount = (line.match(/"""/g) || []).length;
        if (systemQuoteCount >= 2) {
          // Complete system on one line
          modelfileLines.push(line);
          console.log('📋 Found complete SYSTEM:', line);
          inSystem = false;
        }
        continue;
      }
      
      // TEMPLATE command start
      if (line.match(/^TEMPLATE\s*"""/i)) {
        inTemplate = true;
        templateContent = line;
        templateQuoteCount = (line.match(/"""/g) || []).length;
        if (templateQuoteCount >= 2) {
          // Complete template on one line
          modelfileLines.push(line);
          console.log('📝 Found complete TEMPLATE:', line);
          inTemplate = false;
        }
        continue;
      }
      
      // Continue building SYSTEM content
      if (inSystem) {
        systemContent += '\n' + line;
        systemQuoteCount += (line.match(/"""/g) || []).length;
        if (systemQuoteCount >= 2) {
          modelfileLines.push(systemContent);
          console.log('📋 Completed SYSTEM block');
          inSystem = false;
        }
        continue;
      }
      
      // Continue building TEMPLATE content
      if (inTemplate) {
        templateContent += '\n' + line;
        templateQuoteCount += (line.match(/"""/g) || []).length;
        if (templateQuoteCount >= 2) {
          modelfileLines.push(templateContent);
          console.log('📝 Completed TEMPLATE block');
          inTemplate = false;
        }
        continue;
      }
    }
    
    // Step 4: Handle incomplete blocks
    if (inSystem && systemContent) {
      if (!systemContent.endsWith('"""')) {
        systemContent += '"""';
      }
      modelfileLines.push(systemContent);
      console.log('🔧 Fixed incomplete SYSTEM block');
    }
    
    if (inTemplate && templateContent) {
      if (!templateContent.endsWith('"""')) {
        templateContent += '"""';
      }
      modelfileLines.push(templateContent);
      console.log('🔧 Fixed incomplete TEMPLATE block');
    }
    
    // Step 5: Ensure we have minimum required components and strict parameter enforcement
    // 1. FROM: Use only models from availableModels
    let fromIndex = modelfileLines.findIndex(line => line.startsWith('FROM '));
    let selectedModel = null;
    if (fromIndex !== -1) {
      // Extract model name from FROM line
      const fromLine = modelfileLines[fromIndex];
      const match = fromLine.match(/^FROM\s+(.+)/i);
      if (match && availableModels.includes(match[1].trim())) {
        selectedModel = match[1].trim();
      } else {
        selectedModel = availableModels[0] || 'qwen3:4b';
        modelfileLines[fromIndex] = `FROM ${selectedModel}`;
        console.log('🔄 Replaced FROM with available model:', selectedModel);
      }
    } else {
      selectedModel = availableModels[0] || 'qwen3:4b';
      modelfileLines.unshift(`FROM ${selectedModel}`);
      console.log('⚠️ No FROM found, added default FROM:', selectedModel);
    }

    // 2. Strict parameter enforcement: temperature, num_ctx, num_gpu
    function setOrReplaceParam(param, value) {
      const idx = modelfileLines.findIndex(line => line.startsWith(`PARAMETER ${param} `));
      if (idx !== -1) {
        modelfileLines[idx] = `PARAMETER ${param} ${value}`;
        console.log(`🔄 Replaced PARAMETER ${param} with value:`, value);
      } else {
        modelfileLines.push(`PARAMETER ${param} ${value}`);
        console.log(`➕ Added PARAMETER ${param}:`, value);
      }
    }
    setOrReplaceParam('temperature', '0.7');
    setOrReplaceParam('num_ctx', '4096');
    setOrReplaceParam('num_gpu', '99');
    
    // Add default SYSTEM if missing
    if (!modelfileLines.some(line => line.startsWith('SYSTEM'))) {
      const defaultSystem = `SYSTEM """You are a helpful AI assistant for: ${userIntent}"""`;
      modelfileLines.push(defaultSystem);
      console.log('➕ Added default SYSTEM');
    }
    
    // Add default TEMPLATE if missing
    if (!modelfileLines.some(line => line.startsWith('TEMPLATE'))) {
      const defaultTemplate = `TEMPLATE """{{ .System }}

User: {{ .Prompt }}
`;
      modelfileLines.push(defaultTemplate);
      console.log('➕ Added default TEMPLATE');
    }
    
    // Join lines back into a single string
    const cleanedModelfile = modelfileLines.join('\n');
    
    console.log('✅ Cleaned Modelfile:');
    console.log('--- FINAL MODELFILE ---');
    console.log(cleanedModelfile);
    console.log('--- END FINAL ---');
    
    return cleanedModelfile;
  };

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.wizardHeader}>
        <h2 className={styles.wizardTitle}>🧙‍♂️ AI Modelfile Wizard</h2>
        <p className={styles.wizardSubtitle}>
          Describe what you want your AI to do, and I'll create a complete, optimized Modelfile ready for Ollama.
        </p>
      </div>

      {wizardStep === 'intent' && (
        <div className={styles.intentStep}>
          <div className={styles.inputSection}>
            <label className={styles.wizardLabel}>
              What do you want your AI model to do?
            </label>
            <textarea
              className={styles.intentInput}
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              placeholder="Examples: 'Help with Python coding', 'Write creative stories', 'Answer customer support questions', 'Translate languages', 'Analyze data and create reports'..."
              rows={4}
            />
            <button
              className={styles.generateButton}
              onClick={generateModelfile}
              disabled={!userIntent.trim() || isGenerating}
            >
              🚀 Generate My Modelfile
            </button>
          </div>

          <div className={styles.examplesSection}>
            <h3 className={styles.examplesTitle}>Or try one of these examples:</h3>
            <div className={styles.examplesGrid}>
              {MODELFILE_EXAMPLES.map((example, idx) => (
                <div
                  key={idx}
                  className={`${styles.exampleCard} ${selectedExample === example ? styles.exampleCardSelected : ''}`}
                  onClick={() => tryExample(example)}
                >
                  <div className={styles.exampleTitle}>{example.intent}</div>
                  <div className={styles.exampleDescription}>{example.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {wizardStep === 'generating' && (
        <div className={styles.generatingStep}>
          <div className={styles.loadingSpinner}></div>
          <h3>🧠 Analyzing your intent...</h3>
          <p>Using knowledge distillation from {MODELFILE_EXAMPLES.length} curated examples to create your perfect Modelfile.</p>
          <div className={styles.generatingSteps}>
            <div className={styles.generatingStep}>✓ Selecting optimal base model</div>
            <div className={styles.generatingStep}>✓ Calculating best parameters</div>
            <div className={styles.generatingStep}>✓ Creating system prompt</div>
            <div className={styles.generatingStep}>⚡ Finalizing configuration...</div>
          </div>
        </div>
      )}

      {wizardStep === 'creating' && (
        <div className={styles.generatingStep}>
          <div className={styles.loadingSpinner}></div>
          <h3>🔧 Creating your Ollama model...</h3>
          <p>Executing automated model creation with full verification.</p>
          <div className={styles.generatingSteps}>
            <div className={styles.generatingStep}>✓ Detecting Ollama installation</div>
            <div className={styles.generatingStep}>✓ Creating temporary Modelfile</div>
            <div className={styles.generatingStep}>✓ Executing `ollama create` command</div>
            <div className={styles.generatingStep}>⚡ Verifying model creation...</div>
          </div>
        </div>
      )}

      {wizardStep === 'result' && generatedResult && (
        <div className={styles.resultStep}>
          {generatedResult.error ? (
            <div className={styles.errorResult}>
              <h3>❌ {generatedResult.modelCreated === false ? 'Model Creation Failed' : 'Generation Failed'}</h3>
              <p>{generatedResult.error}</p>
              {generatedResult.creationOutput && (
                <div className={styles.debugOutput}>
                  <h4>Output:</h4>
                  <pre>{generatedResult.creationOutput}</pre>
                </div>
              )}
              {generatedResult.creationErrors && (
                <div className={styles.debugOutput}>
                  <h4>Errors:</h4>
                  <pre>{generatedResult.creationErrors}</pre>
                </div>
              )}
              <button className={styles.retryButton} onClick={resetWizard}>
                Try Again
              </button>
            </div>
          ) : (
            <div className={styles.successResult}>
              <div className={styles.resultHeader}>
                <h3>{generatedResult.modelCreated ? '🎉 Model Created Successfully!' : '✅ Your Modelfile is Ready!'}</h3>
                <div className={styles.resultMeta}>
                  <span className={styles.resultModel}>Recommended Model: <b>{generatedResult.model}</b></span>
                </div>
              </div>

              <div className={styles.resultDescription}>
                <h4>Rationale for Model Selection:</h4>
                <p>{generatedResult.rationale}</p>
                <h4>Your Modelfile:</h4>
                <pre className={styles.modelfileBlock}>{generatedResult.modelfile}</pre>
                <button
                  className={styles.copyButton}
                  style={{marginTop: 12}}
                  onClick={() => navigator.clipboard.writeText(generatedResult.modelfile)}
                >
                  📋 Copy Modelfile
                </button>

                {/* Validation Results Section */}
                {generatedResult.validationResults && (
                  <div className={styles.validationBlock} style={{marginTop: 24}}>
                    <h4>Validation Results:</h4>
                    {generatedResult.validationResults.error ? (
                      <div className={styles.validationError}>
                        <b>Validation Error:</b> {generatedResult.validationResults.error}
                        {generatedResult.validationResults.details && (
                          <pre>{generatedResult.validationResults.details}</pre>
                        )}
                      </div>
                    ) : (
                      <>
                        <div><b>Status:</b> {generatedResult.validationResults.qualityScore ? '✅ Passed' : '⚠️ Issues Found'}</div>
                        {generatedResult.validationResults.qualityScore && (
                          <div><b>Quality Score:</b> {generatedResult.validationResults.qualityScore.overallScore?.toFixed(1)}/100</div>
                        )}
                        {generatedResult.validationResults.improvements && (
                          <div style={{marginTop: 8}}>
                            <b>Improvement Suggestions:</b>
                            <ul>
                              {Array.isArray(generatedResult.validationResults.improvements.suggestions)
                                ? generatedResult.validationResults.improvements.suggestions.map((s, i) => <li key={i}>{s}</li>)
                                : <li>{generatedResult.validationResults.improvements.suggestions}</li>}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.actionButtons}>
                {!generatedResult.modelCreated ? (
                  <button
                    className={styles.createModelButton}
                    onClick={createOllamaModel}
                  >
                    🎯 Create Ollama Model: {generatedResult.suggestedName}
                  </button>
                ) : (
                  <div className={styles.successMessage}>
                    <p>🎉 Model "{generatedResult.suggestedName}" is now available in Ollama!</p>
                    <p>You can use it with: <code>ollama run {generatedResult.suggestedName}</code></p>
                  </div>
                )}
              </div>

              {/* User Feedback Section */}
              <FeedbackSection />

              <button
                className={styles.newWizardButton}
                onClick={resetWizard}
              >
                ✨ Create Another Model
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- User Feedback Section Component ---

const FeedbackSection = () => {
  const [feedback, setFeedback] = useState(null); // 'up' | 'down'
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Stub: handle feedback submission (send to backend or store locally)
    // Example: sendFeedback({ feedback, comment })
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{marginTop: 24, textAlign: 'center'}}>
        <b>Thank you for your feedback!</b>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16}}>
      <div style={{marginBottom: 8}}><b>Was this Modelfile helpful?</b></div>
      <div style={{marginBottom: 8}}>
        <button type="button" onClick={() => setFeedback('up')} style={{fontSize: 20, color: feedback==='up'?'green':'#888', marginRight: 8}}>👍</button>
        <button type="button" onClick={() => setFeedback('down')} style={{fontSize: 20, color: feedback==='down'?'red':'#888'}}>👎</button>
      </div>
      <textarea
        placeholder="Optional: Add comments or suggestions..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{width: '100%', minHeight: 48, marginBottom: 8, resize: 'vertical'}}
      />
      <br />
      <button type="submit" disabled={!feedback} style={{marginTop: 4}}>Submit Feedback</button>
    </form>
  );
};

export default ModelfileWizardPanel; 