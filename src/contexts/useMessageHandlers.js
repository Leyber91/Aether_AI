import { useCallback, useContext } from 'react';
import { createUserMessage, createAssistantMessage } from './utils/messageHandlers';
import { ModelContext } from './ModelContext';

/**
 * Custom hook for message handling logic
 * Provides functions for sending, adding, and processing messages in a conversation
 * Only orchestration/state logic here; helpers in messageHandlers.js
 */
export function useMessageHandlers({
  getConversation,
  addMessageToConversation,
  setConversations,
  updateTokenUsage,
  setLastResponseUsage,
  setIsLoading,
  setError,
  generateTitle
}) {
  const { selectedModel } = useContext(ModelContext);

  // Send a message to a conversation
  const sendMessage = useCallback(async (conversationId, content, options = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const conversation = getConversation(conversationId);
      if (!conversation) throw new Error('Conversation not found');
      
      // Log MCP state if present
      if (options && typeof options.mcpEnabled !== 'undefined') {
        console.log('[useMessageHandlers] MCP enabled:', options.mcpEnabled);
      }
      
      const userMessage = createUserMessage(content);
      addMessageToConversation(conversationId, userMessage);

      const messages = [...(conversation.messages || []), userMessage];
      const assistantMsgId = crypto.randomUUID();
      const initialAssistantMessage = createAssistantMessage('', null, { partial: true });
      addMessageToConversation(conversationId, { ...initialAssistantMessage, id: assistantMsgId });

      if (typeof setConversations !== 'function') {
        console.error('setConversations is not a function:', setConversations);
        setError('Internal error: Invalid state update function');
        return;
      }

      // Use processModelMessage to route based on conversation.provider/modelId
      const { processModelMessage } = await import('./utils/messageHandlers');
      
      // Create a callback with guard clause to prevent unnecessary re-renders
      const handleStreamUpdate = ({ content: partialContent, thinking, partial }) => {
        // Only update state if we actually have new content to show
        if (partialContent || thinking !== undefined) {
          setConversations(prev => {
            if (!Array.isArray(prev)) return prev;
            return prev.map(conv => {
              if (conv.id !== conversationId) return conv;
              const updatedMessages = conv.messages.map(msg => {
                if (msg.id === assistantMsgId) {
                  return {
                    ...msg,
                    content: partialContent ?? msg.content,
                    thinking: thinking ?? msg.thinking,
                    partial: partial !== undefined ? partial : true
                  };
                }
                return msg;
              });
              return { ...conv, messages: updatedMessages };
            });
          });
        }
      };
      
      // Streaming: update the assistant message as partials arrive
      await processModelMessage(
        // Pass MCP enabled flag as part of conversation if needed
        options && typeof options.mcpEnabled !== 'undefined'
          ? { ...conversation, mcpEnabled: options.mcpEnabled }
          : conversation,
        content,
        messages,
        updateTokenUsage,
        setLastResponseUsage,
        handleStreamUpdate
      ).then(response => {
        // Update assistant message with the final response
        setConversations(prev => {
          if (!Array.isArray(prev)) return prev;
          return prev.map(conv => {
            if (conv.id !== conversationId) return conv;
            const updatedMessages = conv.messages.map(msg => {
              if (msg.id === assistantMsgId) {
                return { ...msg, content: response.content, usage: response.usage || null, thinking: response.thinking, partial: false };
              }
              return msg;
            });
            return { ...conv, messages: updatedMessages };
          });
        });
        if (conversation.messages.length === 0) {
          setTimeout(() => generateTitle(conversationId, content), 0);
        }
      });
    } catch (err) {
      setError(err.message);
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getConversation, addMessageToConversation, setConversations, updateTokenUsage, setLastResponseUsage, setIsLoading, setError, generateTitle]);

  // Additional message-related handlers can be added here as needed
  return { sendMessage };
}
