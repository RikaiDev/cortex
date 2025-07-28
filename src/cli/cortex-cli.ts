import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { CursorAdapter } from "../adapters/cursor-adapter.js";
import { ClaudeAdapter } from "../adapters/claude-adapter.js";
import { GeminiAdapter } from "../adapters/gemini-adapter.js";
import { Role, ProjectKnowledge } from "../core/types.js";

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
   * Initialize Cortex in the project
   */
  async initialize(): Promise<void> {
    console.log(chalk.blue("🧠 Initializing Cortex AI..."));

    // Create necessary directories
    const dirs = [
      "docs/ai-collaboration/roles",
      "docs/ai-collaboration/templates",
      "docs/ai-collaboration/examples",
      ".cortex",
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.projectPath, dir);
      await fs.ensureDir(fullPath);
      console.log(chalk.gray(`📁 Created directory: ${dir}`));
    }

    // Create initial README
    await this.createInitialReadme();

    console.log(chalk.green("\n🎉 Cortex AI initialization complete!"));
    console.log(chalk.yellow("\nNext steps:"));
    console.log(
      chalk.gray('1. Run "cortex generate-ide" to create IDE configurations')
    );
    console.log(chalk.gray('2. Run "cortex start" to begin AI collaboration'));
  }

  /**
   * Generate IDE configurations
   */
  async generateIDE(): Promise<void> {
    console.log(chalk.blue("🔧 Generating IDE configurations..."));

    try {
      // Generate Cursor rules
      await this.cursorAdapter.generateCursorRules();
      console.log(chalk.green("✅ Generated Cursor rules"));

      // Generate Claude configuration
      await this.claudeAdapter.generateClaudeConfig();
      console.log(chalk.green("✅ Generated Claude configuration"));

      // Generate Gemini configuration
      await this.geminiAdapter.generateGeminiConfig();
      console.log(chalk.green("✅ Generated Gemini configuration"));

      console.log(
        chalk.green("\n🎉 IDE configurations generated successfully!")
      );
      console.log(chalk.yellow("\nNext steps:"));
      console.log(chalk.gray("1. Restart your IDE to apply configurations"));
      console.log(
        chalk.gray('2. Run "cortex start" to begin AI collaboration')
      );
    } catch (error) {
      console.error(
        chalk.red("❌ Failed to generate IDE configurations:"),
        error
      );
    }
  }

  /**
   * Start AI collaboration
   */
  async startCollaboration(): Promise<void> {
    console.log(chalk.blue("🚀 Starting AI collaboration..."));

    const questions = [
      {
        type: "list",
        name: "platform",
        message: "Select AI platform:",
        choices: ["Cursor", "Claude", "Gemini"],
      },
    ];

    const answers = await inquirer.prompt(questions);

    switch (answers.platform) {
      case "Cursor":
        console.log(chalk.green("✅ Cursor configuration ready!"));
        console.log(
          chalk.gray("Open Cursor and start coding with AI assistance")
        );
        break;
      case "Claude":
        console.log(chalk.green("✅ Claude configuration ready!"));
        console.log(chalk.gray("Use Claude with the generated configuration"));
        break;
      case "Gemini":
        console.log(chalk.green("✅ Gemini configuration ready!"));
        console.log(chalk.gray("Use Gemini with the generated configuration"));
        break;
    }
  }

  /**
   * Show version
   */
  async showVersion(): Promise<void> {
    const packageJson = await fs.readJson(
      path.join(this.projectPath, "package.json")
    );
    console.log(chalk.blue(`🧠 Cortex AI v${packageJson.version}`));
  }

  /**
   * Create initial README
   */
  private async createInitialReadme(): Promise<void> {
    const readmePath = path.join(
      this.projectPath,
      "docs/ai-collaboration/README.md"
    );

    const content = `# Cortex AI Collaboration

This project uses Cortex AI for enhanced AI collaboration.

## Quick Start

1. Run \`cortex generate-ide\` to create IDE configurations
2. Restart your IDE
3. Start coding with AI assistance!

## Features

- **Real-time user preference learning** from conversation
- **Cross-platform consistency** across Cursor, Claude, and Gemini
- **Project-specific adaptations** based on your codebase
- **Structured thinking process** for better AI responses

## Architecture

- **MDC/GEMINI/CLAUDE** = Brain (real-time thinking and decision making)
- **docs** = Experience and long-term memory (learning and knowledge base)
- **Scripts** = Essential tools only

## User Preference Learning

The system learns from your feedback:
- Corrections: "不對", "錯誤", "錯了"
- Preferences: "我們用", "我們專案用"
- Prohibitions: "不要", "從來不用"
- Frustration: "又來了", "還是這樣"

The AI immediately applies learned preferences to current and future responses.
`;

    await fs.writeFile(readmePath, content);
    console.log(chalk.gray("📝 Created initial README"));
  }
}
