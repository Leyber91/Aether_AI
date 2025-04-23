/**
 * Collection of helper functions for chat interface components
 */

/**
 * Determines if the usage tracker should be displayed
 * @param {Object} activeConversation - The current active conversation
 * @param {string} selectedProvider - The currently selected provider
 * @returns {boolean} - Whether to show the usage tracker
 */
export const shouldShowUsageTracker = (activeConversation, selectedProvider) => {
  // Show if active conversation uses Groq
  if (activeConversation && activeConversation.provider === 'groq') {
    return true;
  }
  // Also show if selected provider is Groq (for new conversations)
  if (selectedProvider === 'groq') {
    return true;
  }
  return false;
};

/**
 * Copy text to the clipboard
 * @param {string} content - Text content to copy
 * @param {Function} setSuccess - State setter for copy success message
 */
export const copyToClipboard = (content, setSuccess) => {
  navigator.clipboard.writeText(content)
    .then(() => {
      setSuccess('Message copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    })
    .catch(err => {
      console.error('Failed to copy message: ', err);
      setSuccess('Failed to copy message');
    });
};
