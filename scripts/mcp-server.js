#!/usr/bin/env node

/**
 * Cortex MCP Server standalone script
 *
 * This script allows running the MCP server directly via npx without global installation
 * Usage: npx @rikaidev/cortex mcp
 */

import { createCortexMCPServer } from '../src/core/mcp/server.js';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let config = {};

  // Simple argument parsing
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--debug':
        config.enableDebugMode = true;
        config.logLevel = 'debug';
        break;
      case '--dev':
        config.enableDebugMode = true;
        config.logLevel = 'debug';
        break;
      case '--project':
      case '--project-root':
        if (i + 1 < args.length) {
          config.projectRoot = args[++i];
        }
        break;
      case '--log-level':
        if (i + 1 < args.length) {
          config.logLevel = args[++i];
        }
        break;
      case '--help':
      case '-h':
        console.log(`
Cortex MCP Server

Usage: npx @rikaidev/cortex mcp [options]

Options:
  --debug              Enable debug mode
  --dev                Enable development mode (same as --debug)
  --project <path>     Set project root directory
  --project-root <path> Set project root directory
  --log-level <level>  Set log level (debug, info, warn, error)
  --help, -h           Show this help message

Examples:
  npx @rikaidev/cortex mcp
  npx @rikaidev/cortex mcp --debug
  npx @rikaidev/cortex mcp --project /path/to/project
        `);
        process.exit(0);
    }
  }

  try {
    console.log('🚀 Starting Cortex MCP Server...');

    // Create and start server
    const server = createCortexMCPServer(config);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT, shutting down...');
      try {
        await server.stop();
      } catch (error) {
        console.error('Error during shutdown:', error);
      }
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      try {
        await server.stop();
      } catch (error) {
        console.error('Error during shutdown:', error);
      }
      process.exit(0);
    });

    // Start server
    await server.start();

  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});


