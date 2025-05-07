// Utility for loading, saving, listing, and deleting workflow JSONs locally or in browser
// Uses fs/path if available (Electron/Node), otherwise falls back to localStorage

const fs = window.require ? window.require('fs') : null;
const path = window.require ? window.require('path') : null;

const WORKFLOW_DIR = path ? path.join(process.cwd(), 'Aether_AI', 'CanvasLibrary') : './Aether_AI/CanvasLibrary';
const LS_KEY = 'aether_canvas_workflows';

function isBrowser() {
  return !fs || !path;
}

function getLocalWorkflows() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function setLocalWorkflows(obj) {
  localStorage.setItem(LS_KEY, JSON.stringify(obj));
}

/**
 * List all workflow JSON files in the CanvasLibrary directory
 * @returns {Promise<string[]>} Array of workflow filenames
 */
export async function listWorkflows() {
  if (!isBrowser()) {
    return new Promise((resolve, reject) => {
      fs.readdir(WORKFLOW_DIR, (err, files) => {
        if (err) return reject(err);
        resolve(files.filter(f => f.endsWith('.json')));
      });
    });
  } else {
    const obj = getLocalWorkflows();
    return Object.keys(obj);
  }
}

/**
 * Load a workflow JSON by filename
 * @param {string} filename
 * @returns {Promise<Object>} Parsed workflow object
 */
