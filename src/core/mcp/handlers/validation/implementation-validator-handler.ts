/**
 * Implementation Validator Handler
 *
 * Handles implementation validation checks
 */

import { ImplementationValidator } from "../../services/implementation-validator.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class ImplementationValidatorHandler {
  constructor(private projectRoot: string) {}

  /**
   * Handle implementation validation
   */
  async handleImplementationValidation(args: {
    changedFiles: string[];
  }): Promise<MCPToolResult> {
    try {
      const validator = new ImplementationValidator(this.projectRoot);
      const result = await validator.validateImplementation(args.changedFiles);

      if (result.isComplete) {
        return {
          content: [
            {
              type: "text",
              text: "✅ Implementation validation passed:\n- No TODO/FIXME comments\n- No mock data or placeholders\n- No unused code (Knip)\n- No scaffold patterns\n\nReady to proceed.",
            },
          ],
        };
      } else {
        // Format issues
        const issuesText = result.issues
          .map(
            (issue) =>
              `**${issue.severity.toUpperCase()}** [${issue.type}] ${issue.file}:${issue.line}\n  ${issue.description}`
          )
          .join("\n\n");

        // Generate fix tasks
        const fixTasks = validator.generateFixTasks(result.issues);
        const fixTasksText = fixTasks
          .map(
            (task) => `- [ ] ${task.id} (${task.priority}): ${task.description}`
          )
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `❌ Implementation validation FAILED:\n\n**Issues Found**:\n${issuesText}\n\n**Fix Tasks Required**:\n${fixTasksText}\n\n**REQUIRED ACTION**: Fix all blocker issues before proceeding.\n- Mock detected: ${result.mockDetected}\n- Scaffold detected: ${result.scaffoldDetected}\n- Unused code: ${result.unusedCodeDetected}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to validate implementation: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
