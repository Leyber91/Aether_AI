import { saveToStorage, getFromStorage } from '../storage.js';
import { STORAGE_KEYS, EXPIRATION } from './constants.js';

/**
 * Generate date keys for current usage tracking
 * @returns {Object} Object containing date keys for daily and minute tracking
 */
export const generateDateKeys = () => {
  const now = new Date();
  const todayKey = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const minuteKey = `${todayKey}-${now.getHours()}-${now.getMinutes()}`; // YYYY-MM-DD-HH-MM format
  
  return {
    todayKey,
    minuteKey
  };
};

/**
 * Initialize daily usage data structure
 * @returns {Object} Initialized or retrieved daily usage data
 */
export const initializeDailyUsage = () => {
  const { todayKey } = generateDateKeys();
  
  // Get stored daily usage or initialize with default
  const dailyUsage = getFromStorage(STORAGE_KEYS.DAILY_USAGE, {
    date: todayKey,
    requests: {},
    tokens: {}
  });
  
  // If it's a new day, reset the counters
  if (dailyUsage.date !== todayKey) {
    dailyUsage.date = todayKey;
    dailyUsage.requests = {};
    dailyUsage.tokens = {};
  }
  
  // Persist the initialized data
  saveToStorage(STORAGE_KEYS.DAILY_USAGE, dailyUsage, EXPIRATION.DAILY);
  
  return dailyUsage;
};

/**
 * Initialize minute usage data structure
 * @returns {Object} Initialized or retrieved minute usage data
 */
export const initializeMinuteUsage = () => {
  const { minuteKey } = generateDateKeys();
  
  // Get stored minute usage or initialize with default
  const minuteUsage = getFromStorage(STORAGE_KEYS.MINUTE_USAGE, {
    minute: minuteKey,
    requests: {},
    tokens: {}
  });
  
  // If it's a new minute, reset the counters
  if (minuteUsage.minute !== minuteKey) {
    minuteUsage.minute = minuteKey;
    minuteUsage.requests = {};
    minuteUsage.tokens = {};
  }
  
  // Persist the initialized data
  saveToStorage(STORAGE_KEYS.MINUTE_USAGE, minuteUsage, EXPIRATION.MINUTE);
  
  return minuteUsage;
};

/**
 * Initialize and get token usage data
 * @returns {Object} Token usage data structure
 */
export const initializeTokenUsage = () => {
  return {
    daily: initializeDailyUsage(),
    minute: initializeMinuteUsage()
  };
};

/**
 * Update usage statistics for a model
 * @param {Object} usageData - Current usage data 
 * @param {string} modelId - The model ID to update
 * @param {number} tokens - Number of tokens to add
 * @returns {Object} Updated usage data
 */
export const updateModelUsage = (usageData, modelId, tokens) => {
  // Update daily usage
  if (!usageData.daily.requests[modelId]) {
    usageData.daily.requests[modelId] = 0;
    usageData.daily.tokens[modelId] = 0;
  }
  usageData.daily.requests[modelId]++;
  usageData.daily.tokens[modelId] += tokens;
  
  // Update minute usage
  if (!usageData.minute.requests[modelId]) {
    usageData.minute.requests[modelId] = 0;
    usageData.minute.tokens[modelId] = 0;
  }
  usageData.minute.requests[modelId]++;
  usageData.minute.tokens[modelId] += tokens;
  
  // Persist the updated data
  saveToStorage(STORAGE_KEYS.DAILY_USAGE, usageData.daily, EXPIRATION.DAILY);
  saveToStorage(STORAGE_KEYS.MINUTE_USAGE, usageData.minute, EXPIRATION.MINUTE);
  
  return usageData;
};
