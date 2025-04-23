import { v4 as uuidv4 } from 'uuid';
import { generateConversationTitle } from '../../services/titleGeneration';

/**
 * Create a new conversation object
 * @param {string} title - Initial conversation title
 * @param {string} modelId - The model ID to use for this conversation
 * @param {string} provider - The provider (groq or ollama)
 * @returns {Object} - New conversation object
 */
export const createNewConversation = (title = 'New Conversation', modelId, provider) => {
  return {
    id: uuidv4(),
    title,
    messages: [],
    modelId,
    provider,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Get a conversation by ID from the conversations array
 * @param {Array} conversations - Array of all conversations
 * @param {string} conversationId - ID of the conversation to find
 * @returns {Object|null} - Found conversation or null
 */
export const findConversationById = (conversations, conversationId) => {
  return conversations.find(conv => conv.id === conversationId) || null;
};

/**
 * Get a conversation by ID from the conversations array
 * @param {Array} conversations - Array of all conversations
 * @param {string} conversationId - ID of the conversation to find
 * @returns {Object|null} - Found conversation or null
 */
export const getConversationById = (conversations, conversationId) => {
  return conversations.find(conv => conv.id === conversationId) || null;
};

/**
 * Delete a conversation by ID
 * @param {Array} conversations - Array of all conversations
 * @param {string} conversationId - ID of the conversation to delete
 * @returns {Object} - Filtered conversations and new active ID
 */
export const deleteConversationById = (conversations, conversationId) => {
  const filtered = conversations.filter(conv => conv.id !== conversationId);
  const newActiveId = filtered.length > 0 ? filtered[0].id : null;
  return { filtered, newActiveId };
};

/**
 * Update conversation title by ID
 * @param {Array} conversations - Array of all conversations
 * @param {string} conversationId - ID of the conversation to update
 * @param {string} newTitle - New title for the conversation
 * @returns {Array} - Updated conversations
 */
export const updateConversationTitleById = (conversations, conversationId, newTitle) => {
  return conversations.map(conv => {
    if (conv.id === conversationId) {
      return {
        ...conv,
        title: newTitle,
        updatedAt: new Date().toISOString()
      };
    }
    return conv;
  });
};

/**
 * Add a message to a conversation by ID
 * @param {Array} conversations - Array of all conversations
 * @param {string} conversationId - ID of the conversation to update
 * @param {Object} message - Message to add to the conversation
 * @returns {Array} - Updated conversations
 */
export const addMessageToConversationById = (conversations, conversationId, message) => {
  return conversations.map(conv => {
    if (conv.id === conversationId) {
      return {
        ...conv,
        messages: [...conv.messages, message],
        updatedAt: new Date().toISOString()
      };
    }
    return conv;
  });
};

/**
 * Check if a conversation title should be generated
 * @param {Object} conversation - The conversation object
 * @param {boolean} forceGeneration - Whether to force generation regardless of current title
 * @returns {boolean} Whether title generation should proceed
 */
const shouldGenerateTitle = (conversation, forceGeneration) => {
  if (!conversation) return false;
  
  // Skip generation if title is not default and we're not forcing regeneration
  if (!forceGeneration && conversation.title !== 'New Conversation') return false;
  
  return true;
};

/**
 * Set title generation state
 * @param {string} conversationId - ID of the conversation
 * @param {boolean} isGenerating - Whether title is being generated
 * @param {Function} setIsTitleGenerating - State setter for title generation flag
 * @param {Function} setTitleGeneratingId - State setter for title generating ID
 */
const setTitleGenerationState = (
  conversationId,
  isGenerating,
  setIsTitleGenerating,
  setTitleGeneratingId
) => {
  setIsTitleGenerating(isGenerating);
  setTitleGeneratingId(isGenerating ? conversationId : null);
};

/**
 * Generate a new title for a conversation
 * @param {string} conversationId - ID of the conversation 
 * @param {string} message - Message to base the title on
 * @param {boolean} forceGeneration - Force regeneration even if title exists
 * @param {Function} getConversation - Function to get a conversation by ID
 * @param {Function} updateConversationTitle - Function to update the title
 * @param {Function} setIsTitleGenerating - State setter for title generation flag
 * @param {Function} setTitleGeneratingId - State setter for title generating ID
 * @returns {Promise<boolean>} - Success status
 */
export const generateConversationTitleHelper = async (
  conversationId,
  message,
  forceGeneration = false,
  getConversation,
  updateConversationTitle,
  setIsTitleGenerating,
  setTitleGeneratingId
) => {
  try {
    if (!conversationId || !message) return false;
    
    const conversation = getConversation(conversationId);
    if (!shouldGenerateTitle(conversation, forceGeneration)) return false;
    
    // Set title generation in progress
    setTitleGenerationState(conversationId, true, setIsTitleGenerating, setTitleGeneratingId);
    
    // Generate the title
    const generatedTitle = await generateConversationTitle(message);
    
    // Update the conversation with the generated title
    if (generatedTitle && generatedTitle !== 'New Conversation') {
      updateConversationTitle(conversationId, generatedTitle);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to generate conversation title:', error);
    return false;
  } finally {
    // Reset title generation state
    setTitleGenerationState(conversationId, false, setIsTitleGenerating, setTitleGeneratingId);
  }
};

/**
 * Create a new message object
 * @param {string} role - Message role (user or assistant)
 * @param {string} content - Message content
 * @param {Object} usage - Token usage data (optional)
 * @returns {Object} - New message object
 */
export const createMessage = (role, content, usage = null) => {
  return {
    id: uuidv4(),
    role,
    content,
    timestamp: new Date().toISOString(),
    usage
  };
};
