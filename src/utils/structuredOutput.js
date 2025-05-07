// Utility functions for validating and parsing structured JSON output from LLMs

/**
 * The schema for agent outputs.
 * You can extend this as needed for more complex workflows.
 */
export const AGENT_OUTPUT_SCHEMA = {
  thought: 'string',
  analysis: 'string',
  action: 'string',
  response: 'string',
};

/**
 * Try to parse a string as JSON and validate it against the schema.
 * Returns { valid: boolean, data: object|null, error: string|null }
 */
export function parseAndValidateAgentOutput(text, schema = AGENT_OUTPUT_SCHEMA) {
  try {
    const obj = JSON.parse(text);
    for (const key of Object.keys(schema)) {
      if (!(key in obj) || typeof obj[key] !== schema[key]) {
        return { valid: false, data: null, error: `Missing or invalid field: ${key}` };
      }
    }
    return { valid: true, data: obj, error: null };
  } catch (e) {
    return { valid: false, data: null, error: 'Invalid JSON' };
  }
}

/**
 * Format the system prompt to instruct the agent to use a strict JSON schema.
 */
export function getAgentSystemPrompt(role) {
  return `You are ${role}. Always respond in the following JSON format, with no text outside the JSON object.\n` +
    '{\n' +
    '  "thought": "<your internal reasoning>",\n' +
    '  "analysis": "<structured breakdown of the situation>",\n' +
    '  "action": "<what to do next>",\n' +
    '  "response": "<the message to display to the user or next agent>"\n' +
    '}';
}
