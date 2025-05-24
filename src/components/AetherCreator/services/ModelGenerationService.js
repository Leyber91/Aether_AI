import IntentAnalyzer from './IntentAnalyzer';
import ContextEnhancer from './ContextEnhancer';
import ModelCapabilityMapper from './ModelCapabilityMapper';
import HybridArchitectureGenerator from './HybridArchitectureGenerator';
import ParameterOptimizer from './ParameterOptimizer';
import PromptEngineer from './PromptEngineer';
import TestSuiteGenerator from './TestSuiteGenerator';
import ModelValidator from './ModelValidator';
import { ollama } from '../../../services/ollamaService';

/**
 * ModelGenerationService - Main orchestration service for AI model generation
 * Coordinates the entire model generation pipeline from intent analysis to deployment
 */
class ModelGenerationService {
  constructor() {
    this.intentAnalyzer = new IntentAnalyzer();
    this.contextEnhancer = new ContextEnhancer();
    this.modelCapabilityMapper = new ModelCapabilityMapper();
    this.architectureGenerator = new HybridArchitectureGenerator();
    this.parameterOptimizer = new ParameterOptimizer();
    this.promptEngineer = new PromptEngineer();
    this.testSuiteGenerator = new TestSuiteGenerator();
    this.validator = new ModelValidator();
  }

  /**
   * Generate a complete model based on user requirements
   * @param {object} request - User request with description and requirements
   * @param {function} progressCallback - Callback for progress updates
   * @returns {object} Complete model generation results
   */
  async generateModel(request, progressCallback = () => {}) {
    try {
      // Progress tracking
      const updateProgress = (stage, progress, message) => {
        progressCallback({
          stage,
          progress,
          message
        });
      };

      // Pipeline execution
      const pipeline = {};

      // 1. Analyze intent (10%)
      updateProgress('intent_analysis', 0, 'Analyzing model requirements...');
      pipeline.intent = await this.intentAnalyzer.analyzeIntent(request.description);
      updateProgress('intent_analysis', 10, 'Analysis complete');

      // 2. Enhance context (20%)
      updateProgress('context_enhancement', 10, 'Enhancing context with additional information...');
      pipeline.enhancedContext = await this.contextEnhancer.enhanceContext(pipeline.intent);
      updateProgress('context_enhancement', 20, 'Context enhancement complete');

      // 3. Select optimal model (30%)
      updateProgress('model_selection', 20, 'Selecting optimal model architecture...');
      pipeline.modelSelection = await this.modelCapabilityMapper.selectOptimalModel(
        this.extractRequirements(pipeline.enhancedContext)
      );
      updateProgress('model_selection', 30, 'Model selection complete');

      // 4. Design architecture (40%)
      updateProgress('architecture_design', 30, 'Designing model architecture...');
      pipeline.architecture = await this.architectureGenerator.generateHybridArchitecture(
        { ...this.extractRequirements(pipeline.enhancedContext), recommendedModel: pipeline.modelSelection.primaryRecommendation.modelId }
      );
      updateProgress('architecture_design', 40, 'Architecture design complete');

      // 5. Optimize parameters (50%)
      updateProgress('parameter_optimization', 40, 'Optimizing model parameters...');
      pipeline.parameters = await this.parameterOptimizer.optimizeParameters(
        pipeline.architecture.model || pipeline.modelSelection.primaryRecommendation.modelId,
        this.extractRequirements(pipeline.enhancedContext),
        request.hardwareProfile || {}
      );
      updateProgress('parameter_optimization', 50, 'Parameter optimization complete');

      // 6. Generate prompts and templates (60%)
      updateProgress('prompt_engineering', 50, 'Engineering optimal prompts and templates...');
      pipeline.prompts = await this.promptEngineer.generateSystemPrompt(
        this.extractRequirements(pipeline.enhancedContext),
        pipeline.modelSelection.primaryRecommendation.capabilities
      );
      pipeline.template = await this.promptEngineer.generateTemplateStructure(
        this.extractRequirements(pipeline.enhancedContext)
      );
      updateProgress('prompt_engineering', 60, 'Prompt engineering complete');

      // 7. Generate configuration (70%)
      updateProgress('configuration_generation', 60, 'Generating model configuration...');
      pipeline.configuration = this.generateModelConfiguration(pipeline);
      updateProgress('configuration_generation', 70, 'Configuration generation complete');

      // 8. Generate test suite (80%)
      updateProgress('test_generation', 70, 'Generating comprehensive test suite...');
      pipeline.tests = await this.testSuiteGenerator.generateTestSuite(
        pipeline.configuration,
        this.extractRequirements(pipeline.enhancedContext)
      );
      updateProgress('test_generation', 80, 'Test suite generation complete');

      // 9. Deployment preparation (90%)
      updateProgress('deployment_preparation', 80, 'Preparing deployment package...');
      pipeline.deployment = await this.prepareDeployment(pipeline, request.modelName || 'aether-custom-model');
      updateProgress('deployment_preparation', 90, 'Deployment preparation complete');

      // 10. Final metadata (100%)
      updateProgress('metadata_generation', 90, 'Generating final metadata...');
      pipeline.metadata = await this.generateMetadata(pipeline, request);
      updateProgress('metadata_generation', 100, 'Model generation complete!');

      // Return complete results
      return {
        success: true,
        modelName: pipeline.deployment.modelName,
        configuration: pipeline.configuration,
        metadata: pipeline.metadata,
        architecture: pipeline.architecture,
        prompts: pipeline.prompts,
        template: pipeline.template,
        parameters: pipeline.parameters,
        deployment: pipeline.deployment
      };
    } catch (error) {
      console.error('Error in model generation pipeline:', error);
      
      return {
        success: false,
        error: error.message,
        suggestions: await this.generateErrorSuggestions(error)
      };
    }
  }

