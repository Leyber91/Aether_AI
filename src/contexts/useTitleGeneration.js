import { useState } from 'react';
import { generateConversationTitleHelper } from './utils/conversationHelpers';

/**
 * Custom hook for conversation title generation logic
 * Handles state and helpers for generating conversation titles
 */
export function useTitleGeneration(getConversation, updateConversationTitle) {
  const [isTitleGenerating, setIsTitleGenerating] = useState(false);
  const [titleGeneratingId, setTitleGeneratingId] = useState(null);

  // Generate a title for a conversation
  const generateTitle = async (conversationId, message, forceGeneration = false) => {
    return generateConversationTitleHelper(
      conversationId,
      message,
      forceGeneration,
      getConversation,
      updateConversationTitle,
      setIsTitleGenerating,
      setTitleGeneratingId
    );
  };

  return {
    isTitleGenerating,
    setIsTitleGenerating,
    titleGeneratingId,
    setTitleGeneratingId,
    generateTitle
  };
}
