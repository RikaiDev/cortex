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

// Setup command (one-click setup)
program
  .command("setup")
  .description("One-click setup for Cortex AI collaboration")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .option("--quick", "Use default configuration")
  .option("--config <file>", "Custom configuration file")
  .action(async (options) => {
    try {
      const cli = new CortexCLI(options.projectPath);
      await cli.setup({ quick: options.quick, config: options.config });
    } catch (error) {
      console.error(chalk.red("❌ Setup failed:"), error);
      process.exit(1);
    }
  });

// Integrate command
program
  .command("integrate")
  .description("Integrate with existing AI collaboration systems")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .option("--roles", "Analyze existing roles")
  .option("--workflows", "Analyze existing workflows")
  .action(async (options) => {
    try {
      const cli = new CortexCLI(options.projectPath);
      await cli.integrate({
        roles: options.roles,
        workflows: options.workflows,
      });
    } catch (error) {
      console.error(chalk.red("❌ Integration failed:"), error);
      process.exit(1);
    }
  });

// Initialize command (legacy)
program
  .command("init")
  .description("Initialize Cortex in your project (legacy command)")
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

// Discover command
program
  .command("discover")
  .description("Discover roles and patterns in your project")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .option("-v, --verbose", "Verbose output")
  .action(async (options) => {
    try {
      const cli = new CortexCLI(options.projectPath);
      await cli.discover(options.verbose);
    } catch (error) {
      console.error(chalk.red("❌ Discovery failed:"), error);
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

// Generate role command
program
  .command("generate-role")
  .description("Generate a new role template")
  .option("-n, --name <name>", "Role name")
  .option(
    "-t, --template <template>",
    "Template type (basic, security, architecture)"
  )
  .option("-o, --output <path>", "Output path")
  .action(async (options) => {
    try {
      const cli = new CortexCLI();
      await cli.generateRole(options.name, options.template, options.output);
    } catch (error) {
      console.error(chalk.red("❌ Role generation failed:"), error);
      process.exit(1);
    }
  });

// Analyze patterns command
program
  .command("analyze-patterns")
  .description("Analyze project coding patterns")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .option("-o, --output <file>", "Output to file")
  .action(async (options) => {
    try {
      const cli = new CortexCLI(options.projectPath);
      await cli.analyzePatterns(options.output);
    } catch (error) {
      console.error(chalk.red("❌ Pattern analysis failed:"), error);
      process.exit(1);
    }
  });

// Start collaboration command
program
  .command("start")
  .description("Start interactive AI collaboration session")
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

// Parse command line arguments
program.parse();
