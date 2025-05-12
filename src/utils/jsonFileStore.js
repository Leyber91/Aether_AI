// Utility for reading/writing JSON files (Node.js only, for Electron or server context)
const fs = require('fs');
const path = require('path');

/**
 * Reads a JSON file and returns its contents, or a default value if file is missing/corrupt.
 * @param {string} filePath - Absolute path to JSON file
 * @param {any} defaultValue - Returned if file missing or cannot be parsed
 * @returns {any}
 */
function readJsonFile(filePath, defaultValue = null) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to read or parse JSON at ${filePath}:`, err);
    return defaultValue;
  }
}

/**
 * Writes data to a JSON file, pretty-printed.
 * @param {string} filePath - Absolute path to JSON file
 * @param {any} data - Data to serialize
 */
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Failed to write JSON to ${filePath}:`, err);
    return false;
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile
};
