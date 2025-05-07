// agentApiService.js
// Handles communication with the Backend Agent Service for Ollama+MCP chat.
import axios from 'axios';

/**
 * Send a chat message to the backend agent (Ollama+MCP tools).
 * @param {Object} params - { message, conversationId, model, mcpQualities, history }
 * @returns {Promise<Object>} The agent's response
 */
export async function sendMessageToAgent({ message, conversationId, model, mcpQualities = [], history = [] }) {
  try {
    const response = await axios.post('/api/agent/chat', {
      message,
      conversationId,
      model,
      mcpQualities,
      history
    });
    return response.data;
  } catch (err) {
    // Standardized error handling
    throw (err?.response?.data?.error || err.message || err);
  }
}
