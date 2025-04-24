// MCP Filesystem Server integration for WINDSURFALFA
// This script will start the MCP Filesystem server on port 6700, limited to ./data/project-alpha

const { startServer } = require('@modelcontextprotocol/server-filesystem');
const fs = require('fs');
const path = require('path');

// Use the correct root for the Aether_AI structure
const ROOT_DIR = path.join(__dirname, 'data', 'project-alpha');

// Ensure the directory exists
if (!fs.existsSync(ROOT_DIR)) {
  fs.mkdirSync(ROOT_DIR, { recursive: true });
  console.log(`Created directory: ${ROOT_DIR}`);
}

startServer({
  root: ROOT_DIR,
  port: 6700,
  // Add more options here if needed (auth, logging, etc.)
});

console.log(`MCP Filesystem server running at root: ${ROOT_DIR} on port 6700`);
