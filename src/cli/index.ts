#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { CortexCLI } from "./cortex-cli.js";

const program = new Command();

// Set up CLI
program
  .name("cortex")
  .description("🧠 Cortex - AI Collaboration Brain")
  .version("0.1.0");

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
