import React from 'react';
import { useNavigation, ROUTES } from '../../contexts/NavigationContext';
import './BackButton.css';

/**
 * BackButton component
 * A simple back button that appears on non-chat screens and helps users
 * navigate back to the main chat interface
 */
const BackButton = () => {
  const { navigateTo, currentRoute } = useNavigation();
  
  // Only show back button when not on chat screen
  if (currentRoute === ROUTES.CHAT) {
    return null;
  }
  
  return (
    <button 
      className="back-button"
      onClick={() => navigateTo(ROUTES.CHAT)}
      aria-label="Back to chat"
    >
      <span className="back-icon">←</span>
      <span className="back-text">Back to Chat</span>
    </button>
  );
};

export default BackButton;
