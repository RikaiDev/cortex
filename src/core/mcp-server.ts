/**
 * Cortex MCP Server - Using Official TypeScript MCP SDK
 *
 * This module provides a standard MCP server using the official SDK
 * that can be called by Cursor and other MCP-compatible clients.
 *
 * Key Features:
 * - Official MCP protocol compliance
 * - Intent analysis and task decomposition
 * - Role selection and coordination
 * - Best practice discovery
 * - Tool usage validation
 * - Experience recording and learning
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import chalk from "chalk";
import fs from "fs-extra";
import { join } from "path";
import { glob } from "glob";
import { readFileSync } from "fs";

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(new URL("../../../package.json", import.meta.url), "utf-8")
);

// Intent Analysis Result
export interface IntentAnalysis {
  primaryIntent: string;
  secondaryIntents: string[];
  painPoints: string[];
  successCriteria: string[];
  complexity: "simple" | "medium" | "complex";
  context: string;
}

// Task Decomposition Result
export interface TaskDecomposition {
  subTasks: Array<{
    id: string;
    name: string;
    description: string;
    dependencies: string[];
    estimatedEffort: string;
    priority: "high" | "medium" | "low";
  }>;
  executionOrder: string[];
  parallelTasks: string[][];
}

// Role Assignment Result
export interface RoleAssignment {
  taskId: string;
  roleName: string;
  roleDescription: string;
  reasoning: string;
  capabilities: string[];
}

// Best Practice Search Result
export interface BestPracticeResult {
  file: string;
  content: string;
  relevance: number;
  tags: string[];
  context: string;
}

// Experience Record
export interface ExperienceRecord {
  id: string;
  timestamp: string;
  action: string;
  context: string;
  success: boolean;
  feedback: string;
  patterns: string[];
  learnings: string[];
}

/**
 * Cortex MCP Server Implementation using Official SDK
 */
export class CortexMCPServer {
  private server: McpServer;
  private projectRoot: string;
  private experienceLog: ExperienceRecord[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;

    // Create MCP server with official SDK
    this.server = new McpServer({
      name: "cortex-mcp-server",
      version: packageJson.version,
    });

    this.initializeCoreTools();
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    console.log(
      chalk.green("🚀 Starting Cortex MCP Server with Official SDK...")
    );
    console.log(chalk.blue("📁 Project root:"), this.projectRoot);

    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.log(chalk.green("✅ Cortex MCP Server started successfully"));
    console.log(chalk.blue("📋 Available tools: 6 tools registered"));
  }

