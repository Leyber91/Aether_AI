/**
 * ModelCapabilityMapper - Intelligent model selection system
 * Maps user requirements to optimal model capabilities and characteristics
 */
class ModelCapabilityMapper {
  constructor() {
    // Comprehensive database of model capabilities
    this.capabilities = {
      'phi4-mini-reasoning:latest': {
        strengths: ['reasoning', 'logic', 'step-by-step', 'analysis'],
        weaknesses: ['creative writing', 'casual conversation'],
        optimalTasks: ['problem-solving', 'code-review', 'technical-analysis'],
        contextWindow: 4096,
        speed: 'medium',
        parameterCount: '3.8B'
      },
      'qwen3:8b': {
        strengths: ['general', 'balanced', 'multilingual', 'versatile'],
        weaknesses: ['specialized reasoning'],
        optimalTasks: ['general-assistant', 'content-creation', 'translation'],
        contextWindow: 32768,
        speed: 'slow',
        parameterCount: '8B'
      },
      'qwen3:4b': {
        strengths: ['efficient', 'coding', 'structured-output'],
        weaknesses: ['complex reasoning'],
        optimalTasks: ['code-generation', 'api-responses', 'data-processing'],
        contextWindow: 32768,
        speed: 'medium',
        parameterCount: '4B'
      },
      'qwen3:1.7b': {
        strengths: ['fast', 'classification', 'simple-tasks'],
        weaknesses: ['complex-content', 'reasoning'],
        optimalTasks: ['routing', 'classification', 'simple-qa'],
        contextWindow: 32768,
        speed: 'fast',
        parameterCount: '1.7B'
      },
      'deepseek-r1:8b': {
        strengths: ['deep-reasoning', 'research', 'analysis'],
        weaknesses: ['speed', 'casual-tasks'],
        optimalTasks: ['research', 'complex-analysis', 'fact-checking'],
        contextWindow: 4096,
        speed: 'slow',
        parameterCount: '8B'
      },
      'llama3:8b': {
        strengths: ['balanced', 'instruction-following', 'general-purpose'],
        weaknesses: ['specialized-domains', 'complex-math'],
        optimalTasks: ['chat', 'content-generation', 'summarization'],
        contextWindow: 8192,
        speed: 'medium',
        parameterCount: '8B'
      },
      'codellama:7b': {
        strengths: ['code-generation', 'code-completion', 'debugging'],
        weaknesses: ['general-knowledge', 'creative-tasks'],
        optimalTasks: ['programming', 'code-analysis', 'technical-documentation'],
        contextWindow: 16384,
        speed: 'medium',
        parameterCount: '7B'
      },
      'mistral:7b': {
        strengths: ['instruction-following', 'reasoning', 'balanced'],
        weaknesses: ['multilingual', 'creative-writing'],
        optimalTasks: ['qa', 'chat', 'analysis'],
        contextWindow: 8192,
        speed: 'medium',
        parameterCount: '7B'
      }
    };
  }

  /**
   * Select the optimal model based on user requirements
   * @param {object} requirements - User requirements from analysis
   * @param {Array} availableModels - List of available Ollama models
   * @returns {object} Recommended models with scoring and reasoning
   */
  async selectOptimalModel(requirements, availableModels = []) {
    // Score each model against requirements
    const scores = {};
    const availableModelNames = availableModels.map(model => model.name);
    
    // Track availability for reporting
    const availability = {};
    
    // Score all models in capabilities database
    for (const [modelId, caps] of Object.entries(this.capabilities)) {
      scores[modelId] = this.calculateModelScore(requirements, caps);
      availability[modelId] = availableModelNames.includes(modelId);
    }
    
    // Return top candidates with reasoning, prioritizing available models
    return this.rankModels(scores, requirements, availability);
  }

