import React from 'react';
import { ChatProvider } from './ChatContext';
import { ModelProvider } from './ModelContext';
import { UserPreferencesProvider } from './UserPreferencesContext';
import { NavigationProvider } from './NavigationContext';

const AppProvider = ({ children }) => {
  return (
    <UserPreferencesProvider>
      <ModelProvider>
        <ChatProvider>
          <NavigationProvider>
            {children}
          </NavigationProvider>
        </ChatProvider>
      </ModelProvider>
    </UserPreferencesProvider>
  );
};

export default AppProvider;
