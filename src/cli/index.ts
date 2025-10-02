#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
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
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  )
  .action(
    async (
      description: string,
      options: { draftPr?: boolean; baseBranch?: string; projectPath?: string }
    ) => {
      try {
        const projectPath = options.projectPath || process.cwd();
        const { executeTask } = await import("./mcp-commands.js");
        await executeTask(description, projectPath, options);
      } catch (error) {
        console.log(
          chalk.yellow("⚠️  Attempting to initialize workspace due to error...")
        );
        const projectPath = options.projectPath || process.cwd();
        const { ensureCortexWorkspace, executeTask } = await import(
          "./mcp-commands.js"
        );
        await ensureCortexWorkspace(projectPath);
        await executeTask(description, projectPath, options);
      }
    }
  );

// Handle unknown commands
program.on("command:*", () => {
  console.error("error: unknown command");
  process.exit(1);
});

program.parse();
