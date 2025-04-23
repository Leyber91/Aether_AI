import React, { createContext, useContext } from 'react';
import { ModelContext } from './ModelContext';
import { useConversations } from './useConversations';
import { useTitleGeneration } from './useTitleGeneration';
import { useMessageHandlers } from './useMessageHandlers';
import {
  getConversationById,
  deleteConversationById,
  updateConversationTitleById,
  addMessageToConversationById
} from './utils/conversationHelpers';

// Create the context
export const ChatContext = createContext();

// Chat provider component
export const ChatProvider = ({ children }) => {
  // Get model context
  const { selectedModel, selectedProvider, updateTokenUsage, getCurrentModelUsage } = useContext(ModelContext);

  // Use modularized conversation hook
  const {
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    createConversation,
    setActiveConversationById
  } = useConversations(selectedModel, selectedProvider);

  // Use modularized title generation hook
  const {
    isTitleGenerating,
    setIsTitleGenerating,
    titleGeneratingId,
    setTitleGeneratingId,
    generateTitle
  } = useTitleGeneration(getConversation, updateConversationTitle);

  // Loading, error, and usage state (keep local)
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [lastResponseUsage, setLastResponseUsage] = React.useState(null);

  // Use helpers for conversation operations
  function getConversation(conversationId) {
    return getConversationById(conversations, conversationId);
  }

  function deleteConversation(conversationId) {
    const { filtered, newActiveId } = deleteConversationById(conversations, conversationId);
    setConversations(filtered);
    if (activeConversation === conversationId) {
      setActiveConversation(newActiveId);
    }
  }

  function updateConversationTitle(conversationId, newTitle) {
    setConversations(prev => updateConversationTitleById(prev, conversationId, newTitle));
  }

  function addMessageToConversation(conversationId, message) {
    setConversations(prev => addMessageToConversationById(prev, conversationId, message));
  }

  function updateMessageInConversation(conversationId, messageId, updates) {
    setConversations(prev => {
      const conversation = getConversationById(prev, conversationId);
      if (!conversation) return prev;
      
      const updatedMessages = conversation.messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      
      return prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, messages: updatedMessages }
          : conv
      );
    });
  }

  // Use modularized message handler hook
  const { sendMessage } = useMessageHandlers({
    getConversation,
    addMessageToConversation,
    setConversations,
    updateMessageInConversation,
    updateTokenUsage,
    setLastResponseUsage,
    setIsLoading,
    setError,
    generateTitle
  });

  // Get active conversation data (complete object, not just the ID)
  function getActiveConversationData() {
    if (!activeConversation) return null;
    return getConversation(activeConversation);
  }

const conversationActions = {
  createConversation,
  deleteConversation,
  updateConversationTitle,
  setActiveConversationById,
  autoRenameConversation: async (conversationId) => {
    const conversation = getConversation(conversationId);
    if (!conversation || conversation.messages.length === 0) return false;
    const userMessages = conversation.messages.filter(m => m.role === 'user').slice(0, 3);
    if (userMessages.length > 0) {
      let contextMessage = userMessages[0].content;
      if (userMessages.length > 1) contextMessage = userMessages.map(m => m.content).join(' | ');
      return await generateTitle(conversationId, contextMessage, true);
    }
    return false;
  },
  triggerTitleGeneration: (conversationId, message) => generateTitle(conversationId, message, true)
};

const conversationState = {
  conversations,
  activeConversationId: activeConversation,
  isLoading,
  error,
  lastResponseUsage,
  isTitleGenerating,
  titleGeneratingId
};

const conversationHelpers = {
  getConversation,
  getActiveConversationData,
  sendMessage,
  addMessageToConversation,
  getCurrentModelUsage,
  updateMessageInConversation
};

return (
  <ChatContext.Provider value={{
    conversationState,
    conversationActions,
    conversationHelpers
  }}>
    {children}
  </ChatContext.Provider>
);
};
