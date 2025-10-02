#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { addMCPCommands } from "./mcp-commands.js";

const program = new Command();

// Get package.json version dynamically
interface PackageInfo {
  name?: string;
  version?: string;
  [key: string]: unknown;
}
let packageJson: PackageInfo;
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageJsonPath = path.join(__dirname, "..", "..", "package.json");
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
} catch (error) {
  // Fallback: try to read from current working directory
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch (fallbackError) {
    // Final fallback: use a default version
    packageJson = { version: "0.7.2" };
  }
}

program
  .name("cortex")
  .description("🧠 Cortex - AI Collaboration Brain")
  .version(packageJson.version || "0.8.0")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  );

addMCPCommands(program);

// Main task command - simplified interface
program
  .command("task <description>")
  .description(
    "🧠 Execute a development task with full AI collaboration workflow"
  )
  .option("--draft-pr", "Create PR as draft")
  .option(
    "--base-branch <branch>",
    "Base branch for PR (default: main)",
    "main"
  )
  .action(
    async (
      description: string,
      options: { draftPr?: boolean; baseBranch?: string }
    ) => {
      const projectPath = program.opts().projectPath || process.cwd();
      await executeTask(description, projectPath, options);
    }
  );

// Handle unknown commands
program.on("command:*", () => {
  console.error("error: unknown command");
  process.exit(1);
});

program.parse();

/**
 * Execute a complete development task with AI collaboration workflow
 */
async function executeTask(
  description: string,
  projectPath: string,
  options: { draftPr?: boolean; baseBranch?: string }
): Promise<void> {
  const { createCortexMCPServer } = await import("../core/mcp/server.js");
  const fs = await import("fs-extra");
  const path = await import("path");

  console.log("🧠 Cortex AI - Starting collaborative development task");
  console.log("==================================================");
  console.log(`📋 Task: ${description}`);
  console.log(`📁 Project: ${projectPath}`);
  console.log();

  try {
    // Step 1: Ensure MCP workspace is initialized
    console.log("🔧 Checking MCP workspace...");
    const cortexDir = path.join(projectPath, ".cortex");
    const rolesDir = path.join(cortexDir, "roles");

    if (!(await fs.pathExists(rolesDir))) {
      console.log("📦 Initializing MCP workspace...");
      const { initializeCortexWorkspace } = await import("./mcp-commands.js");
      await initializeCortexWorkspace(projectPath);
    }

    // Step 2: Initialize MCP server
    console.log("🤖 Initializing AI collaboration system...");
    const mcpServer = createCortexMCPServer({ projectRoot: projectPath });

    // Step 3: Enhance context with relevant past experiences
    console.log("🧠 Enhancing context with past experiences...");
    try {
      const enhanceResult = await mcpServer.executeMCPTool("enhance-context", {
        query: description,
        maxItems: 5,
      });
      if (enhanceResult.content && enhanceResult.content[0]) {
        console.log("📚 Found relevant experiences to enhance context");
      }
    } catch (error) {
      console.log(
        "ℹ️  No relevant past experiences found, proceeding with fresh context"
      );
    }

    // Step 4: Create workflow using MCP tool
    console.log("📝 Creating workflow...");
    const createWorkflowResult = await mcpServer.executeMCPTool(
      "create-workflow",
      {
        title: `Task: ${description}`,
        description: description,
      }
    );

    if (createWorkflowResult.isError || !createWorkflowResult.content?.[0]) {
      throw new Error("Failed to create workflow");
    }

    // Extract workflow ID from result
    const resultText = createWorkflowResult.content[0].text;
    const workflowIdMatch =
      resultText.match(/workflow\s+(\w+)/i) || resultText.match(/ID:\s*(\w+)/i);
    if (!workflowIdMatch) {
      throw new Error("Could not extract workflow ID from creation result");
    }
    const workflowId = workflowIdMatch[1];
    console.log(`✅ Workflow created: ${workflowId}`);
    console.log();

    // Step 5: Execute workflow roles automatically using MCP tool
    console.log("🎭 Executing workflow roles...");
    let stepCount = 0;
    const maxSteps = 10; // Prevent infinite loops

    while (stepCount < maxSteps) {
      stepCount++;
      console.log(`\n📍 Step ${stepCount}: Executing next workflow role`);

      try {
        const executeResult = await mcpServer.executeMCPTool(
          "execute-workflow-role",
          {
            workflowId: workflowId,
          }
        );

        if (executeResult.isError || !executeResult.content?.[0]) {
          console.log(
            `❌ Step ${stepCount} failed: Could not execute workflow role`
          );
          break;
        }

        const executionText = executeResult.content[0].text;
        console.log("✅ Role execution completed");

        // Check if workflow is completed
        if (
          executionText.includes("Workflow Completed Successfully") ||
          executionText.includes("workflow has been completed")
        ) {
          console.log("\n🎉 Workflow completed successfully!");
          break;
        }
      } catch (error) {
        console.error(
          `❌ Step ${stepCount} failed: ${error instanceof Error ? error.message : String(error)}`
        );
        break;
      }
    }

    // Step 6: Record experience for future learning
    console.log("📚 Recording experience for future learning...");
    try {
      await mcpServer.executeMCPTool("record-experience", {
        input: description,
        output: `Completed multi-role workflow for: ${description}. Generated PR documentation and workspace files.`,
        category: "workflow-execution",
      });
      console.log("✅ Experience recorded successfully");
    } catch (error) {
      console.log("⚠️  Could not record experience, but task completed");
    }

    // Step 7: Create PR if workflow completed
    console.log("\n🚀 Creating pull request...");
    try {
      const prResult = await mcpServer.executeMCPTool("create-pull-request", {
        workflowId: workflowId,
        baseBranch: options.baseBranch || "main",
        draft: options.draftPr || false,
      });

      if (prResult.content && prResult.content[0]) {
        console.log(prResult.content[0].text);
      }
    } catch (error) {
      console.log("⚠️  PR creation failed, but workflow files are available");
      console.log("💡 Check .cortex/workspaces/ directory for generated files");
    }

    console.log("\n✨ Task execution completed!");
  } catch (error) {
    console.error(
      "❌ Task execution failed:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
