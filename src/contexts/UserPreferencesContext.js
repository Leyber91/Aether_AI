import React, { createContext, useState, useEffect } from 'react';
import { loadUserPreferences, saveUserPreferences } from '../utils/userPreferences';

// Create the context
export const UserPreferencesContext = createContext();

/**
 * UserPreferencesProvider Component
 * Provides access to user preferences throughout the application
 */
export const UserPreferencesProvider = ({ children }) => {
  // Load initial preferences
  const [preferences, setPreferences] = useState(loadUserPreferences());

  // Update a single preference
  const updatePreference = (key, value) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, [key]: value };
      saveUserPreferences(newPreferences);
      return newPreferences;
    });
  };

  // Reset all preferences to defaults
  const resetPreferences = () => {
    const defaultPreferences = loadUserPreferences(); // This loads defaults if no saved prefs
    saveUserPreferences(defaultPreferences);
    setPreferences(defaultPreferences);
  };

  // Provide the context value
  const contextValue = {
    preferences,
    updatePreference,
    resetPreferences
  };

  return (
    <UserPreferencesContext.Provider value={contextValue}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

// Custom hook to use the preferences context
export const useUserPreferences = () => {
  const context = React.useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
