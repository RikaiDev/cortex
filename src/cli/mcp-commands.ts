/**
 * Cortex MCP CLI Commands
 *
 * This module provides CLI commands for testing and using the MCP system.
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { Command } from "commander";

/**
 * Add MCP commands to the CLI
 */
export function addMCPCommands(program: Command): void {
  const mcpGroup = program
    .command("mcp")
    .description("🧠 Cortex MCP (Model Context Protocol) commands");

  // List tools command
  mcpGroup
    .command("tools")
    .description("List available MCP tools")
    .action(async () => {
      await listMCPTools();
    });

  // Execute specific tool command
  mcpGroup
    .command("tool <toolName> [input]")
    .description("Execute a specific MCP tool")
    .action(async (toolName, input) => {
      await executeMCPTool(toolName, input || "{}");
    });

  // Generate rules command
  mcpGroup
    .command("generate-rules")
    .description("Regenerate Cortex rules with latest role definitions")
    .option(
      "-p, --project-path <path>",
      "Project path (default: current directory)"
    )
    .action(async (options) => {
      const projectPath = options.projectPath || process.cwd();
      await regenerateRules(projectPath);
    });

  // Initialize workspace command
  mcpGroup
    .command("init")
    .description("Initialize Cortex workspace structure")
    .option(
      "-p, --project-path <path>",
      "Project path (default: current directory)"
    )
    .action(async (options) => {
      const projectPath = options.projectPath || process.cwd();
      await initializeCortexWorkspace(projectPath);
    });

  // Start MCP server command
  mcpGroup
    .command("start")
    .description("Start Cortex MCP server")
    .option(
      "-p, --project-path <path>",
      "Project path (default: current directory)"
    )
    .option("--project-root <path>", "Project root path (for MCP integration)")
    .action(async (options) => {
      const projectRoot =
        options.projectRoot || options.projectPath || process.cwd();
      await startMCPServer(projectRoot);
    });
}

/**
 * List available MCP tools
 */
async function listMCPTools(): Promise<void> {
  console.log(chalk.blue("🔧 Available MCP Tools:"));
  console.log();

  try {
    // List the available tools
    const tools = ["enhance-context", "record-experience"];

    if (tools.length === 0) {
      console.log(
        chalk.yellow(
          "⚠️  No tools registered. This might indicate an issue with tool registration."
        )
      );
    } else {
      tools.forEach((tool: string) => {
        console.log(`- ${tool}`);
      });
    }

    console.log();
    console.log(chalk.gray(`Total: ${tools.length} tools available`));

    // Also show the tools that should be available
    console.log();
    console.log(chalk.cyan("📋 Available MCP Tools:"));
    console.log(
      "- enhance-context: Enhance current context with relevant past experiences and knowledge"
    );
    console.log(
      "- record-experience: Record a new experience or solution for future reference"
    );

    // Show MCP server status
    console.log();
    console.log(chalk.cyan("🚀 MCP Server Status:"));
    console.log("- MCP server provides context engineering tools");
    console.log("- Tools are designed to work with Cursor IDE integration");
    console.log("- Use 'cortex mcp start' to start the MCP server");
  } catch (error) {
    console.error(chalk.red("❌ Failed to list tools:"), error);
    process.exit(1);
  }
}

/**
 * Execute a specific MCP tool
 */
