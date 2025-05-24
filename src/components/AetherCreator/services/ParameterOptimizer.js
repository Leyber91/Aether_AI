import { ollama } from '../../../services/ollamaService';

/**
 * ParameterOptimizer - Advanced model parameter optimization
 * Generates optimal static and dynamic parameters for models based on requirements
 */
class ParameterOptimizer {
  constructor() {
    this.optimizationModel = 'qwen3:4b';
  }

  /**
   * Optimize parameters for specific model and requirements
   * @param {string} modelId - ID of the model to optimize
   * @param {object} requirements - User requirements
   * @param {object} hardwareProfile - Hardware capabilities
   * @returns {object} Optimized parameters with reasoning
   */
  async optimizeParameters(modelId, requirements, hardwareProfile) {
    const baseParams = await this.getBaseParameters(modelId, requirements);
    
    // Use AI to fine-tune parameters
    const optimizationPrompt = `
      Given model: ${modelId}
      Requirements: ${JSON.stringify(requirements)}
      Hardware: ${JSON.stringify(hardwareProfile)}
      Base parameters: ${JSON.stringify(baseParams)}
      
      Optimize these parameters for best performance.
      Consider: latency, quality, memory usage, task accuracy.
      
      For each parameter:
      1. Provide optimized value
      2. Explain reasoning behind the value
      3. Note expected impact on performance
      
      Parameters to optimize:
      - temperature
      - top_k
      - top_p
      - repeat_penalty
      - num_ctx (context window)
      - num_thread
      - mirostat settings (if applicable)
      
      Return optimized parameters with reasoning as JSON.
    `;
    
    const optimization = await ollama.chat({
      model: this.optimizationModel,
      messages: [{ role: 'user', content: optimizationPrompt }],
      options: { temperature: 0.2 }
    });
    
    return this.parseOptimizedParameters(optimization.message.content);
  }

  /**
   * Parse optimization results, with fallback for parsing errors
   * @param {string} optimizationResult - Optimization result text
   * @returns {object} Parsed parameters
   */
  parseOptimizedParameters(optimizationResult) {
    try {
      return JSON.parse(optimizationResult);
    } catch (e) {
      console.warn('Error parsing parameter optimization result:', e);
      
      // Extract parameters with regex as fallback
      const params = {
        temperature: this.extractParameterWithRegex(optimizationResult, 'temperature', 0.7),
        top_k: this.extractParameterWithRegex(optimizationResult, 'top_k', 40),
        top_p: this.extractParameterWithRegex(optimizationResult, 'top_p', 0.9),
        repeat_penalty: this.extractParameterWithRegex(optimizationResult, 'repeat_penalty', 1.1),
        num_ctx: this.extractParameterWithRegex(optimizationResult, 'num_ctx', 4096),
        num_thread: this.extractParameterWithRegex(optimizationResult, 'num_thread', 0),
        num_gpu: 99,
        reasoning: "Parsed from unstructured optimization result"
      };
      
      // Check if mirostat is mentioned
      if (optimizationResult.includes('mirostat')) {
        params.mirostat = this.extractParameterWithRegex(optimizationResult, 'mirostat', 0);
        params.mirostat_eta = this.extractParameterWithRegex(optimizationResult, 'mirostat_eta', 0.1);
        params.mirostat_tau = this.extractParameterWithRegex(optimizationResult, 'mirostat_tau', 5.0);
      }
      
      return {
        parameters: params,
        parsingError: true,
        rawResponse: optimizationResult
      };
    }
  }

  /**
   * Extract parameter value using regex as fallback method
   * @param {string} text - Text to extract from
   * @param {string} paramName - Parameter name to find
   * @param {number} defaultValue - Default value if not found
   * @returns {number} Extracted parameter value
   */
  extractParameterWithRegex(text, paramName, defaultValue) {
    const regex = new RegExp(`${paramName}[^\\d]*(\\d+\\.?\\d*)`, 'i');
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : defaultValue;
  }

