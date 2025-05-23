/**
 * LLM Service module
 * Handles communication with LLM providers (Ollama, Groq, etc.)
 * Uses the unified model service API backend
 */

/**
 * Fetch a streaming response from a model via the unified model service API
 * @param {string} provider - Provider name (ollama, groq)
 * @param {Object} agent - The agent configuration 
 * @param {string} model - Model name
 * @param {string} input - User input prompt
 * @param {Array} history - Conversation history
 * @param {Function} onToken - Callback for each token
 * @param {AbortSignal} signal - AbortController signal
 * @returns {Promise<string>} - The full response text
 */
export async function fetchModelStream(provider, agent, model, input, history, onToken, signal) {
  try {
    // Always use the unified model API
    const isChatModel = true; // Assume all models use the chat format with our unified API
    
    // Prepare the chat messages
    const chatMessages = [
      ...history,
      { role: "user", content: input }
    ];
    
    // Prepare the API payload
    const payload = {
      provider: provider,
      model: model,
      input: input,
      history: history,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature || 0.7,
      max_tokens: agent.max_tokens || null
    };

    // --- Payload validation ---
    let validationErrors = [];
    if (!payload.model || typeof payload.model !== 'string' || !payload.model.trim()) {
      validationErrors.push('Model name is missing or not a string.');
    }
    if (!payload.input || typeof payload.input !== 'string') {
      validationErrors.push('Input text is missing or not a string.');
    }
    if (!payload.provider || typeof payload.provider !== 'string') {
      validationErrors.push('Provider is missing or not a string.');
    }
    
    if (validationErrors.length > 0) {
      console.error('[ERROR] Invalid model service payload:', validationErrors);
      throw new Error('Invalid model service payload: ' + validationErrors.join(' | '));
    }
    
    console.log(`Sending ${provider} request to unified API:`, JSON.stringify(payload, null, 2));
    
    // Make the API request to our unified backend
    const response = await fetch("http://localhost:8000/api/chat_agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Model API Error (${response.status}): ${errorText}`);
    }
    
    // Process the response (which might be streaming or not)
    const data = await response.json();
    const responseText = data.response || '';
    
    // Call the onToken callback with the full response
    // Note: In a future version, we could implement actual streaming from the backend
    onToken(responseText);
    
    return responseText;
  } catch (err) {
    if (err.name === 'AbortError') return '';
    console.error(`Error fetching ${provider} response:`, err);
    throw err;
  }
}

/**
 * Legacy wrapper for Ollama streaming
 * @deprecated Use fetchModelStream instead
 */
export async function fetchOllamaStream(agent, model, input, history, onToken, signal) {
  return fetchModelStream('ollama', agent, model, input, history, onToken, signal);
}

/**
 * Simulates a response from any provider (for testing)
 * @param {string} provider - The provider name
 * @param {Object} agent - Agent configuration
 * @param {string} model - Model name 
 * @param {string} input - Input text
 * @param {Array} history - Conversation history
 * @param {Function} onToken - Token callback function
 * @returns {Promise<string>} - Simulated response
 */
export async function simulateProviderResponse(provider, agent, model, input, history, onToken) {
  const responseText = `[Provider ${provider} model ${model} simulation]: I'm responding to "${input}" with history length ${history.length}`;
  await new Promise(res => setTimeout(res, 500));
  onToken(responseText);
  return responseText;
}

/**
 * Save a loop conversation to the server
 * @param {Object} data - Conversation data
 * @param {string} data.seedPrompt - Initial prompt
 * @param {string} data.modelA - Model A name
 * @param {string} data.providerA - Provider A name
 * @param {string} data.modelB - Model B name
 * @param {string} data.providerB - Provider B name
 * @param {Array} data.messages - Conversation messages
 * @param {string} apiBaseUrl - API base URL
 * @returns {Promise<Response>} - Fetch response
 */
export async function saveLoopConversation(data, apiBaseUrl) {
  try {
    console.log("[llmService] Attempting to save loop conversation via API. Payload:", JSON.stringify(data, null, 2));
    const response = await fetch(
      `${apiBaseUrl}/loop_conversations/${Date.now()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
        }),
      }
    );
    console.log("[llmService] Save loop API response status:", response.status);
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("[llmService] Save loop API error response body:", errorBody);
        throw new Error(`API error during saveLoopConversation: ${response.status} - ${errorBody}`);
    }
    // Assuming the backend returns { "success": true } or similar simple JSON.
    // If it returns the saved object, that's fine too.
    const responseData = await response.json(); 
    console.log("[llmService] Save loop API response data:", responseData);
    return responseData; 
  } catch (e) {
    console.error("[llmService] Failed to save loop conversation due to exception:", e);
    throw e;
  }
}

/**
 * Fetch available models from a specific provider
 * @param {string} provider - Provider name ('ollama' or 'groq')
 * @returns {Promise<Array>} - List of available models
 */
export async function fetchModels(provider) {
  try {
    const response = await fetch(`http://localhost:8000/api/models/${provider}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[llmService] Error fetching ${provider} models:`, errorText);
      return [];
    }
    
    const models = await response.json();
    console.log(`[llmService] Fetched ${models.length} ${provider} models`);
    return models;
  } catch (e) {
    console.error(`[llmService] Exception fetching ${provider} models:`, e);
    return [];
  }
}

/**
 * Get detailed information about a specific model
 * @param {string} provider - Provider name
 * @param {string} modelId - Model ID
 * @returns {Promise<Object|null>} - Model information or null if not found
 */
export async function getModelInfo(provider, modelId) {
  try {
    // Fetch all models from the provider and find the specific one
    const models = await fetchModels(provider);
    return models.find(model => model.id === modelId) || null;
  } catch (e) {
    console.error(`[llmService] Error getting model info for ${provider}/${modelId}:`, e);
    return null;
  }
}
