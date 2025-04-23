/**
 * Utility functions for local storage operations
 * Handles saving and retrieving data with expiration
 */

/**
 * Save data to localStorage with expiration
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 * @param {number} expirationHours - Hours until data expires (optional)
 */
export const saveToStorage = (key, data, expirationHours = null) => {
  try {
    const item = {
      data,
      timestamp: new Date().getTime(),
    };
    
    // Add expiration if provided
    if (expirationHours) {
      item.expiration = expirationHours * 60 * 60 * 1000; // Convert hours to milliseconds
    }
    
    localStorage.setItem(key, JSON.stringify(item));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Get data from localStorage, respecting expiration
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found or expired
 * @returns {any} The stored data or defaultValue
 */
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const storedItem = localStorage.getItem(key);
    if (!storedItem) return defaultValue;
    
    const item = JSON.parse(storedItem);
    
    // Check if data has expired
    if (item.expiration) {
      const now = new Date().getTime();
      const expiresAt = item.timestamp + item.expiration;
      
      if (now > expiresAt) {
        localStorage.removeItem(key); // Clean up expired data
        return defaultValue;
      }
    }
    
    return item.data;
  } catch (error) {
    console.error(`Error retrieving from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Clear all data from localStorage
 */
export const clearStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};
