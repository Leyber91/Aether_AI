import { ollama } from '../../../services/ollamaService';

/**
 * IntentAnalyzer - Multi-Stage Intent Processing System
 * Responsible for deep analysis of user requirements for AI model creation
 */
class IntentAnalyzer {
  constructor() {
    this.reasoningModel = 'phi4-mini-reasoning:latest';
    this.classificationModel = 'qwen3:1.7b';
  }

  /**
   * Analyze user intent through a multi-stage process
   * @param {string} userInput - Natural language description of desired model
   * @returns {object} Comprehensive analysis of user requirements
   */
  async analyzeIntent(userInput) {
    // Stage 1: Deep reasoning about user requirements
    const reasoningPrompt = `
      Analyze this AI model request in extreme detail:
      "${userInput}"
      
      Extract:
      1. Primary task category (coding/analysis/creative/support/etc)
      2. Specific capabilities needed
      3. Performance requirements
      4. Context window needs
      5. Speed vs quality tradeoffs
      6. Special requirements (multimodal, multilingual, etc)
      7. Integration requirements
      8. Target user expertise level
      
      Provide structured JSON output.
    `;
    
    const deepAnalysis = await ollama.chat({
      model: this.reasoningModel,
      messages: [{ role: 'user', content: reasoningPrompt }],
      options: { temperature: 0.1 }
    });

    // Stage 2: Task classification and routing
    const classification = await this.classifyTask(deepAnalysis.message.content);
    
    // Stage 3: Extract technical requirements
    const technicalReqs = await this.extractTechnicalRequirements(deepAnalysis.message.content);
    
    return {
      deepAnalysis: deepAnalysis.message.content,
      classification,
      technicalReqs,
      confidence: this.calculateConfidence(deepAnalysis.message.content)
    };
  }

  /**
   * Classify the task type to determine optimal model architecture
   * @param {string} analysisResult - Result from deep analysis
   * @returns {object} Task classification data
   */
  async classifyTask(analysisResult) {
    const classificationPrompt = `
      Based on this analysis:
      ${analysisResult}

      Classify the task into one of these categories:
      1. Code Generation/Analysis
      2. Creative Content Generation
      3. Question Answering
      4. Summarization
      5. Translation/Multilingual
      6. Reasoning and Problem Solving
      7. Chat/Conversation
      8. Specialized Domain (specify)

      For the selected category, provide:
      1. Confidence score (0-1)
      2. Key capabilities needed
      3. Optimal model architecture characteristics
      
      Return as JSON.
    `;

    const result = await ollama.chat({
      model: this.classificationModel,
      messages: [{ role: 'user', content: classificationPrompt }],
      options: { temperature: 0.2 }
    });

    try {
      // Parse if it's a valid JSON, otherwise return the raw text with a parsing error flag
      return JSON.parse(result.message.content);
    } catch (e) {
      return { 
        rawResponse: result.message.content,
        parsingError: true
      };
    }
  }

  /**
   * Extract specific technical requirements for model creation
   * @param {string} analysisResult - Result from deep analysis
   * @returns {object} Technical requirements data
   */
  async extractTechnicalRequirements(analysisResult) {
    const technicalPrompt = `
      Based on this analysis:
      ${analysisResult}

      Extract precise technical requirements:
      1. Minimum context length needed (in tokens)
      2. Expected input/output types
      3. Performance constraints (latency, throughput)
      4. Hardware target (CPU, GPU requirements)
      5. Fine-tuning requirements (if any)
      6. Special capabilities (code, math, reasoning, etc.)
      7. Integration points (API, CLI, UI)
      
      Return as JSON with numeric values where applicable.
    `;

    const result = await ollama.chat({
      model: this.classificationModel,
      messages: [{ role: 'user', content: technicalPrompt }],
      options: { temperature: 0.1 }
    });

    try {
      return JSON.parse(result.message.content);
    } catch (e) {
      return { 
        rawResponse: result.message.content,
        parsingError: true
      };
    }
  }

  /**
   * Calculate confidence score for the analysis
   * @param {string} analysisResult - Result from deep analysis
   * @returns {number} Confidence score between 0-1
   */
  calculateConfidence(analysisResult) {
    // Simplified scoring mechanism - production version would be more sophisticated
    const confidenceFactors = {
      completeness: 0, // How complete the analysis is
      specificity: 0, // How specific the requirements are
      clarity: 0      // How clear the requirements are
    };

    // Check for completeness
    const requiredElements = [
      "task category", "capabilities", "performance", 
      "context window", "speed", "quality"
    ];
    
    confidenceFactors.completeness = requiredElements.filter(
      element => analysisResult.toLowerCase().includes(element)
    ).length / requiredElements.length;

    // Check for specificity (presence of numbers, technical terms)
    const specificityMarkers = [
      /\d+k\b/g, // Context window specs like "4k"
      /\d+\s*(ms|millisecond|second)/gi, // Latency specs
      /\d+\s*(gb|mb)/gi, // Memory specs
      /specific|precise|exact/gi, // Words indicating specificity
    ];
    
    confidenceFactors.specificity = Math.min(
      1, 
      specificityMarkers.filter(regex => regex.test(analysisResult)).length / 2
    );

    // Check for clarity (absence of ambiguity)
    const ambiguityMarkers = [
      /unclear|ambiguous|vague|maybe|perhaps|possibly/gi,
      /could be|might be|not sure/gi
    ];
    
    const ambiguityScore = ambiguityMarkers.filter(
      regex => regex.test(analysisResult)
    ).length;
    
    confidenceFactors.clarity = Math.max(0, 1 - (ambiguityScore * 0.2));

    // Overall confidence is weighted average
    return (
      confidenceFactors.completeness * 0.5 + 
      confidenceFactors.specificity * 0.3 + 
      confidenceFactors.clarity * 0.2
    );
  }
}

export default IntentAnalyzer;
