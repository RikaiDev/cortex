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

      // Check for danger zones FIRST (highest priority)
      if (result.dangerZoneDetected) {
        const dangerZoneText = result.dangerZones
          .map((zone) => {
            const location =
              zone.endLine && zone.endLine !== zone.startLine
                ? `${zone.file}:${zone.startLine}-${zone.endLine}`
                : `${zone.file}:${zone.startLine}`;

            return `📍 **${location}**\n   Reason: ${zone.reason}\n   Source: ${zone.markedBy === "comment" ? "Code comment" : "Config file"}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `⚠️  **DANGER ZONE DETECTED - PROTECTED CODE REGIONS**\n\nThe following protected regions will be affected by your changes:\n\n${dangerZoneText}\n\n⚠️  **CRITICAL WARNING**: These regions are marked as protected and should not be modified without careful consideration.\n\n**REQUIRED ACTION**: \n- Review the reasons for protection above\n- Confirm with the user that modifying these regions is intentional\n- If confirmed, you may proceed with EXTREME CAUTION\n- If not confirmed, abort the changes to these files`,
            },
          ],
          isError: true,
        };
      }

      // Check for environment compatibility issues (second priority after danger zones)
      if (result.environmentIssuesDetected) {
        const errorCount = result.environmentWarnings.filter(
          (w) => w.severity === "error"
        ).length;

        const warningsByEnv = result.environmentWarnings.reduce(
          (acc, warning) => {
            if (!acc[warning.environment]) {
              acc[warning.environment] = [];
            }
            acc[warning.environment].push(warning);
            return acc;
          },
          {} as Record<string, typeof result.environmentWarnings>
        );

        const warningsText = Object.entries(warningsByEnv)
          .map(([env, warnings]) => {
            const warningsList = warnings
              .map((w) => {
                const icon =
                  w.severity === "error"
                    ? "❌"
                    : w.severity === "warning"
                      ? "⚠️"
                      : "ℹ️";
                return `  ${icon} **${w.type}**: ${w.message}\n     ${w.location ? `File: ${w.location.file}` : ""}\n     ${w.suggestion ? `💡 ${w.suggestion}` : ""}`;
              })
              .join("\n\n");

            return `### ${env}\n\n${warningsList}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `⚠️  **Environment Compatibility Issues**\n\n${warningsText}\n\n**Summary:**\n- Errors: ${errorCount}\n- Warnings: ${result.environmentWarnings.length - errorCount}\n\n${errorCount > 0 ? "**REQUIRED ACTION**: Fix all errors before deploying to these environments." : "**Warnings found**: Review and address if applicable."}`,
            },
          ],
          isError: errorCount > 0,
        };
      }

      if (result.isComplete) {
        return {
          content: [
            {
              type: "text",
              text: "✅ Implementation validation passed:\n- No TODO/FIXME comments\n- No mock data or placeholders\n- No unused code (Knip)\n- No scaffold patterns\n- No danger zones affected\n- No environment compatibility issues\n\nReady to proceed.",
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
