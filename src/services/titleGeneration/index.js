/**
 * Conversation title generation module
 * Provides functionality to automatically generate titles based on conversation content
 */

import { sendMessageToOllama } from '../enhancedOllamaService';
import { isValidTitle, cleanupTitle, toTitleCase } from './validation';
import { extractKeywords } from './keywords';
import { generateTitlePrompt, generateFollowUpPrompt } from './prompts';

/**
 * Generate a title for a conversation based on its initial content
 * Uses Ollama's API with the specified model (defaulting to llama3.2:1b) to generate a concise title
 * 
 * @param {string} message - The first user message in the conversation
 * @param {Object} options - Additional options for title generation
 * @returns {Promise<string>} - The generated title
 */
export const generateConversationTitle = async (message, options = {}) => {
  const model = 'llama3.2:1b'; // Hardcode the model to Llama 3.2
  try {
    // Make sure we have a usable message to generate a title from
    if (!message || message.trim().length === 0) {
      return 'New Conversation';
    }
    
    // Only use the first 300 characters to keep the prompt short but meaningful
    const truncatedMessage = message.length > 300 
      ? message.substring(0, 300) + '...' 
      : message;
    
    // Extract potential keywords for fallback
    const keywords = extractKeywords(truncatedMessage);
    
    // Create a system prompt asking for a concise title
    const prompt = generateTitlePrompt(truncatedMessage);
    
    // Try up to 3 times to get a good title with different approaches
    let title = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!isValidTitle(title) && attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`Title generation attempt ${attempts}/${maxAttempts} for model ${model}`);
        
        // Call Ollama API to generate the title with improved error handling
        const response = await sendMessageToOllama(model, prompt, {
          temperature: 0.3, // Low temperature for consistent results
          maxTokens: 30,    // Only need a short response
          fallbackMessage: attempts < maxAttempts ? null : "Title Generation Failed" // Only use fallback on last attempt
        });

        // --- FIX: If response is an object, extract .content ---
        let rawTitle = response;
        if (typeof response === 'object' && response !== null && 'content' in response) {
          rawTitle = response.content;
        }
        // Clean up the response
        title = cleanupTitle(rawTitle);
        
        // If still not valid after cleanup, try again with a modified prompt
        if (!isValidTitle(title) && attempts < maxAttempts) {
          // For the second attempt, add a follow-up prompt for clarity
          if (attempts === 1) {
            prompt.push(generateFollowUpPrompt());
          } 
          // For the third attempt, completely refresh the prompt with more explicit instructions
          else if (attempts === 2) {
            // Create a new prompt with more explicit instructions
            prompt.length = 0; // Clear the array
            prompt.push({
              role: 'system',
              content: `Generate a VERY SHORT title (2-5 words only) for this conversation. 
NO explanations. NO quotes. ONLY the title itself. Be extremely concise.
Examples of good titles: "Database Migration Issue", "Python Loop Optimization", "React State Management"`
            });
            prompt.push({
              role: 'user',
              content: `Title for: "${truncatedMessage}"`
            });
          }
        }
      } catch (error) {
        console.warn(`Title generation attempt ${attempts} failed:`, error);
      }
    }
    
    // If we still don't have a valid title after all attempts, use fallback methods
    if (!isValidTitle(title)) {
      // Try to use extracted keywords as a fallback
      if (keywords.length > 0) {
        title = toTitleCase(keywords.slice(0, 3).join(' '));
      } else {
        // Last resort: use a truncated version of the message
        const words = truncatedMessage.split(' ').slice(0, 5).join(' ');
        title = toTitleCase(words);
      }
    }
    
    // Final validation and cleanup to ensure the title is presentable
    title = cleanupTitle(title);
    
    if (isValidTitle(title)) {
      console.log(`Generated title: "${title}" after ${attempts} attempts`);
      return title;
    }
    
    console.warn('Failed to generate a valid title, using default');
    return options.defaultTitle || 'New Conversation';
  } catch (error) {
    console.warn('Error generating conversation title:', error);
    return options.defaultTitle || 'New Conversation';
  }
};

/**
 * Generate a title for a conversation based on multiple messages
 * Useful when the conversation has progressed and a more accurate title can be created
 * 
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - The generated title
 */
export const generateTitleFromConversation = async (messages, options = {}) => {
  const model = 'llama3.2:1b'; // Hardcode the model to Llama 3.2
  try {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return options.defaultTitle || 'New Conversation';
    }
    
    // Extract user messages for better context
    const userMessages = messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n\n')
      .substring(0, 500); // Limit to 500 chars to keep prompt size reasonable
    
    // If no user messages, fall back to the first message
    if (!userMessages || userMessages.trim().length === 0) {
      const firstMessage = messages[0].content || '';
      return generateConversationTitle(firstMessage, model, options);
    }
    
    // Generate title based on the combined user messages
    return generateConversationTitle(userMessages, model, options);
  } catch (error) {
    console.warn('Error generating title from conversation:', error);
    return options.defaultTitle || 'New Conversation';
  }
};
