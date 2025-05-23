/**
 * Message Utilities Module
 * Handles message formatting, validation, and transformation
 * Pure utility functions for the MetaLoopLab
 * Implements Blueprint 3.3.3.d - Deep Observability, Introspection & Control
 */

/**
 * Enhanced JSON extraction system
 * More robust handling of structured output formats with repair capabilities
 * @param {string} text - Text to extract JSON from
 * @returns {Object|null} - Extracted JSON object or null if none found
 */
export function extractTrailingJson(text) {
  if (!text || typeof text !== 'string') return null;
  
  // Clean the text by removing code blocks and thinking sections
  let cleaned = text.replace(/```[\s\S]*?```/g, '')
                    .replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // Try to find structured JSON within markers first
  const jsonMarkerPattern = /\[STRUCTURED_OUTPUT\]([\s\S]*?)\[\/STRUCTURED_OUTPUT\]/;
  const jsonMarkerMatch = cleaned.match(jsonMarkerPattern);
  
  if (jsonMarkerMatch && jsonMarkerMatch[1]) {
    try {
      return JSON.parse(jsonMarkerMatch[1].trim());
    } catch (e) {
      console.warn("Found structured output markers but failed to parse JSON:", e);
      
      // Try to repair common JSON formatting errors
      try {
        const repaired = repairJsonString(jsonMarkerMatch[1].trim());
        console.log("Attempting to parse repaired JSON:", repaired);
        return JSON.parse(repaired);
      } catch (repairError) {
        console.error("Failed to repair and parse JSON:", repairError);
        // Continue to the fallback method
      }
    }
  }
  
  // Second pattern to try - JSON after final markdown code block
  const afterCodeBlockPattern = /```\s*\n([\s\S]*?)$/;
  const afterCodeBlockMatch = cleaned.match(afterCodeBlockPattern);
  
  if (afterCodeBlockMatch && afterCodeBlockMatch[1]) {
    try {
      // Look for JSON-like structure in the trailing content
      const jsonCandidate = afterCodeBlockMatch[1].trim();
      if (jsonCandidate.startsWith('{') && jsonCandidate.endsWith('}')) {
        try {
          return JSON.parse(jsonCandidate);
        } catch (e) {
          // Try repair
          const repaired = repairJsonString(jsonCandidate);
          return JSON.parse(repaired);
        }
      }
    } catch (e) {
      // Continue to next method
    }
  }
  
  // Find the last opening brace
  const lastBraceIndex = cleaned.lastIndexOf('{');
  if (lastBraceIndex === -1) return null;
  
  // Balance braces to extract complete JSON
  let balance = 0;
  let jsonString = null;
  
  for (let i = lastBraceIndex; i < cleaned.length; i++) {
    if (cleaned[i] === '{') balance++;
    else if (cleaned[i] === '}') balance--;
    
    if (balance === 0 && i > lastBraceIndex) {
      jsonString = cleaned.substring(lastBraceIndex, i + 1);
      break;
    }
  }
  
  if (!jsonString) return null;
  
  // Try to parse the JSON
  try {
    return JSON.parse(jsonString.trim());
  } catch (e) {
    // Attempt repair of the extracted JSON
    try {
      const repaired = repairJsonString(jsonString.trim());
      return JSON.parse(repaired);
    } catch (repairError) {
      return null;
    }
  }
}

/**
 * Repair common JSON formatting issues
 * @param {string} jsonString - Potentially malformed JSON string
 * @returns {string} - Repaired JSON string
 */
function repairJsonString(jsonString) {
  // Replace single quotes with double quotes
  let repaired = jsonString.replace(/'/g, '"');
  
  // Fix missing quotes around property names
  repaired = repaired.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":');
  
  // Fix trailing commas in arrays and objects
  repaired = repaired.replace(/,(\s*[\}\]])/g, '$1');
  
  // Fix unquoted string values
  repaired = repaired.replace(/:\s*([a-zA-Z0-9_]+)(\s*[,\}])/g, ':"$1"$2');
  
  // Normalize whitespace in JSON
  repaired = repaired.replace(/\s+/g, ' ');
  
  return repaired;
}

/**
 * Processes and validates structured output for the Reflector system
 * @param {Object} output - Extracted JSON object
 * @returns {Object} - Validated and repaired structured output
 */
export function validateStructuredOutput(output) {
  if (!output) return null;
  
  // Clone the output to avoid modifying the original
  const validated = {...output};
  
  // Check for memory_update structure
  if (validated.memory_update) {
    // Ensure loopCycle exists
    if (!validated.memory_update.loopCycle) {
      validated.memory_update.loopCycle = {
        timestamp: new Date().toISOString(),
        summary: "Cycle completed with no explicit summary"
      };
    }
    
    // Ensure timestamp
    if (!validated.memory_update.loopCycle.timestamp) {
      validated.memory_update.loopCycle.timestamp = new Date().toISOString();
    }
    
    // Ensure identified_patterns is an array
    if (!Array.isArray(validated.memory_update.loopCycle.identified_patterns)) {
      validated.memory_update.loopCycle.identified_patterns = [];
    }
    
    // Ensure cycle_evolution exists
    if (!validated.memory_update.loopCycle.cycle_evolution) {
      validated.memory_update.loopCycle.cycle_evolution = {
        progress_score: 0.5,
        novelty_score: 0.5,
        stagnation_risk: "medium",
        breakthrough_potential: "medium"
      };
    }
    
    // Ensure heuristics is an array
    if (!validated.memory_update.heuristics) {
      validated.memory_update.heuristics = [];
    } else if (!Array.isArray(validated.memory_update.heuristics)) {
      validated.memory_update.heuristics = [validated.memory_update.heuristics];
    }
    
    // Validate each heuristic
    validated.memory_update.heuristics = validated.memory_update.heuristics.map(h => {
      // Ensure heuristic has required fields
      if (!h.id && !h.heuristic_id) h.id = `h_${Date.now()}`;
      if (h.heuristic_id && !h.id) h.id = h.heuristic_id;
      if (!h.rule) h.rule = "Unnamed heuristic";
      if (!h.evaluation) h.evaluation = "No evaluation provided";
      if (!h.source_cycle) h.source_cycle = 0;
      return h;
    });
  }
  
  return validated;
}

/**
 * Formats conversation history for LLM context
 * Enhanced to include message types and multi-modal content references
 * @param {Array} history - Array of message objects
 * @returns {string} - Formatted conversation history
 */
export function formatPriorContext(history) {
  return history.map((msg, i) => {
    let parts = [`### Turn ${i + 1}: ${msg.agent}${msg.model ? ` (${msg.model})` : ''}`];
    
    // Include message type if available
    if (msg.type) {
      parts[0] += ` - ${msg.type.toUpperCase()}`;
    }
    
    parts.push(`**Full Response:**\n${msg.text}`);
    
    // Include image references if available
    if (msg.images && msg.images.length > 0) {
      parts.push(`\n**Contains ${msg.images.length} image(s)**`);
    }
    
    // Include structured data if available
    if (msg.structured) {
      parts.push(`\n**Structured Data:**\n\`\`\`json\n${JSON.stringify(msg.structured, null, 2)}\n\`\`\``);
    }
    
    return parts.join('\n');
  }).join('\n\n---\n\n');
}

