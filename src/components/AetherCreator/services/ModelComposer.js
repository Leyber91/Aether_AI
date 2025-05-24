import { ollama } from '../../../services/ollamaService';

/**
 * ModelComposer - Advanced model composition system
 * Creates specialized models by combining multiple capabilities and models
 */
class ModelComposer {
  constructor() {
    this.compositionModel = 'qwen3:8b';
  }

  /**
   * Compose a specialized model based on requirements
   * @param {object} requirements - User requirements
   * @returns {object} Composed model configuration
   */
  async composeSpecializedModel(requirements) {
    // Determine if we need a mixture of experts or a single model
    if (requirements.capabilities && requirements.capabilities.length > 3) {
      return this.createMixtureOfExperts(requirements);
    }
    
    return this.createSingleExpert(requirements);
  }

  /**
   * Create a Mixture of Experts (MoE) model
   * @param {object} requirements - User requirements
   * @returns {object} MoE configuration
   */
  async createMixtureOfExperts(requirements) {
    // Generate expert models for each capability
    const experts = [];
    
    for (const capability of requirements.capabilities) {
      const expert = await this.createExpert({
        ...requirements,
        primaryCapability: capability,
        capabilities: [capability]
      });
      
      experts.push(expert);
    }
    
    // Create router model
    const router = await this.createRouter(experts, requirements);
    
    // Generate unified Modelfile
    const modelfile = await this.generateMoEModelfile(router, experts);
    
    return {
      type: 'mixture_of_experts',
      router,
      experts,
      modelfile,
      explanation: 'Specialized model using Mixture of Experts architecture',
      capabilities: requirements.capabilities
    };
  }

  /**
   * Create a single expert model
   * @param {object} requirements - User requirements
   * @returns {object} Expert model configuration
   */
  async createSingleExpert(requirements) {
    // Determine the best base model for the requirements
    const baseModelPrompt = `
      Select the optimal base model for these requirements:
      ${JSON.stringify(requirements)}
      
      Consider these base models:
      - phi4-mini-reasoning (3.8B, great for reasoning and analysis)
      - qwen3:8b (8B, versatile and balanced)
      - qwen3:4b (4B, efficient coding and structured output)
      - deepseek-r1:8b (8B, deep reasoning and research)
      - llama3:8b (8B, balanced instruction following)
      - codellama:7b (7B, specialized for code)
      - mistral:7b (7B, good reasoning and balanced)
      
      Return JSON with selected model and justification.
    `;
    
    const baseModelResult = await ollama.chat({
      model: this.compositionModel,
      messages: [{ role: 'user', content: baseModelPrompt }],
      options: { temperature: 0.2 }
    });
    
    let baseModel;
    try {
      const result = JSON.parse(baseModelResult.message.content);
      baseModel = result.model || result.selectedModel;
    } catch (e) {
      // Default if parsing fails
      baseModel = 'qwen3:8b';
    }
    
    // Generate optimal system prompt for this model
    const systemPromptPrompt = `
      Create an optimal system prompt for this model and requirements:
      Base model: ${baseModel}
      Requirements: ${JSON.stringify(requirements)}
      
      The system prompt should:
      1. Define the model's core purpose
      2. Specify its capabilities and constraints
      3. Set behavior expectations
      4. Provide guidance for handling different input types
      
      Make it concise but comprehensive.
      Return the system prompt as a plain string, not JSON.
    `;
    
    const systemPromptResult = await ollama.chat({
      model: this.compositionModel,
      messages: [{ role: 'user', content: systemPromptPrompt }],
      options: { temperature: 0.3 }
    });
    
    const systemPrompt = systemPromptResult.message.content;
    
    // Generate optimal template
    const templatePrompt = `
      Create an optimal template for this model and requirements:
      Base model: ${baseModel}
      Requirements: ${JSON.stringify(requirements)}
      
      The template should use Ollama template format with {{ .System }} and {{ .Prompt }} variables.
      Optimize for the specific use case.
      Return only the template string, not JSON.
    `;
    
    const templateResult = await ollama.chat({
      model: this.compositionModel,
      messages: [{ role: 'user', content: templatePrompt }],
      options: { temperature: 0.3 }
    });
    
    let template = templateResult.message.content;
    
    // Clean up template (remove code blocks if present)
    template = template.replace(/```[^\n]*\n|```/g, '').trim();
    
    // Generate optimal parameters
    const parametersPrompt = `
      Generate optimal parameters for this model and requirements:
      Base model: ${baseModel}
      Requirements: ${JSON.stringify(requirements)}
      
      Include:
      - temperature
      - top_k
      - top_p
      - repeat_penalty
      - num_ctx
      
      Return as JSON object.
    `;
    
    const parametersResult = await ollama.chat({
      model: this.compositionModel,
      messages: [{ role: 'user', content: parametersPrompt }],
      options: { temperature: 0.2 }
    });
    
    let parameters;
    try {
      parameters = JSON.parse(parametersResult.message.content);
    } catch (e) {
      // Default parameters if parsing fails
      parameters = {
        temperature: 0.7,
        top_k: 40,
        top_p: 0.9,
        repeat_penalty: 1.1,
        num_ctx: 4096,
        num_gpu: 99
      };
    }
    
    return {
      type: 'single_expert',
      baseModel,
      systemPrompt,
      template,
      parameters,
      explanation: `Specialized model using ${baseModel} as base`,
      capabilities: requirements.capabilities
    };
  }

