/**
 * Workspace Utilities
 *
 * Shared helper functions for CLI commands
 */

import chalk from "chalk";

/**
 * Resolve workspace root variable
 */
export function resolveWorkspaceRoot(projectRoot: string): string {
  // Handle Cursor's ${workspaceRoot} variable
  if (projectRoot === "${workspaceRoot}") {
    return (
      process.env.WORKSPACE_ROOT ||
      process.env.WORKSPACE_FOLDER ||
      process.env.CURSOR_WORKSPACE_ROOT ||
      process.cwd()
    );
  }

  // Handle other potential variable formats
  if (projectRoot.includes("${workspaceRoot}")) {
    const workspaceRoot =
      process.env.WORKSPACE_ROOT ||
      process.env.WORKSPACE_FOLDER ||
      process.env.CURSOR_WORKSPACE_ROOT ||
      process.cwd();
    return projectRoot.replace(/\$\{workspaceRoot\}/g, workspaceRoot);
  }

  // Handle other common workspace variables that Cursor might use
  if (projectRoot === "${workspaceFolder}") {
    return (
      process.env.WORKSPACE_FOLDER ||
      process.env.WORKSPACE_ROOT ||
      process.env.CURSOR_WORKSPACE_ROOT ||
      process.cwd()
    );
  }

  if (projectRoot.includes("${workspaceFolder}")) {
    const workspaceRoot =
      process.env.WORKSPACE_FOLDER ||
      process.env.WORKSPACE_ROOT ||
      process.env.CURSOR_WORKSPACE_ROOT ||
      process.cwd();
    return projectRoot.replace(/\$\{workspaceFolder\}/g, workspaceRoot);
  }

  return projectRoot;
}

/**
 * Ensure Cortex workspace exists with error fallback
 */
export async function ensureCortexWorkspace(
  projectPath: string
): Promise<void> {
  const fs = await import("fs-extra");
  const path = await import("path");
  const { initializeCortexWorkspace } = await import("../commands/init.js");

  try {
    const cortexDir = path.join(projectPath, ".cortex");
    const rolesDir = path.join(cortexDir, "roles");

    if (!(await fs.pathExists(rolesDir))) {
      console.log(
        chalk.yellow("  Cortex workspace not found, initializing...")
      );
      await initializeCortexWorkspace(projectPath);
    }
  } catch (error) {
    console.log(chalk.red(" Failed to ensure Cortex workspace:"));
    console.log(
      chalk.gray(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    console.log(
      chalk.yellow("Please run 'cortex init' to initialize the workspace")
    );
    throw error;
  }
}
