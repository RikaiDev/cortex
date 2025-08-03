import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { ClaudeAdapter } from "../adapters/claude-adapter.js";
import { GeminiAdapter } from "../adapters/gemini-adapter.js";
import { CursorAdapter } from "../adapters/cursor-adapter.js";
import { ProjectAnalyzer } from "../core/project/project-analyzer.js";

interface DetectedCommands {
  build?: string;
  dev?: string;
  test?: string;
  framework?: string;
}

export class CortexCLI {
  private projectPath: string;
  private claudeAdapter: ClaudeAdapter;
  private geminiAdapter: GeminiAdapter;
  private cursorAdapter: CursorAdapter;

  constructor(projectPath?: string) {
    this.projectPath = projectPath || process.cwd();
    this.claudeAdapter = new ClaudeAdapter(this.projectPath);
    this.geminiAdapter = new GeminiAdapter(this.projectPath);
    this.cursorAdapter = new CursorAdapter(this.projectPath, [], {
      patterns: [],
      conventions: [],
      preferences: [],
    });
  }

  /**
   * Initialize Cortex AI with an intelligent, interactive setup.
   * It uses ProjectAnalyzer to detect the project environment and provide smart defaults.
   */
  public async initialize(): Promise<void> {
    console.log(chalk.blue("🧠 Initializing Cortex AI..."));
    console.log();

    // Step 1: Use ProjectAnalyzer to detect project environment
    console.log(chalk.gray("🔍 Detecting project environment..."));
    const projectAnalyzer = new ProjectAnalyzer(this.projectPath);
    const analysis = await projectAnalyzer.analyzeProject();

    const detected: DetectedCommands = {
      build: analysis.buildCommand,
      dev: analysis.devCommand,
      test: analysis.testCommand,
      framework: analysis.framework || analysis.projectType,
    };

    if (detected.framework) {
      console.log(
        chalk.green(`✅ Detected ${detected.framework} environment.`)
      );
    } else {
      console.log(
        chalk.yellow(
          "⚠️ Could not automatically detect environment, using generic defaults."
        )
      );
    }
    console.log();

    // Step 2: Interactive setup for user preferences
    console.log(
      chalk.yellow(
        "Please confirm your project preferences. We've suggested defaults based on our detection."
      )
    );
    const preferences = await inquirer.prompt([
      {
        type: "list",
        name: "language",
        message: "Select your preferred interaction language:",
        choices: [
          { name: "English", value: "en" },
          { name: "繁體中文 (Traditional Chinese)", value: "zh-TW" },
          { name: "日本語 (Japanese)", value: "ja" },
        ],
        default: "en",
      },
      {
        type: "input",
        name: "buildCommand",
        message: "Build command:",
        default: detected.build,
      },
      {
        type: "input",
        name: "devCommand",
        message: "Development command:",
        default: detected.dev,
      },
      {
        type: "input",
        name: "testCommand",
        message: "Test command:",
        default: detected.test,
      },
    ]);

    // Step 3: Save preferences to the project-specific cortex.json
    const configPath = path.join(this.projectPath, "cortex.json");
    await fs.writeJson(configPath, { preferences }, { spaces: 2 });
    console.log(
      chalk.green(
        `✅ Project-specific Cortex configuration saved to ${configPath}`
      )
    );
    console.log();

    // Step 4: Generate AI platform configurations
    console.log(chalk.blue("🤖 Generating AI platform configurations..."));
    await this.claudeAdapter.generateClaudeConfig();
    await this.geminiAdapter.generateGeminiConfig();
    await this.cursorAdapter.generateCursorRules();
    console.log(chalk.green("✅ AI platform configurations generated!"));
    console.log();

    // Step 5: Generate project documentation
    console.log(chalk.blue("📝 Generating project documentation..."));
    await projectAnalyzer.generateDocumentation();
    console.log(chalk.green("✅ Project documentation generated!"));
    console.log();

    // Step 6: Create directories and initial documentation
    console.log(chalk.blue("📁 Creating documentation structure..."));
    await this.setupDocumentation();
    console.log(
      chalk.green("✅ Documentation structure created successfully!")
    );
    console.log();

    console.log(chalk.green("🎉 Cortex AI initialization complete!"));
    console.log();
    console.log(chalk.blue("Next steps:"));
    console.log(
      chalk.gray("1. IDE configurations have been generated automatically.")
    );
    console.log(
      chalk.gray(
        '2. Review and customize the generated files in the "docs/" directory.'
      )
    );
  }

  private async setupDocumentation(): Promise<void> {
    const dirs = [
      "docs/cortex/roles",
      "docs/cortex/experiences",
      "docs/cortex/conventions",
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.projectPath, dir);
      await fs.ensureDir(fullPath);
    }
    await this.createInitialReadme();
  }

  /**
   * Create initial README in docs/cortex/
   */
  private async createInitialReadme(): Promise<void> {
    const readmePath = path.join(this.projectPath, "docs/cortex/README.md");
    const content = `# Cortex AI Collaboration Framework

This directory contains the core configuration and learned experiences for Cortex AI in this project.

- **/roles**: Defines different AI personas and their capabilities.
- **/experiences**: Stores learned user preferences and corrections over time.
- **/conventions**: Documents project-specific coding standards and patterns.

This entire structure is the "brain" of the AI for this project, enabling it to provide consistent, context-aware, and personalized assistance.
`;
    await fs.writeFile(readmePath, content);
  }
}
