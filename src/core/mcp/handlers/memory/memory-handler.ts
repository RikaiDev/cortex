/**
 * Memory Handler
 *
 * Handles memory operations (learn, context, correct)
 */

import { MemoryService } from "../../services/memory-service.js";
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
