/**
 * Utility functions for API calls and other common operations
 */

/**
 * Format chat messages for API requests
 * @param {Array} messages - Array of message objects
 * @returns {Array} Formatted messages
 */
export const formatMessages = (messages) => {
  return messages.map(message => ({
    role: message.role,
    content: message.content
  }));
};

/**
 * Create error handler for API calls
 * @param {string} serviceName - Name of the service
 * @returns {Function} Error handler function
 */
export const createErrorHandler = (serviceName) => {
  return (error) => {
    console.error(`Error in ${serviceName}:`, error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return `${serviceName} error (${error.response.status}): ${
        error.response.data?.error?.message || 
        error.response.data?.message || 
        'Unknown error'
      }`;
    } else if (error.request) {
      // The request was made but no response was received
      return `No response received from ${serviceName}. Check your connection.`;
    } else {
      // Something happened in setting up the request that triggered an Error
      return `${serviceName} error: ${error.message}`;
    }
  };
};
