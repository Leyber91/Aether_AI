// Integrate wizard schema and runner into the Aether Canvas system
import { WIZARD_EXAMPLES } from './utils/wizardSchema';
import { runWizard } from './utils/wizardRunner';

/**
 * Convert a wizard definition to a Canvas workflow (nodes/edges)
 * Each wizard step becomes a node; edges connect steps in order.
 * @param {WizardDefinition} wizard
 * @returns {{ nodes: Array, edges: Array }}
 */
export function wizardToWorkflow(wizard) {
  const nodes = [];
  const edges = [];
  let prevId = null;
  wizard.steps.forEach((step, idx) => {
    const nodeId = step.id;
    nodes.push({
      id: nodeId,
      type: step.type === 'model' ? 'agent' : (step.type === 'refinement' ? 'tool' : step.type),
      position: { x: 200 + idx * 180, y: 120 },
      data: {
        label: step.type.charAt(0).toUpperCase() + step.type.slice(1) + ' (' + step.model + ')',
        backend: step.model.startsWith('groq') ? 'groq' : 'ollama',
        modelId: step.model,
        instructions: step.type,
        ...step.params
      }
    });
    if (prevId) {
      edges.push({ id: prevId + '-' + nodeId, source: prevId, target: nodeId, animated: true });
    }
    prevId = nodeId;
  });
  // Add input and output nodes
  nodes.unshift({ id: 'input', type: 'start', position: { x: 40, y: 120 }, data: { label: 'Wizard Input' } });
  edges.unshift({ id: 'input-' + wizard.steps[0].id, source: 'input', target: wizard.steps[0].id, animated: true });
  nodes.push({ id: 'output', type: 'output', position: { x: 200 + wizard.steps.length * 180, y: 120 }, data: { label: 'Wizard Output' } });
  edges.push({ id: prevId + '-output', source: prevId, target: 'output', animated: true });
  return { nodes, edges };
}

/**
 * Run a wizard and update canvas logs and output node
 * @param {WizardDefinition} wizard
 * @param {string} userPrompt
 * @param {function} setOutputLogs
 * @param {function} setNodeExecutionData
 * @returns {Promise<void>}
 */
export async function runWizardOnCanvas(wizard, userPrompt, setOutputLogs, setNodeExecutionData) {
  setOutputLogs(logs => [...logs, `[Wizard] Starting: ${wizard.name}`]);
  await runWizard(wizard, userPrompt, (step, input, output, idx) => {
    setOutputLogs(logs => [...logs, `[Wizard] Step ${idx + 1}/${wizard.steps.length}: ${step.type} (${step.model})`]);
    setNodeExecutionData(data => ({ ...data, [step.id]: { input, output } }));
  });
  setOutputLogs(logs => [...logs, `[Wizard] Complete.`]);
}
