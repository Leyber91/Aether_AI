// Wizard runner logic for executing wizard definitions step by step
// Integrates with the Aether Canvas node/flow system
import { sendMessageToOllama } from '../../../services/enhancedOllamaService';
import { sendMessageToGroq } from '../../../services/groqService';
import { getStepById, getStepInputs } from './wizardSchema';

/**
 * Runs a wizard definition step by step, invoking models as defined.
 * @param {WizardDefinition} wizard
 * @param {string} userPrompt
 * @param {function} onStep (step, input, output, idx, messages, status) => void
 * @returns {Promise<{success: boolean, error: object, diagnostics: array}>}
 */
export async function runWizard(wizard, userPrompt, onStep) {
  console.log('[WizardRunner] Starting wizard:', wizard.name, wizard);
  const context = { userPrompt };
  const diagnostics = [];
  let error = null;
  for (let idx = 0; idx < wizard.steps.length; idx++) {
    const step = wizard.steps[idx];
    console.log(`[WizardRunner] Step ${idx + 1}/${wizard.steps.length}:`, step);
    // --- Resolve input(s) robustly ---
    let input;
    if (Array.isArray(step.input)) {
      // Always combine all specified inputs, fallback to userPrompt if missing
      input = step.input.map(inp => (context[inp] && context[inp].trim() !== '' ? context[inp] : (inp === 'userPrompt' ? userPrompt : userPrompt))).join('\n\n---\n\n');
    } else if (step.input === 'userPrompt') {
      input = userPrompt;
    } else {
      input = context[step.input] ?? userPrompt;
    }
    // --- Check for missing or empty input ---
    if (!input || (typeof input === 'string' && input.trim() === '')) {
      const errMsg = `[WizardRunner] ERROR: Step ${step.id} received empty input for key '${step.input}'. Halting execution.`;
      console.error(errMsg);
      error = { stepId: step.id, errorType: 'input_error', message: errMsg, contextSnapshot: { ...context } };
      if (onStep) onStep(step, input, '[Runner] ERROR: Empty input.', idx, [], 'input_error');
      diagnostics.push({ stepId: step.id, input, output: '', validatedOutput: '', validationStatus: 'input_error', corrected: false, error, contextSnapshot: { ...context } });
      break;
    }
    console.log(`[WizardRunner] Step ${step.id} input:`, input);
    let output;
    let messages = [];
    let corrected = false;
    let validationStatus = 'not_needed';
    let validatedOutput = '';
    try {
      // Qwen3 models and phi4-mini: use Ollama
      if (
        step.model === 'qwen3:8b' ||
        step.model === 'qwen3:4b' ||
        step.model === 'qwen3:1.7b' ||
        step.model === 'qwen3:0.6b' ||
        step.model === 'phi4-mini'
      ) {
        // --- Robust prompt chaining: full context for every step ---
        messages = [
          { role: 'system', content: step.instructions || step.type || 'You are a helpful assistant.' },
          { role: 'user', content: `User Goal: ${userPrompt}` },
          ...wizard.steps.slice(0, idx).map(prevStep => ({
            role: 'user',
            content: `${prevStep.id.charAt(0).toUpperCase() + prevStep.id.slice(1)} Output: ${context[prevStep.id] || '[none]'}`
          })),
          { role: 'user', content: `Current Input: ${input}` }
        ];
        console.log(`[WizardRunner] Calling Ollama for step ${step.id} with model:`, step.model, 'messages:', messages, 'params:', step.params);
        output = '';
        await sendMessageToOllama(step.model, messages, {
          ...(step.params || {}),
          stream: true,
          onUpdate: (chunk) => {
            output = chunk.content;
            context[step.id] = output;
            onStep(step, input, output, idx, messages, 'running');
          }
        });
        output = context[step.id] || output || `[Ollama-${step.model}] No output.`;
        onStep(step, input, output, idx, messages, 'done');
        console.log(`[WizardRunner] Ollama streamed output for step ${step.id}:`, output);
      } else if (step.model.startsWith('groq')) {
        messages = [
          { role: 'system', content: step.instructions || step.type || 'You are a helpful assistant.' },
          { role: 'user', content: `User Goal: ${userPrompt}` },
          ...wizard.steps.slice(0, idx).map(prevStep => ({
            role: 'user',
            content: `${prevStep.id.charAt(0).toUpperCase() + prevStep.id.slice(1)} Output: ${context[prevStep.id] || '[none]'}`
          })),
          { role: 'user', content: `Current Input: ${input}` }
        ];
        console.log(`[WizardRunner] Calling Groq for step ${step.id} with model:`, step.model, 'messages:', messages);
        output = await sendMessageToGroq(step.model, messages);
        output = output?.content || '[Groq] No output.';
        console.log(`[WizardRunner] Groq output for step ${step.id}:`, output);
      } else {
        output = `[Runner] Unsupported model: ${step.model}`;
        console.warn(`[WizardRunner] Unsupported model for step ${step.id}:`, step.model);
      }
    } catch (err) {
      output = `[Runner] Error running step ${step.id}: ${err?.message || String(err)}`;
      error = { stepId: step.id, errorType: 'model_error', message: output, contextSnapshot: { ...context } };
      console.error(`[WizardRunner] Error running step ${step.id}:`, err);
    }
    // --- Output validation/correction ---
    validatedOutput = output;
    const needsJsonValidation = ['node_generation', 'edge_generation', 'json_correction', 'synthesis', 'planning', 'json_validation'].includes(step.type);
    if (needsJsonValidation) {
      if (!isValidJson(output)) {
        validationStatus = 'invalid';
        console.warn(`[WizardRunner] Output for step ${step.id} is invalid JSON. Attempting auto-correction.`);
        const correctionInstructions = 'You are a JSON repair assistant. Given invalid JSON, output ONLY valid, minified JSON with the same intended structure. NO prose, NO markdown, NO commentary. If you cannot fix, output INVALID.';
        validatedOutput = await autoCorrectJsonOutput(step.model, output, correctionInstructions, step.params);
        corrected = true;
        if (!isValidJson(validatedOutput)) {
          const errMsg = `[WizardRunner] Auto-correction failed for step ${step.id}. Output remains invalid.`;
          console.error(errMsg);
          validationStatus = 'correction_failed';
          error = { stepId: step.id, errorType: 'correction_failed', message: errMsg, contextSnapshot: { ...context }, originalOutput: output };
        } else {
          validationStatus = 'corrected';
        }
      } else {
        validationStatus = 'valid';
      }
    }
    // --- Fallback for clarify step: extract first valid technical sentence ---
    if (step.id === 'clarify' && (validationStatus === 'not_needed' || validationStatus === 'invalid' || validationStatus === 'correction_failed')) {
      // If output is not a single technical sentence, try to extract one
      const fallback = extractFirstTechnicalSentence(output);
      if (fallback) {
        console.warn('[WizardRunner] Fallback: extracted first technical sentence from clarify output:', fallback);
        validatedOutput = fallback;
        validationStatus = 'fallback_extracted';
        error = null; // clear error if fallback succeeds
      }
    }
    context[step.id] = validatedOutput;
    diagnostics.push({ stepId: step.id, input, output, validatedOutput, validationStatus, corrected, error, contextSnapshot: { ...context } });
    // --- Logging and snapshotting ---
    console.log(`[WizardRunner] Step ${step.id} transition:`, {
      stepId: step.id,
      input,
      output,
      validatedOutput,
      validationStatus,
      corrected,
      contextSnapshot: { ...context }
    });
    if (error) break;
  }
  console.log('[WizardRunner] Finished wizard:', wizard.name);
  if (error) {
    return { success: false, error, diagnostics };
  }
  return { success: true, diagnostics };
}

