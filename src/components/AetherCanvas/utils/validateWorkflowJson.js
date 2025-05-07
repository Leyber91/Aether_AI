// Utility to validate workflow JSON structure for Aether Canvas
// Returns { valid: boolean, errors: string[] }

export function validateWorkflowJson(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') {
    errors.push('Workflow must be an object.');
    return { valid: false, errors };
  }
  if (!Array.isArray(obj.nodes)) {
    errors.push('Workflow must have a nodes array.');
  }
  if (!Array.isArray(obj.edges)) {
    errors.push('Workflow must have an edges array.');
  }
  // Optionally check node/edge shape
  if (Array.isArray(obj.nodes)) {
    obj.nodes.forEach((n, i) => {
      if (!n.id || !n.type || !n.position || !n.data) {
        errors.push(`Node at index ${i} is missing required fields.`);
      }
    });
  }
  if (Array.isArray(obj.edges)) {
    obj.edges.forEach((e, i) => {
      if (!e.id || !e.source || !e.target) {
        errors.push(`Edge at index ${i} is missing required fields.`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}
