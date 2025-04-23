import React from 'react';
import { useNavigation, ROUTES } from '../../contexts/NavigationContext';
import './Navigation.css';

/**
 * Navigation component
 * Provides a simple, consistent navigation interface that works with the existing pattern
 */
const Navigation = ({ showLabels = true }) => {
  const { currentRoute, navigateTo } = useNavigation();

  return (
    <nav className="app-navigation">
      <ul className="nav-list">
        <li className={`nav-item ${currentRoute === ROUTES.CHAT ? 'active' : ''}`}>
          <button 
            className="nav-button"
            onClick={() => navigateTo(ROUTES.CHAT)}
            aria-label="Chat"
          >
            <span className="nav-icon">💬</span>
            {showLabels && <span className="nav-label">Chat</span>}
          </button>
        </li>
        <li className={`nav-item ${currentRoute === ROUTES.SETTINGS ? 'active' : ''}`}>
          <button 
            className="nav-button"
            onClick={() => navigateTo(ROUTES.SETTINGS)}
            aria-label="Settings"
          >
            <span className="nav-icon">⚙️</span>
            {showLabels && <span className="nav-label">Settings</span>}
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
