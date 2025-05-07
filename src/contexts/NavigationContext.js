import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * NavigationContext
 * Manages the application's navigation state without introducing
 * significant architectural changes to the existing codebase.
 * This approach enhances the current state toggle system rather than replacing it.
 * 
 * Enhancements include URL hash-based routing to enable shareable links and 
 * browser history navigation.
 */

// Define available routes/screens in the application
export const ROUTES = {
  CHAT: 'chat',
  SETTINGS: 'settings',
  LOGIN: 'login',
  CANVAS: 'canvas', // Aether Canvas tab
  VISION: 'vision', // Vision tab for canvas vision and opportunities
  META_LOOP_LAB: 'meta_loop_lab', // Experimental self-dialogue playground
};

// Create the navigation context
const NavigationContext = createContext();

// NavigationProvider component
export const NavigationProvider = ({ children }) => {
  // Initialize route from URL hash if present, otherwise default to CHAT
  const initialRoute = () => {
    // Get route from URL hash (e.g., #settings)
    const hash = window.location.hash.replace('#', '');
    // Check if hash matches a valid route
    return Object.values(ROUTES).includes(hash) ? hash : ROUTES.CHAT;
  };

  const [currentRoute, setCurrentRoute] = useState(initialRoute());
  const [navigationHistory, setNavigationHistory] = useState([initialRoute()]);

  // Sync route with URL hash
  useEffect(() => {
    // Update hash when route changes
    window.location.hash = currentRoute;
    
    // Listen for hash changes in the browser
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (Object.values(ROUTES).includes(hash) && hash !== currentRoute) {
        setCurrentRoute(hash);
        setNavigationHistory(prev => [...prev, hash]);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentRoute]);

  // Navigate to a specific route
  const navigateTo = (route) => {
    if (route !== currentRoute) {
      setCurrentRoute(route);
      // Update history
      setNavigationHistory(prev => [...prev, route]);
    }
  };

  // Go back to previous route
  const goBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current route
      const previousRoute = newHistory[newHistory.length - 1];
      
      setCurrentRoute(previousRoute);
      setNavigationHistory(newHistory);
      return true;
    }
    return false;
  };

  return (
    <NavigationContext.Provider
      value={{
        currentRoute,
        navigateTo,
        goBack,
        routes: ROUTES,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

// Custom hook for using navigation
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export default NavigationContext;
