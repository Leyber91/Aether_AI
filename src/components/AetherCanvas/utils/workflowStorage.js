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
