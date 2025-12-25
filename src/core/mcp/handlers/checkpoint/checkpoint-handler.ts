/**
 * Checkpoint Handler
 *
 * Handles checkpoint operations for resumable work sessions
 */

import { MCPTool } from "../../decorators/index.js";
import { CheckpointService } from "../../services/checkpoint-service.js";
import type { MCPToolResult } from "../../types/mcp-types.js";
import type { Checkpoint, CheckpointFile } from "../../types/checkpoint.js";

export class CheckpointHandler {
  private checkpointService: CheckpointService;

  constructor(private projectRoot: string) {
    this.checkpointService = new CheckpointService(projectRoot);
  }

  /**
   * Handle checkpoint-save - Save task progress
   */
  @MCPTool({
    name: "checkpoint-save",
    description:
      "Save current task progress as a checkpoint for resuming later",
    inputSchema: {
      type: "object",
      properties: {
        taskDescription: {
          type: "string",
          description: "Brief description of the task being checkpointed",
        },
        completed: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "string" },
              description: { type: "string" },
              status: {
                type: "string",
                enum: ["completed", "in-progress", "pending"],
              },
            },
            required: ["path", "description", "status"],
          },
          description: "List of completed files",
        },
        pending: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "string" },
              description: { type: "string" },
              status: {
                type: "string",
                enum: ["completed", "in-progress", "pending"],
              },
            },
            required: ["path", "description", "status"],
          },
          description: "List of pending files",
        },
        context: {
          type: "string",
          description: "Additional context about the current state",
        },
        nextStep: {
          type: "string",
          description: "Recommended next step for resuming",
        },
        workflowId: {
          type: "string",
          description: "Associated workflow ID (optional)",
        },
      },
      required: ["taskDescription"],
    },
  })
  async handleCheckpointSave(args: {
    taskDescription: string;
    completed?: CheckpointFile[];
    pending?: CheckpointFile[];
    context?: string;
    nextStep?: string;
    workflowId?: string;
  }): Promise<MCPToolResult> {
    try {
      // Get current git info
      let branch: string | undefined;
      let lastCommit: string | undefined;

      try {
        const { execSync } = await import("node:child_process");
        branch = execSync("git rev-parse --abbrev-ref HEAD", {
          cwd: this.projectRoot,
          encoding: "utf-8",
        }).trim();
        lastCommit = execSync("git rev-parse --short HEAD", {
          cwd: this.projectRoot,
          encoding: "utf-8",
        }).trim();
      } catch {
        // Git info optional
      }

      // Get modified files from git
      let modifiedFiles: string[] = [];
      try {
        const { execSync } = await import("node:child_process");
        const gitStatus = execSync("git status --porcelain", {
          cwd: this.projectRoot,
          encoding: "utf-8",
        });
        modifiedFiles = gitStatus
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => line.substring(3).trim());
      } catch {
        // Modified files optional
      }

      const checkpointId = await this.checkpointService.saveCheckpoint({
        taskDescription: args.taskDescription,
        completed: args.completed || [],
        pending: args.pending || [],
        context: args.context || "",
        nextStep: args.nextStep || "",
        workflowId: args.workflowId,
        metadata: {
          branch,
          lastCommit,
          modifiedFiles,
          totalFiles: 0, // Will be calculated by service
          completedCount: 0, // Will be calculated by service
        },
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ **Checkpoint saved successfully!**

**Checkpoint ID**: ${checkpointId}
**Task**: ${args.taskDescription}
**Progress**: ${args.completed?.length || 0} completed, ${args.pending?.length || 0} pending
${branch ? `**Branch**: ${branch}` : ""}

You can resume this task later using:
\`checkpoint-resume ${checkpointId}\`

Or resume from the latest checkpoint:
\`checkpoint-resume\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to save checkpoint: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle checkpoint-resume - Resume from checkpoint
   */
  @MCPTool({
    name: "checkpoint-resume",
    description: "Resume from a saved checkpoint (by ID or latest)",
    inputSchema: {
      type: "object",
      properties: {
        checkpointId: {
          type: "string",
          description:
            "Checkpoint ID to resume from (optional, uses latest if not provided)",
        },
      },
    },
  })
  async handleCheckpointResume(args: {
    checkpointId?: string;
  }): Promise<MCPToolResult> {
    try {
      let checkpoint: Checkpoint | null;

      if (args.checkpointId) {
        checkpoint = await this.checkpointService.loadCheckpoint(
          args.checkpointId
        );
        if (!checkpoint) {
          return {
            content: [
              {
                type: "text",
                text: `Checkpoint not found: ${args.checkpointId}\n\nUse \`checkpoint-list\` to see available checkpoints.`,
              },
            ],
            isError: true,
          };
        }
      } else {
        checkpoint = await this.checkpointService.getLatestCheckpoint();
        if (!checkpoint) {
          return {
            content: [
              {
                type: "text",
                text: "No checkpoints found. Save a checkpoint first using `checkpoint-save`.",
              },
            ],
            isError: true,
          };
        }
      }

      // Format checkpoint context
      const context =
        this.checkpointService.formatCheckpointAsContext(checkpoint);

      // Mark as active
      await this.checkpointService.setCheckpointActive(checkpoint.id, true);

      return {
        content: [
          {
            type: "text",
            text: `${context}

**Instructions**:
1. Review the completed files and context above
2. Continue with the pending files in order
3. Follow the next step guidance
4. Save a new checkpoint after completing each file

Ready to continue!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to resume checkpoint: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle checkpoint-list - List saved checkpoints
   */
  @MCPTool({
    name: "checkpoint-list",
    description: "List all saved checkpoints",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of checkpoints to return (default: 10)",
          default: 10,
        },
      },
    },
  })
  async handleCheckpointList(args: { limit?: number }): Promise<MCPToolResult> {
    try {
      const checkpoints = await this.checkpointService.listCheckpoints(
        args.limit || 10
      );

      if (checkpoints.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No checkpoints found.\n\nSave a checkpoint using `checkpoint-save` to enable resumable work sessions.",
            },
          ],
        };
      }

      const lines = ["## 📍 Saved Checkpoints", ""];

      for (const checkpoint of checkpoints) {
        const date = new Date(checkpoint.checkpoint).toLocaleString();
        const progress = `${checkpoint.completedCount}/${checkpoint.totalFiles}`;
        const status = checkpoint.isActive ? "🟢" : "⚪";

        lines.push(`### ${status} ${checkpoint.taskDescription}`);
        lines.push(`- **ID**: \`${checkpoint.id}\``);
        lines.push(`- **Progress**: ${progress} files`);
        lines.push(`- **Checkpoint**: ${date}`);
        lines.push("");
      }

      lines.push(
        "**Resume a checkpoint**: `checkpoint-resume <checkpoint-id>`"
      );
      lines.push("**Resume latest**: `checkpoint-resume`");

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
            text: `Failed to list checkpoints: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle checkpoint-clear - Clear checkpoint(s)
   */
  @MCPTool({
    name: "checkpoint-clear",
    description: "Clear checkpoint(s) - specific ID or all checkpoints",
    inputSchema: {
      type: "object",
      properties: {
        checkpointId: {
          type: "string",
          description:
            "Specific checkpoint ID to clear (if not provided, clears all)",
        },
      },
    },
  })
  async handleCheckpointClear(args: {
    checkpointId?: string;
  }): Promise<MCPToolResult> {
    try {
      if (!args.checkpointId) {
        // Clear all checkpoints
        const count = await this.checkpointService.clearAllCheckpoints();
        return {
          content: [
            {
              type: "text",
              text: `✅ Cleared ${count} checkpoint(s).`,
            },
          ],
        };
      }

      const success = await this.checkpointService.clearCheckpoint(
        args.checkpointId
      );
      if (!success) {
        return {
          content: [
            {
              type: "text",
              text: `Checkpoint not found: ${args.checkpointId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ Checkpoint cleared: ${args.checkpointId}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to clear checkpoint: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
