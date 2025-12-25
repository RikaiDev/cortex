/**
 * Memory Handler
 *
 * Handles memory operations (learn, context, correct)
 */

import { MCPTool } from "../../decorators/index.js";
import { MemoryService } from "../../services/memory/index.js";
import { CorrectionService } from "../../services/correction-service.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class MemoryHandler {
  private memoryService: MemoryService;
  private correctionService: CorrectionService;

  constructor(private projectRoot: string) {
    this.memoryService = new MemoryService(projectRoot);
    this.correctionService = new CorrectionService(projectRoot);
  }

  /**
   * Handle context - Enhance context from memory
   */
  @MCPTool({
    name: "context",
    description:
      "Retrieve relevant context from project memory (past experiences, patterns, decisions)",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to search for in project memory",
        },
      },
      required: ["query"],
    },
  })
  async handleContext(args: { query: string }): Promise<MCPToolResult> {
    try {
      const context = await this.memoryService.enhanceContext(args.query);

      if (!context) {
        return {
          content: [
            {
              type: "text",
              text: "No relevant experiences found in memory for this query.",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: context,
          },
        ],
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

  /**
   * Handle correct - Record correction to prevent future mistakes
   */
  @MCPTool({
    name: "correct",
    description:
      "Record a correction to prevent AI from repeating mistakes in future sessions",
    inputSchema: {
      type: "object",
      properties: {
        wrongBehavior: {
          type: "string",
          description: "What the AI did wrong",
        },
        correctBehavior: {
          type: "string",
          description: "What the AI should do instead",
        },
        severity: {
          type: "string",
          enum: ["minor", "moderate", "major"],
          description: "How serious was the mistake",
        },
        filePatterns: {
          type: "array",
          items: { type: "string" },
          description:
            "File patterns where this applies (e.g., '**/*.test.ts')",
        },
        triggerKeywords: {
          type: "array",
          items: { type: "string" },
          description: "Keywords that should trigger this correction",
        },
      },
      required: ["wrongBehavior", "correctBehavior"],
    },
  })
  async handleCorrect(args: {
    wrongBehavior: string;
    correctBehavior: string;
    severity?: string;
    filePatterns?: string[];
    triggerKeywords?: string[];
  }): Promise<MCPToolResult> {
    try {
      const correctionId = await this.correctionService.recordCorrection({
        wrongBehavior: args.wrongBehavior,
        correctBehavior: args.correctBehavior,
        severity:
          (args.severity as "minor" | "moderate" | "major" | undefined) ||
          "moderate",
        context: {
          filePatterns: args.filePatterns || [],
          techStack: [],
          triggerKeywords: args.triggerKeywords || [],
          phases: [],
        },
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ Correction recorded successfully!

**ID**: ${correctionId}
**Wrong**: ${args.wrongBehavior}
**Correct**: ${args.correctBehavior}
**Severity**: ${args.severity || "moderate"}

This correction has been saved to project memory. The AI will be warned before repeating similar mistakes in future sessions.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to record correction: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle learn - Record experience to memory
   */
  @MCPTool({
    name: "learn",
    description:
      "Record an experience, pattern, or lesson to project memory for future reference",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short title for this experience",
        },
        content: {
          type: "string",
          description: "Full description of what was learned",
        },
        type: {
          type: "string",
          enum: ["pattern", "decision", "solution", "lesson"],
          description: "Type of experience",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for easier retrieval",
        },
      },
      required: ["title", "content", "type"],
    },
  })
  async handleLearn(args: {
    title: string;
    content: string;
    type: string;
    tags?: string[];
  }): Promise<MCPToolResult> {
    try {
      const experienceId = await this.memoryService.recordExperience({
        title: args.title,
        content: args.content,
        type: args.type as "pattern" | "decision" | "solution" | "lesson",
        tags: args.tags || [],
      });

      return {
        content: [
          {
            type: "text",
            text: `Experience recorded successfully!

**ID**: ${experienceId}
**Type**: ${args.type}
**Title**: ${args.title}

This experience is now searchable via \`cortex.context\`.`,
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
}
