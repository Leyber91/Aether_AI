import { useState, useEffect } from 'react';
import { 
  createNewConversation, 
  findConversationById,
  deleteConversationById
} from './utils/conversationHelpers';

/**
 * Custom hook for conversation state and management
 * Handles loading, saving, creating, and setting active conversations
 * Only orchestration/state logic here; helpers in conversationHelpers.js
 */
export function useConversations(initialModel, initialProvider) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  // Load conversations from localStorage on initial load
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      try {
        setConversations(JSON.parse(savedConversations));
      } catch (e) {
        console.error('Error parsing saved conversations:', e);
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('conversations', JSON.stringify(conversations));
    } else {
      localStorage.removeItem('conversations');
    }
  }, [conversations]);

  // Create a new conversation (delegates to helper)
  const createConversation = (title = 'New Conversation') => {
    const newConversation = createNewConversation(title, initialModel, initialProvider);
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newConversation.id);
    return newConversation;
  };

  // Set active conversation by id (delegates to helper)
  const setActiveConversationById = (conversationId) => {
    const found = findConversationById(conversations, conversationId);
    if (found) {
      setActiveConversation(found.id);
    }
  };

  // Delete a conversation
  const deleteConversation = (conversationId) => {
    const { filtered, newActiveId } = deleteConversationById(conversations, conversationId);
    setConversations(filtered);
    if (activeConversation === conversationId) {
      setActiveConversation(newActiveId);
    }
  };

  return {
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    createConversation,
    setActiveConversationById,
    deleteConversation
  };
}