  /**
   * Extract structured requirements from enhanced context
   * @param {object} enhancedContext - Context from analyzer and enhancer
   * @returns {object} Structured requirements
   */
  extractRequirements(enhancedContext) {
    return {
      taskCategory: enhancedContext.classification?.category || 'general',
      capabilities: enhancedContext.classification?.capabilities || [],
      contextWindow: enhancedContext.technicalReqs?.contextLength || 4096,
      performanceNeeds: enhancedContext.technicalReqs?.performance || 'balanced',
      specialRequirements: enhancedContext.technicalReqs?.specialCapabilities || [],
      description: enhancedContext.deepAnalysis,
      integrationRequirements: enhancedContext.technicalReqs?.integration || []
    };
  }

  /**
   * Generate complete model configuration
   * @param {object} pipeline - Pipeline data
   * @returns {object} Complete model configuration
   */
  generateModelConfiguration(pipeline) {
    // Extract parameters from optimization
    const params = pipeline.parameters.parameters || {};
    
    // Base configuration
    const config = {
      model: pipeline.architecture.model || pipeline.modelSelection.primaryRecommendation.modelId,
      parameters: {
        temperature: params.temperature || 0.7,
        top_k: params.top_k || 40,
        top_p: params.top_p || 0.9,
        repeat_penalty: params.repeat_penalty || 1.1,
        num_ctx: params.num_ctx || 4096,
        num_gpu: params.num_gpu || 99,
        num_thread: params.num_thread || 0
      },
      systemPrompt: pipeline.prompts.systemPrompt || '',
      template: pipeline.template.customTemplate || ''
    };
    
    // Add mirostat if specified
    if (params.mirostat > 0) {
      config.parameters.mirostat = params.mirostat;
      config.parameters.mirostat_eta = params.mirostat_eta || 0.1;
      config.parameters.mirostat_tau = params.mirostat_tau || 5.0;
    }
    
    // Add architecture type
    config.architectureType = pipeline.architecture.architecture || 'single';
    
    // For pipeline architectures, include stages
    if (config.architectureType === 'pipeline') {
      config.stages = pipeline.architecture.stages || [];
    }
    
    return config;
  }