export async function loadWorkflow(filename) {
  if (!isBrowser()) {
    const fullPath = path.join(WORKFLOW_DIR, filename);
    return new Promise((resolve, reject) => {
      fs.readFile(fullPath, 'utf-8', (err, data) => {
        if (err) return reject(err);
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
  } else {
    const obj = getLocalWorkflows();
    if (!obj[filename]) throw new Error('Workflow not found');
    return obj[filename];
  }
}

/**
 * Save a workflow JSON
 * @param {string} filename
 * @param {Object} workflow
 * @returns {Promise<void>}
 */
export async function saveWorkflow(filename, workflow) {
  if (!isBrowser()) {
    const fullPath = path.join(WORKFLOW_DIR, filename);
    return new Promise((resolve, reject) => {
      fs.writeFile(fullPath, JSON.stringify(workflow, null, 2), 'utf-8', err => {
        if (err) return reject(err);
        resolve();
      });
    });
  } else {
    const obj = getLocalWorkflows();
    obj[filename] = workflow;
    setLocalWorkflows(obj);
  }
}

/**
 * Delete a workflow JSON
 * @param {string} filename
 * @returns {Promise<void>}
 */
export async function deleteWorkflow(filename) {
  if (!isBrowser()) {
    const fullPath = path.join(WORKFLOW_DIR, filename);
    return new Promise((resolve, reject) => {
      fs.unlink(fullPath, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  } else {
    const obj = getLocalWorkflows();
    delete obj[filename];
    setLocalWorkflows(obj);
  }
}

/**
 * Rename a workflow JSON (move/rename the file or key)
 * @param {string} oldName
 * @param {string} newName
 * @returns {Promise<void>}
 */
export async function renameWorkflow(oldName, newName) {
  if (!isBrowser()) {
    const oldPath = path.join(WORKFLOW_DIR, oldName);
    const newPath = path.join(WORKFLOW_DIR, newName);
    return new Promise((resolve, reject) => {
      fs.rename(oldPath, newPath, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  } else {
    const obj = getLocalWorkflows();
    if (!obj[oldName]) throw new Error('Workflow not found');
    obj[newName] = obj[oldName];
    delete obj[oldName];
    setLocalWorkflows(obj);
  }
}

/**
 * Duplicate a workflow JSON (copy under new name)
 * @param {string} filename
 * @param {string} newName
 * @returns {Promise<void>}
 */
export async function duplicateWorkflow(filename, newName) {
  if (!isBrowser()) {
    const fullPath = path.join(WORKFLOW_DIR, filename);
    const newPath = path.join(WORKFLOW_DIR, newName);
    return new Promise((resolve, reject) => {
      fs.copyFile(fullPath, newPath, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  } else {
    const obj = getLocalWorkflows();
    if (!obj[filename]) throw new Error('Workflow not found');
    obj[newName] = JSON.parse(JSON.stringify(obj[filename]));
    setLocalWorkflows(obj);
  }
}

// --- Built-in Example Workflows ---
export const EXAMPLE_WORKFLOWS = {
  "Multi-Agent Research & Summarization": {
    version: 1,
    nodes: [
      { id: "start", type: "start", position: { x: 60, y: 150 }, data: { label: "Topic Input" } },
      { id: "agent1", type: "agent", position: { x: 220, y: 100 }, data: { label: "Research Agent", backend: "ollama", instructions: "Research the topic and return a list of key facts." } },
      { id: "agent2", type: "agent", position: { x: 400, y: 100 }, data: { label: "Summarizer", backend: "ollama", instructions: "Summarize the key facts into a paragraph." } },
      { id: "agent3", type: "agent", position: { x: 400, y: 220 }, data: { label: "Question Generator", backend: "ollama", instructions: "Suggest three follow-up questions." } },
      { id: "output", type: "output", position: { x: 600, y: 160 }, data: { label: "Results Output" } }
    ],
    edges: [
      { id: "e_start_agent1", source: "start", target: "agent1", animated: true },
      { id: "e_agent1_agent2", source: "agent1", target: "agent2", animated: true },
      { id: "e_agent2_agent3", source: "agent2", target: "agent3", animated: true },
      { id: "e_agent3_output", source: "agent3", target: "output", animated: true }
    ]
  },
  "Multilingual Translation Pipeline": {
    version: 1,
    nodes: [
      { id: "start", type: "start", position: { x: 60, y: 150 }, data: { label: "Text Input" } },
      { id: "agent1", type: "agent", position: { x: 220, y: 100 }, data: { label: "Translator", backend: "ollama", instructions: "Translate the input to French." } },
      { id: "agent2", type: "agent", position: { x: 400, y: 100 }, data: { label: "Summarizer", backend: "ollama", instructions: "Summarize the translated text." } },
      { id: "agent3", type: "agent", position: { x: 400, y: 220 }, data: { label: "Sentiment Detector", backend: "ollama", instructions: "Detect the sentiment of the summary." } },
      { id: "output", type: "output", position: { x: 600, y: 160 }, data: { label: "French Summary & Sentiment" } }
    ],
    edges: [
      { id: "e_start_agent1", source: "start", target: "agent1", animated: true },
      { id: "e_agent1_agent2", source: "agent1", target: "agent2", animated: true },
      { id: "e_agent2_agent3", source: "agent2", target: "agent3", animated: true },
      { id: "e_agent3_output", source: "agent3", target: "output", animated: true }
    ]
  },
  "Q&A Assistant with Clarification": {
    version: 1,
    nodes: [
      { id: "start", type: "start", position: { x: 60, y: 150 }, data: { label: "Question Input" } },
      { id: "agent1", type: "agent", position: { x: 220, y: 100 }, data: { label: "Initial Answer", backend: "ollama", instructions: "Answer the question as best as possible." } },
      { id: "agent2", type: "agent", position: { x: 400, y: 100 }, data: { label: "Clarifier", backend: "ollama", instructions: "If the answer is ambiguous, ask for clarification; otherwise, confirm." } },
      { id: "output", type: "output", position: { x: 600, y: 100 }, data: { label: "Final Answer" } }
    ],
    edges: [
      { id: "e_start_agent1", source: "start", target: "agent1", animated: true },
      { id: "e_agent1_agent2", source: "agent1", target: "agent2", animated: true },
      { id: "e_agent2_output", source: "agent2", target: "output", animated: true }
    ]
  },
  "Creative Writing Assistant": {
    version: 1,
    nodes: [
      { id: "start", type: "start", position: { x: 60, y: 150 }, data: { label: "Prompt Input" } },
      { id: "agent1", type: "agent", position: { x: 220, y: 100 }, data: { label: "Idea Generator", backend: "ollama", instructions: "Generate a creative story idea based on the prompt." } },
      { id: "agent2", type: "agent", position: { x: 400, y: 100 }, data: { label: "Plot Expander", backend: "ollama", instructions: "Expand the idea into a plot outline." } },
      { id: "agent3", type: "agent", position: { x: 400, y: 220 }, data: { label: "Title Suggester", backend: "ollama", instructions: "Suggest a catchy title for the story." } },
      { id: "output", type: "output", position: { x: 600, y: 160 }, data: { label: "Story Output" } }
    ],
    edges: [
      { id: "e_start_agent1", source: "start", target: "agent1", animated: true },
      { id: "e_agent1_agent2", source: "agent1", target: "agent2", animated: true },
      { id: "e_agent2_agent3", source: "agent2", target: "agent3", animated: true },
      { id: "e_agent3_output", source: "agent3", target: "output", animated: true }
    ]
  },
  "Data Cleaning & Analysis": {
    version: 1,
    nodes: [
      { id: "start", type: "start", position: { x: 60, y: 150 }, data: { label: "CSV Input" } },
      { id: "agent1", type: "agent", position: { x: 220, y: 100 }, data: { label: "Cleaner", backend: "ollama", instructions: "Clean the CSV data, remove duplicates, fix errors." } },
      { id: "agent2", type: "agent", position: { x: 400, y: 100 }, data: { label: "Analyzer", backend: "ollama", instructions: "Analyze the cleaned data for key trends." } },
      { id: "agent3", type: "agent", position: { x: 400, y: 220 }, data: { label: "Summarizer", backend: "ollama", instructions: "Summarize the main findings in plain English." } },
      { id: "output", type: "output", position: { x: 600, y: 160 }, data: { label: "Analysis Output" } }
    ],
    edges: [
      { id: "e_start_agent1", source: "start", target: "agent1", animated: true },
      { id: "e_agent1_agent2", source: "agent1", target: "agent2", animated: true },
      { id: "e_agent2_agent3", source: "agent2", target: "agent3", animated: true },
      { id: "e_agent3_output", source: "agent3", target: "output", animated: true }
    ]
  },
  "AI Self-Improvement Loop": {
    version: 1,
    nodes: [
      { id: "goal", type: "start", position: { x: 50, y: 200 }, data: { label: "User Goal" } },
      { id: "solution", type: "agent", position: { x: 200, y: 80 }, data: { label: "Initial Solution Generator", backend: "ollama", modelId: "llama3.2:1b", instructions: "Generate initial solution." } },
      { id: "critic", type: "agent", position: { x: 350, y: 80 }, data: { label: "Critic", backend: "groq", modelId: "groq/llama3-70b", instructions: "Critique the solution." } },
      { id: "improver", type: "agent", position: { x: 500, y: 80 }, data: { label: "Improver", backend: "ollama", modelId: "qwen3:4b", instructions: "Improve based on critique." } },
      { id: "knowledge", type: "tool", position: { x: 650, y: 80 }, data: { label: "Knowledge Fetcher", backend: "groq", modelId: "groq/llama3-70b", instructions: "Fetch external knowledge." } },
      { id: "factCheck", type: "agent", position: { x: 800, y: 80 }, data: { label: "Fact Checker", backend: "ollama", modelId: "llama3.2:8b", instructions: "Check facts." } },
      { id: "synth", type: "agent", position: { x: 950, y: 80 }, data: { label: "Synthesizer", backend: "ollama", modelId: "llama3.2:1b", instructions: "Synthesize new solution." } },
      { id: "simulator", type: "tool", position: { x: 1100, y: 80 }, data: { label: "Simulator", backend: "groq", modelId: "groq/llama3-70b", instructions: "Simulate solution in scenarios." } },
      { id: "analyzer", type: "agent", position: { x: 1250, y: 80 }, data: { label: "Result Analyzer", backend: "ollama", modelId: "qwen3:4b", instructions: "Analyze simulation results." } },
      { id: "reflector", type: "agent", position: { x: 1400, y: 80 }, data: { label: "Self-Reflector", backend: "ollama", modelId: "llama3.2:8b", instructions: "Reflect on process." } },
      { id: "plan", type: "agent", position: { x: 1550, y: 80 }, data: { label: "Plan Updater", backend: "groq", modelId: "groq/llama3-70b", instructions: "Update improvement plan." } },
      { id: "altGen", type: "agent", position: { x: 1700, y: 80 }, data: { label: "Alternative Generator", backend: "ollama", modelId: "llama3.2:1b", instructions: "Generate alternative solutions." } },
      { id: "selector", type: "filter", position: { x: 1850, y: 80 }, data: { label: "Selector", instructions: "Select best solution." } },
      { id: "reviewer", type: "agent", position: { x: 2000, y: 80 }, data: { label: "Reviewer", backend: "groq", modelId: "groq/llama3-70b", instructions: "Review and approve." } },
      { id: "personalizer", type: "agent", position: { x: 2150, y: 80 }, data: { label: "Personalizer", backend: "ollama", modelId: "llama3.2:8b", instructions: "Personalize solution." } },
      { id: "formatter", type: "tool", position: { x: 2300, y: 80 }, data: { label: "Formatter", backend: "ollama", modelId: "llama3.2:1b", instructions: "Format for output." } },
      { id: "publisher", type: "output", position: { x: 2450, y: 80 }, data: { label: "Publisher" } },
      { id: "feedback", type: "tool", position: { x: 2600, y: 80 }, data: { label: "Feedback Analyzer", backend: "groq", modelId: "groq/llama3-70b", instructions: "Analyze user feedback." } }
    ],
    edges: [
      { id: "e1", source: "goal", target: "solution" },
      { id: "e2", source: "solution", target: "critic" },
      { id: "e3", source: "critic", target: "improver" },
      { id: "e4", source: "improver", target: "knowledge" },
      { id: "e5", source: "knowledge", target: "factCheck" },
      { id: "e6", source: "factCheck", target: "synth" },
      { id: "e7", source: "synth", target: "simulator" },
      { id: "e8", source: "simulator", target: "analyzer" },
      { id: "e9", source: "analyzer", target: "reflector" },
      { id: "e10", source: "reflector", target: "plan" },
      { id: "e11", source: "plan", target: "altGen" },
      { id: "e12", source: "altGen", target: "selector" },
      { id: "e13", source: "selector", target: "reviewer" },
      { id: "e14", source: "reviewer", target: "personalizer" },
      { id: "e15", source: "personalizer", target: "formatter" },
      { id: "e16", source: "formatter", target: "publisher" },
      { id: "e17", source: "publisher", target: "feedback" }
    ]
  },
};
