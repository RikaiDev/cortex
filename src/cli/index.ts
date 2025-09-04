#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { CortexCLI } from "./cortex-cli.js";
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

program
  .command("install-global-mcp")
  .description("Install global MCP configuration for Cursor")
  .action(async () => {
    try {
      console.log(chalk.blue("🔧 Installing Cortex MCP configuration..."));

      // Get user's home directory
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      if (!homeDir) {
        throw new Error("Could not determine home directory");
      }

      // Determine correct MCP config path based on platform
      let mcpConfigPath: string;

      if (process.platform === "darwin") {
        // macOS: ~/Library/Application Support/Cursor/User/mcp.json
        const cursorUserDir = path.join(
          homeDir,
          "Library",
          "Application Support",
          "Cursor",
          "User"
        );
        await fs.ensureDir(cursorUserDir);
        mcpConfigPath = path.join(cursorUserDir, "mcp.json");
      } else if (process.platform === "win32") {
        // Windows: %APPDATA%\Cursor\User\mcp.json
        const cursorUserDir = path.join(
          homeDir,
          "AppData",
          "Roaming",
          "Cursor",
          "User"
        );
        await fs.ensureDir(cursorUserDir);
        mcpConfigPath = path.join(cursorUserDir, "mcp.json");
      } else {
        // Linux and others: ~/.config/cursor/user/mcp.json
        const cursorUserDir = path.join(homeDir, ".config", "cursor", "user");
        await fs.ensureDir(cursorUserDir);
        mcpConfigPath = path.join(cursorUserDir, "mcp.json");
      }

      // Read existing mcp.json or create new one
      interface MCPConfig {
        mcpServers: Record<string, unknown>;
        [key: string]: unknown;
      }
      let mcpConfig: MCPConfig = { mcpServers: {} };
      if (await fs.pathExists(mcpConfigPath)) {
        const existingConfig = await fs.readFile(mcpConfigPath, "utf-8");
        mcpConfig = JSON.parse(existingConfig);
      }

      // Add cortex configuration (following Context7 format)
      mcpConfig.mcpServers["cortex"] = {
        command: "node",
        args: ["cortex/cli/index.js", "mcp", "start"],
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
      // Simple project type detection
      console.log(chalk.blue("🔍 Detecting project type..."));
      const projectPath = options.projectPath || process.cwd();
      const analysis = await detectProjectType(projectPath);

      console.log(chalk.blue("📋 Project Detection Results:"));
      console.log(
        chalk.cyan("Project Type:") +
          ` ${analysis.type} (${analysis.confidence}% confidence)`
      );
      if (analysis.framework) {
        console.log(chalk.cyan("Framework:") + ` ${analysis.framework}`);
      }
      console.log();
      console.log(chalk.yellow("🚀 Suggested Commands:"));
      console.log(
        chalk.cyan("Build:") + ` ${analysis.buildCommand || "npm run build"}`
      );
      console.log(
        chalk.cyan("Development:") + ` ${analysis.devCommand || "npm run dev"}`
      );
      console.log(
        chalk.cyan("Test:") + ` ${analysis.testCommand || "npm run test"}`
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

/**
 * Simple project type detection
 */
async function detectProjectType(projectPath: string): Promise<{
  type: string;
  framework?: string;
  confidence: number;
  buildCommand?: string;
  devCommand?: string;
  testCommand?: string;
}> {
  // Check for package.json (Node.js)
  const packageJsonPath = path.join(projectPath, "package.json");
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for common frameworks
      if (deps["next"]) {
        return {
          type: "node",
          framework: "Next.js",
          confidence: 95,
          buildCommand: "npm run build",
          devCommand: "npm run dev",
          testCommand: "npm run test",
        };
      }

      if (deps["react"]) {
        return {
          type: "node",
          framework: "React",
          confidence: 90,
          buildCommand: "npm run build",
          devCommand: "npm run dev",
          testCommand: "npm run test",
        };
      }

      if (deps["vue"]) {
        return {
          type: "node",
          framework: "Vue.js",
          confidence: 90,
          buildCommand: "npm run build",
          devCommand: "npm run dev",
          testCommand: "npm run test",
        };
      }

      return {
        type: "node",
        framework: "Node.js",
        confidence: 85,
        buildCommand: "npm run build",
        devCommand: "npm run dev",
        testCommand: "npm run test",
      };
    } catch (error) {
      // Invalid package.json
    }
  }

  // Check for Python files
  const pythonFiles = await fs.readdir(projectPath).catch(() => []);
  if (pythonFiles.some((file) => file.endsWith(".py"))) {
    return {
      type: "python",
      confidence: 80,
      buildCommand: "python setup.py build",
      devCommand: "python -m your_app",
      testCommand: "python -m pytest",
    };
  }

  // Default fallback
  return {
    type: "unknown",
    confidence: 0,
    buildCommand: "echo 'Build command not detected'",
    devCommand: "echo 'Dev command not detected'",
    testCommand: "echo 'Test command not detected'",
  };
}
