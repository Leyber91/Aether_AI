// Extraction and JSONification pipeline for Goal-to-Flow Wizard
// Step 1: Extract canonical workflow steps and edges from structured text
// Step 2: Convert canonical structure to valid workflow JSON

import { sendMessageToOllama } from '../../../services/enhancedOllamaService';
import { EXAMPLE_WORKFLOWS } from './workflowStorage';
import { validateWorkflowJson } from './validateWorkflowJson';

// --- Utility: Robust Audit Logging ---
function auditLog(context, message, data) {
  if (!context || typeof context !== 'object') return;
  if (!context._audit) context._audit = [];
  context._audit.push({ timestamp: Date.now(), message, data });
}

// --- Utility: Strip meta/assistant content from LLM output ---
function stripMetaContent(raw) {
  // Remove common meta/assistant phrases and anything outside JSON
  const metaPatterns = [
    /Thank you[\s\S]*?(?=\{|\[|$)/gi,
    /As an AI[\s\S]*?(?=\{|\[|$)/gi,
    /Here (is|are)[\s\S]*?(?=\{|\[|$)/gi,
    /Feel free[\s\S]*?(?=\{|\[|$)/gi,
    /I'm here[\s\S]*?(?=\{|\[|$)/gi,
    /Based on what you[\s\S]*?(?=\{|\[|$)/gi,
    /Note:[\s\S]*?(?=\{|\[|$)/gi,
    /("|')?usage tips?("|')?:[\s\S]*?(?=\{|\[|$)/gi,
    /\n\s*\n/g
  ];
  let cleaned = raw;
  metaPatterns.forEach(pat => { cleaned = cleaned.replace(pat, ''); });
  // Only keep content between first { or [ and last } or ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let jsonStart = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (jsonStart !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(jsonStart, lastBrace + 1);
  }
  return cleaned.trim();
}

// --- Utility: Enforce only one Start node at beginning, all others Agent nodes ---
function enforceStartAndAgentNodesOnly(nodes) {
  // Keep only the first Start node with id 'start' (if any)
  let startNode = null;
  const filteredNodes = [];
  for (const n of nodes) {
    if (n.type === 'start') {
      if (!startNode && n.id === 'start') {
        startNode = n;
      }
      // skip any other Start nodes
      continue;
    }
    if (n.type === 'agent') {
      filteredNodes.push(n);
    }
    // skip Tool, Filter, Output, or any other node types
  }
  return startNode ? [startNode, ...filteredNodes] : filteredNodes;
}

// --- Utility: Heal/auto-correct workflow JSON ---
function healWorkflowJson(obj) {
  // Add missing required fields for nodes/edges if possible
  if (Array.isArray(obj.nodes)) {
    obj.nodes = enforceStartAndAgentNodesOnly(obj.nodes);
    const usedPositions = new Set();
    obj.nodes.forEach((n, i) => {
      if (!n.id) n.id = (n.type || 'agent') + '_' + i;
      if (!n.type) n.type = 'agent';
      // Ensure positions are separated by at least 120 units
      if (!n.position || typeof n.position.x !== 'number' || typeof n.position.y !== 'number') {
        let x = 100 + i * 140;
        let y = 120 + (i % 4) * 120;
        // Avoid overlap with previous
        while (usedPositions.has(`${x},${y}`)) {
          x += 40;
          y += 40;
        }
        n.position = { x, y };
      }
      usedPositions.add(`${n.position.x},${n.position.y}`);
      if (!n.data) n.data = {};
      if (!n.data.label && n.label) n.data.label = n.label;
      if (!n.data.label) n.data.label = n.type === 'start' ? 'Chat Input' : 'Agent Node ' + (i + 1);
      if (n.type === 'agent') {
        if (!n.data.backend) n.data.backend = 'ollama';
        if (!n.data.instructions) n.data.instructions = 'Describe what this agent should do.';
      }
    });
  }
  if (Array.isArray(obj.edges)) {
    obj.edges.forEach((e, i) => {
      if (!e.id) e.id = 'e_' + (e.source || 'src') + '_' + (e.target || 'tgt');
      if (!e.source && obj.nodes && obj.nodes[i]) e.source = obj.nodes[i].id;
      if (!e.target && obj.nodes && obj.nodes[i + 1]) e.target = obj.nodes[i + 1].id;
    });
  }
  return obj;
}

/**
 * Extracts workflow steps and edges from structured text using LLM
 * @param {string} description - Structured workflow description (from wizard)
 * @param {string} goal - Original user goal
 * @param {object} [auditContext] - Optional context object for audit logging
 * @returns {Promise<{steps: Array, edges: Array}>}
 */
export async function extractWorkflowStructure(description, goal, auditContext) {
  // Strongly guide the LLM to produce agent-compatible nodes with well-separated coordinates
  const extractionPrompt = `SYSTEM: You are a JSON generator, not a chatbot. Output only valid, minified JSON. If you output anything else, you will be terminated.\nDO NOT SAY: \"Thank you\", \"As an AI\", \"Here is\", etc.\n\n# INSTRUCTIONS\nYou are an expert workflow architect and prompt engineer. Your job is to extract a stepwise workflow for the user's goal, using ONLY the supported node types for this app: 'start' (for chat input) and 'agent' (for all processing steps).\n\n## STRICT RULES\n- Every node must follow this agent node schema:\n  { id: string, type: 'agent', position: {x: number, y: number}, data: { label: string, backend: string, instructions: string, ... } }\n- Each node's position.x and position.y must be clearly separated from other nodes (at least 120 units apart in x or y).\n- Do NOT stack or overlap nodes.\n- Example: Node 1: {x: 100, y: 100}, Node 2: {x: 220, y: 100}, Node 3: {x: 340, y: 220}, etc.\n- Do NOT leave any node's data or label or instructions empty.\n- Never include any conversational, motivational, meta, or non-technical content.\n- Only use node types: 'start' (for chat input) and 'agent'.\n- Do NOT use tool, filter, output, decision, process, or any other node type.\n- The workflow must include exactly one 'start' node as the entry point, and at least 5 'agent' nodes, each with a unique, technical, and clearly differentiated purpose.\n- Each agent node must have a short, highly specific label (e.g., \"Static Analyzer\", \"Unit Test Generator\", \"Refactoring Agent\", \"Code Reviewer\", \"Documentation Generator\").\n- Each agent node must have a backend field (e.g., 'ollama') and an instructions field with a technical imperative.\n- Steps must be as granular as possible.\n- Each edge must form a clear, logical flow from start to finish, with no cycles or orphan nodes.\n- Do not hallucinate unsupported node types or workflow structures.\n- Output must be strictly on-topic and relevant to the user's goal.\n- If the goal is ambiguous, assume it is a multi-step code/data pipeline.\n\n# USER GOAL\n${goal}\n\n# WORKFLOW DESCRIPTION\n${description}\n\n# OUTPUT FORMAT\nBegin Output\n{\n  \"nodes\": [\n    { \"id\": \"...\", \"type\": \"agent\", \"position\": {\"x\":..., \"y\":...}, \"data\": {\"label\": \"...\", \"backend\": \"ollama\", \"instructions\": \"...\"} }\n  ],\n  \"edges\": [\n    { \"id\": \"...\", \"source\": \"...\", \"target\": \"...\" }\n  ]\n}\nEnd Output`;
  auditLog(auditContext, 'extractionPrompt', extractionPrompt);
  const result = await sendMessageToOllama('phi4-mini', [{ role: 'user', content: extractionPrompt }], { temperature: 0.18 });
  auditLog(auditContext, 'llmExtractionResult', result.content);
  return result.content;
}

/**
 * Converts extracted canonical steps/edges to workflow JSON using LLM
 * @param {string} extracted - Canonical steps/edges (YAML-like list)
 * @param {string} goal - Original user goal
 * @param {object} [auditContext] - Optional context object for audit logging
 * @returns {Promise<{nodes: Array, edges: Array}>}
 */
export async function canonicalToWorkflowJson(extracted, goal, auditContext) {
  const exampleJson = JSON.stringify(EXAMPLE_WORKFLOWS[Object.keys(EXAMPLE_WORKFLOWS)[0]]);
  // --- Robust prompt with negative/positive examples and explicit schema ---
  const jsonPrompt = `SYSTEM: You are a JSON generator, not a chatbot. Output ONLY valid, minified JSON.\nDO NOT SAY: \"Thank you\", \"As an AI\", \"Here is\", etc.\n\n# INSTRUCTIONS\nYou are an expert at converting structured workflow descriptions into valid workflow JSON for the Aether Canvas app.\n\n## STRICT RULES\n- Output ONLY a valid, minified JSON object with just 'nodes' and 'edges' arrays.\n- Do NOT include markdown, comments, explanations, or any extra text.\n- All node types must be 'start' or 'agent' only.\n- Every node must have a unique id, type, position (x, y), and data with a short, technical label.\n- Edges must connect valid node ids and form a logical, acyclic flow.\n- The output must match the schema shown in the example.\n- If the extracted structure is invalid, correct it automatically.\n- If you output anything else, you will be terminated.\n\n# BAD EXAMPLES (DO NOT DO THIS)\nThank you for your request!\nHere is your workflow: ...\nAs an AI language model...\n\n# GOOD EXAMPLE\n{"nodes":[{"id":"start","type":"start","position":{"x":60,"y":150},"data":{"label":"Chat Input"}},{"id":"1","type":"agent","position":{"x":200,"y":150},"data":{"label":"Static Analyzer"}}],"edges":[{"id":"e_start_1","source":"start","target":"1"}]}\n\n# USER GOAL\n${goal}\n\n# CANONICAL STEPS AND EDGES\n${extracted}\n\n# EXAMPLE JSON\n${exampleJson}\nBegin Output`;
  auditLog(auditContext, 'jsonPrompt', jsonPrompt);
  let result = await sendMessageToOllama('qwen3:1.7b', [{ role: 'user', content: jsonPrompt }], { temperature: 0.05 });
  auditLog(auditContext, 'llmJsonResult', result.content);
  let cleaned = stripMetaContent(result.content);
  let parsed = null;
  try {
    parsed = typeof cleaned === 'string' ? JSON.parse(cleaned) : cleaned;
  } catch (err) {
    // Try to extract largest valid JSON substring
    try {
      const jsonMatch = cleaned.match(/[\[{][\s\S]*[\]}]/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {}
    if (!parsed) {
      auditLog(auditContext, 'jsonParseError', { cleaned, error: err.message });
      throw new Error('Failed to parse workflow JSON: ' + err.message);
    }
  }
  // Heal/auto-correct
  parsed = healWorkflowJson(parsed);
  const validation = validateWorkflowJson(parsed);
  auditLog(auditContext, 'validationResult', validation);
  if (!validation.valid) {
    // Try a correction pass with model switch
    const correctionPrompt = `SYSTEM: Fix the following JSON so it passes this schema: nodes must have id, type, position, data.label; edges must have id, source, target.\nInvalid JSON:\n${cleaned}\nErrors:\n${validation.errors.join('\n')}`;
    auditLog(auditContext, 'correctionPrompt', correctionPrompt);
    let correctionResult = await sendMessageToOllama('phi4-mini', [{ role: 'user', content: correctionPrompt }], { temperature: 0.01 });
    auditLog(auditContext, 'llmCorrectionResult', correctionResult.content);
    let correctionCleaned = stripMetaContent(correctionResult.content);
    try {
      parsed = typeof correctionCleaned === 'string' ? JSON.parse(correctionCleaned) : correctionCleaned;
    } catch (err2) {
      const jsonMatch = correctionCleaned.match(/[\[{][\s\S]*[\]}]/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      else {
        auditLog(auditContext, 'correctionParseError', { correctionCleaned, error: err2.message });
        throw new Error('Correction model failed to produce valid JSON: ' + err2.message);
      }
    }
    parsed = healWorkflowJson(parsed);
    const finalValidation = validateWorkflowJson(parsed);
    auditLog(auditContext, 'finalValidationResult', finalValidation);
    if (!finalValidation.valid) {
      auditLog(auditContext, 'finalValidationError', finalValidation);
      throw new Error('Workflow JSON failed schema validation (even after correction): ' + finalValidation.errors.join(', '));
    }
  }
  return parsed;
}
