// Simple token estimation utility for OpenAI/Groq-style models
// This is an approximation: 1 token ≈ 4 chars in English text, but code, non-English, etc. may vary
// For robust production use, swap with a real tokenizer like tiktoken if needed

/**
 * Estimate the number of tokens in a string or message array
 * @param {string|Array<{content: string}>} input
 * @returns {number}
 */
export function estimateTokens(input) {
  if (!input) return 0;
  if (typeof input === 'string') {
    return Math.ceil(input.length / 4);
  }
  if (Array.isArray(input)) {
    return input.reduce((sum, msg) => sum + estimateTokens(msg.content || ''), 0);
  }
  return 0;
}

/**
 * Trim a messages array to fit under a token limit, always keeping the latest message
 * @param {Array<{role: string, content: string}>} messages
 * @param {number} maxTokens
 * @returns {Array}
 */
export function trimMessagesToTokenLimit(messages, maxTokens) {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  // Always include the latest message
  let trimmed = [messages[messages.length - 1]];
  let total = estimateTokens(trimmed);
  // Add previous messages backwards until limit
  for (let i = messages.length - 2; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content || '');
    if (total + msgTokens > maxTokens) break;
    trimmed.unshift(msg);
    total += msgTokens;
  }
  return trimmed;
}