  /**
   * Initialize core MCP tools
   */
  private initializeCoreTools(): void {
    // Intent Analyzer Tool
    this.server.tool(
      "intent-analyzer",
      {
        title: "Intent Analyzer",
        description: "分析用戶意圖並提取核心需求",
        inputSchema: {
          userInput: z.string(),
          context: z.string(),
          history: z.array(z.string()),
        },
      },
      async ({ userInput, context, history }) => {
        console.log(chalk.blue("🔍 Analyzing user intent..."));
        const result = await this.analyzeIntent({
          userInput,
          context,
          history,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // Task Decomposer Tool
    this.server.tool(
      "task-decomposer",
      {
        title: "Task Decomposer",
        description: "將複雜任務拆解為可執行的子任務",
        inputSchema: {
          primaryIntent: z.string(),
          complexity: z.string(),
          context: z.string(),
        },
      },
      async ({ primaryIntent, complexity, context }) => {
        console.log(chalk.blue("📋 Decomposing task..."));
        const result = await this.decomposeTask({
          primaryIntent,
          complexity,
          context,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // Role Selector Tool
    this.server.tool(
      "role-selector",
      {
        title: "Role Selector",
        description: "根據任務選擇最適合的角色",
        inputSchema: {
          subTasks: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
            })
          ),
          context: z.string(),
        },
      },
      async ({ subTasks, context }) => {
        console.log(chalk.blue("🎭 Selecting roles..."));
        const result = await this.selectRoles({
          subTasks,
          context,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // Best Practice Finder Tool
    this.server.tool(
      "best-practice-finder",
      {
        title: "Best Practice Finder",
        description: "在 docs/ 目錄中搜索最佳實踐",
        inputSchema: {
          query: z.string(),
          context: z.string(),
          searchType: z.string(),
        },
      },
      async ({ query, context, searchType }) => {
        console.log(chalk.blue("📚 Finding best practices..."));
        const result = await this.findBestPractices({
          query,
          context,
          searchType,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // Tool Usage Validator Tool
    this.server.tool(
      "tool-usage-validator",
      {
        title: "Tool Usage Validator",
        description: "驗證工具使用是否正確",
        inputSchema: {
          toolName: z.string(),
          usage: z.string(),
          context: z.string(),
        },
      },
      async ({ toolName, usage, context }) => {
        console.log(chalk.blue("🔧 Validating tool usage..."));
        const result = await this.validateToolUsage({
          toolName,
          usage,
          context,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // Experience Recorder Tool
    this.server.tool(
      "experience-recorder",
      {
        title: "Experience Recorder",
        description: "記錄開發經驗和學習模式",
        inputSchema: {
          action: z.string(),
          context: z.string(),
          success: z.boolean(),
          feedback: z.string(),
        },
      },
      async ({ action, context, success, feedback }) => {
        console.log(chalk.blue("🧠 Recording experience..."));
        const result = await this.recordExperience({
          action,
          context,
          success,
          feedback,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }
    );
  }

  /**
   * Analyze user intent
   */
  private async analyzeIntent(input: {
    userInput: string;
    context: string;
    history: string[];
  }): Promise<IntentAnalysis> {
    const { userInput, context, history } = input;

    // Extract intent patterns
    const intentPatterns = {
      導入: "implementation",
      設計: "design",
      實作: "implementation",
      架構: "architecture",
      工具: "tool",
      驗證: "validation",
      測試: "testing",
      文檔: "documentation",
      優化: "optimization",
      修復: "fix",
    };

    // Find primary intent
    let primaryIntent = "general";
    for (const [keyword, intent] of Object.entries(intentPatterns)) {
      if (userInput.includes(keyword)) {
        primaryIntent = intent;
        break;
      }
    }

    // Extract pain points
    const painPointKeywords = ["問題", "錯誤", "失敗", "困難", "卡住", "不懂"];
    const painPoints = painPointKeywords
      .filter((keyword) => userInput.includes(keyword))
      .map((keyword) => `用戶提到: ${keyword}`);

    // Assess complexity
    const complexityKeywords = {
      simple: ["簡單", "基本", "快速", "小"],
      complex: ["複雜", "困難", "大型", "系統", "架構"],
    };

    let complexity: "simple" | "medium" | "complex" = "medium";
    for (const [level, keywords] of Object.entries(complexityKeywords)) {
      if (keywords.some((keyword) => userInput.includes(keyword))) {
        complexity = level as "simple" | "medium" | "complex";
        break;
      }
    }

    // Define success criteria
    const successCriteria = [
      `完成 ${primaryIntent} 相關任務`,
      "代碼品質符合專案標準",
      "遵循最佳實踐",
    ];

    return {
      primaryIntent,
      secondaryIntents: [],
      painPoints,
      successCriteria,
      complexity,
      context,
    };
  }

  /**
   * Decompose task into sub-tasks
   */
  private async decomposeTask(input: {
    primaryIntent: string;
    complexity: string;
    context: string;
  }): Promise<TaskDecomposition> {
    const { primaryIntent, complexity, context } = input;

    // Task templates based on intent
    const taskTemplates: Record<
      string,
      Array<{ name: string; description: string }>
    > = {
      implementation: [
        { name: "analyze-requirements", description: "分析需求" },
        { name: "design-architecture", description: "設計架構" },
        { name: "implement-core", description: "實作核心功能" },
        { name: "add-tests", description: "添加測試" },
        { name: "validate-solution", description: "驗證解決方案" },
      ],
      design: [
        { name: "research-patterns", description: "研究模式" },
        { name: "create-design", description: "創建設計" },
        { name: "validate-design", description: "驗證設計" },
      ],
      tool: [
        { name: "analyze-tool-requirements", description: "分析工具需求" },
        { name: "research-tool-options", description: "研究工具選項" },
        { name: "implement-tool-integration", description: "實作工具整合" },
        { name: "test-tool-functionality", description: "測試工具功能" },
      ],
      validation: [
        { name: "identify-validation-criteria", description: "識別驗證標準" },
        { name: "implement-validation-logic", description: "實作驗證邏輯" },
        { name: "test-validation-process", description: "測試驗證流程" },
      ],
    };

    const template =
      taskTemplates[primaryIntent] || taskTemplates["implementation"];

    // Generate sub-tasks
    const subTasks = template.map((task, index) => ({
      id: `task-${index + 1}`,
      name: task.name,
      description: task.description,
      dependencies: index > 0 ? [`task-${index}`] : [],
      estimatedEffort:
        complexity === "simple"
          ? "1-2 hours"
          : complexity === "medium"
            ? "4-8 hours"
            : "1-2 days",
      priority: index === 0 ? "high" : ("medium" as "high" | "medium" | "low"),
    }));

    // Determine execution order
    const executionOrder = subTasks.map((task) => task.id);

    // Identify parallel tasks (none for now, all sequential)
    const parallelTasks: string[][] = [];

    return {
      subTasks,
      executionOrder,
      parallelTasks,
    };
  }

  /**
   * Select appropriate roles for tasks
   */
  private async selectRoles(input: {
    subTasks: Array<{ name: string; description: string }>;
    context: string;
  }): Promise<{ roleAssignments: RoleAssignment[]; coordinationPlan: string }> {
    const { subTasks, context } = input;

    // Role mapping based on task patterns
    const roleMapping: Record<
      string,
      { roleName: string; roleDescription: string; capabilities: string[] }
    > = {
      analyze: {
        roleName: "project-coordinator",
        roleDescription: "專案協調者",
        capabilities: ["需求分析", "任務規劃"],
      },
      design: {
        roleName: "architecture-designer",
        roleDescription: "架構設計師",
        capabilities: ["系統設計", "架構規劃"],
      },
      implement: {
        roleName: "code-assistant",
        roleDescription: "代碼助手",
        capabilities: ["代碼實作", "功能開發"],
      },
      test: {
        roleName: "code-reviewer",
        roleDescription: "代碼審查者",
        capabilities: ["代碼審查", "品質保證"],
      },
      validate: {
        roleName: "code-reviewer",
        roleDescription: "代碼審查者",
        capabilities: ["驗證測試", "品質檢查"],
      },
    };

    const roleAssignments: RoleAssignment[] = subTasks.map((task) => {
      // Find matching role
      let matchedRole = roleMapping["implement"]; // Default
      for (const [pattern, role] of Object.entries(roleMapping)) {
        if (task.name.includes(pattern) || task.description.includes(pattern)) {
          matchedRole = role;
          break;
        }
      }

      return {
        taskId: task.name,
        roleName: matchedRole.roleName,
        roleDescription: matchedRole.roleDescription,
        reasoning: `任務 "${task.description}" 需要 ${matchedRole.roleDescription} 的技能`,
        capabilities: matchedRole.capabilities,
      };
    });

    const coordinationPlan = `
🎯 角色協調計劃:
1. ${roleAssignments[0]?.roleDescription} 負責 ${roleAssignments[0]?.taskId}
2. 其他角色根據任務依賴關係順序執行
3. 每個角色完成後進行品質檢查
4. 最終由 ${roleAssignments[roleAssignments.length - 1]?.roleDescription} 進行整體驗證
    `.trim();

    return {
      roleAssignments,
      coordinationPlan,
    };
  }

  /**
   * Find best practices in docs
   */
  private async findBestPractices(input: {
    query: string;
    context: string;
    searchType: string;
  }): Promise<{ results: BestPracticeResult[]; recommendations: string[] }> {
    const { query, context, searchType } = input;

    try {
      const docsDir = join(this.projectRoot, "docs");
      const files = await glob("**/*.md", { cwd: docsDir });

      const results: BestPracticeResult[] = [];

      for (const file of files) {
        const filePath = join(docsDir, file);
        const content = await fs.readFile(filePath, "utf-8");

        // Simple relevance scoring
        const relevance = this.calculateRelevance(content, query, searchType);

        if (relevance > 0.3) {
          // Threshold for relevance
          results.push({
            file,
            content: content.substring(0, 500) + "...", // Truncate for display
            relevance,
            tags: this.extractTags(content),
            context: `Found in ${file}`,
          });
        }
      }

      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance);

      // Generate recommendations
      const recommendations =
        results.length > 0
          ? [
              `找到 ${results.length} 個相關的最佳實踐`,
              "建議按照相關性順序參考",
            ]
          : ["未找到相關的最佳實踐", "建議查看通用文檔或創建新的最佳實踐"];

      return {
        results: results.slice(0, 5), // Limit to top 5
        recommendations,
      };
    } catch (error) {
      console.error(chalk.yellow("⚠️ Error searching docs:"), error);
      return {
        results: [],
        recommendations: ["搜索文檔時發生錯誤", "請檢查 docs/ 目錄是否存在"],
      };
    }
  }

  /**
   * Validate tool usage
   */
  private async validateToolUsage(input: {
    toolName: string;
    usage: string;
    context: string;
  }): Promise<{ isValid: boolean; issues: string[]; suggestions: string[] }> {
    const { toolName, usage, context } = input;

    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for common tool usage patterns
    const toolPatterns = {
      git: {
        validCommands: [
          "git add",
          "git commit",
          "git push",
          "git pull",
          "git status",
        ],
        invalidPatterns: ["git commit -m ''", "git push without commit"],
      },
      npm: {
        validCommands: ["npm install", "npm run", "npm test", "npm build"],
        invalidPatterns: [
          "npm install without package.json",
          "npm run undefined-script",
        ],
      },
      bun: {
        validCommands: ["bun install", "bun run", "bun test", "bun build"],
        invalidPatterns: [
          "bun install without package.json",
          "bun run undefined-script",
        ],
      },
    };

    const pattern = toolPatterns[toolName as keyof typeof toolPatterns];
    if (pattern) {
      // Check for invalid patterns
      for (const invalidPattern of pattern.invalidPatterns) {
        if (usage.includes(invalidPattern)) {
          issues.push(`檢測到無效的使用模式: ${invalidPattern}`);
        }
      }

      // Check for valid commands
      const hasValidCommand = pattern.validCommands.some((cmd) =>
        usage.includes(cmd)
      );
      if (!hasValidCommand) {
        issues.push(`未檢測到有效的 ${toolName} 命令`);
        suggestions.push(`建議使用: ${pattern.validCommands.join(", ")}`);
      }
    }

    // General suggestions
    if (usage.includes("TODO") || usage.includes("FIXME")) {
      suggestions.push("建議完成 TODO/FIXME 而不是留下註解");
    }

    if (usage.includes("noqa") || usage.includes("eslint-disable")) {
      suggestions.push("建議解決根本問題而不是禁用檢查");
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  /**
   * Record experience for learning
   */
  private async recordExperience(input: {
    action: string;
    context: string;
    success: boolean;
    feedback: string;
  }): Promise<{
    recorded: boolean;
    experienceId: string;
    recommendations: string[];
  }> {
    const { action, context, success, feedback } = input;

    const experience: ExperienceRecord = {
      id: `exp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      context,
      success,
      feedback,
      patterns: this.extractPatterns(action, context),
      learnings: this.generateLearnings(success, feedback),
    };

    this.experienceLog.push(experience);

    // Save to file for persistence
    try {
      const experiencesDir = join(
        this.projectRoot,
        "docs",
        "experiences",
        "mcp"
      );
      await fs.writeFile(
        join(experiencesDir, `${experience.id}.json`),
        JSON.stringify(experience, null, 2)
      );
    } catch (error) {
      console.error(chalk.yellow("⚠️ Error saving experience:"), error);
    }

    const recommendations = success
      ? ["記錄成功經驗", "可以重複使用此模式"]
      : ["記錄失敗經驗", "避免重複此錯誤", "尋找替代方案"];

    return {
      recorded: true,
      experienceId: experience.id,
      recommendations,
    };
  }

  /**
   * Calculate relevance score for content
   */
  private calculateRelevance(
    content: string,
    query: string,
    searchType: string
  ): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();

    let score = 0;

    for (const word of queryWords) {
      const count = (contentLower.match(new RegExp(word, "g")) || []).length;
      score += count;
    }

    // Boost score for specific search types
    if (searchType === "best-practice" && content.includes("best practice")) {
      score += 10;
    }
    if (searchType === "tool-usage" && content.includes("tool")) {
      score += 10;
    }

    return score;
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];

    // Extract markdown headers
    const headers = content.match(/^#{1,6}\s+(.+)$/gm) || [];
    headers.forEach((header) => {
      const tag = header.replace(/^#{1,6}\s+/, "").trim();
      if (tag.length < 50) tags.push(tag);
    });

    // Extract code blocks
    const codeBlocks = content.match(/```(\w+)/g) || [];
    codeBlocks.forEach((block) => {
      const lang = block.replace("```", "");
      if (lang) tags.push(lang);
    });

    return tags.slice(0, 5); // Limit to 5 tags
  }

  /**
   * Extract patterns from action and context
   */
  private extractPatterns(action: string, context: string): string[] {
    const patterns: string[] = [];

    if (action.includes("mcp-tool-execution")) {
      patterns.push("MCP 工具執行");
    }

    if (context.includes("error") || context.includes("失敗")) {
      patterns.push("錯誤處理");
    }

    if (context.includes("success") || context.includes("成功")) {
      patterns.push("成功模式");
    }

    return patterns;
  }

  /**
   * Generate learnings from experience
   */
  private generateLearnings(success: boolean, feedback: string): string[] {
    const learnings: string[] = [];

    if (success) {
      learnings.push("此方法有效，可以重複使用");
      learnings.push("遵循了最佳實踐");
    } else {
      learnings.push("此方法無效，需要改進");
      learnings.push("避免重複此錯誤");
    }

    if (feedback.includes("tool")) {
      learnings.push("工具使用需要驗證");
    }

    return learnings;
  }
}

/**
 * CLI Entry Point for MCP Server
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Cortex MCP Server (Official SDK)

Usage:
  node mcp-server.js [options]

Options:
  --project-root <path>  Project root directory (default: current directory)
  --help, -h            Show this help message
  --version, -v         Show version

Examples:
  node mcp-server.js --project-root /path/to/project
  node mcp-server.js
    `);
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log("Cortex MCP Server v1.0.0 (Official SDK)");
    process.exit(0);
  }

  // Get project root
  const projectRootIndex = args.indexOf("--project-root");
  const projectRoot =
    projectRootIndex >= 0 ? args[projectRootIndex + 1] : process.cwd();

  try {
    const server = new CortexMCPServer(projectRoot);
    await server.start();

    // Keep the process alive
    process.on("SIGINT", () => {
      console.log(chalk.yellow("\n🛑 Shutting down Cortex MCP Server..."));
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log(chalk.yellow("\n🛑 Shutting down Cortex MCP Server..."));
      process.exit(0);
    });
  } catch (error) {
    console.error(chalk.red("❌ Failed to start MCP server:"), error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(chalk.red("❌ Fatal error:"), error);
    process.exit(1);
  });
}
