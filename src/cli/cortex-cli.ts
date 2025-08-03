import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { CursorAdapter } from "../adapters/cursor-adapter.js";
import { ClaudeAdapter } from "../adapters/claude-adapter.js";
import { GeminiAdapter } from "../adapters/gemini-adapter.js";
import { CortexRulesGenerator } from "../adapters/mcp-rules-generator.js";
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
  private cortexRulesGenerator: CortexRulesGenerator;

  constructor(projectPath?: string) {
    this.projectPath = projectPath || process.cwd();
    this.claudeAdapter = new ClaudeAdapter(this.projectPath);
    this.geminiAdapter = new GeminiAdapter(this.projectPath);
    this.cursorAdapter = new CursorAdapter(this.projectPath, [], {
      patterns: [],
      conventions: [],
      preferences: [],
    });
    // Pass project path to generator so it can also access cortex.json
    this.cortexRulesGenerator = new CortexRulesGenerator(this.projectPath);
  }

  /**
   * Initialize Cortex AI with an intelligent, interactive setup.
   * It detects the project environment to provide smart defaults for user confirmation.
   */
  public async initialize(): Promise<void> {
    console.log(chalk.blue("🧠 Initializing Cortex AI..."));
    console.log();

    // Step 1: Detect project environment to provide smart defaults
    console.log(chalk.gray("🔍 Detecting project environment..."));
    const detected = await this.detectProjectEnvironment();
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

    // Step 4: Analyze project structure (can leverage saved config in the future)
    console.log(chalk.blue("🔍 Analyzing project structure..."));
    const analyzer = new ProjectAnalyzer(this.projectPath);
    await analyzer.analyzeProject();
    console.log(chalk.green("✅ Project analysis complete!"));
    console.log();

    // Step 5: Create directories and initial documentation
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
      chalk.gray(
        '1. Run "cortex generate-ide" to create IDE configurations based on your preferences.'
      )
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
   * Detects the project's framework and suggests common commands.
   * @returns An object with detected framework and suggested commands.
   */
  private async detectProjectEnvironment(): Promise<DetectedCommands> {
    // Check for Nx
    if (await fs.pathExists(path.join(this.projectPath, "nx.json"))) {
      return {
        build: "nx build",
        dev: "nx serve",
        test: "nx test",
        framework: "Nx Workspace",
      };
    }

    // Check for Node.js (package.json)
    const packageJsonPath = path.join(this.projectPath, "package.json");
    if (await fs.pathExists(packageJsonPath)) {
      const packageManager = await this.detectPackageManager();
      try {
        const packageJson = await fs.readJson(packageJsonPath);
        const scripts = packageJson.scripts || {};
        return {
          build: scripts.build ? `${packageManager} run build` : undefined,
          dev:
            scripts.dev || scripts.start
              ? `${packageManager} run ${scripts.dev ? "dev" : "start"}`
              : undefined,
          test: scripts.test ? `${packageManager} run test` : undefined,
          framework: `Node.js (${packageManager})`,
        };
      } catch (e) {
        /* fall through */
      }
    }

    // Check for Python
    if (
      (await fs.pathExists(path.join(this.projectPath, "pyproject.toml"))) ||
      (await fs.pathExists(path.join(this.projectPath, "requirements.txt")))
    ) {
      return {
        // No standard build/dev command, but test is common
        test: "pytest",
        framework: "Python",
      };
    }

    // Check for Rust
    if (await fs.pathExists(path.join(this.projectPath, "Cargo.toml"))) {
      return {
        build: "cargo build",
        dev: "cargo run",
        test: "cargo test",
        framework: "Rust",
      };
    }

    // Check for Go
    if (await fs.pathExists(path.join(this.projectPath, "go.mod"))) {
      return {
        build: "go build",
        dev: "go run .",
        test: "go test ./...",
        framework: "Go",
      };
    }

    return {
      build: "npm run build",
      dev: "npm run dev",
      test: "npm run test",
    };
  }

  private async detectPackageManager(): Promise<string> {
    if (await fs.pathExists(path.join(this.projectPath, "bun.lock"))) {
      return "bun";
    }
    if (await fs.pathExists(path.join(this.projectPath, "pnpm-lock.yaml"))) {
      return "pnpm";
    }
    if (await fs.pathExists(path.join(this.projectPath, "yarn.lock"))) {
      return "yarn";
    }
    return "npm";
  }

  /**
   * Generate IDE configurations based on cortex.json.
   */
  async generateIDE(): Promise<void> {
    console.log(
      chalk.blue("🔧 Generating IDE configurations from cortex.json...")
    );

    // CortexRulesGenerator now reads cortex.json in its constructor
    await this.cortexRulesGenerator.generateAllPlatformRules();

    console.log(chalk.green("\n🎉 IDE configurations generated successfully!"));
    console.log(chalk.yellow("\nNext steps:"));
    console.log(chalk.gray("1. Restart your IDE to apply configurations."));
  }

  // ... (showVersion, createInitialReadme and other methods can remain similar, but mcp.json logic is removed)

  /**
   * Show version
   */
  async showVersion(): Promise<void> {
    const packageJsonPath = path.join(__dirname, "../../package.json"); // More robust path
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      console.log(chalk.blue(`🧠 Cortex AI v${packageJson.version}`));
    } else {
      console.log(chalk.yellow("Could not determine version."));
    }
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
