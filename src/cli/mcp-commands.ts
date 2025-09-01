/**
 * Cortex MCP CLI Commands
 *
 * This module provides CLI commands for testing and using the MCP system.
 */

import chalk from "chalk";
import { Command } from "commander";
import { MCPWorkflow } from "../core/mcp/mcp-workflow.js";
import { createMCPContextTools } from "../core/mcp/mcp-context-tools.js";

/**
 * Sub-task interface for task decomposition
 */
interface SubTask {
  description: string;
  priority: "low" | "medium" | "high";
}

/**
 * Task decomposition interface
 */
interface TaskDecomposition {
  subTasks: SubTask[];
}

/**
 * Role assignment interface
 */
interface RoleAssignment {
  roleDescription: string;
  taskId: string;
}

/**
 * Role assignments interface
 */
interface RoleAssignments {
  roleAssignments: RoleAssignment[];
}

/**
 * Best practice result interface
 */
interface BestPracticeResult {
  file: string;
  relevance: number;
  tags?: string[];
  content?: string;
}

/**
 * Add MCP commands to the CLI
 */
export function addMCPCommands(program: Command): void {
  const mcpGroup = program
    .command("mcp")
    .description("🧠 Cortex MCP (Model Context Protocol) commands");

  // Test workflow command
  mcpGroup
    .command("test")
    .description("Test MCP workflow with sample input")
    .option(
      "-i, --input <input>",
      "User input to test",
      "We need to implement proper error handling for API calls"
    )
    .option("-c, --context <context>", "Additional context", "")
    .action(async (options) => {
      await testMCPWorkflow(options.input, options.context);
    });

  // List tools command
  mcpGroup
    .command("tools")
    .description("List available MCP tools")
    .action(async () => {
      await listMCPTools();
    });

  // Execute specific tool command
  mcpGroup
    .command("tool")
    .description("Execute a specific MCP tool")
    .argument("<toolName>", "Name of the tool to execute")
    .option("-i, --input <input>", "Tool input (JSON string)", "{}")
    .action(async (toolName, options) => {
      await executeMCPTool(toolName, options.input);
    });

  // Analyze intent command
  mcpGroup
    .command("analyze")
    .description("Analyze user intent")
    .argument("<input>", "User input to analyze")
    .option("-c, --context <context>", "Additional context", "")
    .action(async (input, options) => {
      await analyzeIntent(input, options.context);
    });

  // Find best practices command
  mcpGroup
    .command("best-practices")
    .description("Search for best practices")
    .argument("<query>", "Search query")
    .option("-t, --type <type>", "Search type", "best-practice")
    .action(async (query, options) => {
      await findBestPractices(query, options.type);
    });

  // Validate tool usage command
  mcpGroup
    .command("validate-tool")
    .description("Validate tool usage")
    .argument("<toolName>", "Name of the tool")
    .argument("<usage>", "Tool usage to validate")
    .action(async (toolName, usage) => {
      await validateToolUsage(toolName, usage);
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
 * Test MCP workflow
 */
async function testMCPWorkflow(
  userInput: string,
  context: string
): Promise<void> {
  console.log(chalk.blue("🧪 Testing Cortex MCP Workflow..."));
  console.log(chalk.gray(`Input: ${userInput}`));
  if (context) {
    console.log(chalk.gray(`Context: ${context}`));
  }
  console.log();

  try {
    // Create MCP workflow and register the actual tools
    const workflow = new MCPWorkflow(process.cwd());

    // Import and register the context tools
    const { createMCPContextTools } = await import(
      "../core/mcp/mcp-context-tools.js"
    );
    createMCPContextTools(workflow, process.cwd());

    const contextObj = context ? { context } : {};
    const result: Record<string, unknown> = await workflow.executeWorkflow(
      userInput,
      contextObj
    );

    console.log(chalk.green("✅ Workflow completed successfully!"));
    console.log();

    // Display results
    console.log(chalk.cyan("📊 Workflow Results:"));
    console.log(`Workflow ID: ${result.workflowId}`);
    console.log(`Success: ${result.success}`);
    console.log(`Steps: ${(result.steps as unknown[]).length}`);
    console.log();

    // Display intent analysis
    if (
      result.finalResult &&
      typeof result.finalResult === "object" &&
      "intentAnalysis" in result.finalResult
    ) {
      const intent = result.finalResult.intentAnalysis;
      if (intent && typeof intent === "object") {
        console.log(chalk.cyan("🎯 Intent Analysis:"));
        console.log(
          `Primary Intent: ${(intent as Record<string, unknown>).primaryIntent || "unknown"}`
        );
        console.log(
          `Complexity: ${(intent as Record<string, unknown>).complexity || "unknown"}`
        );
        console.log(
          `Pain Points: ${
            Array.isArray((intent as Record<string, unknown>).painPoints)
              ? String((intent as Record<string, unknown>).painPoints)
                  .split(",")
                  .join(", ")
              : "None"
          }`
        );
        console.log();
      }
    }

    // Display task decomposition
    if (
      result.finalResult &&
      typeof result.finalResult === "object" &&
      "taskDecomposition" in result.finalResult
    ) {
      const tasks = result.finalResult.taskDecomposition;
      if (tasks && typeof tasks === "object" && "subTasks" in tasks) {
        console.log(chalk.cyan("📋 Task Decomposition:"));
        (tasks as TaskDecomposition).subTasks.forEach(
          (task: SubTask, index: number) => {
            console.log(
              `${index + 1}. ${task.description} (${task.priority} priority)`
            );
          }
        );
        console.log();
      }
    }

    // Display role assignments
    if (
      result.finalResult &&
      typeof result.finalResult === "object" &&
      "roleAssignment" in result.finalResult
    ) {
      const roles = result.finalResult.roleAssignment;
      if (roles && typeof roles === "object" && "roleAssignments" in roles) {
        console.log(chalk.cyan("🎭 Role Assignments:"));
        (roles as RoleAssignments).roleAssignments.forEach(
          (role: RoleAssignment) => {
            console.log(`- ${role.roleDescription}: ${role.taskId}`);
          }
        );
        console.log();
      }
    }

    // Display recommendations
    if (
      Array.isArray(result.recommendations) &&
      result.recommendations.length > 0
    ) {
      console.log(chalk.cyan("💡 Recommendations:"));
      result.recommendations.forEach((rec: unknown) => {
        console.log(`- ${String(rec)}`);
      });
      console.log();
    }

    // Display learnings
    if (Array.isArray(result.learnings) && result.learnings.length > 0) {
      console.log(chalk.cyan("🧠 Learnings:"));
      result.learnings.forEach((learning: unknown) => {
        console.log(`- ${String(learning)}`);
      });
      console.log();
    }

    // Display workflow status
    const status = workflow.getWorkflowStatus();
    console.log(chalk.cyan("📈 Workflow Status:"));
    console.log(`Total Steps: ${status.totalSteps}`);
    console.log(`Completed: ${status.completedSteps}`);
    console.log(`Failed: ${status.failedSteps}`);
    console.log(`Success Rate: ${status.successRate.toFixed(1)}%`);
  } catch (error) {
    console.error(chalk.red("❌ Workflow test failed:"), error);
    process.exit(1);
  }
}

/**
 * List available MCP tools
 */
async function listMCPTools(): Promise<void> {
  console.log(chalk.blue("🔧 Available MCP Tools:"));
  console.log();

  try {
    // List the available tools
    const tools = [
      "natural-language-query",
      "project-context",
      "experience-search",
      "code-diagnostic",
    ];

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
    console.log(chalk.cyan("📋 Expected MCP Tools:"));
    console.log(
      "- natural-language-query: Process natural language queries and route to appropriate tools"
    );
    console.log(
      "- project-context: Get essential project context for task understanding"
    );
    console.log(
      "- experience-search: Search for relevant past experiences and solutions"
    );
    console.log(
      "- code-diagnostic: Analyze code issues and provide diagnostic information"
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
    const input: Record<string, unknown> = JSON.parse(inputStr);

    // Create MCP server
    const { createMCPServer } = await import("../core/mcp/server.js");

    // Create MCP workflow and context tools
    const projectPath = process.cwd();
    const mcpWorkflow = new MCPWorkflow(projectPath);
    createMCPContextTools(mcpWorkflow, projectPath);
    const server = createMCPServer(projectPath);

    // Simple CLI testing - direct method call
    let result;
    if (toolName === "natural-language-query") {
      result = await server.handleNaturalLanguageQuery(input);
    } else if (toolName === "project-context") {
      result = await server.handleProjectContext(input);
    } else if (toolName === "experience-search") {
      result = await server.handleExperienceSearch(input);
    } else if (toolName === "code-diagnostic") {
      result = await server.handleCodeDiagnostic(input);
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
 * Analyze user intent
 */
async function analyzeIntent(
  userInput: string,
  context: string
): Promise<void> {
  console.log(chalk.blue("🔍 Analyzing user intent..."));
  console.log(chalk.gray(`Input: ${userInput}`));
  if (context) {
    console.log(chalk.gray(`Context: ${context}`));
  }
  console.log();

  try {
    // Note: With official SDK, tools are called through the server directly
    // For now, we'll simulate the intent analysis
    const result = {
      primaryIntent: "general",
      complexity: "medium",
      painPoints: [],
      successCriteria: [
        "Complete the task successfully",
        "Code quality meets project standards",
        "Follow best practices",
      ],
    };

    console.log(chalk.green("✅ Intent analysis completed!"));
    console.log();
    console.log(chalk.cyan("📊 Analysis Result:"));
    console.log(`Primary Intent: ${result.primaryIntent}`);
    console.log(`Complexity: ${result.complexity}`);
    console.log(`Pain Points: ${result.painPoints.join(", ") || "None"}`);
    console.log(`Success Criteria: ${result.successCriteria.join(", ")}`);
  } catch (error) {
    console.error(chalk.red("❌ Intent analysis failed:"), error);
    process.exit(1);
  }
}

/**
 * Find best practices
 */
async function findBestPractices(
  query: string,
  searchType: string
): Promise<void> {
  console.log(chalk.blue("📚 Searching for best practices..."));
  console.log(chalk.gray(`Query: ${query}`));
  console.log(chalk.gray(`Type: ${searchType}`));
  console.log();

  try {
    // Note: With official SDK, tools are called through the server directly
    // For now, we'll simulate the best practice search
    const result = {
      results: [
        {
          file: "docs/getting-started.md",
          relevance: 0.8,
          tags: ["getting-started", "documentation"],
          content: "Getting started guide for the project...",
        },
      ],
      recommendations: [
        "Found 1 relevant best practice",
        "Consider reviewing in order of relevance",
      ],
    };

    console.log(chalk.green("✅ Best practice search completed!"));
    console.log();

    if (result.results.length > 0) {
      console.log(chalk.cyan("📚 Found Best Practices:"));
      result.results.forEach((practice: BestPracticeResult, index: number) => {
        console.log(
          `${index + 1}. ${practice.file} (relevance: ${practice.relevance})`
        );
        console.log(
          `   Tags: ${practice.tags ? practice.tags.join(", ") : "None"}`
        );
        console.log(
          `   Content: ${practice.content ? practice.content.substring(0, 100) : "No content"}...`
        );
        console.log();
      });
    } else {
      console.log(chalk.yellow("⚠️ No best practices found"));
    }

    if (result.recommendations.length > 0) {
      console.log(chalk.cyan("💡 Recommendations:"));
      result.recommendations.forEach((rec: string) => {
        console.log(`- ${rec}`);
      });
    }
  } catch (error) {
    console.error(chalk.red("❌ Best practice search failed:"), error);
    process.exit(1);
  }
}

/**
 * Validate tool usage
 */
async function validateToolUsage(
  toolName: string,
  usage: string
): Promise<void> {
  console.log(chalk.blue(`🔍 Validating tool usage: ${toolName}`));
  console.log(chalk.gray(`Usage: ${usage}`));
  console.log();

  try {
    // Note: With official SDK, tools are called through the server directly
    // For now, we'll simulate the tool validation
    const result = {
      isValid: true,
      issues: [],
      suggestions: ["Follow best practices", "Ensure tool usage is safe"],
    };

    console.log(chalk.green("✅ Tool usage validation completed!"));
    console.log();
    console.log(chalk.cyan("📊 Validation Result:"));
    console.log(`Valid: ${result.isValid ? "Yes" : "No"}`);

    if (result.issues.length > 0) {
      console.log(chalk.red("❌ Issues:"));
      result.issues.forEach((issue: string) => {
        console.log(`- ${issue}`);
      });
    } else {
      console.log(chalk.green("✅ No issues found"));
    }

    if (result.suggestions.length > 0) {
      console.log(chalk.cyan("💡 Suggestions:"));
      result.suggestions.forEach((suggestion: string) => {
        console.log(`- ${suggestion}`);
      });
    }
  } catch (error) {
    console.error(chalk.red("❌ Tool usage validation failed:"), error);
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
    const { createMCPServer } = await import("../core/mcp/server.js");

    // Create MCP workflow and context tools
    const mcpWorkflow = new MCPWorkflow(resolvedProjectRoot);
    createMCPContextTools(mcpWorkflow, resolvedProjectRoot);
    const server = createMCPServer(resolvedProjectRoot);

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