  /**
   * Get base parameters for model optimization starting point
   * @param {string} modelId - Model ID
   * @param {object} requirements - User requirements
   * @returns {object} Base parameters
   */
  async getBaseParameters(modelId, requirements) {
    // Default parameters
    const baseParams = {
      temperature: 0.7,
      top_k: 40,
      top_p: 0.9,
      repeat_penalty: 1.1,
      num_ctx: 4096,
      num_gpu: 99,
      num_thread: 0
    };
    
    // Task-specific parameter adjustments
    if (requirements.taskCategory) {
      const taskCategory = requirements.taskCategory.toLowerCase();
      
      if (taskCategory.includes('code') || taskCategory.includes('programming')) {
        // Coding tasks need more precision, less randomness
        baseParams.temperature = 0.2;
        baseParams.top_k = 20;
        baseParams.top_p = 0.7;
        baseParams.repeat_penalty = 1.2;
      } 
      else if (taskCategory.includes('creative') || taskCategory.includes('writing')) {
        // Creative tasks need more exploration
        baseParams.temperature = 0.9;
        baseParams.top_k = 60;
        baseParams.top_p = 0.95;
        baseParams.repeat_penalty = 1.05;
      }
      else if (taskCategory.includes('chat') || taskCategory.includes('conversation')) {
        // Balanced for conversational use
        baseParams.temperature = 0.7;
        baseParams.top_k = 40;
        baseParams.top_p = 0.9;
        baseParams.repeat_penalty = 1.1;
      }
      else if (taskCategory.includes('analysis') || taskCategory.includes('reasoning')) {
        // Analysis tasks need more determinism
        baseParams.temperature = 0.3;
        baseParams.top_k = 30;
        baseParams.top_p = 0.7;
        baseParams.repeat_penalty = 1.15;
      }
    }
    
    // Context window adjustments based on requirements
    if (requirements.contextWindow) {
      baseParams.num_ctx = Math.max(2048, requirements.contextWindow);
    }
    
    return baseParams;
  }

  /**
   * Generate adaptive parameters that change based on input
   * @param {object} requirements - User requirements
   * @returns {object} Static and dynamic parameter configuration
   */
  async generateAdaptiveParameters(requirements) {
    // Adaptive parameter configuration
    return {
      static: {
        num_gpu: 99,
        num_ctx: this.calculateOptimalContext(requirements),
        num_thread: 0
      },
      dynamic: {
        temperature: {
          default: 0.7,
          rules: [
            { condition: 'task.type === "coding"', value: 0.2 },
            { condition: 'task.type === "creative"', value: 0.9 },
            { condition: 'task.complexity > 0.8', value: 0.3 }
          ]
        },
        top_k: {
          default: 40,
          rules: [
            { condition: 'requirements.precision === "high"', value: 10 },
            { condition: 'requirements.creativity === "high"', value: 100 }
          ]
        },
        repeat_penalty: {
          default: 1.1,
          rules: [
            { condition: 'input.length > 2000', value: 1.2 },
            { condition: 'task.type === "creative"', value: 1.05 }
          ]
        }
      }
    };
  }

  /**
   * Calculate optimal context window size based on requirements
   * @param {object} requirements - User requirements
   * @returns {number} Optimal context window size
   */
  calculateOptimalContext(requirements) {
    // Default context size
    let contextSize = 4096;
    
    // If explicitly specified in requirements, use that value
    if (requirements.contextWindow) {
      contextSize = requirements.contextWindow;
    } 
    // Otherwise estimate based on task category
    else if (requirements.taskCategory) {
      const taskCategory = requirements.taskCategory.toLowerCase();
      
      if (taskCategory.includes('document') || taskCategory.includes('summarization')) {
        contextSize = 8192; // Document processing needs larger context
      }
      else if (taskCategory.includes('code') || taskCategory.includes('programming')) {
        contextSize = 16384; // Code generation often needs large context
      }
      else if (taskCategory.includes('chat') || taskCategory.includes('conversation')) {
        contextSize = 4096; // Standard chat context
      }
      else if (taskCategory.includes('qa') || taskCategory.includes('question')) {
        contextSize = 2048; // Simple QA can use smaller context
      }
    }
    
    // Ensure context size is within reasonable bounds
    return Math.max(2048, Math.min(32768, contextSize));
  }
}

export default ParameterOptimizer;
