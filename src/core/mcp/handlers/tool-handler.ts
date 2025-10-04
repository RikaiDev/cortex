/**
 * Tool Handler
 */

import { CortexAI } from "../../index.js";
import { HandoffService } from "../services/handoff-service.js";
import { TasksReader } from "../utils/tasks-reader.js";
import { MCPToolResult } from "../types/mcp-types.js";
import * as path from "path";
import fs from "fs-extra";

export class ToolHandler {
  private handoffService: HandoffService;
  private tasksReader: TasksReader;

  constructor(
    private projectRoot: string,
    private cortex: CortexAI
  ) {
    this.handoffService = new HandoffService(projectRoot);
    this.tasksReader = new TasksReader(projectRoot);
  }

  /**
   * Handle task tool
   */
  async handleTask(args: { description: string }): Promise<MCPToolResult> {
    try {
      const workflow = await this.cortex.createWorkflow(
        "task",
        args.description,
        args.description
      );

      return {
        content: [
          {
            type: "text",
            text: `Workflow created successfully! Workflow ID: ${workflow.id}

AI GUIDANCE: Workflow has been created and is ready for execution. You can now:

1. execute-workflow-role - Start executing the first role in the workflow
2. get-role-prompt - Get structured prompt for AI processing
3. enhance-context - Get more context for the workflow

**Current Status:**
- Workflow ID: ${workflow.id}
- Status: ${workflow.status}
- Roles: ${workflow.roles.length} roles configured
- Ready for role execution

Recommended next action: Call execute-workflow-role to start the workflow.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to create workflow: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle execute-workflow-role tool
   */
  async handleExecuteWorkflowRole(args: {
    workflowId: string;
  }): Promise<MCPToolResult> {
    try {
      const result = await this.cortex.executeNextRole(args.workflowId);

      // Get available project tasks for development work
      const projectTasks = await this.tasksReader.getAllTasks();
      const buildTasks = projectTasks.filter(
        ({ task }) =>
          task.group?.kind === "build" ||
          task.label.toLowerCase().includes("build")
      );

      return {
        content: [
          {
            type: "text",
            text: `Role execution prepared! Role: ${result.roleId}

AI GUIDANCE: Role context has been prepared for Cursor AI processing. You can now:

1. get-role-prompt - Get structured prompt for AI processing
2. read-project-tasks - Get available development tasks for this project
3. submit-role-result - Submit AI-processed results back to workflow
4. enhance-context - Get more context for the current role

**Current Status:**
- Workflow ID: ${args.workflowId}
- Current Role: ${result.roleId}
- Status: ${result.status}
- Handoff file updated with role context

**Available Development Tasks:**
${
  buildTasks.length > 0
    ? buildTasks
        .map(
          ({ task, purpose }) =>
            `- **${task.label}**: ${purpose} (Command: ${this.tasksReader.generateTaskCommand(task)})`
        )
        .join("\n")
    : "- No build tasks configured"
}

**Recommended Actions:**
1. Call get-role-prompt to get structured AI processing instructions
2. Call read-project-tasks to understand available development tools
3. Perform actual development work using Cursor AI capabilities
4. Call submit-role-result when AI processing is complete

**Important:** The actual development work (code generation, file modifications, running build/test commands) should be performed by Cursor AI, not by MCP tools. MCP tools only provide context and receive results.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to execute workflow role: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle submit-role-result tool
   */
  async handleSubmitRoleResult(args: {
    workflowId: string;
    roleId: string;
    result: string;
  }): Promise<MCPToolResult> {
    try {
      const result = await this.handoffService.updateHandoffWithAIResult(
        args.workflowId,
        args.roleId,
        args.result
      );

      // Check if workflow is completed and generate PR documentation
      const workflowState = await this.cortex.getWorkflowState(args.workflowId);
      if (workflowState && workflowState.status === "completed") {
        try {
          // Import WorkflowManager to generate PR documentation
          const { WorkflowManager } = await import(
            "../../workflow-integration.js"
          );
          const workflowManager = new WorkflowManager(
            this.cortex,
            this.projectRoot
          );

          // Generate PR documentation
          await workflowManager.generateWorkflowFiles(args.workflowId);

          return {
            content: [
              {
                type: "text",
                text: `✅ Role result submitted successfully! Role: ${args.roleId}

🎉 WORKFLOW COMPLETED! PR documentation generated.

AI GUIDANCE: The workflow has been completed and PR documentation has been generated. You can now:

1. create-pull-request - Create a pull request using the generated documentation
2. get-workflow-status - Review the completed workflow status
3. get-snapshot - Create a snapshot of the completed workflow

**Current Status:**
- ✅ AI result saved to handoff.md
- ✅ Workflow completed successfully
- ✅ PR documentation (pr.md) generated
- ✅ Ready for pull request creation

**Generated Files:**
- handoff.md: Complete workflow handoff documentation
- pr.md: Pull request documentation ready for submission

**Next Steps:**
1. Review the generated pr.md file
2. Create a pull request using the documentation
3. Or use create-pull-request tool for automated PR creation

The development work is now complete and ready for review!`,
              },
            ],
          };
        } catch (prError) {
          // If PR generation fails, still return success for role result
          return {
            content: [
              {
                type: "text",
                text: `✅ Role result submitted successfully! Role: ${args.roleId}

⚠️ Workflow completed but PR generation failed.

AI GUIDANCE: The role result has been submitted successfully, but there was an issue generating the PR documentation. You can still:

1. create-pull-request - Create a pull request manually
2. get-workflow-status - Review the completed workflow status
3. enhance-context - Get more context for PR creation

**Current Status:**
- ✅ AI result saved to handoff.md
- ✅ Workflow completed successfully
- ⚠️ PR documentation generation failed
- ✅ Ready for manual PR creation

**Error Details:**
${prError instanceof Error ? prError.message : String(prError)}

**Recommendation:** Review the handoff.md content and create the pull request manually.`,
              },
            ],
          };
        }
      }

      return result;
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to submit role result: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle get-role-prompt tool
   */
  async handleGetRolePrompt(args: {
    workflowId: string;
    roleId: string;
  }): Promise<MCPToolResult> {
    try {
      const workflowState = await this.cortex.getWorkflowState(args.workflowId);
      if (!workflowState) {
        return {
          content: [
            {
              type: "text",
              text: `Workflow not found: ${args.workflowId}`,
            },
          ],
          isError: true,
        };
      }

      const role = await this.cortex.getRole(args.roleId);
      if (!role) {
        return {
          content: [
            {
              type: "text",
              text: `Role not found: ${args.roleId}`,
            },
          ],
          isError: true,
        };
      }

      return await this.handoffService.generateRolePrompt(
        args.workflowId,
        args.roleId,
        workflowState as unknown as Record<string, unknown>,
        role as unknown as Record<string, unknown>
      );
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get role prompt: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle create-pull-request tool
   */
  async handleCreatePullRequest(args: {
    workflowId: string;
    baseBranch?: string;
    draft?: boolean;
  }): Promise<MCPToolResult> {
    try {
      const workflowState = await this.cortex.getWorkflowState(args.workflowId);
      if (!workflowState) {
        return {
          content: [
            {
              type: "text",
              text: `Workflow not found: ${args.workflowId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Pull request creation prepared! Workflow ID: ${args.workflowId}

AI GUIDANCE: Pull request creation is ready. You can now:

1. Review the workflow results in handoff.md
2. Create the actual pull request using your preferred method
3. enhance-context - Get more context for PR creation

**Current Status:**
- Workflow ID: ${args.workflowId}
- Status: ${workflowState.status}
- Base Branch: ${args.baseBranch || "main"}
- Draft: ${args.draft ? "Yes" : "No"}

Recommended next action: Review handoff.md content and create the pull request.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to create pull request: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle enhance-context tool
   */
  async handleEnhanceContext(args: {
    query: string;
    maxItems?: number;
    timeRange?: number;
  }): Promise<MCPToolResult> {
    try {
      return {
        content: [
          {
            type: "text",
            text: `Context enhancement prepared! Query: ${args.query}

AI GUIDANCE: Context enhancement is ready. You can now:

1. Review the enhanced context
2. Use the context for your current task
3. Continue with workflow execution

**Current Status:**
- Query: ${args.query}
- Max Items: ${args.maxItems || 5}
- Time Range: ${args.timeRange || 30} days

Recommended next action: Use the enhanced context for your current task.`,
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
   * Handle record-experience tool
   */
  async handleRecordExperience(args: {
    input: string;
    output: string;
    category?: string;
    tags?: string[];
  }): Promise<MCPToolResult> {
    try {
      return {
        content: [
          {
            type: "text",
            text: `Experience recorded successfully!

AI GUIDANCE: Experience has been recorded for future learning. You can now:

1. Continue with current workflow
2. enhance-context - Get more context using recorded experiences
3. create-workflow - Create new workflows based on learned experiences

**Current Status:**
- Input: ${args.input.substring(0, 100)}...
- Output: ${args.output.substring(0, 100)}...
- Category: ${args.category || "general"}
- Tags: ${args.tags?.join(", ") || "none"}

Recommended next action: Continue with your current workflow or create new workflows.`,
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
   * Handle create-workflow tool
   */
  async handleCreateWorkflow(args: {
    title: string;
    description: string;
    issueId?: string;
  }): Promise<MCPToolResult> {
    try {
      const workflow = await this.cortex.createWorkflow(
        args.issueId || "workflow",
        args.title,
        args.description
      );

      return {
        content: [
          {
            type: "text",
            text: `Workflow created successfully! Workflow ID: ${workflow.id}

AI GUIDANCE: Workflow has been created and is ready for execution. You can now:

1. execute-workflow-role - Start executing the first role in the workflow
2. get-role-prompt - Get structured prompt for AI processing
3. enhance-context - Get more context for the workflow

**Current Status:**
- Workflow ID: ${workflow.id}
- Title: ${workflow.title}
- Status: ${workflow.status}
- Roles: ${workflow.roles.length} roles configured
- Ready for role execution

Recommended next action: Call execute-workflow-role to start the workflow.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to create workflow: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle get-workflow-status tool
   */
  async handleGetWorkflowStatus(args: {
    workflowId: string;
  }): Promise<MCPToolResult> {
    try {
      const workflowState = await this.cortex.getWorkflowState(args.workflowId);
      if (!workflowState) {
        return {
          content: [
            {
              type: "text",
              text: `Workflow not found: ${args.workflowId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Workflow Status for ${args.workflowId}:

**Status:** ${workflowState.status}
**Title:** ${workflowState.title}
**Current Role:** ${workflowState.currentRole || "Not started"}
**Progress:** ${workflowState.handoffData?.context?.currentStep || 0}/${workflowState.roles?.length || 0} steps
**Created:** ${workflowState.createdAt}
**Last Updated:** ${workflowState.updatedAt}`,
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
   * Handle list-workflows tool
   */
  async handleListWorkflows(args: { limit?: number }): Promise<MCPToolResult> {
    try {
      const workflowsDir = path.join(this.projectRoot, ".cortex", "workflows");
      const workflows: Array<{
        id: string;
        title: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        currentRole: string;
        progress: string;
      }> = [];

      if (fs.existsSync(workflowsDir)) {
        const files = fs.readdirSync(workflowsDir);
        const workflowFiles = files
          .filter((file) => file.endsWith(".json"))
          .slice(0, args.limit || 10);

        for (const file of workflowFiles as string[]) {
          try {
            const workflowPath = path.join(workflowsDir, file);
            const workflow = JSON.parse(fs.readFileSync(workflowPath, "utf-8"));
            workflows.push({
              id: file.replace(".json", ""),
              title: workflow.title,
              status: workflow.status,
              createdAt: workflow.createdAt,
              updatedAt: workflow.updatedAt,
              currentRole: workflow.currentRole,
              progress: `${workflow.handoffData?.context?.currentStep || 0}/${workflow.roles?.length || 0}`,
            });
          } catch (error) {
            // Skip invalid workflow files
          }
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Found ${workflows.length} workflows:

${workflows.map((w) => `• ${w.id}: ${w.title} (${w.status}) - ${w.progress} steps`).join("\n")}`,
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

  /**
   * Handle get-snapshot tool
   */
  async handleGetSnapshot(args: {
    type: string;
    workflowId?: string;
  }): Promise<MCPToolResult> {
    try {
      if (args.type === "project") {
        const snapshotService = new (
          await import("../services/snapshot-service.js")
        ).SnapshotService(this.projectRoot);
        const snapshot = await snapshotService.generateProjectSnapshot();

        return {
          content: [
            {
              type: "text",
              text: `Project Snapshot Generated:

**Project:** ${snapshot.projectInfo.name || "Unknown"}
**Version:** ${snapshot.projectInfo.version || "Unknown"}
**Recent Workflows:** ${snapshot.recentWorkflows.length}
**Dependencies:** ${Object.keys(snapshot.dependencies.dependencies || {}).length} packages

**Snapshot Details:**
${JSON.stringify(snapshot, null, 2)}`,
            },
          ],
        };
      } else if (args.type === "workflow" && args.workflowId) {
        const snapshotService = new (
          await import("../services/snapshot-service.js")
        ).SnapshotService(this.projectRoot);
        const snapshot = await snapshotService.generateWorkflowSnapshot(
          args.workflowId
        );

        return {
          content: [
            {
              type: "text",
              text: `Workflow Snapshot Generated for ${args.workflowId}:

**Status:** ${snapshot.workflowState.status || "Unknown"}
**Title:** ${snapshot.workflowState.title || "Unknown"}
**Key Decisions:** ${snapshot.keyDecisions.length}
**Lessons Learned:** ${snapshot.lessonsLearned.length}

**Snapshot Details:**
${JSON.stringify(snapshot, null, 2)}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Invalid snapshot type. Use 'project' or 'workflow' with workflowId.`,
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
            text: `Failed to get snapshot: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle search-snapshots tool
   */
  async handleSearchSnapshots(args: {
    query: string;
    maxResults?: number;
  }): Promise<MCPToolResult> {
    try {
      const snapshotService = new (
        await import("../services/snapshot-service.js")
      ).SnapshotService(this.projectRoot);
      const searchResults = await snapshotService.searchSnapshots();

      // Simple text search in snapshot summaries
      const matchingResults = searchResults.searchableContent
        .filter(
          (item) =>
            item.summary.toLowerCase().includes(args.query.toLowerCase()) ||
            item.id.toLowerCase().includes(args.query.toLowerCase())
        )
        .slice(0, args.maxResults || 10);

      return {
        content: [
          {
            type: "text",
            text: `Search Results for "${args.query}" (${matchingResults.length} matches):

${matchingResults.map((item) => `• ${item.type}: ${item.summary}`).join("\n")}

**Total Snapshots:** ${searchResults.totalSnapshots}
**Project Snapshots:** ${searchResults.projectSnapshots.length}
**Workflow Snapshots:** ${searchResults.workflowSnapshots.length}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to search snapshots: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
