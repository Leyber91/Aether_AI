/**
 * Performance optimization utilities
 * Provides helper functions to improve application performance
 * and prevent excessive API calls
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - The options object
 * @returns {Function} The debounced function
 */
export const debounce = (func, wait, options = {}) => {
  let timeout;
  return function(...args) {
    const context = this;
    const later = function() {
      timeout = null;
      if (!options.leading) func.apply(context, args);
    };
    const callNow = options.leading && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 * 
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @returns {Function} The throttled function
 */
export const throttle = (func, wait) => {
  let lastCall = 0;
  return function(...args) {
    const now = new Date().getTime();
    if (now - lastCall < wait) return;
    lastCall = now;
    return func.apply(this, args);
  };
};

/**
 * Creates a memoized function that caches results of previous calls
 * 
 * @param {Function} func - The function to memoize
 * @param {Function} resolver - Function to resolve the cache key
 * @returns {Function} The memoized function
 */
export const memoize = (func, resolver) => {
  const cache = new Map();
  return function(...args) {
    const key = resolver ? resolver.apply(this, args) : args[0];
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Creates a function that batches API calls
 * 
 * @param {Function} func - The API call function to batch
 * @param {number} delay - The delay in ms to wait before processing batch
 * @param {Function} processor - Function to process the batched items
 * @returns {Function} A function that adds items to the batch
 */
export const batchProcessor = (processor, delay = 200) => {
  let batch = [];
  let timeout = null;
  
  const processBatch = async () => {
    if (batch.length === 0) return;
    
    const currentBatch = [...batch];
    batch = [];
    
    try {
      await processor(currentBatch);
    } catch (error) {
      console.error('Error processing batch:', error);
      // Re-add failed items to the batch
      batch = [...batch, ...currentBatch];
    }
  };
  
  return (item) => {
    return new Promise((resolve, reject) => {
      batch.push({
        item,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      if (!timeout) {
        timeout = setTimeout(() => {
          timeout = null;
          processBatch();
        }, delay);
      }
    });
  };
};
