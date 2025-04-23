/**
 * Utility functions for calculating usage metrics and status classes for UsageTracker
 * Extracted from UsageTracker.js for modularity and testability.
 */

/**
 * Calculate metrics from raw stats and limits
 * @param {Object} stats
 * @param {Object} limits
 * @returns {Object|null}
 */
export const calculateUsageMetrics = (stats, limits) => {
  if (!stats || !limits) return null;

  // Calculate the usage percentages
  const minuteRequestsPercent = 
    Math.min(100, Math.round((stats.minute.requests / limits.requestsPerMinute) * 100)) || 0;
  const dailyTokensPercent = 
    Math.min(100, Math.round((stats.daily.tokens / limits.tokensPerDay) * 100)) || 0;

  // Get status classes based on usage percentages
  const getStatusClass = (percent) => {
    if (percent >= 90) return 'usage-red';
    if (percent >= 70) return 'usage-yellow';
    return 'usage-green';
  };

  const requestsClass = getStatusClass(minuteRequestsPercent);
  const tokensClass = getStatusClass(dailyTokensPercent);

  return {
    minuteRequestsPercent,
    dailyTokensPercent,
    requestsClass,
    tokensClass,
    stats,
    limits
  };
};
