#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { CortexCLI } from "./cortex-cli.js";
import { addMCPCommands } from "./mcp-commands.js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const program = new Command();

// Get package.json version
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, "..", "..", "package.json");
const packageJson = JSON.parse(
  fs.readFileSync(packageJsonPath, "utf8")
);

// Set up CLI
program
  .name("cortex")
  .description("🧠 Cortex - AI Collaboration Brain")
  .version(packageJson.version);

// Add MCP commands
addMCPCommands(program);

// Add global MCP installation command
program
  .command("install-global-mcp")
  .description("Install global MCP configuration for Cursor")
  .action(async () => {
    const cli = new CortexCLI();
    await cli.installGlobalMCP();
  });

// Initialize command
program
  .command("init")
  .description("Initialize Cortex in your project")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .action(async (options) => {
    try {
      const cli = new CortexCLI(options.projectPath);
      await cli.initialize();
      console.log(chalk.green("✅ Cortex initialized successfully!"));
    } catch (error) {
      console.error(chalk.red("❌ Failed to initialize Cortex:"), error);
      process.exit(1);
    }
  });

// Generate IDE command
program
  .command("generate-ide")
  .description("Generate IDE configurations and rules")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .action(async (options) => {
    try {
      const cli = new CortexCLI(options.projectPath);
      await cli.generateIDE();
    } catch (error) {
      console.error(chalk.red("❌ IDE generation failed:"), error);
      process.exit(1);
    }
  });

// Generate MCP rules command
program
  .command("generate-mcp-rules")
  .description("Generate MCP-integrated rules for stable AI responses")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .action(async (options) => {
    try {
      const cli = new CortexCLI(options.projectPath);
      await cli.generateMCPRules();
    } catch (error) {
      console.error(chalk.red("❌ MCP rules generation failed:"), error);
      process.exit(1);
    }
  });

// Start collaboration command
program
  .command("start")
  .description("Start AI collaboration")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .action(async (options) => {
    try {
      const cli = new CortexCLI(options.projectPath);
      await cli.startCollaboration();
    } catch (error) {
      console.error(chalk.red("❌ Failed to start collaboration:"), error);
      process.exit(1);
    }
  });

// Version command
program
  .command("version")
  .description("Show current version")
  .action(async () => {
    const cli = new CortexCLI();
    await cli.showVersion();
  });

// Parse command line arguments
program.parse();
