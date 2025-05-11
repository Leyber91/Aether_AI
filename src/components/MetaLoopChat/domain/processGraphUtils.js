/**
 * Process Graph Utilities
 * Handles graph traversal and processing logic
 */

/**
 * Gets the model options for a specific provider
 * 
 * @param {string} provider - The provider name (e.g., "ollama", "groq")
 * @param {Array} ollamaModels - Available Ollama models
 * @param {Array} groqModels - Available Groq models
 * @returns {Array} - Array of model objects with id and name
 */
export function getModelOptions(provider, ollamaModels, groqModels) {
  if (provider === "ollama") {
    return ollamaModels.map(m => ({ id: m.name, name: m.name }));
  }
  if (provider === "groq") {
    return groqModels.map(m => ({ id: m.id, name: m.id }));
  }
  return [];
}

/**
 * Creates a node map from graph nodes
 * 
 * @param {Array} nodes - Graph nodes
 * @returns {Object} - Map of node IDs to nodes
 */
export function createNodeMap(nodes) {
  return Object.fromEntries(nodes.map(n => [n.id, n]));
}

/**
 * Finds the next node in the graph
 * 
 * @param {Array} edges - Graph edges
 * @param {string} currentNodeId - Current node ID
 * @returns {string|null} - Next node ID or null if no next node
 */
export function findNextNode(edges, currentNodeId) {
  const nextEdge = edges.find(e => e.source === currentNodeId);
  return nextEdge ? nextEdge.target : null;
}

/**
 * Validates that a graph path exists starting from entry
 * 
 * @param {Object} graph - Process graph object
 * @returns {boolean} - Whether the graph is valid
 */
export function validateGraph(graph) {
  const { nodes, edges, entry } = graph;
  
  // Check if entry exists
  if (!entry || !nodes.some(n => n.id === entry)) {
    return false;
  }
  
  // Check if all edges reference valid nodes
  for (const edge of edges) {
    const sourceExists = nodes.some(n => n.id === edge.source);
    const targetExists = nodes.some(n => n.id === edge.target);
    
    if (!sourceExists || !targetExists) {
      return false;
    }
  }
  
  return true;
}

/**
 * Checks if required model settings are valid for looping
 * 
 * @param {string} modelA - Model A ID
 * @param {string} modelB - Model B ID
 * @returns {boolean} - Whether all required models are selected
 */
export function validateModelSettings(modelA, modelB) {
  return Boolean(modelA && modelB);
}
