import fs from "fs-extra";
import path from "path";
import { ClaudeAdapter } from "../adapters/claude-adapter.js";
import { GeminiAdapter } from "../adapters/gemini-adapter.js";
import {
  CursorAdapter,
  TaskEnhancementCursorRulesGenerator,
} from "../adapters/cursor-adapter.js";
import { ProjectAnalyzer } from "../core/project/project-analyzer.js";
import type { UserPreferences } from "./types.js";

export class CortexCLI {
  private projectPath: string;
  private claudeAdapter: ClaudeAdapter;
  private geminiAdapter: GeminiAdapter;
  private cursorAdapter: TaskEnhancementCursorRulesGenerator;

  constructor(projectPath?: string) {
    this.projectPath = projectPath || process.cwd();
    this.claudeAdapter = new ClaudeAdapter(this.projectPath);
    this.geminiAdapter = new GeminiAdapter(this.projectPath);
    this.cursorAdapter = new CursorAdapter(this.projectPath);
  }

  /**
   * Initialize Cortex AI
   */
  public async initialize(): Promise<void> {
    console.log("Setting up Cortex...");

    const analyzer = new ProjectAnalyzer(this.projectPath);
    const analysis = await analyzer.analyzeProject();

    const preferences: UserPreferences = {
      language: "en",
      buildCommand: analysis.buildCommand || "npm run build",
      devCommand: analysis.devCommand || "npm run dev",
      testCommand: analysis.testCommand || "npm run test",
    };

    await fs.writeJson(
      path.join(this.projectPath, "cortex.json"),
      { preferences },
      { spaces: 2 }
    );

    await this.claudeAdapter.generateClaudeConfig();
    await this.geminiAdapter.generateGeminiConfig();
    await this.cursorAdapter.generateRules();

    await this.setupCortexInfrastructure();

    console.log("Cortex setup complete.");
  }

  private async setupCortexInfrastructure(): Promise<void> {
    const cortexDir = path.join(this.projectPath, ".cortex");
    await fs.ensureDir(cortexDir);
    await fs.ensureDir(path.join(cortexDir, "roles"));
    await fs.ensureDir(path.join(cortexDir, "experiences"));
    await fs.ensureDir(path.join(cortexDir, "conventions"));

    const config = {
      version: "0.1.0",
      initialized: new Date().toISOString(),
    };
    await fs.writeJson(path.join(cortexDir, "config.json"), config, {
      spaces: 2,
    });
  }
}
