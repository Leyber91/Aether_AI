/**
 * Enhanced Ollama Service
 * Provides additional features for working with local Ollama models
 */

import { makeRequest } from './api/baseApiService';
import config from '../config';
import { v4 as uuidv4 } from 'uuid';

// API URLs
const OLLAMA_API_URL = config.ollamaApiUrl;
const DIRECT_OLLAMA_URL = 'http://localhost:11434/api';
const BACKUP_OLLAMA_URLS = [
  'http://127.0.0.1:11434/api',
  'http://localhost:11434/api',
];

// Model IDs for app-wide consistency
export const OLLAMA_MODELS = {
  GENERAL: 'qwen3:1.7b',
  TITLE_GEN: 'llama3.2:1b',
  AUTOCOMPLETE: 'llama3.2:1b',
  CODING: 'phi4-mini:latest',   // Add specialized model for code explanations
};

// --- Availability state (module-scoped, resettable for tests) ---
let isOllamaAvailable = null;
let proxyApiAvailable = null;
let directApiAvailable = null;
let lastOllamaCheckTime = 0;
const OLLAMA_CHECK_INTERVAL = 3 * 60 * 1000;

// --- Helper: Determine optimal API URLs to try ---
const getPreferredApiUrls = (endpoint) => {
  if (directApiAvailable === true) {
    return [ `${DIRECT_OLLAMA_URL}${endpoint}`, `${OLLAMA_API_URL}${endpoint}` ];
  }
  if (proxyApiAvailable === true && directApiAvailable === false) {
    return [ `${OLLAMA_API_URL}${endpoint}`, `${DIRECT_OLLAMA_URL}${endpoint}` ];
  }
  return [ `${DIRECT_OLLAMA_URL}${endpoint}`, `${OLLAMA_API_URL}${endpoint}` ];
};

// --- Core request with fallback logic ---
const makeOllamaRequest = async (endpoint, data = {}, method = 'post', options = {}) => {
  const force = options.force === true;
  const currentTime = Date.now();
  if (!force && isOllamaAvailable === false && (currentTime - lastOllamaCheckTime) < OLLAMA_CHECK_INTERVAL) {
    throw new Error('Ollama service is currently unavailable. Will retry in a few minutes.');
  }
  const urls = getPreferredApiUrls(endpoint);
  try {
    const response = await makeRequest({
      urls,
      method,
      data,
      params: method.toLowerCase() === 'get' ? data : {},
      timeout: options.timeout || 80000,
      signal: options.signal,
      onSuccess: (url, response) => {
        isOllamaAvailable = true;
        lastOllamaCheckTime = currentTime;
        if (url.includes('127.0.0.1')) directApiAvailable = true;
        else proxyApiAvailable = true;
      },
      onError: (url, error) => {
        if (url.includes('127.0.0.1')) directApiAvailable = false;
        else proxyApiAvailable = false;
      },
    });
    return response;
  } catch (error) {
    if (!directApiAvailable && !proxyApiAvailable) {
      isOllamaAvailable = false;
      lastOllamaCheckTime = currentTime;
    }
    throw error;
  }
};

// --- Format messages for Ollama API ---
const formatMessagesForOllamaAPI = (messages) => {
  if (!messages || messages.length === 0) {
    return [{ role: 'system', content: 'You are a helpful assistant.' }];
  }
  return messages.map(msg => ({ role: msg.role, content: msg.content }));
};

// --- Get all available models ---
export const getAllOllamaModels = async (options = {}) => {
  try {
    const response = await makeOllamaRequest('/tags', {}, 'get', options);
    if (response && response.data && Array.isArray(response.data.models)) {
      return { models: response.data.models.map(model => ({
        id: model.name,
        name: model.name,
        size: model.size,
        modified: model.modified
      })), error: null };
    }
    return { models: [], error: 'No models found in Ollama response (unexpected structure)' };
  } catch (error) {
    const errMsg = (error && error.message) ? error.message : String(error);
    return { models: [], error: errMsg };
  }
};

