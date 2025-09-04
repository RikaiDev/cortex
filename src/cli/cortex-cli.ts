import fs from "fs-extra";
import path from "path";
import { ClaudeAdapter } from "../adapters/claude-adapter.js";
import { CursorAdapter } from "../adapters/cursor-adapter.js";
import { GeminiAdapter } from "../adapters/gemini-adapter.js";

export class CortexCLI {
  private projectPath: string;
  private claudeAdapter: ClaudeAdapter;
  private cursorAdapter: CursorAdapter;
  private geminiAdapter: GeminiAdapter;

  constructor(projectPath?: string) {
    this.projectPath = projectPath || process.cwd();
    this.claudeAdapter = new ClaudeAdapter(this.projectPath);
    this.cursorAdapter = new CursorAdapter(this.projectPath);
    this.geminiAdapter = new GeminiAdapter(this.projectPath);
  }

  /**
   * Initialize Cortex AI - Simplified setup
   */
  public async initialize(): Promise<void> {
    console.log("🚀 Setting up Cortex AI...");

    // Create minimal cortex.json configuration
    const config = {
      version: "0.8.0",
      initialized: new Date().toISOString(),
      language: "en",
    };

    await fs.writeJson(path.join(this.projectPath, "cortex.json"), config, {
      spaces: 2,
    });

    // Generate AI platform configurations
    console.log("📝 Generating AI platform configurations...");
    await this.claudeAdapter.generateClaudeConfig();
    await this.cursorAdapter.generateRules();
    await this.geminiAdapter.generateGeminiConfig();

    // Setup .cortex infrastructure
    await this.setupCortexInfrastructure();

    console.log("✅ Cortex AI setup complete!");
    console.log("📁 Generated files:");
    console.log("   • cortex.json (Configuration)");
    console.log("   • CLAUDE.md (Claude prompts)");
    console.log("   • .cursor/rules/cortex.mdc (Cursor rules)");
    console.log("   • GEMINI.md (Gemini prompts)");
    console.log("   • .cortex/ (Project knowledge base)");
  }

  private async setupCortexInfrastructure(): Promise<void> {
    const cortexDir = path.join(this.projectPath, ".cortex");
    await fs.ensureDir(cortexDir);
    await fs.ensureDir(path.join(cortexDir, "roles"));
    await fs.ensureDir(path.join(cortexDir, "experiences"));
    await fs.ensureDir(path.join(cortexDir, "conventions"));
  }
}
