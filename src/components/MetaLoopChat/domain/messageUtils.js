/**
 * Message Utilities Module
 * Handles message formatting, validation, and transformation
 * Pure utility functions for the MetaLoopLab
 */

/**
 * Extracts JSON from text, focusing on trailing JSON if present
 * @param {string} text - Text to extract JSON from
 * @returns {Object|null} - Extracted JSON object or null if none found
 */
export function extractTrailingJson(text) {
  if (!text || typeof text !== 'string') return null;
  
  // Clean the text by removing code blocks and thinking sections
  let cleaned = text.replace(/```[\s\S]*?```/g, '')
                    .replace(/<think>[\s\S]*?<\/think>/gi, '');
  
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
    return null;
  }
}

/**
 * Formats conversation history for LLM context
 * @param {Array} history - Array of message objects
 * @returns {string} - Formatted conversation history
 */
export function formatPriorContext(history) {
  return history.map((msg, i) => {
    let parts = [`### Turn ${i + 1}: ${msg.agent} (${msg.model})`];
    parts.push(`**Full Response:**\n${msg.text}`);
    
    if (msg.structured) {
      parts.push(`\n**Structured Data:**\n\`\`\`json\n${JSON.stringify(msg.structured, null, 2)}\n\`\`\``);
    }
    
    return parts.join('\n');
  }).join('\n\n---\n\n');
}

/**
 * Formats a user prompt with context and instructions
 * @param {Object} node - Graph node containing instructions
 * @param {string} priorContext - Formatted prior context
 * @param {string} seedPrompt - Initial seed prompt
 * @param {string} currentContext - Current context
 * @returns {string} - Formatted prompt for the LLM
 */
export function formatUserPromptContent(node, priorContext, seedPrompt, currentContext) {
  return `Previous Context:\n${priorContext}\n\n` +
         `Your Current Task (${node.data.label}):\n${node.data.instructions}\n\n` +
         `Seed Prompt was: ${seedPrompt}\n\n` +
         `Input for this step:\n${currentContext}`;
}

/**
 * Creates a new message object for display
 * @param {string} agent - Agent name
 * @param {string} model - Model name
 * @param {string} text - Message text
 * @param {Object} structured - Optional structured data
 * @param {boolean} isPending - Whether message is pending
 * @returns {Object} - Formatted message object
 */
export function createMessage(agent, model, text, structured = null, isPending = false) {
  return {
    agent,
    model,
    text,
    structured,
    ...(isPending && { __pending: true })
  };
}
