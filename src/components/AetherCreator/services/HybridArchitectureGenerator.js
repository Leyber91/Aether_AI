import { ollama } from '../../../services/ollamaService';

/**
 * HybridArchitectureGenerator - Intelligent model architecture design
 * Designs single or multi-model architectures based on task complexity
 */
class HybridArchitectureGenerator {
  constructor() {
    this.designModel = 'qwen3:8b';
  }

  /**
   * Generate optimal architecture for the task requirements
   * @param {object} requirements - User requirements and task analysis
   * @returns {object} Architecture specification
   */
  async generateHybridArchitecture(requirements) {
    // Determine if single model or multi-model architecture needed
    const complexity = await this.assessComplexity(requirements);
    
    if (complexity.score > 0.7) {
      // Design multi-model pipeline for complex tasks
      return this.designMultiModelPipeline(requirements);
    } else {
      // Optimize single model configuration for simpler tasks
      return this.optimizeSingleModel(requirements);
    }
  }

  /**
   * Assess the complexity of the task to determine architecture needs
   * @param {object} requirements - User requirements
   * @returns {object} Complexity assessment with score and rationale
   */
  async assessComplexity(requirements) {
    const complexityPrompt = `
      Analyze this model requirement to determine task complexity:
      ${JSON.stringify(requirements)}
      
      Assess complexity factors:
      1. Multiple distinct subtasks required
      2. Range of capabilities needed (reasoning AND generation AND analysis)
      3. Need for specialized handling of different input types
      4. Complex decision-making or routing logic
      5. Conflicting optimization goals (speed vs quality in different subtasks)
      
      Rate complexity on scale of 0-1, where:
      - 0-0.3: Simple, single-purpose task best handled by one model
      - 0.3-0.7: Moderate complexity, could use one optimized model
      - 0.7-1.0: High complexity, would benefit from multi-model architecture
      
      Return JSON with complexity score and detailed reasoning.
    `;
    
    const result = await ollama.chat({
      model: this.designModel,
      messages: [{ role: 'user', content: complexityPrompt }],
      options: { temperature: 0.2 }
    });

    try {
      return JSON.parse(result.message.content);
    } catch (e) {
      console.warn('Error parsing complexity assessment:', e);
      // Fallback assessment if parsing fails
      return {
        score: 0.5, // Default to moderate complexity
        reasoning: "Unable to parse complexity assessment, using default moderate complexity score",
        rawResponse: result.message.content
      };
    }
  }

  /**
   * Design a multi-model pipeline for complex tasks
   * @param {object} requirements - User requirements
   * @returns {object} Pipeline architecture specification
   */
  async designMultiModelPipeline(requirements) {
    const pipelinePrompt = `
      Design a multi-model pipeline for these requirements:
      ${JSON.stringify(requirements)}
      
      Create an optimal architecture with 2-5 stages, where each stage:
      1. Has a specific purpose/role
      2. Uses an appropriate model optimized for that role
      3. Includes appropriate configuration parameters
      
      Common architectures include:
      - Router → Processor → Validator
      - Classifier → Specialized Model(s) → Aggregator
      - Planner → Executor → Reviewer
      - Input Processor → Core Reasoner → Output Generator
      
      For each stage, specify:
      - Stage name and purpose
      - Selected model
      - Key configuration parameters
      - Input/output format
      
      Return detailed pipeline as JSON.
    `;
    
    const result = await ollama.chat({
      model: this.designModel,
      messages: [{ role: 'user', content: pipelinePrompt }],
      options: { temperature: 0.3 }
    });

    try {
      const pipeline = JSON.parse(result.message.content);
      return {
        architecture: 'pipeline',
        complexity: 'high',
        stages: pipeline.stages || pipeline,
        explanation: pipeline.explanation || "Multi-model pipeline designed for complex task requirements"
      };
    } catch (e) {
      console.warn('Error parsing pipeline design:', e);
      // Fallback to a simple pipeline if parsing fails
      return {
        architecture: 'pipeline',
        complexity: 'high',
        stages: [
          {
            name: 'router',
            model: 'qwen3:1.7b',
            role: 'Classify and route requests',
            parameters: { temperature: 0.1, top_k: 10 }
          },
          {
            name: 'processor',
            model: requirements.recommendedModel || 'qwen3:8b',
            role: 'Main processing',
            parameters: { temperature: 0.7, top_p: 0.9 }
          },
          {
            name: 'validator',
            model: 'phi4-mini-reasoning:latest',
            role: 'Validate and enhance output',
            parameters: { temperature: 0.2 }
          }
        ],
        explanation: "Standard pipeline architecture (router → processor → validator)",
        parsingError: true,
        rawResponse: result.message.content
      };
    }
  }

  /**
   * Optimize a single model configuration for simpler tasks
   * @param {object} requirements - User requirements
   * @returns {object} Optimized single model configuration
   */
  async optimizeSingleModel(requirements) {
    const optimizationPrompt = `
      Optimize a single model configuration for these requirements:
      ${JSON.stringify(requirements)}
      
      Create a configuration that:
      1. Uses the most appropriate base model
      2. Has optimized parameters for the specific task
      3. Includes any necessary pre/post processing
      
      Specify:
      - Selected model with justification
      - All key configuration parameters
      - Recommended template format
      - System prompt optimization
      - Any special handling requirements
      
      Return detailed configuration as JSON.
    `;
    
    const result = await ollama.chat({
      model: this.designModel,
      messages: [{ role: 'user', content: optimizationPrompt }],
      options: { temperature: 0.3 }
    });

    try {
      const config = JSON.parse(result.message.content);
      return {
        architecture: 'single',
        complexity: 'moderate',
        model: config.model || config.selectedModel,
        parameters: config.parameters || config,
        explanation: config.justification || config.explanation || "Optimized single model configuration"
      };
    } catch (e) {
      console.warn('Error parsing single model configuration:', e);
      // Fallback to a basic configuration if parsing fails
      return {
        architecture: 'single',
        complexity: 'moderate',
        model: requirements.recommendedModel || 'qwen3:8b',
        parameters: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
          repeat_penalty: 1.1,
          num_ctx: 4096
        },
        explanation: "Basic optimized configuration for balanced performance",
        parsingError: true,
        rawResponse: result.message.content
      };
    }
  }

  /**
   * Generate diagram of the architecture for visualization
   * @param {object} architecture - The generated architecture
   * @returns {string} ASCII or text-based diagram
   */
  generateArchitectureDiagram(architecture) {
    if (architecture.architecture === 'single') {
      return `
┌─────────────────────────────────────────┐
│ Single Model: ${architecture.model.padEnd(25)} │
├─────────────────────────────────────────┤
│ Parameters:                             │
│  • temperature: ${architecture.parameters.temperature} │
│  • top_p: ${architecture.parameters.top_p} │
│  • num_ctx: ${architecture.parameters.num_ctx} │
└─────────────────────────────────────────┘
      `;
    } else {
      // Generate pipeline diagram
      let diagram = `
┌─────────────────────────────────────────────────────┐
│ Multi-Model Pipeline Architecture                   │
├─────────────────────────────────────────────────────┤\n`;
      
      architecture.stages.forEach((stage, index) => {
        diagram += `│ Stage ${index + 1}: ${stage.name.padEnd(10)} │ Model: ${stage.model.padEnd(20)} │\n`;
        
        if (index < architecture.stages.length - 1) {
          diagram += `│                    ↓                              │\n`;
        }
      });
      
      diagram += `└─────────────────────────────────────────────────────┘\n`;
      
      return diagram;
    }
  }
}

export default HybridArchitectureGenerator;
