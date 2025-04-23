/**
 * Consolidated Ollama Service
 * Re-exports functionality from ollamaService.js for better organization
 * while maintaining backward compatibility
 */

import {
  getAllOllamaModels,
  sendMessageToOllama,
  isOllamaRunning
} from '../ollamaService';

// Constants for model IDs to ensure consistency across the app
export const OLLAMA_MODELS = {
  GENERAL: 'llama3.2:16b',
  TITLE_GEN: 'llama3.2:1b',
  AUTOCOMPLETE: 'llama3.2:1b'
};

// Re-export core functionality from ollamaService
export { 
  getAllOllamaModels,
  sendMessageToOllama,
  isOllamaRunning
};

// Enhanced API functions needed by useOllamaEnhancements
export const getTextCompletions = async (text, options = {}) => {
  const messages = [{ role: 'user', content: text }];
  return sendMessageToOllama(options.model || OLLAMA_MODELS.AUTOCOMPLETE, messages, {
    maxTokens: options.maxTokens || 20,
    temperature: 0.3,
    onUpdate: options.onUpdate,
    onError: options.onError
  });
};

export const smartQueryRouter = async (message, options = {}) => {
  // Simple implementation that just returns the message without enhancement
  return {
    modelId: OLLAMA_MODELS.GENERAL,
    enhancedPrompt: message
  };
};

export const getOllamaSystemInfo = async () => {
  const isRunning = await isOllamaRunning();
  const models = isRunning ? await getAllOllamaModels() : [];
  
  return {
    isRunning,
    models,
    version: "Unknown", // This could be enhanced to fetch from actual API if needed
    status: isRunning ? "running" : "stopped"
  };
};

export const getSuggestions = async (text, options = {}) => {
  return getTextCompletions(text, {
    ...options,
    model: options.model || OLLAMA_MODELS.AUTOCOMPLETE
  });
};

// Default export for ES modules
export default {
  getAllOllamaModels,
  sendMessageToOllama,
  isOllamaRunning,
  getTextCompletions,
  smartQueryRouter,
  getOllamaSystemInfo,
  getSuggestions,
  OLLAMA_MODELS
};
