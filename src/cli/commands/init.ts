/**
 * Init Command
 *
 * Initialize Cortex workspace structure and IDE integration
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import type { Command } from "commander";

/**
 * Register init command
 */
export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize Cortex workspace structure and IDE integration")
    .option(
      "-p, --project-path <path>",
      "Project path (default: current directory)"
    )
    .option("--skip-ide", "Skip IDE integration (only initialize workspace)")
    .action(async (options) => {
      const projectPath = options.projectPath || process.cwd();
      await initializeCortexWorkspace(projectPath);

      // Automatically run IDE integration unless skipped
      if (!options.skipIde) {
        console.log();
        console.log(chalk.cyan("Setting up IDE integration..."));
        await regenerateRules(projectPath);
      }
    });
}

/**
 * Regenerate Cortex rules with latest role definitions
 */
async function regenerateRules(projectPath: string): Promise<void> {
  console.log(chalk.blue("Regenerating Cortex rules with latest roles..."));
  console.log(chalk.gray(`Project path: ${projectPath}`));
  console.log();

  try {
    // Import adapters
    const { CursorAdapter } = await import("../../adapters/cursor-adapter.js");
    const { ClaudeAdapter } = await import("../../adapters/claude-adapter.js");
    const { GeminiAdapter } = await import("../../adapters/gemini-adapter.js");

    // Create adapter instances
    const cursorAdapter = new CursorAdapter(projectPath);
    const claudeAdapter = new ClaudeAdapter(projectPath);
    const geminiAdapter = new GeminiAdapter(projectPath);

    // Regenerate configurations
    console.log("Regenerating Cursor rules...");
    await cursorAdapter.generateRules();

    console.log("Regenerating Claude configuration...");
    await claudeAdapter.generateClaudeConfig();

    console.log("Regenerating Gemini configuration...");
    await geminiAdapter.generateGeminiConfig();

    console.log();
    console.log(
      chalk.green("Successfully regenerated all Cortex configurations!")
    );
    console.log(
      chalk.gray("Rules have been updated with the latest role definitions.")
    );
    console.log(
      chalk.gray("You can now use the updated roles in your AI conversations.")
    );
  } catch (error) {
    console.error(chalk.red("Failed to regenerate rules:"), error);
    process.exit(1);
  }
}

/**
 * Initialize Cortex workspace structure
 */
export async function initializeCortexWorkspace(
  projectPath: string
): Promise<void> {
  console.log(chalk.blue("  Initializing Cortex workspace..."));
  console.log(chalk.gray(`Project path: ${projectPath}`));
  console.log();

  try {
    // Create .cortex directory structure
    const cortexDir = path.join(projectPath, ".cortex");
    const workflowsDir = path.join(cortexDir, "workflows");
    const memoryDir = path.join(cortexDir, "memory");
    const templatesDir = path.join(cortexDir, "templates");
    const commandsDir = path.join(templatesDir, "commands");
    const rolesDir = path.join(cortexDir, "roles");
    const templatesRolesDir = path.join(projectPath, "templates", "roles");

    // Create directories
    await fs.ensureDir(cortexDir);
    await fs.ensureDir(workflowsDir);
    await fs.ensureDir(memoryDir);
    await fs.ensureDir(templatesDir);
    await fs.ensureDir(commandsDir);
    await fs.ensureDir(rolesDir);

    // Copy role templates to .cortex/roles if they don't exist
    if (await fs.pathExists(templatesRolesDir)) {
      const roleFiles = await fs.readdir(templatesRolesDir);
      for (const file of roleFiles) {
        if (file.endsWith(".md")) {
          const sourcePath = path.join(templatesRolesDir, file);
          const destPath = path.join(rolesDir, file);
          if (!(await fs.pathExists(destPath))) {
            await fs.copy(sourcePath, destPath);
            console.log(chalk.green(`   Copied role: ${file}`));
          }
        }
      }
    }

    // Copy template files from tool templates
    const toolTemplatesDir = path.join(projectPath, "templates", "cortex");
    if (await fs.pathExists(toolTemplatesDir)) {
      // Copy all template files
      const templateFiles = await fs.readdir(toolTemplatesDir);
      for (const templateFile of templateFiles) {
        if (templateFile.endsWith(".md")) {
          const sourcePath = path.join(toolTemplatesDir, templateFile);
          const targetPath = path.join(templatesDir, templateFile);
          if (!(await fs.pathExists(targetPath))) {
            await fs.copy(sourcePath, targetPath);
            console.log(chalk.green(`   Copied template: ${templateFile}`));
          }
        }
      }

      // Copy commands directory
      const commandsSourceDir = path.join(toolTemplatesDir, "commands");
      if (await fs.pathExists(commandsSourceDir)) {
        const commandFiles = await fs.readdir(commandsSourceDir);
        for (const commandFile of commandFiles) {
          const sourcePath = path.join(commandsSourceDir, commandFile);
          const targetPath = path.join(commandsDir, commandFile);
          if (!(await fs.pathExists(targetPath))) {
            await fs.copy(sourcePath, targetPath);
            console.log(chalk.green(`   Copied command: ${commandFile}`));
          }
        }
      }
    }

    // Initialize memory index
    const memoryIndexPath = path.join(memoryDir, "index.json");
    if (!(await fs.pathExists(memoryIndexPath))) {
      const emptyIndex = {
        version: "1.0.0",
        initialized: new Date().toISOString(),
        index: [],
      };
      await fs.writeJson(memoryIndexPath, emptyIndex, { spaces: 2 });
    }

    // Create .cortexrc configuration file
    const cortexConfig = {
      version: "1.0.0",
      initialized: new Date().toISOString(),
      projectRoot: projectPath,
      structure: {
        workflows: ".cortex/workflows",
        memory: ".cortex/memory",
        templates: ".cortex/templates",
        roles: ".cortex/roles",
      },
    };

    const configPath = path.join(cortexDir, ".cortexrc");
    await fs.writeJson(configPath, cortexConfig, { spaces: 2 });

    console.log();
    console.log(chalk.green(" Cortex workspace initialized successfully!"));
    console.log();
    console.log(chalk.cyan("Created structure:"));
    console.log(`  ${cortexDir}/`);
    console.log(`  ├── .cortexrc          # Configuration file`);
    console.log(`  ├── workflows/         # Workflow state files`);
    console.log(`  ├── memory/            # Learning experiences`);
    console.log(`  ├── templates/         # Spec, plan, tasks templates`);
    console.log(`  │   └── commands/      # AI execution guides`);
    console.log(`  └── roles/             # Role definitions`);
    console.log();
    console.log(chalk.yellow("Next steps:"));
    console.log("  1. Run 'cortex start' to start the MCP server");
    console.log("  2. Use MCP tools to create and manage workflows");
    console.log("  3. Each workflow will have its own workspace folder");
  } catch (error) {
    console.error(chalk.red(" Failed to initialize workspace:"), error);
    process.exit(1);
  }
}
