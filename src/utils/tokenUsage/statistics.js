import { GROQ_MODELS } from '../groqModels';
import { DEFAULT_LIMITS } from './constants';
import { initializeTokenUsage } from './tracker';

/**
 * Get the current token usage statistics
 * @param {string} modelId - Optional model ID to filter stats
 * @returns {Object} Usage statistics
 */
export const getTokenUsageStats = (modelId = null) => {
  const usageData = initializeTokenUsage();
  
  if (modelId) {
    // Return stats for a specific model
    return {
      model: modelId,
      daily: {
        requests: usageData.daily.requests[modelId] || 0,
        tokens: usageData.daily.tokens[modelId] || 0
      },
      minute: {
        requests: usageData.minute.requests[modelId] || 0,
        tokens: usageData.minute.tokens[modelId] || 0
      }
    };
  }
  
  // Return stats for all models
  const allModels = {};
  const modelIds = [...new Set([
    ...Object.keys(usageData.daily.requests),
    ...Object.keys(usageData.minute.requests)
  ])];
  
  modelIds.forEach(id => {
    allModels[id] = {
      daily: {
        requests: usageData.daily.requests[id] || 0,
        tokens: usageData.daily.tokens[id] || 0
      },
      minute: {
        requests: usageData.minute.requests[id] || 0,
        tokens: usageData.minute.tokens[id] || 0
      }
    };
  });
  
  return {
    date: usageData.daily.date,
    minute: usageData.minute.minute,
    models: allModels
  };
};

/**
 * Get usage limits for a Groq model
 * @param {string} modelId - The Groq model ID
 * @returns {Object} Model limits
 */
export const getModelLimits = (modelId) => {
  const model = GROQ_MODELS.find(m => m.id === modelId);
  
  if (!model) {
    return DEFAULT_LIMITS;
  }
  
  return {
    requestsPerMinute: model.requestsPerMinute,
    requestsPerDay: model.requestsPerDay,
    tokensPerMinute: model.tokensPerMinute,
    tokensPerDay: model.tokensPerDay || -1 // -1 means unlimited
  };
};

/**
 * Calculate percentage usage of a limit
 * @param {number} used - Amount used
 * @param {number} limit - Total limit
 * @returns {number} - Percentage used (0-100)
 */
export const calculateUsagePercent = (used, limit) => {
  if (limit === -1) return 0; // No limit
  return Math.round((used / limit) * 100);
};

/**
 * Calculate detailed limit status for a specific metric
 * @param {number} used - Current usage
 * @param {number} limit - Usage limit
 * @returns {Object} - Detailed limit status
 */
const calculateLimitStatus = (used, limit) => {
  const limited = limit !== -1 && used >= limit;
  return {
    limited,
    used,
    limit,
    percent: calculateUsagePercent(used, limit)
  };
};
