#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the directory where this CLI script is located
const cliDir = __dirname;
const mcpServerPath = path.join(cliDir, 'mcp-server.cjs');

// Package information
const packagePath = path.join(cliDir, '..', 'package.json');
let packageInfo = { name: 'armsforge', version: '0.1.0' };

try {
  if (fs.existsSync(packagePath)) {
    packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  }
} catch (error) {
  // Use defaults if package.json can't be read
}

// Parse command line arguments
const args = process.argv.slice(2);

// Handle --version flag
if (args.includes('--version') || args.includes('-v')) {
  console.log(`${packageInfo.name} v${packageInfo.version}`);
  process.exit(0);
}

// Handle --help flag
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${packageInfo.name} v${packageInfo.version}
${packageInfo.description || 'Offensive security toolkit for red team operations'}

Usage:
  armsforge [options]
  af [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show version information

This command starts the Armsforge MCP server for integration with Claude Code.
The server provides tools for exploit development, payload generation, and OPSEC reviews.
`);
  process.exit(0);
}

// Check if the MCP server exists
if (!fs.existsSync(mcpServerPath)) {
  console.error(`Error: MCP server not found at ${mcpServerPath}`);
  console.error('Please ensure the package is properly built with "npm run build"');
  process.exit(1);
}

// Start the MCP server
try {
  const mcpServer = spawn('node', [mcpServerPath, ...args], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Handle process termination
  process.on('SIGINT', () => {
    mcpServer.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    mcpServer.kill('SIGTERM');
  });

  // Exit with the same code as the MCP server
  mcpServer.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code || 0);
    }
  });

  mcpServer.on('error', (error) => {
    console.error(`Failed to start MCP server: ${error.message}`);
    process.exit(1);
  });

} catch (error) {
  console.error(`Error starting Armsforge MCP server: ${error.message}`);
  process.exit(1);
}