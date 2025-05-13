/**
 * LLM Service module
 * Handles communication with LLM providers (Ollama, Groq, etc.)
 */

/**
 * Fetch a streaming response from Ollama
 * @param {Object} agent - The agent configuration 
 * @param {string} model - Model name
 * @param {string} input - User input prompt
 * @param {Array} history - Conversation history
 * @param {Function} onToken - Callback for each token
 * @param {AbortSignal} signal - AbortController signal
 * @returns {Promise<string>} - The full response text
 */
export async function fetchOllamaStream(agent, model, input, history, onToken, signal) {
  // Always use /api/chat endpoint; adjust messages for completion-style models
  const isChatModel = /chat|llama|phi|qwen|mistral/i.test(model);
  try {
    let chatMessages;
    if (isChatModel) {
      chatMessages = [
        { role: "system", content: agent.systemPrompt },
        ...history,
        { role: "user", content: input }
      ];
    } else {
      // For completion/instruct models, flatten all prompt content into a single user message
      const prompt = [agent.systemPrompt, ...history.map(h => h.content), input].join('\n');
      chatMessages = [
        { role: "user", content: prompt }
      ];
    }
    const payload = { model, messages: chatMessages, stream: true };

    // --- Payload validation ---
    let validationErrors = [];
    if (!payload.model || typeof payload.model !== 'string' || !payload.model.trim()) {
      validationErrors.push('Model name is missing or not a string.');
    }
    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
      validationErrors.push('Messages array is missing or empty.');
    } else {
      payload.messages.forEach((msg, i) => {
        if (typeof msg.role !== 'string' || typeof msg.content !== 'string') {
          validationErrors.push(`Message at index ${i} missing string role/content.`);
        }
        if (!msg.role.trim() || !msg.content.trim()) {
          validationErrors.push(`Message at index ${i} has empty role/content.`);
        }
      });
    }
    const payloadStr = JSON.stringify(payload);
    if (payloadStr.length > 16000) {
      console.warn('[WARN] Payload size exceeds 16k chars. This may cause Ollama to reject the request.');
    }
    if (validationErrors.length > 0) {
      console.error('[ERROR] Invalid Ollama payload:', validationErrors);
      throw new Error('Invalid Ollama payload: ' + validationErrors.join(' | '));
    }
    console.log('Ollama payload (unified chat):', JSON.stringify(payload, null, 2));
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payloadStr,
      signal
    });

    if (!response.ok) throw new Error(`Ollama API Error (${response.status})`);
    if (!response.body) throw new Error("Response body is null");
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          const token = data.message?.content || "";
          if (token) {
            fullText += token;
            onToken(fullText);
          }
          if (data.done) break;
        }
        catch (e) {
          console.warn("Failed to parse Ollama chunk:", line, e);
        }
      }
    }
    
    return fullText;
  } catch (err) {
    if (err.name === 'AbortError') return '';
    console.error("Error fetching Ollama stream:", err);
    throw err;
  }
}

/**
 * Simulates a response from any provider (for testing)
 * @param {string} provider - The provider name
 * @param {string} model - Model name 
 * @param {string} input - Input text
 * @param {Function} onToken - Token callback function
 * @returns {Promise<string>} - Simulated response
 */
export async function simulateProviderResponse(provider, model, input, onToken) {
  const responseText = `[Provider ${provider} simulation]`;
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
    return await fetch(
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
  } catch (e) {
    console.error("Failed to save loop conversation:", e);
    throw e;
  }
}
