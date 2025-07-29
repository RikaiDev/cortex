import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { CursorAdapter } from "../adapters/cursor-adapter.js";
import { ClaudeAdapter } from "../adapters/claude-adapter.js";
import { GeminiAdapter } from "../adapters/gemini-adapter.js";
import { MCPRulesGenerator } from "../adapters/mcp-rules-generator.js";

import { ProjectAnalyzer } from "../core/project-analyzer.js";

export class CortexCLI {
  private projectPath: string;
  private claudeAdapter: ClaudeAdapter;
  private geminiAdapter: GeminiAdapter;
  private cursorAdapter: CursorAdapter;
  private mcpRulesGenerator: MCPRulesGenerator;

  constructor(projectPath?: string) {
    this.projectPath = projectPath || process.cwd();
    this.claudeAdapter = new ClaudeAdapter(this.projectPath);
    this.geminiAdapter = new GeminiAdapter(this.projectPath);
    this.cursorAdapter = new CursorAdapter(this.projectPath, [], {
      patterns: [],
      conventions: [],
      preferences: [],
    });
    this.mcpRulesGenerator = new MCPRulesGenerator(this.projectPath);
  }

  /**
   * Initialize Cortex AI
   */
  public async initialize(): Promise<void> {
    console.log(chalk.blue("🧠 Initializing Cortex AI..."));
    console.log();

    // Step 1: Analyze project structure
    console.log(chalk.blue("🔍 Step 1: Analyzing project structure..."));
    const analyzer = new ProjectAnalyzer(this.projectPath);
    await analyzer.analyzeProject();
    console.log(chalk.green("✅ Project analysis complete!"));
    console.log();

    // Step 2: Generate documentation
    console.log(chalk.blue("📚 Step 2: Generating documentation..."));
    await analyzer.generateDocumentation();
    console.log(chalk.green("✅ Documentation generated successfully!"));
    console.log();

    // Step 3: Create directories
    console.log(chalk.blue("📁 Step 3: Creating directories..."));
    const dirs = [
      "docs/ai-collaboration/roles",
      "docs/ai-collaboration/templates",
      "docs/ai-collaboration/examples",
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.projectPath, dir);
      await fs.ensureDir(fullPath);
      console.log(chalk.gray(`📁 Created directory: ${dir}`));
    }
    console.log(chalk.green("✅ Directories created successfully!"));
    console.log();

    // Step 4: Create initial README
    console.log(chalk.blue("📝 Step 4: Creating initial README..."));
    await this.createInitialReadme();
    console.log(chalk.green("✅ Initial README created"));
    console.log();

    // Step 5: Create MCP server configuration
    console.log(chalk.blue("🔧 Step 5: Creating MCP server configuration..."));
    await this.createMCPServerConfig();
    console.log(chalk.green("✅ MCP server configuration created"));
    console.log();

    // Step 6: Global MCP configuration (optional)
    console.log(
      chalk.blue("🌐 Step 6: Global MCP configuration (optional)...")
    );
    console.log(
      chalk.gray(
        "💡 To install global MCP configuration, run: cortex install-global-mcp"
      )
    );
    console.log(
      chalk.gray("💡 This will make Cortex MCP available in all projects")
    );
    console.log();

