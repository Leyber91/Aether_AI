/**
 * Base API Service
 * Provides common functionality for API requests, including:
 * - Retry logic
 * - Error handling
 * - Request timeouts
 * - URL fallback mechanism
 */

import axios from 'axios';

// Default configuration
const DEFAULT_CONFIG = {
  MAX_RETRIES: 2,
  RETRY_DELAY: 500,
  API_TIMEOUT: 100000
};

/**
 * Sleep function for implementing delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the specified time
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make API request with retry logic
 * @param {Object} options - Request configuration
 * @param {Array<string>} options.urls - Array of URLs to try in order of preference
 * @param {string} options.method - HTTP method (get, post, etc.)
 * @param {Object} options.data - Request data/body
 * @param {Object} options.params - URL parameters (for GET requests)
 * @param {number} options.timeout - Request timeout in ms
 * @param {number} options.maxRetries - Maximum retry attempts
 * @param {number} options.retryDelay - Delay between retries in ms
 * @param {Function} options.onSuccess - Optional callback for successful requests
 * @param {Function} options.onError - Optional callback for failed requests
 * @param {AbortSignal} options.signal - Optional AbortController signal
 * @returns {Promise<Object>} - API response
 */
export const makeRequest = async ({
  urls,
  method = 'post',
  data = {},
  params = {},
  timeout = DEFAULT_CONFIG.API_TIMEOUT,
  maxRetries = DEFAULT_CONFIG.MAX_RETRIES,
  retryDelay = DEFAULT_CONFIG.RETRY_DELAY,
  onSuccess,
  onError,
  signal
}) => {
  if (!urls || !urls.length) {
    throw new Error('No URLs provided for API request');
  }

  let lastError = null;

  // Try each URL with retries
  for (const url of urls) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Attempting ${method.toUpperCase()} request to ${url} (attempt ${attempt + 1}/${maxRetries})`);
        
        const requestConfig = {
          timeout,
          signal,
          ...(method.toLowerCase() === 'get' ? { params } : {})
        };
        
        let response;
        if (method.toLowerCase() === 'get') {
          response = await axios.get(url, requestConfig);
        } else {
          response = await axios.post(url, data, requestConfig);
        }
        
        // Call success callback if provided
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(url, response);
        }
        
        return response;
      } catch (error) {
        console.error(`Request to ${url} failed (attempt ${attempt + 1}/${maxRetries}):`, error.message);
        lastError = error;
        
        // Call error callback if provided
        if (onError && typeof onError === 'function') {
          onError(url, error, attempt);
        }
        
        // Check for cancellation
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          throw error; // Don't retry canceled requests
        }
        
        // Check if server unreachable
        if (error.code === 'ECONNREFUSED' || error.response?.status === 502 || error.response?.status === 503) {
          console.warn(`Server at ${url} appears to be down or overloaded`);
          break; // No need for multiple retries on connection refused - move to next URL
        }
        
        // Wait before retry (skip delay on last attempt)
        if (attempt < maxRetries - 1) {
          await sleep(retryDelay);
        }
      }
    }
  }
  
  // All attempts failed
  throw lastError || new Error('API request failed for all provided URLs');
};

/**
 * Create a standardized error handler
 * @param {string} serviceName - Name of service for error context
 * @returns {Function} - Error handler function
 */
export const createErrorHandler = (serviceName) => {
  return (error) => {
    const errorMessage = error.response?.data?.error?.message || 
                         error.response?.data?.message || 
                         error.message || 
                         'Unknown error';
                         
    console.error(`${serviceName} error:`, errorMessage);
    
    return {
      error: true,
      message: `${serviceName} error: ${errorMessage}`,
      status: error.response?.status || 'NETWORK_ERROR',
      original: error
    };
  };
};