/**
 * Groq Service
 * Handles communication with Groq API
 */

import axios from 'axios';
import config from '../config.js';
import { createErrorHandler } from './api/baseApiService.js';
import { trimMessagesToTokenLimit } from './tokenEstimate.js';

// Get the Groq API URL from config
const GROQ_API_URL = config.groqApiUrl;

// Error handler specific to Groq service
const handleGroqApiError = createErrorHandler('Groq API');

/**
 * Format messages for Groq API (which uses OpenAI-compatible format)
 * @param {Array} messages - Raw messages from the conversation
 * @returns {Array} Formatted messages for the API
 */
const formatMessagesForGroqAPI = (messages) => {
  if (!messages || messages.length === 0) {
    console.error('No messages to format for Groq API');
    // Add a default system message to avoid the "minimum number of items is 1" error
    return [{
      role: 'system',
      content: 'You are a helpful assistant.'
    }];
  }
  
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

/**
 * Send a message to a Groq model
 * @param {string} modelId - The ID of the model to use
 * @param {Array} messages - Array of message objects with role and content
 * @param {Function} updateTokenUsage - Function to update token usage tracking
 * @returns {Promise<Object>} The model's response and usage information
 */
export const sendMessageToGroq = async (modelId, messages, updateTokenUsage) => {
  try {
    // Check for empty messages array
    if (!messages || messages.length === 0) {
      console.warn('Empty messages array passed to sendMessageToGroq');
      return {
        content: "I'm sorry, I didn't receive any messages to process.",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }
    
    // Get API key from config
    const apiKey = config.groqApiKey;
    
    // Check for API key
    if (!apiKey) {
      return {
        content: "Groq API key is not set. Please set REACT_APP_GROQ_API_KEY in your .env file and restart the server.",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    // Before formatting, trim messages to fit token limit for Groq
    const MAX_GROQ_TOKENS = 6000; // Safe for all Groq models, can make dynamic if needed
    const trimmedMessages = trimMessagesToTokenLimit(messages, MAX_GROQ_TOKENS);
    // Format messages for Groq API
    const formattedMessages = formatMessagesForGroqAPI(trimmedMessages);
    
    // Log message count for debugging (not content for privacy)
    console.log(`Sending ${formattedMessages.length} messages to Groq model: ${modelId}`);

    const response = await axios.post(
      `${GROQ_API_URL}/chat/completions`, 
      {
        model: modelId,
        messages: formattedMessages,
        temperature: 0.7
        // Remove max_tokens and max_completion_tokens to let Groq use the largest possible value (subject to context window)
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Check for valid response
    if (!response || !response.data) {
      console.error('Invalid response format from Groq: No data returned');
      return {
        content: "I received an invalid response from the server. Please try again.",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    // Log the full Groq API response for debugging
    console.log('[GroqService] Full API response:', JSON.stringify(response.data, null, 2));

    // Process successful response
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      // Update token usage if the function is provided
      if (updateTokenUsage && response.data.usage) {
        updateTokenUsage(modelId, response.data.usage);
      }

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    } else {
      console.error('Invalid response structure from Groq:', response.data);
      return {
        content: "I received an unexpected response format. Please try again.",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }
  } catch (error) {
    // Get friendly error info
    const errorInfo = handleGroqApiError(error);

    // Detect Groq rate limit error for tokens per minute (TPM)
    const isTPMLimit = errorInfo.message && errorInfo.message.includes('Rate limit reached for model') && errorInfo.message.includes('tokens per minute');
    let waitSeconds = null;
    if (isTPMLimit) {
      // Try to extract wait time from message (e.g., 'Please try again in 29.269s')
      const match = errorInfo.message.match(/try again in (\d+(?:\.\d+)?)s/);
      if (match) {
        waitSeconds = parseFloat(match[1]);
      }
    }

    if (isTPMLimit) {
      return {
        content: waitSeconds
          ? `Groq API rate limit reached. Please wait ${waitSeconds.toFixed(1)} seconds before sending another request.`
          : `Groq API rate limit reached. Please wait a moment before sending another request.`,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        error: true,
        groqRateLimit: true,
        waitSeconds
      };
    }

    // Return a response object with the error message
    return {
      content: `I'm sorry, I encountered an error: ${errorInfo.message || 'Unknown error'}`,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      error: true
    };
  }
};