    console.log(chalk.green("🎉 Cortex AI initialization complete!"));
    console.log();
    console.log(chalk.blue("Next steps:"));
    console.log(
      chalk.gray('1. Run "cortex generate-ide" to create IDE configurations')
    );
    console.log(chalk.gray('2. Run "cortex start" to begin AI collaboration'));
    console.log(chalk.gray("3. MCP server is ready for integration"));
    console.log(
      chalk.gray(
        '4. For global MCP: run "cortex install-global-mcp" then restart Cursor'
      )
    );
    console.log();
    console.log(chalk.green("✅ Cortex initialized successfully!"));
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
   * Generate MCP-integrated rules
   */
  async generateMCPRules(): Promise<void> {
    console.log(chalk.blue("🧠 Generating MCP-integrated rules..."));

    try {
      await this.mcpRulesGenerator.generateMCPRules();

      console.log(
        chalk.green("\n🎉 MCP-integrated rules generated successfully!")
      );
      console.log(chalk.yellow("\nGenerated files:"));
      console.log(
        chalk.gray("- .cursor/rules/cortex-mcp.mdc (Cursor MCP rules)")
      );
      console.log(chalk.gray("- CLAUDE-MCP (Claude MCP rules)"));
      console.log(chalk.gray("- GEMINI-MCP (Gemini MCP rules)"));
      console.log(chalk.yellow("\nNext steps:"));
      console.log(
        chalk.gray("1. Replace existing rules with MCP-integrated rules")
      );
      console.log(chalk.gray("2. Restart your IDE to apply MCP rules"));
      console.log(
        chalk.gray("3. Every AI response will now go through MCP validation")
      );
    } catch (error) {
      console.error(chalk.red("❌ Failed to generate MCP rules:"), error);
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

  /**
   * Create MCP server configuration
   */
  private async createMCPServerConfig(): Promise<void> {
    // Create .cursor/mcp.json with MCP server configuration only
    const mcpConfigPath = path.join(this.projectPath, ".cursor", "mcp.json");

    const mcpConfig = {
      mcpServers: {
        "cortex-mcp-server": {
          command: "node",
          args: ["cortex/core/mcp-server.js"],
          timeout: 3000,
          env: {
            NODE_ENV: "production",
            MCP_DEBUG: "true",
            MCP_DESKTOP_MODE: "true",
          },
          autoApprove: [
            "intent-analyzer",
            "task-decomposer",
            "role-selector",
            "best-practice-finder",
            "tool-usage-validator",
            "experience-recorder",
          ],
        },
      },
    };

    // Ensure .cursor directory exists
    await fs.ensureDir(path.dirname(mcpConfigPath));

    await fs.writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    console.log(
      chalk.gray("🔧 Created .cursor/mcp.json with MCP server configuration")
    );
  }

  /**
   * Create global MCP configuration in ~/.cursor/mcp.json
   */
  private async createGlobalMCPConfig(): Promise<void> {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
      console.log(
        chalk.yellow(
          "⚠️  Could not determine home directory, skipping global MCP config"
        )
      );
      return;
    }

    const globalMCPPath = path.join(homeDir, ".cursor", "mcp.json");

    try {
      // Read existing config if it exists
      let existingConfig: { mcpServers: Record<string, any> } = {
        mcpServers: {},
      };
      if (await fs.pathExists(globalMCPPath)) {
        try {
          existingConfig = await fs.readJson(globalMCPPath);
        } catch (error) {
          console.log(
            chalk.yellow(
              "⚠️  Could not read existing MCP config, creating new one"
            )
          );
          existingConfig = { mcpServers: {} };
        }
      }

      // Check if cortex-mcp-server already exists
      if (existingConfig.mcpServers["cortex-mcp-server"]) {
        console.log(
          chalk.gray("🔧 Global MCP config already contains cortex-mcp-server")
        );
        return;
      }

      // Detect package installation path
      const mcpServerPath = await this.detectMCPServerPath();

      // Add cortex-mcp-server to existing config
      existingConfig.mcpServers["cortex-mcp-server"] = {
        command: "node",
        args: [mcpServerPath],
        timeout: 3000,
        env: {
          NODE_ENV: "production",
          MCP_DEBUG: "true",
          MCP_DESKTOP_MODE: "true",
        },
        autoApprove: [
          "intent-analyzer",
          "task-decomposer",
          "role-selector",
          "best-practice-finder",
          "tool-usage-validator",
          "experience-recorder",
        ],
      };

      // Ensure .cursor directory exists
      await fs.ensureDir(path.dirname(globalMCPPath));

      // Write updated config
      await fs.writeFile(
        globalMCPPath,
        JSON.stringify(existingConfig, null, 2)
      );
      console.log(
        chalk.green("✅ Added cortex-mcp-server to global MCP configuration")
      );
      console.log(chalk.gray(`📁 Location: ${globalMCPPath}`));
      console.log(chalk.gray(`🔧 MCP Server Path: ${mcpServerPath}`));
    } catch (error) {
      console.log(
        chalk.yellow("⚠️  Could not create global MCP config:"),
        error
      );
    }
  }

  /**
   * Detect MCP server path based on installation type
   */
  private async detectMCPServerPath(): Promise<string> {
    // Check if we're in a global npm installation
    const globalPaths = [
      "/usr/local/lib/node_modules/@rikaidev/cortex/cortex/core/mcp-server.js",
      "/opt/homebrew/lib/node_modules/@rikaidev/cortex/cortex/core/mcp-server.js",
      path.join(
        process.env.npm_config_prefix || "",
        "lib/node_modules/@rikaidev/cortex/cortex/core/mcp-server.js"
      ),
    ];

    for (const globalPath of globalPaths) {
      if (await fs.pathExists(globalPath)) {
        return globalPath;
      }
    }

    // Fallback: try to find the package using require.resolve
    try {
      const packagePath = require.resolve("@rikaidev/cortex/package.json");
      const packageDir = path.dirname(packagePath);
      const fallbackPath = path.join(
        packageDir,
        "cortex",
        "core",
        "mcp-server.js"
      );

      if (await fs.pathExists(fallbackPath)) {
        return fallbackPath;
      }
    } catch (error) {
      // Package not found, continue to error
    }

    throw new Error(
      "Could not detect MCP server path. Please ensure @rikaidev/cortex is properly installed globally."
    );
  }

  /**
   * Install global MCP configuration
   */
  public async installGlobalMCP(): Promise<void> {
    console.log(chalk.blue("🌐 Installing global MCP configuration..."));
    await this.createGlobalMCPConfig();
    console.log(
      chalk.green("✅ Global MCP configuration installed successfully!")
    );
    console.log(
      chalk.gray("💡 Restart Cursor to activate the global MCP server")
    );
  }
}
