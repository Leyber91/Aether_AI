/**
 * API Service for conversations
 * Centralizes all API calls to the backend
 */

export const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Fetch all conversations from the API
 * @returns {Promise<Array>} List of conversations
 */
export async function fetchConversations() {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.conversations || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

/**
 * Fetch a single conversation by ID
 * @param {string} id Conversation ID
 * @returns {Promise<Object>} Conversation data
 */
export async function fetchConversation(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching conversation ${id}:`, error);
    throw error;
  }
}

/**
 * Save a conversation to the API
 * @param {string} id Conversation ID
 * @param {Object} conversation Conversation data
 * @returns {Promise<boolean>} Success status
 */
export async function saveConversation(id, conversation) {
  try {
    // Transform conversation to ensure it's suitable for backend storage
    const sanitizedConversation = sanitizeConversationForStorage(conversation);
    
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedConversation),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error(`Error saving conversation ${id}:`, error);
    return false;
  }
}

/**
 * Delete a conversation from the API
 * @param {string} id Conversation ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteConversation(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error(`Error deleting conversation ${id}:`, error);
    return false;
  }
}

/**
 * Sanitize conversation data for storage
 * Removes circular references and limits message size to prevent memory issues
 * @param {Object} conversation The conversation to sanitize
 * @returns {Object} Sanitized conversation
 */
function sanitizeConversationForStorage(conversation) {
  if (!conversation) return {};
  
  const { messages, ...rest } = conversation;
  
  // Process messages to ensure they're suitable for storage
  const sanitizedMessages = messages?.map(message => {
    const { content, role, id, timestamp, usage, thinking } = message;
    
    // Only keep essential properties and limit size
    return {
      id,
      role,
      timestamp,
      // Limit content length if needed
      content: typeof content === 'string' ? content : JSON.stringify(content),
      // Only include usage data if it exists and is not too large
      usage: usage && typeof usage === 'object' ? {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      } : null,
      // Include thinking data if it exists but limit size
      thinking: thinking && typeof thinking === 'string' ? thinking : null
    };
  }) || [];
  
  return {
    ...rest,
    messages: sanitizedMessages,
    // Include any other necessary fields, excluding large or circular references
    provider: conversation.provider || null,
    modelId: conversation.modelId || null,
    title: conversation.title || null,
    createdAt: conversation.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
