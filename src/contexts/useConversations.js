import { useState, useEffect } from 'react';
import { 
  createNewConversation, 
  findConversationById,
  deleteConversationById
} from './utils/conversationHelpers';
import { 
  fetchConversations as apiFetchConversations,
  fetchConversation as apiFetchConversation,
  saveConversation as apiSaveConversation,
  deleteConversation as apiDeleteConversation
} from '../api/apiService';

/**
 * Custom hook for conversation state and management
 * Handles loading, saving, creating, and setting active conversations
 * Only orchestration/state logic here; helpers in conversationHelpers.js
 */
// --- Backend API helpers ---
async function fetchConversationsFromAPI() {
  try {
    return await apiFetchConversations();
  } catch (e) {
    console.error('[fetchConversationsFromAPI] Error:', e);
    return [];
  }
}
async function fetchConversationById(id) {
  try {
    return await apiFetchConversation(id);
  } catch (e) {
    console.error(`[fetchConversationById] Error fetching ${id}:`, e);
    throw new Error('Not found');
  }
}
async function saveConversationToAPI(id, conversation) {
  return await apiSaveConversation(id, conversation);
}
async function deleteConversationFromAPI(id) {
  return await apiDeleteConversation(id);
}

export function useConversations(initialModel, initialProvider) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- MIGRATION: Move from localStorage to backend on first load ---
  useEffect(() => {
    async function migrateAndLoad() {
      const ls = localStorage.getItem('conversations');
      let migrated = false;
      if (ls) {
        try {
          const arr = JSON.parse(ls);
          for (const conv of arr) {
            await saveConversationToAPI(conv.id, conv);
          }
          localStorage.removeItem('conversations');
          migrated = true;
        } catch (e) { /* ignore */ }
      }
      // After migration, load from backend
      const files = await fetchConversationsFromAPI();
      const loaded = [];
      for (const fname of files) {
        const id = fname.replace(/\.json$/, '');
        try {
          loaded.push(await fetchConversationById(id));
        } catch (e) {}
      }
      setConversations(loaded);
      setLoading(false);
    }
    migrateAndLoad();
  }, []);

  // Save conversation to backend on change
  useEffect(() => {
    if (!loading) {
      for (const conv of conversations) {
        saveConversationToAPI(conv.id, conv);
      }
    }
  }, [conversations, loading]);

  // Create a new conversation
  const createConversation = (title = 'New Conversation') => {
    const newConversation = createNewConversation(title, initialModel, initialProvider);
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newConversation.id);
    // Immediately persist new conversation
    saveConversationToAPI(newConversation.id, newConversation);
    return newConversation;
  };

  // Set active conversation by id
  const setActiveConversationById = (conversationId) => {
    const found = findConversationById(conversations, conversationId);
    if (found) {
      setActiveConversation(found.id);
    }
  };

  // Delete a conversation
  const deleteConversation = (conversationId) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    deleteConversationFromAPI(conversationId);
    if (activeConversation === conversationId) {
      setActiveConversation(conversations.length > 1 ? conversations[0].id : null);
    }
  };

  return {
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    createConversation,
    setActiveConversationById,
    deleteConversation,
    loading
  };
}
