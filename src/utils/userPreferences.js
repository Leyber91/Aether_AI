/**
 * User preferences utilities
 * Manages user preferences for application features and behavior
 */

// Default preferences
const DEFAULT_PREFERENCES = {
  // Ollama enhancements
  enableAutoSuggestions: true,
  enablePromptEnhancement: true,
  enableDynamicModelSelection: true,
  maxSuggestionsLength: 30,
  
  // UI preferences
  showModelInsights: true,
  debugMode: false
};

/**
 * Load user preferences from localStorage
 * @returns {Object} User preferences
 */
export const loadUserPreferences = () => {
  try {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(savedPreferences) };
    }
    return { ...DEFAULT_PREFERENCES };
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return { ...DEFAULT_PREFERENCES };
  }
};

/**
 * Save user preferences to localStorage
 * @param {Object} preferences - User preferences to save
 */
export const saveUserPreferences = (preferences) => {
  try {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

/**
 * Update a single user preference
 * @param {string} key - Preference key to update
 * @param {any} value - New preference value
 */
export const updateUserPreference = (key, value) => {
  try {
    const preferences = loadUserPreferences();
    preferences[key] = value;
    saveUserPreferences(preferences);
    return preferences;
  } catch (error) {
    console.error('Error updating user preference:', error);
    return loadUserPreferences();
  }
};

/**
 * Create a context for user preferences
 * Initializes with default preferences and provides update functions
 */
export const createUserPreferencesContext = () => {
  const preferences = loadUserPreferences();
  
  return {
    preferences,
    updatePreference: updateUserPreference,
    resetPreferences: () => saveUserPreferences(DEFAULT_PREFERENCES)
  };
};
