#!/usr/bin/env node

/**
 * Cortex MCP Server - Minimal and focused implementation
 *
 * Based on Context7 design principles: Keep it simple, focused, and effective
 */

import { readFileSync } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  InitializeRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { CortexCore } from "../index.js";

/**
 * Cortex Master role definition
 */
interface CortexMaster {
  id: string;
  name: string;
  specialty: string;
  description: string;
  keywords: string[];
  systemPrompt: string;
}

// Cortex Master roles are now loaded dynamically from .cortex/roles directory

/**
 * Get version from package.json
 */
function getPackageVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packagePath = path.join(__dirname, "../../../package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    return packageJson.version;
  } catch (error) {
    console.error("Failed to read package.json version:", error);
    return "0.0.0";
  }
}

/**
 * Minimal Cortex MCP Server
 */
export class CortexMCPServer {
  private server: Server;
  private cortex: CortexCore;
  private projectRoot: string;

  /**
   * Select appropriate Cortex Master role based on query content
   */
  private async selectCortexMaster(query: string): Promise<CortexMaster> {
    const lowerQuery = query.toLowerCase();

    // Load roles from .cortex/roles directory
    const masters = await this.loadCortexMasters();

    // Calculate matching scores for each role
    const scores = masters.map((master) => {
      let score = 0;

      // Keyword matching with weighted scoring
      for (const keyword of master.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (lowerQuery.includes(keywordLower)) {
          // Give higher weight to more specific keywords
          if (
            keywordLower === "scalability" ||
            keywordLower === "architecture" ||
            keywordLower === "typescript" ||
            keywordLower === "react" ||
            keywordLower === "security" ||
            keywordLower === "debug"
          ) {
            score += 3; // Specific domain keywords get 3 points
          } else {
            score += 1; // General keywords get 1 point
          }
        }
      }

      // Specialty field relevance - higher weight
      if (lowerQuery.includes(master.specialty.toLowerCase())) {
        score += 5; // Specialty match adds 5 points
      }

      // Bonus for exact phrase matches
      if (lowerQuery.includes(master.name.toLowerCase())) {
        score += 10; // Exact name match gets highest priority
      }

      return { master, score };
    });

    // Sort by score (descending) and return highest scoring role
    scores.sort((a, b) => b.score - a.score);

    console.log(
      `🎯 Master selection scores:`,
      scores.map((s) => `${s.master.name}: ${s.score}`).join(", ")
    );

    // If highest score is 0, return default System Architect for architecture questions
    if (scores[0].score === 0) {
      if (
        lowerQuery.includes("architecture") ||
        lowerQuery.includes("design") ||
        lowerQuery.includes("system")
      ) {
        return masters.find((m) => m.id === "architect")!;
      }
      return masters.find((m) => m.id === "code-assistant")!;
    }

    return scores[0].master;
  }

