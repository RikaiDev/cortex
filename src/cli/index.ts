#!/usr/bin/env node

/**
 * Cortex CLI
 *
 * Main entry point for the Cortex command-line interface.
 * Commands are organized by domain in the commands/ directory.
 */

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import {
  registerInitCommand,
  registerServerCommand,
  registerTaskCommand,
} from "./commands/index.js";

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
} catch {
  // Fallback: try to read from current working directory
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    // Final fallback: use a default version
    packageJson = { version: "0.7.2" };
  }
}

program
  .name("cortex")
  .description(" Cortex - AI Collaboration Brain")
  .version(packageJson.version || "0.8.0")
  .option(
    "-p, --project-path <path>",
    "Project path (default: current directory)"
  );

// Register all commands from domain modules
registerInitCommand(program);
registerServerCommand(program);
registerTaskCommand(program);

// Handle unknown commands
program.on("command:*", () => {
  console.error("error: unknown command");
  process.exit(1);
});

program.parse();
