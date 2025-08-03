#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { CortexCLI } from "./cortex-cli.js";
import { addMCPCommands } from "./mcp-commands.js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const program = new Command();

// Get package.json version dynamically
let packageJson: any;
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
    packageJson = { version: "0.7.1" };
  }
}

program
  .name("cortex")
  .description("🧠 Cortex - AI Collaboration Brain")
  .version(packageJson.version)
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  );

addMCPCommands(program);

program
  .command("install-global-mcp")
  .description("Install global MCP configuration for Cursor")
  .action(async (_options) => {
    try {
      console.log(chalk.blue("🔧 Installing Cortex MCP configuration..."));

      // Get user's home directory
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      if (!homeDir) {
        throw new Error("Could not determine home directory");
      }

      // Create .cursor directory if it doesn't exist
      const cursorDir = path.join(homeDir, ".cursor");
      await fs.ensureDir(cursorDir);

      // Path to mcp.json
      const mcpConfigPath = path.join(cursorDir, "mcp.json");

      // Read existing mcp.json or create new one
      let mcpConfig: any = { mcpServers: {} };
      if (await fs.pathExists(mcpConfigPath)) {
        const existingConfig = await fs.readFile(mcpConfigPath, "utf-8");
        mcpConfig = JSON.parse(existingConfig);
      }

      // Add cortex-mcp-server configuration
      mcpConfig.mcpServers["cortex-mcp-server"] = {
        command: "cortex",
        args: ["mcp", "start", "--project-root", "${workspaceRoot}"],
        timeout: 600000,
        env: {
          NODE_ENV: "production",
          MCP_DEBUG: "false",
          PROJECT_ROOT: "${workspaceRoot}",
          DOCS_CACHE_TTL: "300000",
        },
        autoApprove: [
          "context-enhancer",
          "experience-recorder",
          "standards-detector",
          "standards-applier",
          "standards-summary",
          "standards-export",
          "register-standards-patterns",
          "cortex-feedback-collector",
          "cortex-feedback-analyzer",
          "cortex-feedback-responder",
          "cortex-user-simulator",
          "cortex-learning-integrator",
        ],
      };

      // Write updated configuration
      await fs.writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));

      console.log(chalk.green("✅ MCP configuration installed successfully!"));
      console.log(
        chalk.cyan("📁 Configuration location:") + ` ${mcpConfigPath}`
      );
      console.log();
      console.log(chalk.yellow("📋 Next steps:"));
      console.log("1. Restart Cursor IDE");
      console.log("2. The MCP tools will be automatically available");
      console.log("3. Check Cursor settings to ensure MCP is enabled");
    } catch (error) {
      console.error(
        chalk.red("❌ Failed to install MCP configuration:"),
        error
      );
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Initialize Cortex in your project and detect project type")
  .action(async (options) => {
    try {
      // First, detect project type
      console.log(chalk.blue("🔍 Detecting project type..."));
      const { ProjectAnalyzer } = await import(
        "../core/project/project-analyzer.js"
      );
      const analyzer = new ProjectAnalyzer(
        options.projectPath || process.cwd()
      );
      const analysis = await analyzer.analyzeProject();

      console.log(chalk.blue("📋 Project Detection Results:"));
      console.log(
        chalk.cyan("Project Type:") +
          ` ${analysis.projectType} (${(analysis.confidence * 100).toFixed(1)}% confidence)`
      );
      if (analysis.framework) {
        console.log(chalk.cyan("Framework:") + ` ${analysis.framework}`);
      }
      console.log();
      console.log(chalk.yellow("🚀 Suggested Commands:"));
      console.log(
        chalk.cyan("Build:") + ` ${analysis.buildCommand || "Not detected"}`
      );
      console.log(
        chalk.cyan("Development:") + ` ${analysis.devCommand || "Not detected"}`
      );
      console.log(
        chalk.cyan("Test:") + ` ${analysis.testCommand || "Not detected"}`
      );
      console.log();

      // Then initialize Cortex
      console.log(chalk.blue("🔧 Initializing Cortex..."));
      const cli = new CortexCLI(options.projectPath || process.cwd());
      await cli.initialize();

      console.log(chalk.green("✅ Cortex initialized successfully!"));
      console.log();
      console.log(
        chalk.green(
          "💡 Copy the suggested commands to your Cursor project settings!"
        )
      );
    } catch (error) {
      console.error(chalk.red("❌ Failed to initialize Cortex:"), error);
      process.exit(1);
    }
  });

program.parse();