  /**
   * Prepare deployment package
   * @param {object} pipeline - Pipeline data
   * @param {string} modelName - Name for the model
   * @returns {object} Deployment package
   */
  async prepareDeployment(pipeline, modelName) {
    // Generate Modelfile content
    const modelfile = this.generateModelfile(pipeline, modelName);
    
    // Generate deployment instructions
    const deploymentInstructions = this.generateDeploymentInstructions(modelName, modelfile);
    
    return {
      modelName,
      modelfile,
      deploymentInstructions,
      requirements: {
        disk: this.estimateDiskRequirements(pipeline),
        memory: this.estimateMemoryRequirements(pipeline),
        gpu: this.estimateGpuRequirements(pipeline)
      }
    };
  }

  /**
   * Generate Modelfile content
   * @param {object} pipeline - Pipeline data
   * @param {string} modelName - Model name
   * @returns {string} Modelfile content
   */
  generateModelfile(pipeline, modelName) {
    const config = pipeline.configuration;
    const baseModel = config.model;
    
    let modelfileContent = `FROM ${baseModel}\n\n`;
    
    // Add system prompt if provided
    if (config.systemPrompt && config.systemPrompt.trim() !== '') {
      modelfileContent += `SYSTEM """\n${config.systemPrompt}\n"""\n\n`;
    }
    
    // Add template if provided
    if (config.template && config.template.trim() !== '') {
      modelfileContent += `TEMPLATE """\n${config.template}\n"""\n\n`;
    }
    
    // Add parameters
    modelfileContent += `# Parameters\n`;
    for (const [key, value] of Object.entries(config.parameters)) {
      modelfileContent += `PARAMETER ${key} ${value}\n`;
    }
    
    return modelfileContent;
  }

  /**
   * Generate deployment instructions
   * @param {string} modelName - Model name
   * @param {string} modelfile - Modelfile content
   * @returns {string} Deployment instructions
   */
  generateDeploymentInstructions(modelName, modelfile) {
    return `
# Deployment Instructions for ${modelName}

## 1. Save the Modelfile
Save the following content to a file named 'Modelfile':

\`\`\`
${modelfile}
\`\`\`

## 2. Create the model
Run the following command in the directory where you saved the Modelfile:

\`\`\`
ollama create ${modelName} -f Modelfile
\`\`\`

## 3. Run the model
After creation, you can run your model with:

\`\`\`
ollama run ${modelName}
\`\`\`

## 4. API Usage
To use your model via the API:

\`\`\`javascript
const response = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: '${modelName}',
    messages: [{ role: 'user', content: 'Your prompt here' }]
  })
});
const data = await response.json();
console.log(data.message.content);
\`\`\`
`;
  }

  /**
   * Generate model metadata
   * @param {object} pipeline - Pipeline data
   * @param {object} request - Original request
   * @returns {object} Model metadata
   */
  async generateMetadata(pipeline, request) {
    return {
      name: request.modelName || 'aether-custom-model',
      version: '1.0.0',
      description: request.description || 'Custom model generated with AetherCreator',
      createdAt: new Date().toISOString(),
      baseModel: pipeline.configuration.model,
      architecture: pipeline.architecture.architecture,
      parameters: pipeline.configuration.parameters,
      capabilities: pipeline.modelSelection.primaryRecommendation.capabilities.strengths || [],
      recommendedUses: pipeline.enhancedContext.expandedUseCases || [],
      originalRequest: request.description,
      docs: this.generateDocumentation(pipeline, request)
    };
  }

