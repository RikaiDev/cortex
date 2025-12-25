/**
 * Task Validator
 *
 * Handles task decomposition analysis
 */

import { TaskDecomposer } from "../../services/task-decomposer.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class TaskValidator {
  /**
   * Handle task decomposition
   */
  async handleTaskDecomposition(args: {
    workflowId: string;
    taskId: string;
    taskDescription: string;
  }): Promise<MCPToolResult> {
    try {
      const decomposer = new TaskDecomposer();

      // Analyze the task
      const analysis = decomposer.analyzeTask(args.taskDescription);

      if (!analysis.isTooLarge) {
        return {
          content: [
            {
              type: "text",
              text: `Task ${args.taskId} does not need decomposition.\nComplexity is manageable - proceed with implementation.`,
            },
          ],
        };
      }

      // Task needs decomposition
      const breakdown = analysis.suggestedBreakdown || [];
      const subtasksText = breakdown
        .map(
          (st, i) =>
            `${args.taskId}-${i + 1}: ${st.description}\n  Dependencies: ${st.dependencies.join(", ") || "none"}\n  Acceptance: ${st.acceptanceCriteria.join(", ")}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `⚠️ Task ${args.taskId} is TOO LARGE and must be decomposed.\n\n**Reason**: ${analysis.reason}\n**Estimated tokens**: ${analysis.estimatedTokens}\n\n**Suggested Breakdown**:\n\n${subtasksText}\n\n**REQUIRED ACTION**: Update tasks.md with these subtasks before proceeding.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to decompose task: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