  /**
   * Calculate compatibility score between requirements and model capabilities
   * @param {object} requirements - User requirements
   * @param {object} capabilities - Model capabilities
   * @returns {object} Score with breakdown by category
   */
  calculateModelScore(requirements, capabilities) {
    // Initialize score categories
    const scores = {
      taskCompatibility: 0,
      contextWindowMatch: 0,
      performanceMatch: 0,
      specialCapabilities: 0
    };

    // Task compatibility (0-100)
    if (requirements.taskCategory && capabilities.optimalTasks) {
      const taskMatches = capabilities.optimalTasks.filter(task => 
        requirements.taskCategory.toLowerCase().includes(task.toLowerCase())
      ).length;
      
      scores.taskCompatibility = Math.min(100, taskMatches * 30);
      
      // Bonus for strengths matching required capabilities
      if (requirements.capabilities && capabilities.strengths) {
        const strengthMatches = requirements.capabilities.filter(cap => 
          capabilities.strengths.some(s => s.toLowerCase().includes(cap.toLowerCase()))
        ).length;
        
        scores.taskCompatibility += Math.min(
          30, 
          (strengthMatches / requirements.capabilities.length) * 30
        );
      }
      
      // Penalty for weaknesses matching required capabilities
      if (requirements.capabilities && capabilities.weaknesses) {
        const weaknessMatches = requirements.capabilities.filter(cap => 
          capabilities.weaknesses.some(w => w.toLowerCase().includes(cap.toLowerCase()))
        ).length;
        
        scores.taskCompatibility -= Math.min(
          40, 
          (weaknessMatches / requirements.capabilities.length) * 40
        );
      }
    }

    // Context window match (0-100)
    if (requirements.contextWindow && capabilities.contextWindow) {
      if (capabilities.contextWindow >= requirements.contextWindow) {
        // Full points if meets or exceeds requirement
        scores.contextWindowMatch = 100;
      } else {
        // Partial points based on how close it comes
        scores.contextWindowMatch = Math.min(
          80, 
          (capabilities.contextWindow / requirements.contextWindow) * 100
        );
      }
    }

    // Performance match (0-100)
    if (requirements.performanceNeeds && capabilities.speed) {
      const speedMapping = {
        'fast': 3,
        'medium': 2,
        'slow': 1
      };
      
      const performanceMapping = {
        'high-speed': 'fast',
        'balanced': 'medium',
        'high-quality': 'slow'
      };
      
      const requiredSpeed = performanceMapping[requirements.performanceNeeds] || 'medium';
      const speedScore = speedMapping[capabilities.speed] || 2;
      const requiredSpeedScore = speedMapping[requiredSpeed] || 2;
      
      // Perfect match
      if (requiredSpeed === capabilities.speed) {
        scores.performanceMatch = 100;
      } 
      // Within one level (fast-medium or medium-slow)
      else if (Math.abs(speedScore - requiredSpeedScore) === 1) {
        scores.performanceMatch = 70;
      }
      // Two levels apart (fast-slow)
      else {
        scores.performanceMatch = 30;
      }
    }

    // Special capabilities (0-100)
    if (requirements.specialRequirements && requirements.specialRequirements.length > 0) {
      // Map special requirements to capabilities
      const specialCapabilityMapping = {
        'multilingual': model => model.strengths.includes('multilingual'),
        'code-generation': model => model.optimalTasks.includes('code-generation') || model.optimalTasks.includes('programming'),
        'reasoning': model => model.strengths.includes('reasoning') || model.strengths.includes('logic'),
        'long-context': model => model.contextWindow >= 8192,
        'structured-output': model => model.strengths.includes('structured-output')
      };
      
      const matchedSpecialCaps = requirements.specialRequirements.filter(req => {
        const checkFunction = specialCapabilityMapping[req.toLowerCase()];
        return checkFunction && checkFunction(capabilities);
      }).length;
      
      scores.specialCapabilities = Math.min(
        100, 
        (matchedSpecialCaps / requirements.specialRequirements.length) * 100
      );
    }

    // Calculate weighted total (0-100)
    const weights = {
      taskCompatibility: 0.4,
      contextWindowMatch: 0.25,
      performanceMatch: 0.2,
      specialCapabilities: 0.15
    };

    const totalScore = Object.entries(scores).reduce(
      (total, [category, score]) => total + (score * weights[category]),
      0
    );

    return {
      totalScore: Math.round(totalScore),
      categoryScores: scores
    };
  }

