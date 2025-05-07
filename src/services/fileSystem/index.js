/**
 * FileSystem Service
 * Provides utilities for interacting with the file system through MCP
 */

import axios from 'axios';

const MCP_API_URL = '/mcp-api';

/**
 * List files in a directory
 * @param {string} path - Directory path to list
 * @param {string} pattern - File pattern to match (e.g., "*.json")
 * @returns {Promise<Array>} - List of files
 */
export async function listFiles(path, pattern = '*') {
  try {
    const response = await axios.post(`${MCP_API_URL}/tools/list_files`, {
      path,
      pattern
    });
    return response.data.files || [];
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * Read a file's contents
 * @param {string} path - Path to the file
 * @returns {Promise<string>} - File contents
 */
export async function readFile(path) {
  try {
    const response = await axios.post(`${MCP_API_URL}/tools/read_file`, {
      path
    });
    return response.data.content || '';
  } catch (error) {
    console.error('Error reading file:', error);
    return '';
  }
}

/**
 * Write content to a file
 * @param {string} path - Path to the file
 * @param {string} content - Content to write
 * @param {boolean} createDirs - Create parent directories if they don't exist
 * @returns {Promise<boolean>} - Success status
 */
export async function writeFile(path, content, createDirs = true) {
  try {
    const response = await axios.post(`${MCP_API_URL}/tools/write_file`, {
      path,
      content,
      create_dirs: createDirs
    });
    return response.data.success || false;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
}

/**
 * Delete a file or directory
 * @param {string} path - Path to delete
 * @param {boolean} recursive - Recursively delete directories
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteFile(path, recursive = false) {
  try {
    const response = await axios.post(`${MCP_API_URL}/tools/delete_file`, {
      path,
      recursive
    });
    return response.data.success || false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Check if the MCP server is available
 * @returns {Promise<boolean>} - Whether the MCP server is available
 */
export async function checkMCPAvailability() {
  try {
    await axios.get(`${MCP_API_URL}/health`);
    return true;
  } catch (error) {
    console.error('MCP server unavailable:', error);
    return false;
  }
}

/**
 * Analyze a file or directory
 * This is a higher-level function that combines multiple MCP operations
 * to provide a comprehensive analysis
 * @param {string} path - Path to analyze
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeFileOrDirectory(path) {
  try {
    // First check if it's a file or directory
    const files = await listFiles(path.split('/').slice(0, -1).join('/') || '.', path.split('/').pop());
    
    if (files.length === 0) {
      // Try as directory
      const dirContents = await listFiles(path);
      
      if (dirContents.length > 0) {
        // It's a directory
        return {
          type: 'directory',
          path,
          contents: dirContents,
          count: dirContents.length
        };
      } else {
        // Not found
        return {
          type: 'not_found',
          path,
          error: 'File or directory not found'
        };
      }
    } else {
      // It's a file
      const content = await readFile(path);
      return {
        type: 'file',
        path,
        content,
        size: content.length
      };
    }
  } catch (error) {
    console.error('Error analyzing file/directory:', error);
    return {
      type: 'error',
      path,
      error: error.message
    };
  }
}