  /**
   * Create a router model to direct requests to appropriate experts
   * @param {Array} experts - Expert models
   * @param {object} requirements - User requirements
   * @returns {object} Router configuration
   */
  async createRouter(experts, requirements) {
    // Generate router system prompt
    const expertDescriptions = experts.map((expert, index) => 
      `Expert ${index + 1}: ${expert.explanation} - Handles ${expert.capabilities.join(', ')}`
    ).join('\n');
    
    const routerPrompt = `
      You are a request router for a Mixture of Experts system.
      Your job is to analyze incoming requests and route them to the most appropriate expert.
      
      Available experts:
      ${expertDescriptions}
      
      For each request:
      1. Analyze the primary task and requirements
      2. Select the most appropriate expert
      3. Return the expert number only, with no explanation
    `;
    
    // Router configuration
    return {
      model: 'qwen3:1.7b', // Lightweight model for routing
      systemPrompt: routerPrompt,
      template: 'USER REQUEST: {{ .Prompt }}\nROUTING TO EXPERT:',
      parameters: {
        temperature: 0.1, // Low temperature for consistent routing
        top_k: 10,
        top_p: 0.7,
        repeat_penalty: 1.1,
        num_ctx: 2048 // Smaller context window for efficiency
      }
    };
  }

  /**
   * Create an expert model for a specific capability
   * @param {object} requirements - Requirements with primary capability
   * @returns {object} Expert configuration
   */
  async createExpert(requirements) {
    // Simplified version of createSingleExpert focused on one capability
    const capability = requirements.primaryCapability;
    
    // Determine best model for this capability
    let baseModel = 'qwen3:4b'; // Default
    
    // Model selection logic based on capability
    if (capability.includes('reasoning') || capability.includes('analysis')) {
      baseModel = 'phi4-mini-reasoning';
    } else if (capability.includes('code') || capability.includes('programming')) {
      baseModel = 'codellama:7b';
    } else if (capability.includes('creative') || capability.includes('writing')) {
      baseModel = 'llama3:8b';
    } else if (capability.includes('research')) {
      baseModel = 'deepseek-r1:8b';
    }
    
    // Generate specialized system prompt
    const promptPrompt = `
      Create a specialized system prompt for an expert in:
      ${capability}
      
      The prompt should focus entirely on this capability.
      Make it concise but effective.
      Return just the system prompt text.
    `;
    
    const promptResult = await ollama.chat({
      model: this.compositionModel,
      messages: [{ role: 'user', content: promptPrompt }],
      options: { temperature: 0.4 }
    });
    
    const systemPrompt = promptResult.message.content;
    
    // Expert configuration
    return {
      baseModel,
      systemPrompt,
      template: '{{ if .System }}{{ .System }}\n\n{{ end }}USER: {{ .Prompt }}\nEXPERT:',
      parameters: this.getOptimalParametersForCapability(capability),
      capabilities: [capability],
      explanation: `Expert in ${capability}`
    };
  }

  /**
   * Get optimal parameters for a specific capability
   * @param {string} capability - Capability
   * @returns {object} Optimal parameters
   */
  getOptimalParametersForCapability(capability) {
    // Default parameters
    const params = {
      temperature: 0.7,
      top_k: 40,
      top_p: 0.9,
      repeat_penalty: 1.1,
      num_ctx: 4096,
      num_gpu: 99
    };
    
    // Adjust based on capability
    if (capability.includes('code') || capability.includes('programming')) {
      params.temperature = 0.2;
      params.top_k = 20;
      params.repeat_penalty = 1.2;
    } else if (capability.includes('creative') || capability.includes('writing')) {
      params.temperature = 0.9;
      params.top_k = 60;
      params.top_p = 0.95;
    } else if (capability.includes('reasoning') || capability.includes('analysis')) {
      params.temperature = 0.3;
      params.top_p = 0.7;
    }
    
    return params;
  }

  /**
   * Generate a Modelfile for Mixture of Experts
   * @param {object} router - Router configuration
   * @param {Array} experts - Expert configurations
   * @returns {string} Modelfile content
   */
  async generateMoEModelfile(router, experts) {
    // Note: This is a conceptual implementation as Ollama doesn't directly support MoE
    // In practice, this would require custom implementation or integration
    
    let modelfile = `# Mixture of Experts Model\n\n`;
    modelfile += `FROM ${router.model} AS router\n\n`;
    modelfile += `SYSTEM """\n${router.systemPrompt}\n"""\n\n`;
    modelfile += `TEMPLATE """\n${router.template}\n"""\n\n`;
    
    // Add parameters for router
    for (const [key, value] of Object.entries(router.parameters)) {
      modelfile += `PARAMETER ${key} ${value}\n`;
    }
    
    modelfile += `\n# Expert Models\n`;
    
    // Add each expert
    experts.forEach((expert, index) => {
      modelfile += `\n# Expert ${index + 1}: ${expert.capabilities.join(', ')}\n`;
      modelfile += `FROM ${expert.baseModel} AS expert${index + 1}\n\n`;
      modelfile += `SYSTEM """\n${expert.systemPrompt}\n"""\n\n`;
      modelfile += `TEMPLATE """\n${expert.template}\n"""\n\n`;
      
      // Add parameters for this expert
      for (const [key, value] of Object.entries(expert.parameters)) {
        modelfile += `PARAMETER ${key} ${value}\n`;
      }
    });
    
    modelfile += `\n# Note: This is a conceptual Modelfile for a Mixture of Experts architecture.\n`;
    modelfile += `# Implementation would require custom router logic between models.\n`;
    
    return modelfile;
  }
}

export default ModelComposer;
