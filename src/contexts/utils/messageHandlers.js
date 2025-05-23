import { createMessage } from './conversationHelpers.js';
import { sendMessageToGroq } from '../../services/groqService.js';
import { sendMessageToOllama } from '../../services/ollamaService.js';
import { sendMessageToAgent } from '../../services/agentApiService.js';

/**
 * Handle token usage data from model response
 * @param {string} modelId - ID of the model used
 * @param {Object} usageData - Token usage data from the API
 * @param {Function} updateTokenUsage - Function to update token usage
 * @param {Function} setLastResponseUsage - Function to update last response usage
 */
const handleUsageData = (modelId, usageData, updateTokenUsage, setLastResponseUsage) => {
  if (!usageData) return;
  
  // Update token usage tracking
  updateTokenUsage(modelId, usageData);
  
  // Update lastResponseUsage state directly
  setLastResponseUsage(usageData);
};

/**
 * Send a message to the appropriate model provider and get the response
 * @param {string} provider - The provider to use (groq or ollama)
 * @param {string} modelId - The model ID to use
 * @param {Array} messages - Array of message objects
 * @param {Function} updateTokenUsage - Function to update token usage
 * @param {Function} setLastResponseUsage - Function to update last response usage
 * @param {Function} onPartialUpdate - Callback for streaming/partial updates
 * @param {Object} conversation - Current conversation object
 * @param {string} content - Message content
 * @returns {Promise<Object>} The response object with content and usage data
 */
const sendToProvider = async (provider, modelId, messages, updateTokenUsage, setLastResponseUsage, onPartialUpdate, conversation, content) => {
  if (provider === 'groq') {
    return await sendMessageToGroq(
      modelId, 
      messages,
      (modelId, usageData) => handleUsageData(modelId, usageData, updateTokenUsage, setLastResponseUsage)
    );
  } else if (provider === 'ollama') {
    // Check if this is a chat context (has conversation and content)
    if (conversation && conversation.type === 'chat') {
      // Route through the backend agent for tool/MCP support
      const response = await sendMessageToAgent({
        message: content,
        conversationId: conversation.id,
        model: modelId,
        mcpEnabled: conversation.mcpEnabled !== undefined ? conversation.mcpEnabled : true,
        mcpQualities: conversation.mcpQualities || [],
        history: messages
      });
      // Optionally handle streaming/partial updates if supported by backend
      return { content: response.content || '', usage: response.usage || null, ...response };
    } else {
      // Fallback to direct Ollama call (non-chat or legacy)
      const response = await sendMessageToOllama(modelId, messages, {
        stream: true,
        onUpdate: onPartialUpdate
      });
      return { content: typeof response.content === 'string' ? response.content : '', usage: null, ...response };
    }
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }
};

/**
 * Process and send a message to the appropriate model provider
 * @param {Object} conversation - Current conversation object
 * @param {string} content - Message content
 * @param {Array} messages - Current messages array
 * @param {Function} updateTokenUsage - Function to update token usage
 * @param {Function} setLastResponseUsage - Function to update last response usage
 * @param {Function} onPartialUpdate - Callback for streaming/partial updates
 * @returns {Promise<Object>} - AI response object
 */
export const processModelMessage = async (
  conversation,
  content,
  messages,
  updateTokenUsage,
  setLastResponseUsage,
  onPartialUpdate
) => {
  const { provider, modelId } = conversation;
  // Pass conversation and content for chat context detection
  return await sendToProvider(
    provider,
    modelId,
    messages,
    updateTokenUsage,
    setLastResponseUsage,
    onPartialUpdate,
    conversation,
    content
  );
};

/**
 * Create a user message object with the given content
 * @param {string} content - Message content
 * @returns {Object} User message object
 */
export const createUserMessage = (content) => {
  return createMessage('user', content);
};

/**
 * Create an assistant message object with the given content and usage data
 * @param {string} content - Message content
 * @param {Object} usage - Token usage data
 * @returns {Object} Assistant message object
 */
export const createAssistantMessage = (content, usage = null) => {
  return createMessage('assistant', content, usage);
};