// --- Send chat completion (multi-turn chat, always streaming) ---
const sendChatCompletion = async (modelId, messages, options = {}) => {
  const formattedMessages = formatMessagesForOllamaAPI(messages);
  const requestData = {
    model: modelId,
    messages: formattedMessages,
    stream: true
  };
  if (options.temperature) requestData.options = { temperature: options.temperature };
  if (options.topP) requestData.options = { ...requestData.options, top_p: options.topP };
  if (options.topK) requestData.options = { ...requestData.options, top_k: options.topK };
  if (options.maxTokens) requestData.options = { ...requestData.options, num_predict: options.maxTokens };

  // Use /api/chat endpoint for multi-turn chat with streaming
  // We'll handle the stream manually below
  const response = await fetch(`${DIRECT_OLLAMA_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
    signal: options.signal
  });
  if (!response.body) throw new Error('No stream body from Ollama');
  const reader = response.body.getReader();
  let decoder = new TextDecoder('utf-8');
  let buffer = '';
  let modelReply = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete for next chunk
    for (const line of lines) {
      if (!line.trim()) continue;
      let data;
      try { data = JSON.parse(line); } catch { continue; }
      const token = data.message?.content || '';
      modelReply += token;
      if (typeof options.onUpdate === 'function') {
        options.onUpdate({ content: modelReply, partial: true });
      }
    }
  }
  if (!modelReply) {
    modelReply = '[Ollama] No response content found.';
  }
  if (typeof options.onUpdate === 'function') {
    options.onUpdate({ content: modelReply, partial: false });
  }
  return modelReply;
};

// --- Send text completion (single prompt, always streaming) ---
export const enhanceTextWithOllama = async (modelId, messages, options = {}) => {
  let requestData = {};
  try {
    // Check if Ollama is running
    const isRunning = await isOllamaRunning();
    if (!isRunning) {
      throw new Error('Ollama service is not running. Please start Ollama and try again.');
    }

    if (Array.isArray(messages)) {
      // Format for API
      requestData = {
        model: modelId,
        prompt: messages.length === 1 
          ? messages[0].content 
          : `${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}`
      };
    } else {
      // Single string
      requestData = {
        model: modelId,
        prompt: messages
      };
    }
  
    // Apply options
    requestData.options = {};
    if (options.temperature) requestData.options.temperature = options.temperature;
    if (options.maxTokens) requestData.options.num_predict = options.maxTokens;
    
    // Try multiple possible Ollama endpoints
    let response = null;
    let errorMessages = [];
    
    // First try the direct URL
    try {
      response = await fetch(`${DIRECT_OLLAMA_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: options.signal
      });
      
      if (!response.ok) {
        errorMessages.push(`Failed to reach Ollama at ${DIRECT_OLLAMA_URL}: ${response.status} ${response.statusText}`);
        response = null;
      }
    } catch (error) {
      errorMessages.push(`Error accessing ${DIRECT_OLLAMA_URL}: ${error.message}`);
    }
    
    // If that fails, try backup URLs
    if (!response) {
      for (const backupUrl of BACKUP_OLLAMA_URLS) {
        if (backupUrl === DIRECT_OLLAMA_URL) continue; // Skip if already tried
        
        try {
          response = await fetch(`${backupUrl}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
            signal: options.signal
          });
          
          if (response.ok) break;
          errorMessages.push(`Failed to reach Ollama at ${backupUrl}: ${response.status} ${response.statusText}`);
          response = null;
        } catch (error) {
          errorMessages.push(`Error accessing ${backupUrl}: ${error.message}`);
        }
      }
    }
    
    // If all attempts fail
    if (!response || !response.ok) {
      console.error('All Ollama endpoints failed:', errorMessages);
      throw new Error('Could not connect to Ollama. Please ensure Ollama is running and accessible.');
    }
    
    if (!response.body) throw new Error('No stream body from Ollama');
    const reader = response.body.getReader();
    let decoder = new TextDecoder('utf-8');
    let buffer = '';
    let modelReply = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        let data;
        try { data = JSON.parse(line); } catch { continue; }
        const token = data.response || '';
        modelReply += token;
        if (typeof options.onUpdate === 'function') {
          options.onUpdate({ content: modelReply, partial: true });
        }
      }
    }
    if (!modelReply) {
      modelReply = '[Ollama] No response content found.';
    }
    if (typeof options.onUpdate === 'function') {
      options.onUpdate({ content: modelReply, partial: false });
    }
    return modelReply;
  } catch (error) {
    console.error('Error enhancing text:', error);
    return '[Ollama] Error enhancing text.';
  }
};

// --- Stream chat completion (multi-turn chat, streaming) ---
export async function streamChatCompletion(modelId, messages, { onUpdate, onDone, onError, ...options } = {}) {
  // Use direct fetch to /api/chat for streaming
  const formattedMessages = formatMessagesForOllamaAPI(messages);
  const controller = new AbortController();
  const requestData = {
    model: modelId,
    messages: formattedMessages,
    stream: true
  };
  if (options.temperature) requestData.options = { temperature: options.temperature };
  if (options.topP) requestData.options = { ...requestData.options, top_p: options.topP };
  if (options.topK) requestData.options = { ...requestData.options, top_k: options.topK };
  if (options.maxTokens) requestData.options = { ...requestData.options, num_predict: options.maxTokens };

  let content = '';
  let thinking = '';
  let inThinking = false;
  let done = false;

  try {
    const response = await fetch(`${DIRECT_OLLAMA_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });
    if (!response.body) throw new Error('No stream body from Ollama');
    const reader = response.body.getReader();
    let decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
      const { value, done: streamDone } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });
      // Process lines (Ollama streams JSONL)
      let lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete for next chunk
      for (const line of lines) {
        if (!line.trim()) continue;
        let data;
        try { data = JSON.parse(line); } catch { continue; }
        const token = data.message?.content || '';
        // --- <think> tag streaming handling ---
        if (!inThinking && token.includes('<think>')) {
          inThinking = true;
          thinking += token.split('<think>')[1];
          if (onUpdate) onUpdate({ content, thinking, partial: true });
          continue;
        }
        if (inThinking) {
          if (token.includes('</think>')) {
            inThinking = false;
            thinking += token.split('</think>')[0];
            if (onUpdate) onUpdate({ content, thinking, partial: true });
            // Add any content after </think>
            const after = token.split('</think>')[1];
            if (after) content += after;
          } else {
            thinking += token;
            if (onUpdate) onUpdate({ content, thinking, partial: true });
            continue;
          }
        } else {
          content += token;
        }
        if (onUpdate) onUpdate({ content, thinking, partial: true });
      }
    }
    done = true;
    if (onDone) onDone({ content, thinking });
    return { content, thinking };
  } catch (err) {
    if (onError) onError(err);
    throw err;
  }
}

