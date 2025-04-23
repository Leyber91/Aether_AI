/**
 * Constants related to token usage tracking
 */

// Storage keys for persistence
export const STORAGE_KEYS = {
  DAILY_USAGE: 'groq_daily_usage',
  MINUTE_USAGE: 'groq_minute_usage'
};

// Default expiration times (in hours)
export const EXPIRATION = {
  DAILY: 24,          // Daily usage expires after 24 hours
  MINUTE: 1/60        // Minute usage expires after 1 minute
};

// Default limits if model-specific ones aren't available
export const DEFAULT_LIMITS = {
  requestsPerMinute: 30,
  requestsPerDay: 1000,
  tokensPerMinute: 6000,
  tokensPerDay: 100000
};