// --- Utility: Validate JSON output ---
function isValidJson(str) {
  try {
    const obj = JSON.parse(str);
    return typeof obj === 'object' && obj !== null;
  } catch {
    return false;
  }
}

// --- Utility: Correction prompt for invalid JSON ---
async function autoCorrectJsonOutput(model, invalidOutput, correctionInstructions, stepParams) {
  const correctionPrompt = [
    { role: 'system', content: correctionInstructions },
    { role: 'user', content: `Here is the invalid output to correct:\n${invalidOutput}` }
  ];
  const result = await sendMessageToOllama(model, correctionPrompt, { ...stepParams, stream: false });
  return result?.content || '';
}

// --- Utility: Extract first valid technical sentence from clarify output ---
function extractFirstTechnicalSentence(output) {
  // Accepts only a single non-empty technical sentence (no markdown, no list, no heading, no meta-question)
  if (!output || typeof output !== 'string') return '';
  // Remove markdown, lists, and headings
  let cleaned = output.replace(/[#\-*`>]+/g, '').replace(/\n+/g, ' ').trim();
  // Extract first sentence ending with a period
  const match = cleaned.match(/([A-Z][^\.\?!]*[\.\?!])/);
  if (match && match[1].length < 200 && !/clarify|specify|please|ethical|abstract|list|step|workflow|markdown|heading|meta/i.test(match[1])) {
    return match[1].trim();
  }
  return '';
}