// --- Stream text completion (single prompt, streaming) ---
export async function streamTextCompletion(modelId, messages, { onUpdate, onDone, onError, ...options } = {}) {
  // Use direct fetch to /api/generate for streaming
  let prompt = '';
  if (Array.isArray(messages) && messages.length === 1 && messages[0].role === 'user') {
    prompt = messages[0].content;
  } else {
    prompt = messages.map(msg => `${msg.role === 'system' ? 'System: ' : msg.role === 'user' ? 'User: ' : 'Assistant: '}${msg.content}`).join('\n\n');
  }
  const controller = new AbortController();
  const requestData = {
    model: modelId,
    prompt,
    stream: true
  };
  if (options.temperature || options.maxTokens) {
    requestData.options = {};
    if (options.temperature) requestData.options.temperature = options.temperature;
    if (options.maxTokens) requestData.options.num_predict = options.maxTokens;
  }
  let content = '';
  let thinking = '';
  let inThinking = false;
  let done = false;
  try {
    const response = await fetch(`${DIRECT_OLLAMA_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });
    if (!response.body) throw new Error('No stream body from Ollama');
    const reader = response.body.getReader();
    let decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
      const { value, done: streamDone } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });
      let lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        let data;
        try { data = JSON.parse(line); } catch { continue; }
        const token = data.response || '';
        if (!inThinking && token.includes('<think>')) {
          inThinking = true;
          thinking += token.split('<think>')[1];
          if (onUpdate) onUpdate({ content, thinking, partial: true });
          continue;
        }
        if (inThinking) {
          if (token.includes('</think>')) {
            inThinking = false;
            thinking += token.split('</think>')[0];
            if (onUpdate) onUpdate({ content, thinking, partial: true });
            const after = token.split('</think>')[1];
            if (after) content += after;
          } else {
            thinking += token;
            if (onUpdate) onUpdate({ content, thinking, partial: true });
            continue;
          }
        } else {
          content += token;
        }
        if (onUpdate) onUpdate({ content, thinking, partial: true });
      }
    }
    done = true;
    if (onDone) onDone({ content, thinking });
    return { content, thinking };
  } catch (err) {
    if (onError) onError(err);
    throw err;
  }
}

// --- Utility: Extract <think>...</think> tags from model content ---
function extractThinkingTags(content) {
  if (!content || typeof content !== 'string') return { thinking: null, rest: content };
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    const thinking = thinkMatch[1].trim();
    // Remove the <think>...</think> block from the content
    const rest = content.replace(thinkMatch[0], '').trim();
    return { thinking, rest };
  }
  return { thinking: null, rest: content };
}

// --- Send a message to Ollama (main entry point for chat) ---
export const sendMessageToOllama = async (modelId, messages, options = {}) => {
  try {
    if (!messages || messages.length === 0) {
      return {
        id: uuidv4(),
        role: 'assistant',
        content: options.fallbackMessage || "I'm sorry, I didn't receive any messages to process.",
        timestamp: new Date().toISOString(),
        model: modelId
      };
    }
    try {
      let responseText;
      // --- Prefer streaming for multi-turn chat ---
      if (Array.isArray(messages) && messages.length > 1) {
        if (options.stream && typeof options.onUpdate === 'function') {
          // Use streaming API
          const result = await streamChatCompletion(modelId, messages, options);
          responseText = result.content;
          // Optionally, pass thinking tag
          if (result.thinking) options.onUpdate({ thinking: result.thinking, content: result.content, partial: false });
        } else {
          // Fallback to non-streaming
          responseText = await sendChatCompletion(modelId, messages, options);
        }
      } else if (Array.isArray(messages) && messages.length === 1 && messages[0].role === 'user') {
        responseText = await enhanceTextWithOllama(modelId, messages, options);
      } else {
        responseText = await sendChatCompletion(modelId, messages, options);
      }
      // --- Extract <think> tags if present ---
      const { thinking, rest } = extractThinkingTags(responseText);
      return {
        id: uuidv4(),
        role: 'assistant',
        content: rest,
        thinking,
        timestamp: new Date().toISOString(),
        model: modelId
      };
    } catch (completionError) {
      return {
        id: uuidv4(),
        role: 'assistant',
        content: 'Ollama service is currently unavailable.',
        timestamp: new Date().toISOString(),
        model: modelId,
        error: true
      };
    }
  } catch (finalError) {
    return {
      id: uuidv4(),
      role: 'assistant',
      content: 'An unexpected error occurred while processing your request.',
      timestamp: new Date().toISOString(),
      model: modelId,
      error: true
    };
  }
};

// --- Check if Ollama server is running ---
export const isOllamaRunning = async () => {
  try {
    const response = await makeOllamaRequest('/tags', {}, 'get', { timeout: 5000, force: true });
    return !!(response && response.data && Array.isArray(response.data.models));
  } catch {
    return false;
  }
};

// --- TEST HOOKS ---
export const __resetOllamaState = () => {
  isOllamaAvailable = null;
  proxyApiAvailable = null;
  directApiAvailable = null;
  lastOllamaCheckTime = 0;
};

/**
 * Get text completions from Ollama model
 * @param {string} text - Input text
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - Completion result
 */
export const getTextCompletions = async (text, options = {}) => {
  const messages = [{ role: 'user', content: text }];
  
  try {
    return await sendMessageToOllama(options.model || OLLAMA_MODELS.AUTOCOMPLETE, messages, {
      maxTokens: options.maxTokens || 20,
      temperature: 0.3,
      onUpdate: options.onUpdate,
      onError: options.onError
    });
  } catch (error) {
    console.warn("Error getting text completions:", error);
    // Return empty string on error rather than breaking the UI
    return "";
  }
};

/**
 * Smart routing for queries to determine optimal model
 * @param {string} message - User message
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Selected model and enhanced prompt
 */
export const smartQueryRouter = async (message, options = {}) => {
  // Simple implementation that just returns the message without enhancement
  return {
    modelId: OLLAMA_MODELS.GENERAL,
    enhancedPrompt: message
  };
};

/**
 * Get Ollama system information
 * @returns {Promise<Object>} - System information
 */
export const getOllamaSystemInfo = async () => {
  try {
    const isRunning = await isOllamaRunning();
    const models = isRunning ? await getAllOllamaModels() : [];
    
    return {
      isRunning,
      models,
      version: "Unknown", // This could be enhanced to fetch from actual API if needed
      status: isRunning ? "running" : "stopped"
    };
  } catch (error) {
    console.warn("Error getting Ollama system info:", error);
    // Return a default response to prevent UI errors
    return {
      isRunning: false,
      models: [],
      version: "Unknown",
      status: "error",
      error: error.message
    };
  }
};

/**
 * Get suggestions for text
 * @param {string} text - Input text
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} - Suggested completion
 */
export const getSuggestions = async (text, options = {}) => {
  return getTextCompletions(text, {
    ...options,
    model: options.model || OLLAMA_MODELS.AUTOCOMPLETE
  });
};

/**
 * Enhanced prompt frameworks for more effective text transformation
 * These are designed to generate more structured, actionable content
 */
export const PROMPT_FRAMEWORKS = {
  // Basic styles
  BASIC: {
    PROFESSIONAL: 'professional',
    CREATIVE: 'creative',
    CONCISE: 'concise',
    ELABORATE: 'elaborate'
  },
  // Advanced frameworks
  ADVANCED: {
    PROBLEM_SOLUTION: 'adaptive-problem-solution',
    ITERATIVE_REFINEMENT: 'iterative-refinement',
    SUCCESS_CRITERIA: 'success-criteria',
    MULTI_PERSPECTIVE: 'multi-perspective',
    SCENARIO_BASED: 'scenario-based'
  }
};

/**
 * Get optimized system prompt for different enhancement frameworks
 * @param {string} frameworkType - Type of enhancement framework to use
 * @returns {string} - Optimized system prompt
 */
export const getFrameworkSystemPrompt = (frameworkType) => {
  const basePrompt = 'You are a helpful AI assistant that enhances text based on specific frameworks. Keep your response focused only on the enhanced text without explanations, preambles, or summaries. ';
  
  switch (frameworkType) {
    // Basic styles
    case PROMPT_FRAMEWORKS.BASIC.PROFESSIONAL:
      return basePrompt + 'You transform casual text into professional and formal language suitable for business communications.';
    case PROMPT_FRAMEWORKS.BASIC.CREATIVE:
      return basePrompt + 'You transform text to be more creative, engaging, and vivid with colorful language.';
    case PROMPT_FRAMEWORKS.BASIC.CONCISE:
      return basePrompt + 'You make text concise and to the point while preserving essential meaning.';
    case PROMPT_FRAMEWORKS.BASIC.ELABORATE:
      return basePrompt + 'You elaborate on text by adding details, examples, and explanations.';
      
    // Advanced frameworks
    case PROMPT_FRAMEWORKS.ADVANCED.PROBLEM_SOLUTION:
      return basePrompt + 'You transform text into a structured Adaptive Problem-Solution Framework with these components: (1) Context: Define relevant background details. (2) Problem: Specify the issue to be resolved. (3) Exploration: Present multiple approaches to address the problem. (4) Evaluation: Compare solutions based on relevant criteria. (5) Resolution: Provide the best approach with actionable steps.';
    case PROMPT_FRAMEWORKS.ADVANCED.ITERATIVE_REFINEMENT:
      return basePrompt + 'You structure text as an Iterative Refinement Framework showing Initial Proposal, Feedback Loop, Enhanced Solution, and Final Validation.';
    case PROMPT_FRAMEWORKS.ADVANCED.SUCCESS_CRITERIA:
      return basePrompt + 'You restructure text into a Comprehensive Success Criteria Framework with Context, Problem/Objective, Success Criteria (with metrics), Solution Design, and Outcome Validation.';
    case PROMPT_FRAMEWORKS.ADVANCED.MULTI_PERSPECTIVE:
      return basePrompt + 'You reframe text into a Multi-Perspective Framework showing the Context from all stakeholder perspectives, defining the Problem/Goal from each viewpoint, proposing Collaborative Solutions, and ensuring a Unified Outcome.';
    case PROMPT_FRAMEWORKS.ADVANCED.SCENARIO_BASED:
      return basePrompt + 'You transform text into a Scenario-Based Action Framework with a detailed Scenario Context, Problem Definition, step-by-step Action Plan, and Outcome Simulation.';
    default:
      return basePrompt + 'You improve text for clarity and impact.';
  }
};

/**
 * Get optimized user prompt for different enhancement frameworks
 * @param {string} frameworkType - Type of enhancement framework to use
 * @param {string} originalText - Text to enhance
 * @returns {string} - Optimized user prompt
 */
export const getFrameworkUserPrompt = (frameworkType, originalText) => {
  switch (frameworkType) {
    // Basic styles
    case PROMPT_FRAMEWORKS.BASIC.PROFESSIONAL:
      return `Make this text more professional and formal: "${originalText}"`;
    case PROMPT_FRAMEWORKS.BASIC.CREATIVE:
      return `Make this text more creative and engaging: "${originalText}"`;
    case PROMPT_FRAMEWORKS.BASIC.CONCISE:
      return `Make this text more concise and to the point: "${originalText}"`;
    case PROMPT_FRAMEWORKS.BASIC.ELABORATE:
      return `Elaborate on this text with more details: "${originalText}"`;
      
    // Advanced frameworks
    case PROMPT_FRAMEWORKS.ADVANCED.PROBLEM_SOLUTION:
      return `Transform this text into an Adaptive Problem-Solution Framework with clear sections for Context, Problem, Exploration, Evaluation, and Resolution: "${originalText}"`;
    case PROMPT_FRAMEWORKS.ADVANCED.ITERATIVE_REFINEMENT:
      return `Transform this text into an Iterative Refinement Framework showing Initial Proposal, Feedback Loop, Enhanced Solution, and Final Validation: "${originalText}"`;
    case PROMPT_FRAMEWORKS.ADVANCED.SUCCESS_CRITERIA:
      return `Transform this text into a Comprehensive Success Criteria Framework with Context, Problem/Objective, Success Criteria (with metrics), Solution Design, and Outcome Validation: "${originalText}"`;
    case PROMPT_FRAMEWORKS.ADVANCED.MULTI_PERSPECTIVE:
      return `Transform this text into a Multi-Perspective Framework showing the Context from all stakeholder perspectives, defining the Problem/Goal from each viewpoint, proposing Collaborative Solutions, and ensuring a Unified Outcome: "${originalText}"`;
    case PROMPT_FRAMEWORKS.ADVANCED.SCENARIO_BASED:
      return `Transform this text into a Scenario-Based Action Framework with a detailed Scenario Context, Problem Definition, step-by-step Action Plan, and Outcome Simulation: "${originalText}"`;
    default:
      return `Improve this text: "${originalText}"`;
  }
};

// --- Suggest next steps using LLM ---
/**
 * Generate context-aware next step suggestions using LLM
 * @param {Array} conversationHistory - Array of message objects
 * @param {number} maxSuggestions - Number of suggestions to return
 * @returns {Promise<string[]>}
 */
export async function generateNextStepSuggestions(conversationHistory, maxSuggestions = 3) {
  // Prepare the prompt with the last 6 messages (or all if fewer)
  const history = conversationHistory.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  const prompt = [
    { role: 'system', content: `You are a helpful AI assistant.\nGiven the following conversation, suggest ${maxSuggestions} specific, actionable next questions or steps the user might take.\nRespond ONLY with a JSON array of strings, for example:\n[\"Ask about the island\", \"Search for clues\", \"Speak to the woman\"]\nIf you are unsure, make your best guess based on the conversation context.\nDo NOT return an empty array unless the conversation is totally empty.\nDo not include any explanation or extra text.` },
    { role: 'user', content: `Conversation so far:\n${history}` }
  ];
  try {
    const response = await sendMessageToOllama('llama3.2:1b', prompt, { maxTokens: 128, temperature: 0.7 });
    // --- Always extract .content from Ollama response ---
    let raw = (typeof response === 'object' && response !== null && 'content' in response)
      ? response.content
      : (typeof response === 'string' ? response : '');
    // Debug: Log the raw LLM output for investigation
    console.log('LLM raw response:', raw);
    let suggestions = [];
    // Try to parse JSON array directly
    try {
      let parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.nextSteps)) {
        suggestions = parsed.nextSteps;
      } else if (Array.isArray(parsed)) {
        suggestions = parsed;
      } else if (typeof parsed === 'string') {
        // Sometimes the LLM double-stringifies
        try {
          let secondParse = JSON.parse(parsed);
          if (Array.isArray(secondParse)) suggestions = secondParse;
        } catch {}
      }
    } catch (err) {
      // Attempt to extract JSON array from text if LLM wrapped it or added extra text
      const match = raw.match(/\[([\s\S]*?)\]/);
      if (match) {
        try {
          suggestions = JSON.parse(`[${match[1]}]`);
        } catch {}
      }
    }
    // Fallback: treat as single suggestion if not array
    if (!Array.isArray(suggestions)) suggestions = [raw.trim()];
    // Fallback: Try to extract bullet or numbered list items if suggestions is still empty
    if (suggestions.length === 0 && typeof raw === 'string') {
      const lines = raw.split('\n')
        .map(line => line.trim())
        .filter(line =>
          /^[-*]\s+/.test(line) || /^\d+[\).\s]/.test(line)
        )
        .map(line =>
          line.replace(/^[-*]\s+/, '').replace(/^\d+[\).\s]/, '').trim()
        )
        .filter(line => line.length > 1);
      if (lines.length) suggestions = lines;
    }
    // Filter out single-letter or empty suggestions
    suggestions = suggestions.filter(s => typeof s === 'string' && s.length > 1).slice(0, maxSuggestions);
    // If still empty, fallback to a generic suggestion for robustness
    if (suggestions.length === 0) {
      suggestions = ["Ask a follow-up question", "Summarize the conversation so far", "Request clarification on a previous point"];
    }
    return suggestions;
  } catch (err) {
    console.error('LLM suggestion error:', err);
    // Fallback: always return at least one generic suggestion
    return ["Ask a follow-up question", "Summarize the conversation so far", "Request clarification on a previous point"];
  }
}