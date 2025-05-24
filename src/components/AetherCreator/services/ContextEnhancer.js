import { ollama } from '../../../services/ollamaService';

/**
 * ContextEnhancer - Advanced context enhancement system
 * Responsible for enriching the initial model analysis with historical context,
 * clarifying questions, and expanded use cases.
 */
class ContextEnhancer {
  constructor() {
    this.enhancementModel = 'qwen3:4b';
    // Local database of successful model configurations for reference
    this.modelConfigurationDb = [];
  }

  /**
   * Enhance the initial intent analysis with additional context
   * @param {object} initialAnalysis - Analysis from IntentAnalyzer
   * @returns {object} Enhanced analysis with historical context and clarifications
   */
  async enhanceContext(initialAnalysis) {
    // Process steps in parallel for efficiency
    const [similarRequests, clarifyingQuestions, expandedUseCases] = await Promise.all([
      this.findSimilarRequests(initialAnalysis),
      this.generateClarifyingQuestions(initialAnalysis),
      this.predictUseCases(initialAnalysis)
    ]);
    
    return {
      ...initialAnalysis,
      historicalContext: similarRequests,
      clarifications: clarifyingQuestions,
      expandedUseCases
    };
  }

  /**
   * Find similar historical model requests to inform current configuration
   * @param {object} analysis - Initial analysis results
   * @returns {Array} Similar historical model configurations
   */
  async findSimilarRequests(analysis) {
    // In production, this would query a database of past successful configurations
    // For now, we'll use the AI to simulate finding similar configurations
    const prompt = `
      Based on this model request analysis:
      ${JSON.stringify(analysis)}
      
      Generate 2-3 examples of similar model configurations that were successful in the past.
      For each example, include:
      1. Original use case description
      2. Base model selected
      3. Key parameters that were optimized
      4. Performance characteristics achieved
      5. Specific optimizations that were effective
      
      Return as structured JSON array.
    `;

    const result = await ollama.chat({
      model: this.enhancementModel,
      messages: [{ role: 'user', content: prompt }],
      options: { temperature: 0.4 }
    });

    try {
      return JSON.parse(result.message.content);
    } catch (e) {
      console.warn('Error parsing similar requests:', e);
      return { 
        rawResponse: result.message.content,
        parsingError: true
      };
    }
  }

  /**
   * Generate clarifying questions to resolve ambiguities in the initial request
   * @param {object} analysis - Initial analysis results
   * @returns {Array} List of clarifying questions with their importance
   */
  async generateClarifyingQuestions(analysis) {
    // Identify gaps and ambiguities in the requirements
    const confidence = analysis.confidence || 0.7;
    
    // Only generate clarifying questions if confidence is below threshold
    if (confidence > 0.9) {
      return { questions: [], needsClarification: false };
    }

    const prompt = `
      Based on this model request analysis:
      ${JSON.stringify(analysis)}
      
      The confidence in this analysis is ${confidence * 100}%.
      
      Generate 2-4 critical clarifying questions that would resolve ambiguities
      or fill in missing information. Focus on:
      1. Unclear performance requirements
      2. Ambiguous capability descriptions
      3. Missing technical constraints
      4. Integration details that need specification
      
      For each question:
      - Explain why this information is needed
      - Rate its importance (high/medium/low)
      - Suggest possible answers and their implications
      
      Return as structured JSON.
    `;

    const result = await ollama.chat({
      model: this.enhancementModel,
      messages: [{ role: 'user', content: prompt }],
      options: { temperature: 0.3 }
    });

    try {
      const parsed = JSON.parse(result.message.content);
      return {
        questions: parsed,
        needsClarification: parsed.length > 0
      };
    } catch (e) {
      console.warn('Error parsing clarifying questions:', e);
      return { 
        rawResponse: result.message.content,
        parsingError: true,
        needsClarification: true
      };
    }
  }

  /**
   * Predict potential use cases beyond those explicitly mentioned
   * @param {object} analysis - Initial analysis results
   * @returns {Array} Expanded use cases and their implications
   */
  async predictUseCases(analysis) {
    const prompt = `
      Based on this model request analysis:
      ${JSON.stringify(analysis)}
      
      Predict 2-3 additional use cases or scenarios that the user might not have
      explicitly mentioned, but would benefit from the same model configuration.
      
      For each use case:
      1. Describe the scenario
      2. Explain why the current configuration would work well
      3. Suggest any minor adaptations that might make it even better
      4. Rate the probability that this is an intended use case (high/medium/low)
      
      Return as structured JSON array.
    `;

    const result = await ollama.chat({
      model: this.enhancementModel,
      messages: [{ role: 'user', content: prompt }],
      options: { temperature: 0.5 }
    });

    try {
      return JSON.parse(result.message.content);
    } catch (e) {
      console.warn('Error parsing expanded use cases:', e);
      return { 
        rawResponse: result.message.content,
        parsingError: true
      };
    }
  }

  /**
   * Save successful model configuration to database for future reference
   * @param {object} configuration - Successful model configuration 
   * @param {object} performance - Performance metrics of the configuration
   * @returns {boolean} Success status
   */
  saveSuccessfulConfiguration(configuration, performance) {
    // In production, this would save to a persistent database
    this.modelConfigurationDb.push({
      configuration,
      performance,
      timestamp: new Date().toISOString()
    });
    
    return true;
  }
}

export default ContextEnhancer;