/**
 * Formats a user prompt with context and instructions
 * Enhanced with message type handling
 * @param {Object} node - Graph node containing instructions
 * @param {string} priorContext - Formatted prior context
 * @param {string} seedPrompt - Initial seed prompt
 * @param {string} currentContext - Current context
 * @param {string} messageType - Optional message type hint
 * @returns {string} - Formatted prompt for the LLM
 */
export function formatUserPromptContent(node, priorContext, seedPrompt, currentContext, messageType = null) {
  let content = `Previous Context:\n${priorContext}\n\n` +
         `Your Current Task (${node.data.label}):\n${node.data.instructions}\n\n` +
         `Seed Prompt was: ${seedPrompt}\n\n` +
         `Input for this step:\n${currentContext}`;
  
  // Add message type guidance if specified
  if (messageType) {
    content += `\n\nYour response should be in the form of a ${messageType.toUpperCase()} message. `;
    
    // Add specific guidance based on message type
    if (messageType === 'reflection') {
      content += 'Focus on analyzing what has been done, what worked well, and what could be improved.';
    } else if (messageType === 'critique') {
      content += 'Critically evaluate the input, identifying weaknesses and suggesting improvements.';
    } else if (messageType === 'analysis') {
      content += 'Provide a detailed breakdown of the components and their relationships.';
    } else if (messageType === 'summary') {
      content += 'Condense the key points and findings into a concise overview.';
    }
  }
  
  // Add structured output guidance
  content += '\n\nWhen appropriate, include structured output in JSON format enclosed in [STRUCTURED_OUTPUT] and [/STRUCTURED_OUTPUT] tags.';
  
  return content;
}

/**
 * Creates a new message object for display
 * Enhanced to support message types and multi-modal content
 * 
 * @param {string} agent - Agent name
 * @param {string} model - Model name
 * @param {string} text - Message text
 * @param {Object} structured - Optional structured data
 * @param {Object} options - Additional options
 * @param {boolean} options.isPending - Whether message is pending
 * @param {string} options.type - Message type (reflection, critique, analysis, summary, etc.)
 * @param {Array} options.images - Array of image objects {url, alt} or strings
 * @returns {Object} - Formatted message object
 */
