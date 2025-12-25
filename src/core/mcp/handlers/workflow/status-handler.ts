/**
 * Status Handler
 *
 * Handles workflow status queries
 * - status: Get detailed workflow status
 * - list: List all workflows
 */

import { WorkflowService } from "../../services/workflow-service.js";
import { HandlerUtils } from "../utils/handler-utils.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class StatusHandler {
  private workflowService: WorkflowService;

  constructor(private projectRoot: string) {
    this.workflowService = new WorkflowService(projectRoot);
  }

  /**
   * Ensure workflow ID exists (use provided or get latest)
   */
  private async ensureWorkflowId(providedId?: string): Promise<string> {
    return HandlerUtils.ensureWorkflowId(this.workflowService, providedId);
  }

  /**
   * Handle status - Get workflow status
   */
  async handleStatus(args: { workflowId?: string }): Promise<MCPToolResult> {
    try {
      const workflowId = await this.ensureWorkflowId(args.workflowId);
      const status = await this.workflowService.getWorkflowStatus(workflowId);

      return {
        content: [
          {
            type: "text",
            text: `## Workflow Status

**ID**: ${status.workflow.id}
**Title**: ${status.workflow.title}
**Status**: ${status.workflow.status.toUpperCase()}
**Created**: ${status.workflow.createdAt}
**Updated**: ${status.workflow.updatedAt}

### Progress
- Completed phases: ${status.completedPhases.join(", ") || "None"}
- Current phase: ${status.currentPhase}
- Next phase: ${status.nextPhase}

### Current Role
${status.workflow.currentRole || "None assigned"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get workflow status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle list - List workflows
   */
  async handleList(args: { limit?: number }): Promise<MCPToolResult> {
    try {
      const workflows = await this.workflowService.listWorkflows(
        args.limit || 10
      );

      if (workflows.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No workflows found. Create one with `spec <description>`.",
            },
          ],
        };
      }

      const lines = ["## Active Workflows", ""];
      for (const workflow of workflows) {
        lines.push(`### ${workflow.title}`);
        lines.push(`- **ID**: ${workflow.id}`);
        lines.push(`- **Status**: ${workflow.status.toUpperCase()}`);
        lines.push(`- **Updated**: ${workflow.updatedAt}`);
        lines.push("");
      }

      return {
        content: [
          {
            type: "text",
            text: lines.join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to list workflows: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