async function executeMCPTool(
  toolName: string,
  inputStr: string
): Promise<void> {
  console.log(chalk.blue(`🔧 Executing MCP tool: ${toolName}`));
  console.log(chalk.gray(`Input: ${inputStr}`));
  console.log();

  try {
    console.log(chalk.gray(`Raw input string: ${inputStr}`));
    const input: Record<string, unknown> = JSON.parse(inputStr);
    console.log(chalk.gray(`Parsed input: ${JSON.stringify(input, null, 2)}`));

    // Create MCP server
    const { createCortexMCPServer } = await import("../core/mcp/server.js");

    const projectPath = process.cwd();
    const server = createCortexMCPServer({ projectRoot: projectPath });

    // Simple CLI testing - direct method call
    let result;
    if (toolName === "enhance-context") {
      result = await (
        server as unknown as {
          handleEnhanceContext: (args: {
            query: string;
            maxItems?: number;
            timeRange?: number;
          }) => Promise<{
            content: Array<{ type: string; text: string }>;
            isError?: boolean;
          }>;
        }
      ).handleEnhanceContext(
        input as {
          query: string;
          maxItems?: number;
          timeRange?: number;
        }
      );
    } else if (toolName === "record-experience") {
      result = await server.handleRecordExperience(
        input as {
          input: string;
          output: string;
          category?: string;
          tags?: string[];
        }
      );
    } else {
      throw new Error(`Tool ${toolName} not supported in CLI mode`);
    }

    console.log(chalk.green("✅ Tool executed successfully!"));
    console.log();
    console.log(chalk.cyan("📊 Result:"));
    if (
      result &&
      result.content &&
      Array.isArray(result.content) &&
      result.content[0]
    ) {
      console.log(result.content[0]);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error(chalk.red("❌ Tool execution failed:"), error);
    process.exit(1);
  }
}

/**
 * Resolve workspace root variable
 */
function resolveWorkspaceRoot(projectRoot: string): string {
  // Handle Cursor's ${workspaceRoot} variable
  if (projectRoot === "${workspaceRoot}") {
    // Try to get workspace root from various environment variables that Cursor might set
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
 * Regenerate Cortex rules with latest role definitions
 */
async function regenerateRules(projectPath: string): Promise<void> {
  console.log(chalk.blue("🔄 Regenerating Cortex rules with latest roles..."));
  console.log(chalk.gray(`Project path: ${projectPath}`));
  console.log();

  try {
    // Import adapters
    const { CursorAdapter } = await import("../adapters/cursor-adapter.js");
    const { ClaudeAdapter } = await import("../adapters/claude-adapter.js");
    const { GeminiAdapter } = await import("../adapters/gemini-adapter.js");

    // Create adapter instances
    const cursorAdapter = new CursorAdapter(projectPath);
    const claudeAdapter = new ClaudeAdapter(projectPath);
    const geminiAdapter = new GeminiAdapter(projectPath);

    // Regenerate configurations
    console.log("📝 Regenerating Cursor rules...");
    await cursorAdapter.generateRules();

    console.log("📝 Regenerating Claude configuration...");
    await claudeAdapter.generateClaudeConfig();

    console.log("📝 Regenerating Gemini configuration...");
    await geminiAdapter.generateGeminiConfig();

    console.log();
    console.log(
      chalk.green("✅ Successfully regenerated all Cortex configurations!")
    );
    console.log(
      chalk.gray("Rules have been updated with the latest role definitions.")
    );
    console.log(
      chalk.gray("You can now use the updated roles in your AI conversations.")
    );
  } catch (error) {
    console.error(chalk.red("❌ Failed to regenerate rules:"), error);
    process.exit(1);
  }
}

/**
 * Start MCP server
 */
async function startMCPServer(projectRoot: string): Promise<void> {
  // Resolve workspace root variable
  const resolvedProjectRoot = resolveWorkspaceRoot(projectRoot);

  console.log(chalk.blue("🚀 Starting Cortex MCP Server..."));
  console.log(chalk.gray(`Project root: ${resolvedProjectRoot}`));
  console.log();

  try {
    // Import and start the MCP server
    const { createCortexMCPServer } = await import("../core/mcp/server.js");

    const server = createCortexMCPServer({ projectRoot: resolvedProjectRoot });

    console.log(chalk.green("✅ MCP server started successfully!"));
    console.log(chalk.gray("Server is running and ready for connections"));
    console.log(chalk.gray("Press Ctrl+C to stop the server"));

    await server.start();

    // Keep the process alive
    process.on("SIGINT", () => {
      console.log(chalk.yellow("\n🛑 Shutting down MCP server..."));
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log(chalk.yellow("\n🛑 Shutting down MCP server..."));
      process.exit(0);
    });
  } catch (error) {
    console.error(chalk.red("❌ Failed to start MCP server:"), error);
    process.exit(1);
  }
}

/**
 * Initialize Cortex workspace structure
 */
export async function initializeCortexWorkspace(
  projectPath: string
): Promise<void> {
  console.log(chalk.blue("🏗️  Initializing Cortex workspace..."));
  console.log(chalk.gray(`Project path: ${projectPath}`));
  console.log();

  try {
    // Create .cortex directory structure
    const cortexDir = path.join(projectPath, ".cortex");
    const workflowsDir = path.join(cortexDir, "workflows");
    const workspacesDir = path.join(cortexDir, "workspaces");
    const rolesDir = path.join(cortexDir, "roles");
    const templatesRolesDir = path.join(projectPath, "templates", "roles");

    // Create directories
    await fs.ensureDir(cortexDir);
    await fs.ensureDir(workflowsDir);
    await fs.ensureDir(workspacesDir);
    await fs.ensureDir(rolesDir);

    // Copy role templates to .cortex/roles if they don't exist
    if (await fs.pathExists(templatesRolesDir)) {
      const roleFiles = await fs.readdir(templatesRolesDir);
      for (const file of roleFiles) {
        if (file.endsWith(".md")) {
          const sourcePath = path.join(templatesRolesDir, file);
          const destPath = path.join(rolesDir, file);
          if (!(await fs.pathExists(destPath))) {
            await fs.copy(sourcePath, destPath);
            console.log(chalk.green(`  ✅ Copied role: ${file}`));
          }
        }
      }
    }

    // Create .cortexrc configuration file
    const cortexConfig = {
      version: "1.0.0",
      initialized: new Date().toISOString(),
      projectRoot: projectPath,
      structure: {
        workflows: ".cortex/workflows",
        workspaces: ".cortex/workspaces",
        roles: ".cortex/roles",
      },
    };

    const configPath = path.join(cortexDir, ".cortexrc");
    await fs.writeJson(configPath, cortexConfig, { spaces: 2 });

    console.log();
    console.log(chalk.green("✅ Cortex workspace initialized successfully!"));
    console.log();
    console.log(chalk.cyan("📁 Created structure:"));
    console.log(`  ${cortexDir}/`);
    console.log(`  ├── .cortexrc          # Configuration file`);
    console.log(`  ├── workflows/         # Workflow state files`);
    console.log(`  ├── workspaces/        # Individual workspace folders`);
    console.log(`  └── roles/             # Role definitions`);
    console.log();
    console.log(chalk.yellow("💡 Next steps:"));
    console.log("  1. Run 'cortex mcp start' to start the MCP server");
    console.log("  2. Use MCP tools to create and manage workflows");
    console.log("  3. Each workflow will have its own workspace folder");
  } catch (error) {
    console.error(chalk.red("❌ Failed to initialize workspace:"), error);
    process.exit(1);
  }
}