export function createMessage(agent, model, text, structured = null, options = {}) {
  const { isPending = false, type = null, images = null } = options;
  
  return {
    agent,
    model,
    text,
    structured,
    ...(type && { type }),
    ...(images && { images }),
    ...(isPending && { __pending: true }),
    timestamp: new Date().toISOString()
  };
}

/**
 * Detects the most likely message type based on content
 * Used for auto-categorization of messages
 * 
 * @param {string} text - Message text content
 * @param {Object} structured - Optional structured data
 * @returns {string|null} - Detected message type or null
 */
export function detectMessageType(text, structured = null) {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  // Check structured data first if available
  if (structured) {
    if (structured.analysis || structured.evaluation) return 'analysis';
    if (structured.critique || structured.criticism) return 'critique';
    if (structured.summary) return 'summary';
    if (structured.reflection || structured.meta_analysis) return 'reflection';
    if (structured.observation) return 'observation';
    if (structured.question || structured.inquiry) return 'question';
    if (structured.action || structured.next_steps) return 'action';
  }
  
  // Text-based detection patterns
  if (lowerText.includes('reflect') || lowerText.includes('reflection') || 
      lowerText.includes('reviewing') || lowerText.includes('looking back')) {
    return 'reflection';
  }
  
  if (lowerText.includes('criticiz') || lowerText.includes('critique') || 
      lowerText.includes('weakness') || lowerText.includes('improve') ||
      lowerText.includes('problem') || lowerText.includes('issue')) {
    return 'critique';
  }
  
  if (lowerText.includes('analyz') || lowerText.includes('assessment') || 
      lowerText.includes('evaluation') || lowerText.includes('breakdown')) {
    return 'analysis';
  }
  
  if (lowerText.includes('summary') || lowerText.includes('summariz') || 
      lowerText.includes('in conclusion') || lowerText.includes('to sum up')) {
    return 'summary';
  }
  
  if (lowerText.includes('observ') || lowerText.includes('notice') || 
      lowerText.includes('i can see') || lowerText.includes('i note')) {
    return 'observation';
  }
  
  if (lowerText.includes('?') || lowerText.startsWith('what') || 
      lowerText.startsWith('how') || lowerText.startsWith('why') ||
      lowerText.startsWith('when') || lowerText.startsWith('where')) {
    return 'question';
  }
  
  if (lowerText.includes('next step') || lowerText.includes('let\'s') || 
      lowerText.includes('i will') || lowerText.includes('we should') ||
      lowerText.includes('action') || lowerText.includes('recommend')) {
    return 'action';
  }
  
  return null;
}

/**
 * Processes raw agent response to extract structured data, detect type, etc.
 * Combines multiple utilities into one convenient function
 * 
 * @param {string} agentName - Agent name
 * @param {string} modelName - Model name 
 * @param {string} responseText - Raw response text
 * @returns {Object} - Processed message object
 */
export function processAgentResponse(agentName, modelName, responseText) {
  // Extract structured data
  const structured = extractTrailingJson(responseText);
  
  // Clean text content (remove JSON if it was extracted)
  let cleanText = responseText;
  if (structured) {
    // Check if JSON is at the end and remove it
    const lastJsonIndex = responseText.lastIndexOf('{');
    if (lastJsonIndex > 0) {
      const potentialJson = responseText.substring(lastJsonIndex);
      try {
        JSON.parse(potentialJson);
        cleanText = responseText.substring(0, lastJsonIndex).trim();
      } catch (e) {
        // Not valid JSON, keep the original text
      }
    }
    
    // Also remove any structured output markers
    cleanText = cleanText.replace(/\[STRUCTURED_OUTPUT\][\s\S]*?\[\/STRUCTURED_OUTPUT\]/g, '').trim();
  }
  
  // Detect message type based on content and structured data
  const messageType = detectMessageType(cleanText, structured);
  
  // Create full message object
  return createMessage(agentName, modelName, cleanText, structured, { type: messageType });
}

/**
 * Extract image URLs from text with markdown image syntax
 * Used for multi-modal content support
 * 
 * @param {string} text - Text to extract image URLs from
 * @returns {Array|null} - Array of image objects or null
 */
export function extractImages(text) {
  if (!text) return null;
  
  const imagePattern = /!\[(.*?)\]\((.*?)\)/g;
  const images = [];
  let match;
  
  while ((match = imagePattern.exec(text)) !== null) {
    images.push({
      alt: match[1] || '',
      url: match[2]
    });
  }
  
  return images.length > 0 ? images : null;
}
