#!/usr/bin/env node

/**
 * MCP Server - Clean, simple implementation
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { LLMConnector } from "./llm-connector.js";

/**
 * Get version from package.json
 */
function getPackageVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packagePath = join(__dirname, "../../../package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    return packageJson.version;
  } catch (error) {
    console.error("Failed to read package.json version:", error);
    return "0.0.0";
  }
}

/**
 * MCP server - clean and simple
 */
export class MCPServer {
  private server: Server;
  private llmConnector: LLMConnector;
  private projectRoot: string;

  constructor(projectPath?: string) {
    this.server = new Server(
      {
        name: "cortex",
        version: getPackageVersion(),
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    const workingDirectory = projectPath || process.cwd();
    this.projectRoot = workingDirectory;
    this.llmConnector = new LLMConnector(workingDirectory);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "natural-language-query",
            description:
              "Process natural language queries and provide intelligent assistance",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Natural language query from user",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "project-context",
            description: "Get essential project context for task understanding",
            inputSchema: {
              type: "object",
              properties: {
                includeFiles: {
                  type: "boolean",
                  description: "Include file structure information",
                  default: true,
                },
                includeDependencies: {
                  type: "boolean",
                  description: "Include dependency information",
                  default: true,
                },
              },
            },
          },
          {
            name: "experience-search",
            description: "Search for relevant past experiences and solutions",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query for experiences",
                },
                category: { type: "string", description: "Filter by category" },
                limit: {
                  type: "number",
                  description: "Maximum number of results",
                  default: 5,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "code-diagnostic",
            description:
              "Analyze code issues and provide diagnostic information",
            inputSchema: {
              type: "object",
              properties: {
                filePath: {
                  type: "string",
                  description: "Path to the file to analyze",
                },
                issueType: {
                  type: "string",
                  description: "Type of issue to look for",
                  enum: ["syntax", "logic", "performance", "security", "style"],
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "natural-language-query":
          return await this.handleNaturalLanguageQuery(args || { query: "" });
        case "project-context":
          return await this.handleProjectContext(args || {});
        case "experience-search":
          return await this.handleExperienceSearch(args || { query: "" });
        case "code-diagnostic":
          return await this.handleCodeDiagnostic(args || {});
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  public async handleNaturalLanguageQuery(args: {
    query?: string;
  }): Promise<{ content: string[]; success: boolean }> {
    const query = args?.query || "";

    if (!query.trim()) {
      return { content: ["Empty query received."], success: false };
    }

    try {
      const llmResponse = await this.llmConnector.processRequest({ query });
      return { content: [llmResponse.content], success: true };
    } catch (error) {
      console.error("Query processing failed:", error);
      return { content: ["Query processing failed."], success: false };
    }
  }

  public async handleProjectContext(args: {
    includeFiles?: boolean;
    includeDependencies?: boolean;
  }): Promise<{ content: string[]; success: boolean }> {
    try {
      const includeFiles = args.includeFiles !== false;
      const includeDependencies = args.includeDependencies !== false;
      const projectInfo: string[] = [];

      if (includeFiles) {
        const structure = await this.getProjectStructure();
        projectInfo.push(`## 📁 Project Structure\n${structure}\n`);
      }

      if (includeDependencies) {
        const dependencies = await this.getProjectDependencies();
        projectInfo.push(`## 📦 Dependencies\n${dependencies}\n`);
      }

      const technologyStack = await this.getTechnologyStack();
      projectInfo.push(`## 🛠️ Technology Stack\n${technologyStack}\n`);

      return { content: [projectInfo.join("")], success: true };
    } catch (error) {
      return {
        content: [
          `Failed to get project context: ${error instanceof Error ? error.message : String(error)}`,
        ],
        success: false,
      };
    }
  }

  public async handleExperienceSearch(args: {
    query?: string;
    category?: string;
    limit?: number;
  }): Promise<{ content: string[]; success: boolean }> {
    try {
      const query = args.query || "";
      const category = args.category;
      const limit = args.limit || 5;

      if (!query.trim()) {
        return {
          content: ["Please provide a search query for experiences."],
          success: false,
        };
      }

      const experiences = await this.searchExperiences(query, category, limit);
      const formattedResults = this.formatExperienceResults(experiences);

      return { content: [formattedResults], success: true };
    } catch (error) {
      return {
        content: [
          `Failed to search experiences: ${error instanceof Error ? error.message : String(error)}`,
        ],
        success: false,
      };
    }
  }

  public async handleCodeDiagnostic(args: {
    filePath?: string;
    issueType?: string;
  }): Promise<{ content: string[]; success: boolean }> {
    try {
      const filePath = args.filePath;
      const issueType = args.issueType;

      if (!filePath) {
        return {
          content: ["Please provide a file path to analyze."],
          success: false,
        };
      }

      const diagnostics = await this.analyzeCodeFile(filePath, issueType);
      const formattedReport = this.formatDiagnosticReport(
        diagnostics,
        filePath
      );

      return { content: [formattedReport], success: true };
    } catch (error) {
      return {
        content: [
          `Failed to analyze code: ${error instanceof Error ? error.message : String(error)}`,
        ],
        success: false,
      };
    }
  }

  private async getProjectStructure(): Promise<string> {
    try {
      const fs = await import("fs");
      const path = await import("path");

      const getStructure = (dir: string, prefix = ""): string => {
        let result = "";
        const items = fs.readdirSync(dir).sort();

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const fullPath = path.join(dir, item);
          const isLast = i === items.length - 1;
          const connector = isLast ? "└── " : "├── ";

          if (item.startsWith(".") || item === "node_modules") continue;

          const stats = fs.statSync(fullPath);
          const displayName = stats.isDirectory() ? `${item}/` : item;
          result += `${prefix}${connector}${displayName}\n`;

          if (stats.isDirectory()) {
            const newPrefix = prefix + (isLast ? "    " : "│   ");
            result += getStructure(fullPath, newPrefix);
          }
        }

        return result;
      };

      return getStructure(this.projectRoot);
    } catch (error) {
      return `Error reading project structure: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async getProjectDependencies(): Promise<string> {
    try {
      const fs = await import("fs");
      const path = await import("path");

      const packageJsonPath = path.join(this.projectRoot, "package.json");
      if (!fs.existsSync(packageJsonPath)) {
        return "No package.json found";
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      let result = "";
      Object.entries(deps).forEach(([name, version]) => {
        result += `• ${name}: ${version}\n`;
      });

      return result || "No dependencies found";
    } catch (error) {
      return `Error reading dependencies: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async getTechnologyStack(): Promise<string> {
    try {
      const fs = await import("fs");
      const path = await import("path");

      const packageJsonPath = path.join(this.projectRoot, "package.json");
      if (!fs.existsSync(packageJsonPath)) {
        return "Unable to determine technology stack";
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      let stack = "TypeScript/JavaScript";

      if (packageJson.dependencies?.["@modelcontextprotocol/sdk"]) {
        stack += " with MCP (Model Context Protocol)";
      }

      if (packageJson.dependencies?.["chalk"]) {
        stack += ", CLI tools";
      }

      if (packageJson.dependencies?.["commander"]) {
        stack += ", Command-line interface";
      }

      return stack;
    } catch (error) {
      return `Error determining technology stack: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async searchExperiences(
    query: string,
    category?: string,
    limit = 5
  ): Promise<Record<string, unknown>[]> {
    try {
      const fs = await import("fs");
      const path = await import("path");

      const experiencesDir = path.join(
        this.projectRoot,
        ".cortex",
        "experiences"
      );
      if (!fs.existsSync(experiencesDir)) {
        return [];
      }

      const files = fs.readdirSync(experiencesDir);
      const experiences = [];

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(experiencesDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          const experience = JSON.parse(content);

          const matches = query
            .toLowerCase()
            .split(" ")
            .some(
              (term) =>
                experience.description?.toLowerCase().includes(term) ||
                experience.title?.toLowerCase().includes(term) ||
                experience.tags?.some((tag: string) =>
                  tag.toLowerCase().includes(term)
                )
            );

          if (matches && (!category || experience.category === category)) {
            experiences.push(experience);
          }
        }
      }

      return experiences.slice(0, limit);
    } catch (error) {
      console.error("Experience search error:", error);
      return [];
    }
  }

  private formatExperienceResults(
    experiences: Record<string, unknown>[]
  ): string {
    if (experiences.length === 0) {
      return "No relevant experiences found.";
    }

    let result = `## 🔍 Search Results (${experiences.length} found)\n\n`;

    experiences.forEach((exp, index) => {
      result += `### ${index + 1}. ${exp.title || "Untitled Experience"}\n`;
      result += `**Category:** ${exp.category || "Uncategorized"}\n`;
      result += `**Tags:** ${Array.isArray(exp.tags) ? (exp.tags as string[]).join(", ") : "None"}\n`;
      result += `**Description:** ${exp.description || "No description"}\n\n`;
    });

    return result;
  }

  private async analyzeCodeFile(
    filePath: string,
    issueType?: string
  ): Promise<Record<string, unknown>[]> {
    try {
      const fs = await import("fs");
      const path = await import("path");

      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.projectRoot, filePath);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = fs.readFileSync(fullPath, "utf-8");
      const diagnostics = [];

      if (!issueType || issueType === "syntax") {
        const syntaxIssues = this.checkSyntax(content, filePath);
        diagnostics.push(...syntaxIssues);
      }

      if (!issueType || issueType === "style") {
        const styleIssues = this.checkStyle(content, filePath);
        diagnostics.push(...styleIssues);
      }

      if (!issueType || issueType === "logic") {
        const logicIssues = this.checkLogic(content, filePath);
        diagnostics.push(...logicIssues);
      }

      return diagnostics;
    } catch (error) {
      throw new Error(
        `Failed to analyze file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private checkSyntax(
    content: string,
    filePath: string
  ): Record<string, unknown>[] {
    const issues: Record<string, unknown>[] = [];

    if (content.includes("console.log(") && !content.includes("import")) {
      issues.push({
        type: "warning",
        message: "Using console.log without proper imports",
        line: this.findLineNumber(content, "console.log"),
        file: filePath,
      });
    }

    return issues;
  }

  private checkStyle(
    content: string,
    filePath: string
  ): Record<string, unknown>[] {
    const issues: Record<string, unknown>[] = [];

    const lines = content.split("\n");
    lines.forEach((line, index) => {
      if (line.length > 100) {
        issues.push({
          type: "style",
          message: `Line too long (${line.length} characters)`,
          line: index + 1,
          file: filePath,
        });
      }
    });

    return issues;
  }

  private checkLogic(
    content: string,
    filePath: string
  ): Record<string, unknown>[] {
    const issues: Record<string, unknown>[] = [];

    if (
      content.includes("==") &&
      !content.includes("===") &&
      content.includes("!=")
    ) {
      issues.push({
        type: "warning",
        message: "Mixed use of == and != operators, consider using === and !==",
        line: this.findLineNumber(content, "=="),
        file: filePath,
      });
    }

    return issues;
  }

  private findLineNumber(content: string, pattern: string): number {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        return i + 1;
      }
    }
    return 0;
  }

  private formatDiagnosticReport(
    diagnostics: Record<string, unknown>[],
    filePath: string
  ): string {
    if (diagnostics.length === 0) {
      return `## ✅ Code Analysis: ${filePath}\n\nNo issues found!`;
    }

    let result = `## 🔍 Code Analysis: ${filePath}\n\n`;
    result += `Found ${diagnostics.length} issue(s):\n\n`;

    diagnostics.forEach((diag, index) => {
      const icon =
        diag.type === "error" ? "❌" : diag.type === "warning" ? "⚠️" : "ℹ️";
      result += `### ${index + 1}. ${icon} ${String(diag.type).toUpperCase()}\n`;
      result += `**Message:** ${diag.message}\n`;
      if (diag.line) {
        result += `**Line:** ${diag.line}\n`;
      }
      result += "\n";
    });

    return result;
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MCP Server started");
  }
}

/**
 * Create MCP server - no factory nonsense
 */
export function createMCPServer(projectPath?: string): MCPServer {
  return new MCPServer(projectPath);
}
