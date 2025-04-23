/**
 * Prompt generation utilities for title generation
 */

/**
 * Generate a prompt for title generation
 * @param {string} messageContent - The message content to base the title on
 * @returns {Array} - Array of message objects for the title generation prompt
 */
export const generateTitlePrompt = (messageContent) => {
  return [
    {
      role: 'system',
      content: `Create a precise, descriptive title (2-5 words) for a conversation.
Analyze the content, identify the core topic, and generate a specific title.
DO NOT use generic titles. Be concise and use clear keywords.
RESPOND WITH ONLY THE TITLE - no quotes, no explanation.`
    },
    {
      role: 'user',
      content: `Title for conversation starting with: "${messageContent}"`
    }
  ];
};

/**
 * Generate a follow-up prompt for title refinement
 * @returns {Object} - Message object for the follow-up prompt
 */
export const generateFollowUpPrompt = () => {
  return {
    role: 'user',
    content: 'The title must be 2-5 specific words. No explanations. Just the title itself.'
  };
};