  /**
   * Load Cortex Masters from .cortex/roles directory
   */
  private async loadCortexMasters(): Promise<CortexMaster[]> {
    const rolesDir = path.join(this.projectRoot, ".cortex", "roles");
    const masters: CortexMaster[] = [];

    try {
      // Check if roles directory exists
      if (!(await fs.pathExists(rolesDir))) {
        console.warn(
          "⚠️ .cortex/roles directory not found, using fallback roles"
        );
        return this.getFallbackMasters();
      }

      // Read all .md files from roles directory
      const files = await fs.readdir(rolesDir);
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      for (const file of mdFiles) {
        try {
          const filePath = path.join(rolesDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const master = this.parseRoleFile(file, content);
          if (master) {
            masters.push(master);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to parse role file ${file}:`, error);
        }
      }

      if (masters.length === 0) {
        console.warn("⚠️ No valid role files found, using fallback roles");
        return this.getFallbackMasters();
      }

      return masters;
    } catch (error) {
      console.error("❌ Failed to load Cortex Masters:", error);
      return this.getFallbackMasters();
    }
  }

  /**
   * Parse role file content into CortexMaster object
   */
  private parseRoleFile(
    filename: string,
    content: string
  ): CortexMaster | null {
    try {
      const id = filename.replace(".md", "");

      // Extract title (first # heading)
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const name = titleMatch ? titleMatch[1] : id;

      // Extract description from ## Description section
      const descMatch = content.match(
        /## Description\n\n(.+?)(?=\n\n##|\n\n\*\*|$)/s
      );
      const description = descMatch
        ? descMatch[1].trim()
        : `${name} specialist`;

      // Generate specialty based on role ID
      const specialty = this.generateSpecialty(id);

      // Generate keywords based on filename and content
      const keywords = this.generateKeywords(id);

      // Use the full content as system prompt
      const systemPrompt = content;

      return {
        id,
        name,
        specialty,
        description,
        keywords,
        systemPrompt,
      };
    } catch (error) {
      console.warn(`⚠️ Failed to parse role file ${filename}:`, error);
      return null;
    }
  }

  /**
   * Generate specialty from role ID
   */
  private generateSpecialty(id: string): string {
    if (id.includes("react")) {
      return "React & Frontend Development";
    } else if (id.includes("typescript")) {
      return "TypeScript Development";
    } else if (id.includes("architect")) {
      return "Software Architecture Design";
    } else if (id.includes("security")) {
      return "Network Security & Cybersecurity";
    } else if (id.includes("debug")) {
      return "Debugging & Problem Solving";
    } else if (id.includes("code-assistant")) {
      return "General Programming";
    } else if (id.includes("documentation")) {
      return "Technical Documentation";
    } else if (id.includes("testing")) {
      return "Software Testing & Quality Assurance";
    } else if (id.includes("ui-ux")) {
      return "UI/UX Design";
    }
    return "General Development";
  }

  /**
   * Generate keywords from role ID and content
   */
  private generateKeywords(id: string): string[] {
    const keywords = [id];

    // Add common keywords based on role ID
    if (id.includes("react")) {
      keywords.push("react", "frontend", "component", "hook", "jsx", "ui");
    } else if (id.includes("typescript")) {
      keywords.push(
        "typescript",
        "type",
        "interface",
        "generic",
        "type-safety"
      );
    } else if (id.includes("architect")) {
      keywords.push(
        "architecture",
        "design",
        "system",
        "structure",
        "pattern",
        "scalability"
      );
    } else if (id.includes("security")) {
      keywords.push(
        "security",
        "auth",
        "authentication",
        "authorization",
        "encryption"
      );
    } else if (id.includes("debug")) {
      keywords.push("debug", "error", "bug", "fix", "troubleshoot", "issue");
    } else if (id.includes("code-assistant")) {
      keywords.push("code", "programming", "development", "quality", "clean");
    } else if (id.includes("documentation")) {
      keywords.push("docs", "documentation", "writing", "technical", "guide");
    } else if (id.includes("testing")) {
      keywords.push("test", "testing", "quality", "qa", "automation");
    } else if (id.includes("ui-ux")) {
      keywords.push("ui", "ux", "design", "user", "interface", "experience");
    }

    return keywords;
  }

  /**
   * Get fallback masters when file loading fails
   */
  private getFallbackMasters(): CortexMaster[] {
    return [
      {
        id: "code-assistant",
        name: "Code Assistant",
        specialty: "General Programming",
        description: "General programming and code quality specialist",
        keywords: ["code", "programming", "development", "quality", "clean"],
        systemPrompt:
          "You are a general code assistant focused on clean, maintainable code.",
      },
    ];
  }

  constructor(projectPath?: string) {
    this.server = new Server(
      {
        name: "cortex-mcp",
        version: getPackageVersion(),
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Resolve project root
    this.projectRoot =
      projectPath ||
      process.env.WORKSPACE_ROOT ||
      process.env.WORKSPACE_FOLDER ||
      process.env.CURSOR_WORKSPACE_ROOT ||
      process.cwd();

    // Initialize Cortex core
    this.cortex = new CortexCore(this.projectRoot);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle initialization
    this.server.setRequestHandler(InitializeRequestSchema, async () => {
      return {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "cortex-mcp",
          version: getPackageVersion(),
        },
      };
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "enhance-context",
            description:
              "Enhance current context with relevant past experiences and knowledge",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description:
                    "Current task or question to enhance context for",
                },
                maxItems: {
                  type: "number",
                  description: "Maximum number of relevant items to return",
                  default: 5,
                },
                timeRange: {
                  type: "number",
                  description: "Days to look back for relevant experiences",
                  default: 30,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "record-experience",
            description:
              "Record a new experience or solution for future reference",
            inputSchema: {
              type: "object",
              properties: {
                input: {
                  type: "string",
                  description: "The original question or task",
                },
                output: {
                  type: "string",
                  description: "The solution or response provided",
                },
                category: {
                  type: "string",
                  description: "Category for this experience",
                  enum: [
                    "bugfix",
                    "feature",
                    "refactor",
                    "debug",
                    "optimization",
                    "general",
                  ],
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags for better organization",
                },
              },
              required: ["input", "output"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;
        switch (name) {
          case "enhance-context":
            result = await this.handleEnhanceContext(
              args as {
                query: string;
                maxItems?: number;
                timeRange?: number;
              }
            );
            break;
          case "record-experience":
            result = await this.handleRecordExperience(
              args as {
                input: string;
                output: string;
                category?: string;
                tags?: string[];
              }
            );
            break;
          default:
            return {
              content: [{ type: "text", text: `Unknown tool: ${name}` }],
              isError: true,
            };
        }

        return result;
      } catch (error) {
        console.error("Tool execution error:", error);
        return {
          content: [
            {
              type: "text",
              text: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  public async handleEnhanceContext(args: {
    query: string;
    maxItems?: number;
    timeRange?: number;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const { query, maxItems = 5, timeRange = 30 } = args;

      if (!query.trim()) {
        return {
          content: [
            {
              type: "text",
              text: "Please provide a query to enhance context for.",
            },
          ],
          isError: true,
        };
      }

      // Select appropriate Cortex Master role
      const selectedMaster = await this.selectCortexMaster(query);
      console.log(
        `🎭 Selected Cortex Master: ${selectedMaster.name} (${selectedMaster.specialty})`
      );

      // Use Cortex core to find relevant experiences
      const relevantExperiences = await this.cortex.findRelevantExperiences(
        query,
        maxItems,
        timeRange
      );

      // Build enhanced response
      let response = `## 🎭 Cortex Master: ${selectedMaster.name}\n`;
      response += `**Specialty:** ${selectedMaster.specialty}\n`;
      response += `**Role Description:** ${selectedMaster.description}\n\n`;

      response += `## 📋 Problem Analysis\n`;
      response += `**Original Query:** ${query}\n\n`;

      if (relevantExperiences.length === 0) {
        response += `## 🤔 Master Recommendations\n`;
        response += `While no relevant historical experiences were found, I can help you based on my professional expertise:\n\n`;
        response += `**Role Definition:**\n${selectedMaster.systemPrompt}\n\n`;
        response += `**Please provide more specific problem details, and I'll give you professional solutions!**`;
      } else {
        response += `## 📚 Related Historical Experiences\n`;
        response += `Based on experiences learned by the system, I found the following relevant cases:\n\n`;

        const formattedExperiences = relevantExperiences
          .map((exp, index) => {
            const tags = exp.tags?.length ? ` [${exp.tags.join(", ")}]` : "";
            return `### 💡 Experience ${index + 1}${tags}
**Problem:** ${exp.input}
**Solution:** ${exp.output}
**Category:** ${exp.category}
**Time:** ${exp.timestamp}`;
          })
          .join("\n\n");

        response += formattedExperiences;
        response += `\n\n## 🎯 Master Insights\n`;
        response += `Based on these experiences and my professional knowledge as a ${selectedMaster.name}, I recommend:\n\n`;
        response += `**My Expertise:**\n${selectedMaster.systemPrompt}\n\n`;
        response += `**Specific Recommendations:**\n`;
        response += `1. **Reference Historical Solutions** - The above experiences may provide direct solution ideas\n`;
        response += `2. **Apply Professional Expertise** - Consider ${selectedMaster.specialty} best practices\n`;
        response += `3. **Systematic Analysis** - Re-evaluate the problem from my domain expertise perspective\n\n`;
        response += `**Need more in-depth guidance? I can provide detailed solutions based on your specific situation!**`;
      }

      return {
        content: [{ type: "text", text: response }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to enhance context: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  public async handleRecordExperience(args: {
    input: string;
    output: string;
    category?: string;
    tags?: string[];
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const { input, output, category = "general", tags = [] } = args;

      if (!input.trim() || !output.trim()) {
        return {
          content: [
            { type: "text", text: "Both input and output are required." },
          ],
          isError: true,
        };
      }

      // Use Cortex core to record the experience
      await this.cortex.recordExperience({
        input,
        output,
        category,
        tags,
        timestamp: new Date().toISOString(),
      });

      return {
        content: [
          {
            type: "text",
            text: `Experience recorded successfully in category: ${category}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to record experience: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
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
 * Create Cortex MCP server - minimal and focused
 */
export function createCortexMCPServer(projectPath?: string): CortexMCPServer {
  return new CortexMCPServer(projectPath);
}

/**
 * Direct execution entry point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createCortexMCPServer();
  server.start().catch((error) => {
    console.error("Failed to start Cortex MCP server:", error);
    process.exit(1);
  });
}
