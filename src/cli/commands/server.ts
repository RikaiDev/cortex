/**
 * Server Command
 *
 * Start Cortex MCP server
 */

import chalk from "chalk";
import type { Command } from "commander";
import { ensureCortexWorkspace, resolveWorkspaceRoot } from "../utils/workspace.js";

/**
 * Register server command
 */
export function registerServerCommand(program: Command): void {
  program
    .command("start")
    .description("Start Cortex MCP server")
    .option(
      "-p, --project-path <path>",
      "Project path (default: current directory)"
    )
    .option("--project-root <path>", "Project root path (for MCP integration)")
    .action(async (options) => {
      try {
        const projectRoot =
          options.projectRoot || options.projectPath || process.cwd();
        await startMCPServer(projectRoot);
      } catch {
        console.log(
          chalk.yellow("  Attempting to initialize workspace due to error...")
        );
        const projectRoot =
          options.projectRoot || options.projectPath || process.cwd();
        await ensureCortexWorkspace(projectRoot);
        await startMCPServer(projectRoot);
      }
    });
}

/**
 * Start MCP server
 */
async function startMCPServer(projectRoot: string): Promise<void> {
  // Resolve workspace root variable
  resolveWorkspaceRoot(projectRoot);

  // Don't log to stdout as it breaks MCP JSON-RPC protocol
  try {
    // Import and start the MCP server
    const { createCortexMCPServer } = await import("../../core/mcp/server.js");

    await createCortexMCPServer();

    // Keep the process alive
    process.on("SIGINT", () => {
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      process.exit(0);
    });
  } catch (error) {
    console.error(chalk.red(" Failed to start MCP server:"), error);
    process.exit(1);
  }
}
