/**
 * Token usage tracking module
 * Provides functions to track, monitor, and limit token usage for Groq models
 */

import { initializeTokenUsage, updateModelUsage } from './tracker';
import { getTokenUsageStats, getModelLimits } from './statistics';
import { checkUsageLimits } from './limits';

/**
 * Track token usage for a specific model
 * @param {string} modelId - The Groq model ID
 * @param {Object} usage - The usage object from Groq API
 * @returns {Object} Updated usage statistics
 */
export const trackTokenUsage = (modelId, usage) => {
  if (!modelId || !usage) return null;
  
  const totalTokens = usage.total_tokens || 0;
  if (totalTokens === 0) return null;
  
  // Get current usage data
  const usageData = initializeTokenUsage();
  
  // Update the usage statistics
  const updatedData = updateModelUsage(usageData, modelId, totalTokens);
  
  // Create and return formatted output data
  const stats = getTokenUsageStats(modelId);
  
  return {
    model: modelId,
    daily: stats.daily,
    minute: stats.minute,
    lastUsage: usage
  };
};

// Export all public API functions
export {
  initializeTokenUsage,
  getTokenUsageStats,
  getModelLimits,
  checkUsageLimits
};
