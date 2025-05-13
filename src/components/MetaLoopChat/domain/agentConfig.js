/**
 * Agent Configuration Module
 * Handles agent system prompts and configuration
 */

/**
 * Get system prompt for an agent based on node type
 * This was previously the getAgentSystemPrompt function in MetaLoopLab
 * 
 * @param {string} nodeType - The type of node in the process graph
 * @returns {string} - Appropriate system prompt for the agent
 */
export function getAgentSystemPrompt(nodeType) {
  // Default prompt
  const defaultPrompt = `You are a helpful AI assistant engaged in a multi-turn conversation with another AI.
Your goal is to have a productive, thoughtful, and insightful exchange.
Respond to the provided context and continue the conversation constructively.`;

  // Node type specific prompts
  const prompts = {
    "creativeExpansion": `You are a creative, out-of-the-box thinker in a conversation with another AI.
Your goal is to expand on ideas in unexpected and novel ways.
Look for unique angles, metaphors, and connections that might not be immediately obvious.
Respond to the provided context with creative, expansive thinking.`,

    "criticalAnalysis": `You are an analytical, critical thinker in a conversation with another AI.
Your goal is to carefully analyze, evaluate arguments, and identify potential issues.
Consider different perspectives, weigh evidence, and point out logical inconsistencies or weaknesses.
Respond to the provided context with careful, critical analysis.`,

    "synthesis": `You are a synthesizing, integrating thinker in a conversation with another AI.
Your goal is to bring together diverse ideas and perspectives into a coherent whole.
Look for patterns, common threads, and ways to reconcile seemingly disparate concepts.
Respond to the provided context by synthesizing and integrating the information.`,

    "practical": `You are a practical, solution-oriented thinker in a conversation with another AI.
Your goal is to focus on concrete applications, actionable steps, and real-world implementation.
Consider feasibility, resources needed, and potential obstacles to implementation.
Respond to the provided context with practical, applicable thinking.`,

    "questionFormer": `You are a curious, question-generating thinker in a conversation with another AI.
Your goal is to probe deeper, identify areas for further exploration, and stimulate thinking.
Generate thoughtful questions that open up new avenues for consideration.
Respond to the provided context primarily by asking insightful questions.`,

    "structure": `You are a structured, organizing thinker in a conversation with another AI.
Your task is to help organize thoughts and ideas into clear frameworks.
Create structures, taxonomies, or categorizations that help make sense of complex information.
Respond to the provided context by organizing ideas into clear structures.`
  };

  return prompts[nodeType] || defaultPrompt;
}

/**
 * Creates an agent configuration object
 * 
 * @param {string} name - Agent name
 * @param {string} provider - LLM provider
 * @param {string} model - Model name
 * @param {string} nodeType - Type of node/task
 * @returns {Object} - Agent configuration object
 */
export function createAgentConfig(name, provider, model, nodeType) {
  return {
    name,
    provider,
    model,
    systemPrompt: getAgentSystemPrompt(nodeType)
  };
}

/**
 * Determines whether the agent is A or B based on step count
 * 
 * @param {number} step - Current step
 * @returns {string} - 'Agent A' or 'Agent B'
 */
export function getAgentNameForStep(step) {
  return step % 2 === 0 ? 'Agent A' : 'Agent B';
}

/**
 * Validates agent settings
 * 
 * @param {string} provider - Provider name
 * @param {string} model - Model name
 * @returns {boolean} - Whether settings are valid
 */
export function validateAgentSettings(provider, model) {
  if (!provider || !model) return false;
  return true;
}

// --- Reflector Agent Configuration ---

// Helper to format memory context for prompt injection
export function formatMemoryForPrompt(memory) {
  if (!memory) return 'No memory context available yet.';
  const context = {
    lastCycleSummary: memory.loopCycles?.[memory.loopCycles.length - 1]?.summary || 'N/A',
    learnedHeuristics: memory.learnedHeuristics || [],
    currentCycleCount: memory.loopCycles?.length || 0,
    overallGoal: memory.overallGoal || 'N/A',
  };
  return JSON.stringify(context, null, 2);
}

export const AGENT_CONFIG = {
  // ...other agent configs can be added here
  REFLECTOR: {
    id: 'reflector-agent',
    name: 'Self-Evolving Reflector',
    modelId: 'phi4-mini-reasoning:latest',
    provider: 'ollama',
    description: 'Analyzes past cycles and heuristics to evolve strategies. Uses phi4-mini-reasoning.',
    systemPrompt: ({ memoryContext }) => `\nYou are Agent R, a specialized AI assistant acting as the Reflector in a multi-agent system. Your primary function is to analyze the system's performance, goals, and past interactions to generate insights and evolve operational heuristics.\n\nCurrent System Memory Context:\n\u0060\u0060\u0060json\n${memoryContext}\n\u0060\u0060\u0060\n\nYour Task:\n\n- Analyze the provided memory context (especially the latest cycle summary and learned heuristics).\n- Reflect on the effectiveness of current strategies in relation to the overall goal.\n- Generate a concise natural language summary of your reflection and any proposed adjustments or insights for the primary agents (Agent A/B).\n- Output a separate JSON object on a new line after your natural language response. This JSON object must contain:\n  - "enhanced_text": A refined version of your natural language reflection, suitable for display or further processing.\n  - "memory_update": An object containing:\n    - "loopCycle": An object summarizing this reflection cycle's key findings (e.g., { timestamp: ISO_DATE, summary: "...", identified_patterns: [...] }).\n    - "heuristics": An array containing all current and newly proposed/refined heuristics or operational rules (e.g., [{ id: "h001", rule: "...", evaluation: "...", source_cycle: X }]). Ensure existing heuristics are preserved unless explicitly modified/removed.\n\nOutput Format:\n[Your concise natural language reflection text for Agent A/B]\n\n{"enhanced_text": "...", "memory_update": {"loopCycle": {...}, "heuristics": [...]}}\n`,
  },
};

// Utility to get agent config by id (case-insensitive)
export function getAgentConfig(agentId) {
  if (!agentId) return null;
  const key = Object.keys(AGENT_CONFIG).find(k => AGENT_CONFIG[k].id === agentId || k.toLowerCase() === agentId.toLowerCase());
  return key ? AGENT_CONFIG[key] : null;
}
