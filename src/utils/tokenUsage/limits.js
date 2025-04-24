import { getTokenUsageStats, getModelLimits, calculateUsagePercent } from './statistics.js';

/**
 * Check if a model has reached its usage limits
 * @param {string} modelId - The Groq model ID
 * @returns {Object} Limit status
 */
export const checkUsageLimits = (modelId) => {
  const stats = getTokenUsageStats(modelId);
  const limits = getModelLimits(modelId);
  
  const minuteRequestsLimited = stats.minute.requests >= limits.requestsPerMinute;
  const dailyRequestsLimited = stats.daily.requests >= limits.requestsPerDay;
  const minuteTokensLimited = stats.minute.tokens >= limits.tokensPerMinute;
  const dailyTokensLimited = limits.tokensPerDay !== -1 && stats.daily.tokens >= limits.tokensPerDay;
  
  return {
    model: modelId,
    limited: minuteRequestsLimited || dailyRequestsLimited || minuteTokensLimited || dailyTokensLimited,
    limits: {
      minuteRequests: {
        limited: minuteRequestsLimited,
        used: stats.minute.requests,
        limit: limits.requestsPerMinute,
        percent: calculateUsagePercent(stats.minute.requests, limits.requestsPerMinute)
      },
      dailyRequests: {
        limited: dailyRequestsLimited,
        used: stats.daily.requests,
        limit: limits.requestsPerDay,
        percent: calculateUsagePercent(stats.daily.requests, limits.requestsPerDay)
      },
      minuteTokens: {
        limited: minuteTokensLimited,
        used: stats.minute.tokens,
        limit: limits.tokensPerMinute,
        percent: calculateUsagePercent(stats.minute.tokens, limits.tokensPerMinute)
      },
      dailyTokens: {
        limited: dailyTokensLimited,
        used: stats.daily.tokens,
        limit: limits.tokensPerDay,
        percent: calculateUsagePercent(stats.daily.tokens, limits.tokensPerDay)
      }
    }
  };
};