  /**
   * Generate documentation for the model
   * @param {object} pipeline - Pipeline data
   * @param {object} request - Original request
   * @returns {string} Documentation
   */
  generateDocumentation(pipeline, request) {
    const config = pipeline.configuration;
    const baseName = pipeline.configuration.model;
    const modelName = request.modelName || 'aether-custom-model';
    
    return `
# ${modelName} Documentation

## Overview
${modelName} is a custom-optimized version of the ${baseName} model, specifically designed for ${pipeline.intent.classification?.category || 'general purpose'} tasks. It was automatically generated and optimized by the AetherCreator system.

## Capabilities
${pipeline.modelSelection.primaryRecommendation.capabilities.strengths.map(s => `- ${s}`).join('\n')}

## Optimal Use Cases
${pipeline.enhancedContext.expandedUseCases ? 
  pipeline.enhancedContext.expandedUseCases.map((useCase, i) => 
    `${i+1}. ${typeof useCase === 'string' ? useCase : JSON.stringify(useCase)}`
  ).join('\n') : 
  '- General purpose assistance\n- Task-specific support'}

## Technical Specifications
- Base model: ${baseName}
- Architecture: ${pipeline.architecture.architecture}
- Context window: ${config.parameters.num_ctx} tokens
- Default temperature: ${config.parameters.temperature}

## Parameter Optimization
The model parameters have been specifically optimized for the intended use case:
- Temperature: ${config.parameters.temperature} - ${this.explainParameter('temperature', config.parameters.temperature)}
- Top-K: ${config.parameters.top_k} - ${this.explainParameter('top_k', config.parameters.top_k)}
- Top-P: ${config.parameters.top_p} - ${this.explainParameter('top_p', config.parameters.top_p)}
- Repeat penalty: ${config.parameters.repeat_penalty} - ${this.explainParameter('repeat_penalty', config.parameters.repeat_penalty)}

## System Prompt
The model uses a custom system prompt designed for optimal performance:

\`\`\`
${config.systemPrompt || 'No custom system prompt defined.'}
\`\`\`

## Template
The model uses the following template format:

\`\`\`
${config.template || 'No custom template defined.'}
\`\`\`

## Hardware Requirements
- Recommended RAM: ${this.estimateMemoryRequirements(pipeline)} GB
- Disk space: ${this.estimateDiskRequirements(pipeline)} GB
- GPU memory: ${this.estimateGpuRequirements(pipeline)} GB VRAM (if using GPU acceleration)

## API Examples
\`\`\`javascript
// Basic chat completion
const response = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: '${modelName}',
    messages: [{ role: 'user', content: 'Your prompt here' }]
  })
});
const data = await response.json();
console.log(data.message.content);
\`\`\`
`;
  }

  /**
   * Provide explanation for parameter values
   * @param {string} parameter - Parameter name
   * @param {number} value - Parameter value
   * @returns {string} Explanation
   */
  explainParameter(parameter, value) {
    const explanations = {
      temperature: {
        low: 'Produces more deterministic, focused outputs',
        medium: 'Balanced between creativity and determinism',
        high: 'Enables more creative and varied responses'
      },
      top_k: {
        low: 'More focused on high-probability tokens',
        medium: 'Balanced token selection approach',
        high: 'Considers a wider range of possible tokens'
      },
      top_p: {
        low: 'More focused and deterministic outputs',
        medium: 'Balanced probability distribution',
        high: 'More diverse and exploratory responses'
      },
      repeat_penalty: {
        low: 'Minimal repetition prevention',
        medium: 'Balanced repetition handling',
        high: 'Strongly prevents repetitive text'
      }
    };
    
    // Determine category based on parameter and value
    let category;
    switch(parameter) {
      case 'temperature':
        if (value <= 0.3) category = 'low';
        else if (value <= 0.7) category = 'medium';
        else category = 'high';
        break;
      case 'top_k':
        if (value <= 20) category = 'low';
        else if (value <= 50) category = 'medium';
        else category = 'high';
        break;
      case 'top_p':
        if (value <= 0.5) category = 'low';
        else if (value <= 0.85) category = 'medium';
        else category = 'high';
        break;
      case 'repeat_penalty':
        if (value <= 1.05) category = 'low';
        else if (value <= 1.15) category = 'medium';
        else category = 'high';
        break;
      default:
        return 'Optimized for this specific use case';
    }
    
    return explanations[parameter][category];
  }

