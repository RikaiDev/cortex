#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { CortexCLI } from "./cortex-cli.js";
import { addMCPCommands } from "./mcp-commands.js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const program = new Command();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, "..", "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

program
  .name("cortex")
  .description("🧠 Cortex - AI Collaboration Brain")
  .version(packageJson.version);

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
      
      // Copy MCP configuration
      const configSource = path.join(__dirname, "..", "..", "examples", "cortex-mcp-config.json");
      const configDest = path.join(cursorDir, "cortex-mcp-config.json");
      
      await fs.copyFile(configSource, configDest);
      
      console.log(chalk.green("✅ MCP configuration installed successfully!"));
      console.log(chalk.cyan("📁 Configuration location:") + ` ${configDest}`);
      console.log();
      console.log(chalk.yellow("📋 Next steps:"));
      console.log("1. Restart Cursor IDE");
      console.log("2. The MCP tools will be automatically available");
      console.log("3. Check Cursor settings to ensure MCP is enabled");
      
    } catch (error) {
      console.error(chalk.red("❌ Failed to install MCP configuration:"), error);
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Initialize Cortex in your project")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .action(async (_options) => {
    try {
      const cli = new CortexCLI(_options.projectPath);
      await cli.initialize();
      console.log(chalk.green("✅ Cortex initialized successfully!"));
    } catch (error) {
      console.error(chalk.red("❌ Failed to initialize Cortex:"), error);
      process.exit(1);
    }
  });

program
  .command("generate-ide")
  .description("Generate IDE configurations and rules")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .action(async (_options) => {
    try {
      const cli = new CortexCLI(_options.projectPath);
      await cli.generateIDE();
    } catch (error) {
      console.error(chalk.red("❌ IDE generation failed:"), error);
      process.exit(1);
    }
  });

program
  .command("generate-rules")
  .description("Generate platform-specific rules for all AI platforms")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .action(async (_options) => {
    console.log(chalk.yellow("This command is temporarily disabled."));
  });

program
  .command("start")
  .description("Start AI collaboration")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .action(async (_options) => {
    console.log(chalk.yellow("This command is temporarily disabled."));
  });

program
  .command("version")
  .description("Show current version")
  .action(async () => {
    const cli = new CortexCLI();
    await cli.showVersion();
  });

program.parse();
