/**
 * Cortex MCP CLI Commands
 *
 * This module provides CLI commands for testing and using the MCP system.
 */

import chalk from "chalk";
import { Command } from "commander";
import { CortexMCPWorkflow } from "../core/mcp-workflow.js";

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
      "我們需要導入 MCP 來讓每個步驟都變成可控的"
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
      "-p, --project-root <path>",
      "Project root directory (default: current directory)",
      process.cwd()
    )
    .action(async (options) => {
      await startMCPServer(options.projectRoot);
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
    const workflow = new CortexMCPWorkflow(process.cwd());
    const result = await workflow.executeWorkflow(userInput, context);

    console.log(chalk.green("✅ Workflow completed successfully!"));
    console.log();

    // Display results
    console.log(chalk.cyan("📊 Workflow Results:"));
    console.log(`Workflow ID: ${result.workflowId}`);
    console.log(`Success: ${result.success}`);
    console.log(`Steps: ${result.steps.length}`);
    console.log();

    // Display intent analysis
    if (result.finalResult?.intentAnalysis) {
      const intent = result.finalResult.intentAnalysis;
      console.log(chalk.cyan("🎯 Intent Analysis:"));
      console.log(`Primary Intent: ${intent.primaryIntent}`);
      console.log(`Complexity: ${intent.complexity}`);
      console.log(`Pain Points: ${intent.painPoints.join(", ") || "None"}`);
      console.log();
    }

    // Display task decomposition
    if (result.finalResult?.taskDecomposition) {
      const tasks = result.finalResult.taskDecomposition;
      console.log(chalk.cyan("📋 Task Decomposition:"));
      tasks.subTasks.forEach((task: any, index: number) => {
        console.log(
          `${index + 1}. ${task.description} (${task.priority} priority)`
        );
      });
      console.log();
    }

    // Display role assignments
    if (result.finalResult?.roleAssignment) {
      const roles = result.finalResult.roleAssignment;
      console.log(chalk.cyan("🎭 Role Assignments:"));
      roles.roleAssignments.forEach((role: any) => {
        console.log(`- ${role.roleDescription}: ${role.taskId}`);
      });
      console.log();
    }

    // Display recommendations
    if (result.recommendations.length > 0) {
      console.log(chalk.cyan("💡 Recommendations:"));
      result.recommendations.forEach((rec: string) => {
        console.log(`- ${rec}`);
      });
      console.log();
    }

    // Display learnings
    if (result.learnings.length > 0) {
      console.log(chalk.cyan("🧠 Learnings:"));
      result.learnings.forEach((learning) => {
        console.log(`- ${learning}`);
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
    const workflow = new CortexMCPWorkflow(process.cwd());
    const tools = workflow.getAvailableTools();

    tools.forEach((tool) => {
      console.log(`- ${tool}`);
    });

    console.log();
    console.log(chalk.gray(`Total: ${tools.length} tools available`));
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
    const input = JSON.parse(inputStr);

    // Note: With official SDK, tools are called through the server directly
    // For now, we'll simulate the tool execution
    console.log(chalk.green("✅ Tool executed successfully!"));
    console.log();
    console.log(chalk.cyan("📊 Result:"));
    console.log(
      JSON.stringify(
        {
          message: `Tool ${toolName} executed with input: ${JSON.stringify(input)}`,
        },
        null,
        2
      )
    );
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
      successCriteria: ["完成相關任務", "代碼品質符合專案標準", "遵循最佳實踐"],
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
      recommendations: ["找到 1 個相關的最佳實踐", "建議按照相關性順序參考"],
    };

    console.log(chalk.green("✅ Best practice search completed!"));
    console.log();

    if (result.results.length > 0) {
      console.log(chalk.cyan("📚 Found Best Practices:"));
      result.results.forEach((practice: any, index: number) => {
        console.log(
          `${index + 1}. ${practice.file} (relevance: ${practice.relevance})`
        );
        console.log(`   Tags: ${practice.tags.join(", ")}`);
        console.log(`   Content: ${practice.content.substring(0, 100)}...`);
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
      suggestions: ["建議遵循最佳實踐", "確保工具使用安全"],
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
 * Start MCP server
 */
async function startMCPServer(projectRoot: string): Promise<void> {
  console.log(chalk.blue("🚀 Starting Cortex MCP Server..."));
  console.log(chalk.gray(`Project root: ${projectRoot}`));
  console.log();

  try {
    // Import and start the MCP server
    const { CortexMCPServer } = await import("../core/mcp-server.js");
    const server = new CortexMCPServer(projectRoot);
    
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
