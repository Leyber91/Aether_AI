import React from 'react';
import './App.css';
import ChatInterface from './components/Chat/ChatInterface';
import AppProvider from './contexts/AppContext';
import { useNavigation, ROUTES } from './contexts/NavigationContext';
import Settings from './components/settings/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import AppHeader from './components/common/AppHeader';
import SystemCheckWizard from './components/SystemCheckWizard';

/**
 * Main application component
 * Renders the appropriate screen based on navigation state and authentication
 */
const MainContent = () => {
  const { currentRoute, navigateTo } = useNavigation();
  const { user, loading } = useAuth();

  // Show nothing while auth is loading
  if (loading) return null;

  // Show login page if not authenticated or explicitly on login route
  if (!user || currentRoute === ROUTES.LOGIN) {
    return <LoginPage onAuthSuccess={() => navigateTo(ROUTES.CHAT)} />;
  }

  return (
    <>
      <AppHeader />
      <main>
        {currentRoute === ROUTES.SETTINGS ? (
          <Settings />
        ) : currentRoute === ROUTES.VISION ? (
          require('./components/VisionTab').default ? React.createElement(require('./components/VisionTab').default) : null
        ) : currentRoute === ROUTES.CANVAS ? (
          require('./components/AetherCanvas/AetherCanvas').default ? React.createElement(require('./components/AetherCanvas/AetherCanvas').default) : null
        ) : (
          <ChatInterface />
        )}
      </main>
    </>
  );
};

/**
 * App component with context providers
 */
function App() {
  const [showWizard, setShowWizard] = React.useState(() => {
    // Show wizard only on first launch or if not passed
    return !localStorage.getItem('systemCheckPassed');
  });
  const handleWizardComplete = () => {
    localStorage.setItem('systemCheckPassed', '1');
    setShowWizard(false);
  };
  return (
    <div className="App space-bg">
      <AuthProvider>
        <AppProvider>
          {showWizard && <SystemCheckWizard onComplete={handleWizardComplete} />}
          {!showWizard && <MainContent />}
        </AppProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