  /**
   * Rank models based on calculated scores and availability
   * @param {object} scores - Score data for each model
   * @param {object} requirements - Original requirements
   * @param {object} availability - Availability status for each model
   * @returns {object} Ranked models with selection rationale
   */
  rankModels(scores, requirements, availability = {}) {
    // Map models with their scores and availability
    const modelsWithScores = Object.entries(scores)
      .map(([modelId, scoreData]) => ({
        modelId,
        ...scoreData,
        available: availability[modelId] || false,
        capabilities: this.capabilities[modelId]
      }));
    
    // Separate available and unavailable models
    const availableModels = modelsWithScores.filter(model => model.available);
    const unavailableModels = modelsWithScores.filter(model => !model.available);
    
    // Sort each group by score
    const sortByScore = (a, b) => b.totalScore - a.totalScore;
    const sortedAvailable = availableModels.sort(sortByScore);
    const sortedUnavailable = unavailableModels.sort(sortByScore);
    
    // Combine with available models first
    const rankedModels = [...sortedAvailable, ...sortedUnavailable];

    // Generate selection rationale for top models
    const topModels = rankedModels.slice(0, 3).map(model => {
      return {
        ...model,
        rationale: this.generateSelectionRationale(model, requirements, availability)
      };
    });

    // Determine primary recommendation
    const primaryRec = topModels.length > 0 ? topModels[0] : null;
    
    // If the top model is unavailable but there are available alternatives, provide a warning
    const warning = primaryRec && !primaryRec.available ? 
      `The optimal model "${primaryRec.modelId}" is not available locally. Consider installing it or using an available alternative.` : null;

    // Return top models with availability info
    return {
      primaryRecommendation: primaryRec,
      alternativeModels: topModels.slice(1),
      allScores: rankedModels,
      warning: warning,
      availability: {
        availableModelsCount: availableModels.length,
        unavailableModelsCount: unavailableModels.length,
        totalModelsCount: rankedModels.length
      }
    };
  }

  /**
   * Generate human-readable rationale for model selection
   * @param {object} model - Selected model data
   * @param {object} requirements - Original requirements
   * @param {object} availability - Availability status for each model
   * @returns {string} Selection rationale
   */
  generateSelectionRationale(model, requirements, availability = {}) {
    const strengths = [];
    const weaknesses = [];
    
    // Add availability information
    if (model.available) {
      strengths.push('Available locally for immediate use');
    } else {
      weaknesses.push('Not currently available locally - installation required');
    }
    
    // Add task compatibility reasoning
    if (model.categoryScores.taskCompatibility >= 70) {
      strengths.push(`Well-suited for ${requirements.taskCategory} tasks`);
    } else if (model.categoryScores.taskCompatibility <= 40) {
      weaknesses.push(`Limited optimization for ${requirements.taskCategory} tasks`);
    }
    
    // Add context window reasoning
    if (model.categoryScores.contextWindowMatch >= 90) {
      strengths.push(`Sufficient context window (${model.capabilities.contextWindow} tokens)`);
    } else if (model.categoryScores.contextWindowMatch <= 60) {
      weaknesses.push(`May have insufficient context window (${model.capabilities.contextWindow} vs. required ${requirements.contextWindow})`);
    }
    
    // Add performance reasoning
    if (model.categoryScores.performanceMatch >= 90) {
      strengths.push(`Performance profile matches requirements (${model.capabilities.speed})`);
    } else if (model.categoryScores.performanceMatch <= 50) {
      weaknesses.push(`Performance profile (${model.capabilities.speed}) doesn't align with requirements`);
    }
    
    // Add special capabilities reasoning
    if (requirements.specialRequirements && requirements.specialRequirements.length > 0) {
      if (model.categoryScores.specialCapabilities >= 70) {
        strengths.push(`Supports required special capabilities`);
      } else if (model.categoryScores.specialCapabilities <= 40) {
        weaknesses.push(`Missing some required special capabilities`);
      }
    }
    
    // Construct rationale
    let rationale = `Overall compatibility score: ${model.totalScore}/100. `;
    
    if (strengths.length > 0) {
      rationale += `Strengths: ${strengths.join(', ')}. `;
    }
    
    if (weaknesses.length > 0) {
      rationale += `Weaknesses: ${weaknesses.join(', ')}. `;
    }
    
    return rationale;
  }
}

export default ModelCapabilityMapper;
