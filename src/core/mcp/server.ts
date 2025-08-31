#!/usr/bin/env node

/**
 * MCP Server - Direct, no-nonsense implementation
 * Linus: Simple names, simple code
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

import {
  ProjectAnalyzer,
  ProjectAnalysis,
} from "../project/project-analyzer.js";
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
 * Contextual response data interface
 */
interface ContextualResponseData {
  projectStructure: string;
  relevantFiles: string[];
  dependencies: string[];
  recentCode: string[];
}

/**
 * MCP server - straight to the point
 */
export class MCPServer {
  private server: Server;
  private llmConnector: LLMConnector;

  constructor() {
    // We don't need complex parsing anymore - keep it simple

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

    // Initialize LLM connector with current working directory
    this.llmConnector = new LLMConnector(process.cwd());

    this.setupHandlers();
  }

  /**
   * Setup request handlers
   */
  private setupHandlers(): void {
    // List available tools
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
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === "natural-language-query") {
        return await this.handleNaturalLanguageQuery(args || { query: "" });
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  /**
   * Handle natural language queries - SIMPLE AND EFFECTIVE
   */
  public async handleNaturalLanguageQuery(args: {
    query?: string;
  }): Promise<{ content: string[]; success: boolean }> {
    const query = args?.query || "";

    if (!query.trim()) {
      return this.createErrorResult("Empty query received.");
    }

    try {
      // Use LLM connector to process the request
      const llmResponse = await this.llmConnector.processRequest({ query });

      return {
        content: [llmResponse.content],
        success: true,
      };
    } catch (error) {
      console.error("Query processing failed:", error);
      return {
        content: ["Query processing failed. Please check your input."],
        success: false,
      };
    }
  }

  /**
   * Get REAL project context that AI actually needs
   */
  private async getRealProjectContext(
    query: string,
    projectPath?: string
  ): Promise<{
    projectInfo: Record<string, unknown>;
    relevantFiles: string[];
    recentCode: string[];
    dependencies: string[];
    projectStructure: string;
  }> {
    const targetPath = projectPath || process.cwd();
    const projectAnalyzer = new ProjectAnalyzer(targetPath);
    const projectAnalysis = await projectAnalyzer.analyzeProject();

    return {
      projectInfo: projectAnalysis as unknown as Record<string, unknown>,
      relevantFiles: this.findRelevantFiles(query, projectAnalysis),
      recentCode: await this.getRecentCodeSnippets(targetPath),
      dependencies: projectAnalysis.architecture?.dependencies || [],
      projectStructure: this.getSimpleProjectStructure(projectAnalysis, query),
    };
  }

  /**
   * Find files relevant to the query
   */
  private findRelevantFiles(
    query: string,
    projectAnalysis: ProjectAnalysis
  ): string[] {
    const files = projectAnalysis.structure?.children || [];
    const queryLower = query.toLowerCase();

    // Extract keywords from query
    const keywords = queryLower
      .split(/[^\w]+/)
      .filter((word) => word.length > 2)
      .filter(
        (word) =>
          ![
            "please",
            "implement",
            "create",
            "build",
            "make",
            "the",
            "and",
            "for",
            "with",
            "from",
          ].includes(word)
      );

    // First priority: files that match query keywords
    const matchingFiles = files
      .filter(
        (file: import("../project/project-analyzer.js").ProjectStructure) =>
          file.type === "file"
      )
      .filter(
        (file: import("../project/project-analyzer.js").ProjectStructure) => {
          const fileName = file.name.toLowerCase();
          return keywords.some((keyword) => fileName.includes(keyword));
        }
      )
      .map(
        (file: import("../project/project-analyzer.js").ProjectStructure) =>
          file.name
      );

    if (matchingFiles.length > 0) {
      return matchingFiles;
    }

    // Second priority: important files based on project type
    const importantFiles = files
      .filter(
        (file: import("../project/project-analyzer.js").ProjectStructure) =>
          file.type === "file"
      )
      .filter(
        (file: import("../project/project-analyzer.js").ProjectStructure) => {
          const fileName = file.name.toLowerCase();
          return (
            fileName.includes("readme") ||
            fileName.includes("package.json") ||
            fileName.includes("requirements.txt") ||
            fileName.includes("setup.py") ||
            fileName.includes("main") ||
            fileName.includes("index") ||
            fileName.includes("app")
          );
        }
      )
      .map(
        (file: import("../project/project-analyzer.js").ProjectStructure) =>
          file.name
      );

    if (importantFiles.length > 0) {
      return importantFiles.slice(0, 5);
    }

    // Fallback: return a few files
    return files
      .filter(
        (file: import("../project/project-analyzer.js").ProjectStructure) =>
          file.type === "file"
      )
      .map(
        (file: import("../project/project-analyzer.js").ProjectStructure) =>
          file.name
      )
      .slice(0, 3);
  }

  /**
   * Get recent code snippets - simple and effective
   */
  private async getRecentCodeSnippets(projectPath: string): Promise<string[]> {
    try {
      const fs = await import("fs");
      const path = await import("path");

      // Look for source files in the project
      const sourceFiles = [
        "src/index.js",
        "src/index.ts",
        "src/main.js",
        "src/main.ts",
        "src/App.js",
        "src/App.tsx",
        "index.js",
        "index.ts",
        "main.py",
        "app.py",
        "main.go",
        "src/main.go",
      ];

      const snippets: string[] = [];

      // Try to read a few source files
      for (const fileName of sourceFiles.slice(0, 3)) {
        try {
          const filePath = path.join(projectPath, fileName);
          const content = await fs.promises.readFile(filePath, "utf-8");
          const lines = content.split("\n").slice(0, 8);
          const relativePath = path.relative(projectPath, filePath);
          snippets.push(`// ${relativePath}\n${lines.join("\n")}`);
        } catch (error) {
          // Skip files that don't exist
        }
      }

      return snippets.length > 0 ? snippets : ["// No source files found"];
    } catch (error) {
      return ["// Error reading files"];
    }
  }

  /**
   * Get simple project structure
   */
  private getSimpleProjectStructure(
    projectAnalysis: ProjectAnalysis,
    query: string
  ): string {
    const structure = projectAnalysis.structure;
    if (!structure) return "Project structure unavailable";

    let result = `Project: ${structure.name}\n`;
    result += `Type: ${projectAnalysis.projectType || "unknown"}\n`;

    if (structure.children) {
      const dirs = structure.children.filter(
        (c: import("../project/project-analyzer.js").ProjectStructure) =>
          c.type === "directory"
      );
      const files = structure.children.filter(
        (c: import("../project/project-analyzer.js").ProjectStructure) =>
          c.type === "file"
      );

      result += `\nDirectories (${dirs.length}):\n`;
      dirs.forEach(
        (dir: import("../project/project-analyzer.js").ProjectStructure) => {
          result += `  ${dir.name}/\n`;
        }
      );

      result += `\nFiles (${files.length}):\n`;

      // Filter files based on query if it contains file type keywords
      const queryLower = query.toLowerCase();
      let filteredFiles = files;

      if (
        queryLower.includes(".ts") ||
        queryLower.includes("typescript") ||
        queryLower.includes("type")
      ) {
        filteredFiles = files.filter(
          (file: import("../project/project-analyzer.js").ProjectStructure) =>
            file.name.endsWith(".ts") || file.name.endsWith(".tsx")
        );
      } else if (
        queryLower.includes(".js") ||
        queryLower.includes("javascript")
      ) {
        filteredFiles = files.filter(
          (file: import("../project/project-analyzer.js").ProjectStructure) =>
            file.name.endsWith(".js") || file.name.endsWith(".jsx")
        );
      } else if (
        queryLower.includes(".json") ||
        queryLower.includes("config")
      ) {
        filteredFiles = files.filter(
          (file: import("../project/project-analyzer.js").ProjectStructure) =>
            file.name.endsWith(".json")
        );
      } else if (
        queryLower.includes(".md") ||
        queryLower.includes("readme") ||
        queryLower.includes("doc")
      ) {
        filteredFiles = files.filter(
          (file: import("../project/project-analyzer.js").ProjectStructure) =>
            file.name.endsWith(".md")
        );
      }

      // Show filtered files or all files if no filter applied
      const displayFiles = filteredFiles.length > 0 ? filteredFiles : files;
      displayFiles
        .slice(0, 20)
        .forEach(
          (file: import("../project/project-analyzer.js").ProjectStructure) => {
            result += `  ${file.name}\n`;
          }
        );

      if (filteredFiles.length > 0 && filteredFiles.length !== files.length) {
        result += `  ... (${files.length - displayFiles.length} more files filtered)\n`;
      }
    }

    return result;
  }

  /**
   * Build contextual response for AI - THIS IS WHAT MATTERS
   */
  private buildContextualResponse(
    query: string,
    context: ContextualResponseData
  ): string {
    // Always use English for this English project environment
    let response = `🤖 **Cortex AI - Providing AI with the context it really needs**\n\n`;
    response += `**Your query:** "${query}"\n\n`;

    // Project information
    response += `## 📁 Project Information\n`;
    response += `${context.projectStructure}\n\n`;

    // Related files
    if (context.relevantFiles.length > 0) {
      response += `## 🎯 Related Files\n`;
      context.relevantFiles.forEach((file: string) => {
        response += `• ${file}\n`;
      });
      response += `\n`;
    }

    // Dependencies
    if (context.dependencies.length > 0) {
      response += `## 📦 Main Dependencies\n`;
      context.dependencies.slice(0, 10).forEach((dep: string) => {
        response += `• ${dep}\n`;
      });
      response += `\n`;
    }

    // Code snippets and examples
    if (context.recentCode.length > 0) {
      response += `## 💻 相关代码示例\n`;
      context.recentCode.forEach((snippet: string) => {
        response += `${snippet}\n\n`;
      });
    }

    // AI guidance
    response += `## 🎯 AI Analysis Guidance\n\n`;
    response += `Based on the context above, please provide:\n`;
    response += `1. **Code Quality Assessment** - Based on actual code patterns\n`;
    response += `2. **Architecture Recommendations** - Considering project structure and dependencies\n`;
    response += `3. **Specific Solutions** - Targeted suggestions for relevant files\n`;
    response += `4. **Best Practices** - Based on existing project patterns\n\n`;
    response += `💡 **Key Point:** Analysis should be based on the actual project context above, not generic suggestions.\n`;

    return response;
  }

  /**
   * Create error result
   */
  private createErrorResult(message: string): {
    content: string[];
    success: boolean;
  } {
    return {
      content: [message],
      success: false,
    };
  }

  /**
   * Analyze a specific project with a query
   */
  async analyzeProject(
    projectPath: string,
    query: string
  ): Promise<{ content: string[]; success: boolean }> {
    try {
      // Use LLM connector to process the request with specific project path
      const llmResponse = await this.llmConnector.processRequest({
        query,
        context: { projectPath },
      });

      return {
        content: [llmResponse.content],
        success: true,
      };
    } catch (error) {
      console.error("Project analysis failed:", error);
      return {
        content: [
          `Failed to analyze project at ${projectPath}: ${error instanceof Error ? error.message : String(error)}`,
        ],
        success: false,
      };
    }
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
export function createMCPServer(): MCPServer {
  return new MCPServer();
}