  /**
   * Estimate disk space requirements
   * @param {object} pipeline - Pipeline data
   * @returns {number} Estimated GB
   */
  estimateDiskRequirements(pipeline) {
    const modelSizes = {
      'phi4-mini-reasoning': 3.8,
      'qwen3:8b': 8,
      'qwen3:4b': 4,
      'qwen3:1.7b': 1.7,
      'deepseek-r1:8b': 8,
      'llama3:8b': 8,
      'codellama:7b': 7,
      'mistral:7b': 7
    };
    
    // Find base model
    const baseModel = pipeline.configuration.model;
    let size = 4; // Default size
    
    // Try to match model name
    for (const [modelPattern, modelSize] of Object.entries(modelSizes)) {
      if (baseModel.includes(modelPattern)) {
        size = modelSize;
        break;
      }
    }
    
    // Add overhead
    return Math.round((size * 1.2) * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Estimate memory requirements
   * @param {object} pipeline - Pipeline data
   * @returns {number} Estimated GB
   */
  estimateMemoryRequirements(pipeline) {
    // Base on context window and model size
    const contextWindow = pipeline.configuration.parameters.num_ctx || 4096;
    const baseSize = this.estimateDiskRequirements(pipeline);
    
    // Memory formula: base size + context window factor
    const contextFactor = contextWindow / 4096; // Normalized to 4K context
    
    return Math.round((baseSize * 1.5 + contextFactor * 2) * 10) / 10;
  }

  /**
   * Estimate GPU VRAM requirements
   * @param {object} pipeline - Pipeline data
   * @returns {number} Estimated GB
   */
  estimateGpuRequirements(pipeline) {
    // Similar to memory but with GPU factors
    const baseSize = this.estimateDiskRequirements(pipeline);
    const contextWindow = pipeline.configuration.parameters.num_ctx || 4096;
    const contextFactor = contextWindow / 4096;
    
    return Math.round((baseSize * 1.2 + contextFactor * 1.5) * 10) / 10;
  }

  /**
   * Generate suggestions for handling errors
   * @param {Error} error - Error that occurred
   * @returns {Array} Suggestions
   */
  async generateErrorSuggestions(error) {
    try {
      const errorPrompt = `
        An error occurred during AI model generation:
        "${error.message}"
        
        Generate 3-5 helpful suggestions to resolve this issue.
        Focus on practical steps the user can take.
        Be specific and actionable.
        
        Return as a simple array of suggestion strings.
      `;
      
      const result = await ollama.chat({
        model: 'qwen3:1.7b',
        messages: [{ role: 'user', content: errorPrompt }],
        options: { temperature: 0.3 }
      });
      
      // Try to parse as JSON, fall back to text processing
      try {
        return JSON.parse(result.message.content);
      } catch (e) {
        // Extract suggestions using regex
        const suggestions = [];
        const lines = result.message.content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          // Look for numbered or bulleted list items
          if (/^(\d+[\.\)]\s+|\-\s+|\*\s+)/.test(trimmed)) {
            suggestions.push(trimmed.replace(/^(\d+[\.\)]\s+|\-\s+|\*\s+)/, ''));
          }
        }
        
        return suggestions.length > 0 ? suggestions : [
          "Check that Ollama is running and accessible",
          "Verify that required models are installed",
          "Check network connectivity",
          "Try with a simpler model configuration",
          "Restart the application and try again"
        ];
      }
    } catch (e) {
      // Default suggestions if error handling fails
      return [
        "Check that Ollama is running and accessible",
        "Verify that required models are installed",
        "Check network connectivity",
        "Try with a simpler model configuration",
        "Restart the application and try again"
      ];
    }
  }
}

export default ModelGenerationService;
