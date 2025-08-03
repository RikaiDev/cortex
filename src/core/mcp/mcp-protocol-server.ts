#!/usr/bin/env node

/**
 * MCP Protocol Server - Using Official SDK
 *
 * This module implements the standard MCP protocol using the official SDK
 * for proper integration with Cursor and other MCP clients.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * MCP Protocol Server using official SDK
 */
export class MCPProtocolServer {
  private server: Server;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.server = new Server(
      {
        name: "cortex-mcp-server",
        version: "0.6.1",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup MCP server handlers
   */
  private setupHandlers(): void {
    // Handle list tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "context-enhancer",
            description: "Load project context and experiences",
            inputSchema: {
              type: "object",
              properties: {},
              required: [],
            },
          },
          {
            name: "experience-recorder",
            description: "Record user interactions and learnings",
            inputSchema: {
              type: "object",
              properties: {
                context: {
                  type: "object",
                  properties: {
                    userInput: { type: "string" },
                    response: { type: "string" },
                    timestamp: { type: "string" },
                  },
                  required: ["userInput"],
                },
              },
              required: ["context"],
            },
          },
          {
            name: "standards-detector",
            description: "Detect user preferences and standards",
            inputSchema: {
              type: "object",
              properties: {
                message: { type: "string" },
                language: { type: "string" },
                context: { type: "string" },
                scope: { type: "string" },
              },
              required: ["message"],
            },
          },
          {
            name: "standards-applier",
            description: "Apply learned standards to content",
            inputSchema: {
              type: "object",
              properties: {
                content: { type: "string" },
                scope: { type: "string" },
              },
              required: ["content"],
            },
          },
          {
            name: "cortex-feedback-collector",
            description: "Collect and process user feedback",
            inputSchema: {
              type: "object",
              properties: {
                feedbackType: {
                  type: "string",
                  enum: ["positive", "negative", "suggestion", "correction"],
                },
                content: { type: "string" },
                contextId: { type: "string" },
                tags: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["feedbackType", "content"],
            },
          },
        ],
      };
    });

    // Handle call tool request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.executeTool(name, args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (error) {
        console.error(`Tool execution failed: ${error}`);
        throw new Error(`Tool execution failed: ${error}`);
      }
    });
  }

  /**
   * Execute a specific tool
   */
  private async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "context-enhancer":
        return await this.executeContextEnhancer(args);

      case "experience-recorder":
        return await this.executeExperienceRecorder(args);

      case "standards-detector":
        return await this.executeStandardsDetector(args);

      case "standards-applier":
        return await this.executeStandardsApplier(args);

      case "cortex-feedback-collector":
        return await this.executeFeedbackCollector(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Execute context enhancer tool
   */
  private async executeContextEnhancer(_args: any): Promise<any> {
    try {
      const experiencesDir = path.join(this.projectRoot, "docs", "experiences");

      // Check if experiences directory exists
      try {
        await fs.access(experiencesDir);
      } catch {
        return {
          output: "<!-- No experiences directory found. -->",
          success: true,
        };
      }

      // Read all experience files
      const files = await fs.readdir(experiencesDir);
      if (files.length === 0) {
        return {
          output: "<!-- No experiences found in the library. -->",
          success: true,
        };
      }

      const allExperiences: string[] = [];
      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(experiencesDir, file);
          const fileContent = await fs.readFile(filePath, "utf-8");

          const formattedBlock = `
--- Experience Start (Source: ${file}) ---
${fileContent}
--- Experience End ---`;
          allExperiences.push(formattedBlock);
        }
      }

      const combinedExperiences = allExperiences.join("\n\n");
      return {
        output: combinedExperiences,
        success: true,
      };
    } catch (error: any) {
      console.error("Error in contextEnhancerTool:", error);
      return {
        output: `<!-- Error fetching experiences: ${error.message} -->`,
        success: false,
      };
    }
  }

  /**
   * Execute experience recorder tool
   */
  private async executeExperienceRecorder(args: any): Promise<any> {
    const { context } = args;
    if (context && context.userInput) {
      const hash = crypto
        .createHash("sha256")
        .update(context.userInput)
        .digest("hex");
      const experiencePath = path.join(
        this.projectRoot,
        "docs",
        "experiences",
        `${hash}.json`
      );

      try {
        // Ensure directory exists
        await fs.mkdir(path.dirname(experiencePath), { recursive: true });
        await fs.writeFile(experiencePath, JSON.stringify(context, null, 2));
        return {
          output: `Experience for "${context.userInput}" saved successfully to ${path.basename(experiencePath)}.`,
          success: true,
        };
      } catch (error: any) {
        console.error(`Failed to save experience to ${experiencePath}:`, error);
        return {
          output: `Failed to save experience: ${error.message}`,
          success: false,
        };
      }
    }
    return {
      output:
        "Invalid context for recording experience. 'userInput' is required.",
      success: false,
    };
  }

  /**
   * Execute standards detector tool
   */
  private async executeStandardsDetector(args: any): Promise<any> {
    const { message, language = "zh-TW" } = args;

    if (!message) {
      return {
        detected: false,
        signals: [],
        message: "No message provided for standards detection",
      };
    }

    // Define keywords for different feedback types
    const keywords = {
      corrections: ["不對", "錯誤", "錯了", "有問題", "失敗"],
      preferences: ["我們用", "我們專案用", "規範是", "習慣是", "偏好"],
      prohibitions: ["不要", "從來不用", "避免", "禁止", "不應該"],
      frustration: ["又來了", "還是這樣", "一直", "總是", "卡關"],
    };

    const detectedSignals = [];
    let detectedType = null;

    // Check for each type of feedback
    for (const [type, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (message.includes(word)) {
          detectedSignals.push({
            type,
            keyword: word,
            context: message,
          });
          detectedType = type;
          break;
        }
      }
      if (detectedType) break;
    }

    return {
      detected: detectedSignals.length > 0,
      signals: detectedSignals,
      detectedType,
      language,
      message:
        detectedSignals.length > 0
          ? `Detected ${detectedType} signal: ${detectedSignals[0].keyword}`
          : "No standards detected",
    };
  }

  /**
   * Execute standards applier tool
   */
  private async executeStandardsApplier(args: any): Promise<any> {
    const { content, scope = "global" } = args;

    if (!content) {
      return {
        originalContent: "",
        modifiedContent: "",
        standardsApplied: false,
        message: "No content provided for standards application",
      };
    }

    // Apply basic standards based on scope
    let modifiedContent = content;
    let standardsApplied = false;

    // Apply English comment standards
    if (scope === "global" || scope === "code") {
      // Ensure code comments are in English
      modifiedContent = modifiedContent.replace(
        /\/\/\s*[\u4e00-\u9fff]+/g, // Chinese characters
        (match: string) => {
          standardsApplied = true;
          return `// TODO: Convert Chinese comment to English: ${match}`;
        }
      );
    }

    // Apply documentation standards
    if (scope === "global" || scope === "docs") {
      // Ensure documentation follows project conventions
      if (
        modifiedContent.includes("TODO") ||
        modifiedContent.includes("FIXME")
      ) {
        standardsApplied = true;
      }
    }

    return {
      originalContent: content,
      modifiedContent,
      standardsApplied,
      scope,
      message: standardsApplied
        ? "Standards applied successfully"
        : "No standards applied (content already compliant)",
    };
  }

  /**
   * Execute feedback collector tool
   */
  private async executeFeedbackCollector(args: any): Promise<any> {
    const { feedbackType, content } = args;

    return {
      id: `fb-${Date.now()}`,
      status: "collected",
      feedbackType,
      content,
      message: `Feedback collected: ${feedbackType}`,
    };
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error("MCP Server started with tools:", [
      "context-enhancer",
      "experience-recorder",
      "standards-detector",
      "standards-applier",
      "cortex-feedback-collector",
    ]);
  }
}

/**
 * Factory function to create an MCP protocol server.
 */
export function createMCPProtocolServer(
  projectRoot: string
): MCPProtocolServer {
  return new MCPProtocolServer(projectRoot);
}

// Start the server if this file is run directly.
if (import.meta.url.endsWith(process.argv[1])) {
  const server = createMCPProtocolServer(process.cwd());
  server.start().catch(console.error);
}
