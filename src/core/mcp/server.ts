#!/usr/bin/env node

/**
 * Cortex MCP Server - Simplified implementation
 */

import { readFileSync } from "fs";
import * as path from "path";
import fs from "fs-extra";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  InitializeRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { CortexAI } from "../index.js";

/**
 * Get version from package.json
 */
function getPackageVersion(): string {
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    return packageJson.version;
  } catch (error) {
    console.error("Failed to read package.json version:", error);
    return "0.0.0";
  }
}

/**
 * Cortex MCP Server - Balanced approach
 */
export class CortexMCPServer {
  private server: Server;
  private cortex: CortexAI;
  private projectRoot: string;

  constructor(projectRoot?: string) {
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

    this.projectRoot = projectRoot || process.cwd();
    this.cortex = new CortexAI(this.projectRoot);
    this.setupHandlers();
  }

  private async executeTool(name: string, args: unknown): Promise<unknown> {
    try {
      switch (name) {
        case "task":
          return await this.handleTask(
            args as {
              description: string;
              draftPr?: boolean;
              baseBranch?: string;
            }
          );

        case "enhance-context":
          return await this.handleEnhanceContext(
            args as {
              query: string;
              maxItems?: number;
              timeRange?: number;
            }
          );

        case "record-experience":
          return await this.handleRecordExperience(
            args as {
              input: string;
              output: string;
              category?: string;
              tags?: string[];
            }
          );

        case "create-workflow":
          return await this.handleCreateWorkflow(
            args as {
              issueId?: string;
              title: string;
              description: string;
            }
          );

        case "execute-workflow-role":
          return await this.handleExecuteWorkflowRole(
            args as {
              workflowId: string;
            }
          );

        case "create-pull-request":
          return await this.handleCreatePullRequest(
            args as {
              workflowId: string;
              baseBranch?: string;
              draft?: boolean;
            }
          );

        default:
          return {
            content: [
              {
                type: "text",
                text: `Unknown tool: ${name}. Use 'list-tools' to see available tools.`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Tool execution failed: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
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

    // Handle list tools - Complete AI collaboration workflow
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "task",
            description:
              "Execute a complete development task with AI collaboration workflow",
            inputSchema: {
              type: "object",
              properties: {
                description: {
                  type: "string",
                  description: "Task description",
                },
                draftPr: {
                  type: "boolean",
                  description: "Create PR as draft",
                  default: false,
                },
                baseBranch: {
                  type: "string",
                  description: "Base branch for PR",
                  default: "main",
                },
              },
              required: ["description"],
            },
          },
          {
            name: "enhance-context",
            description:
              "Enhance current context with relevant past experiences",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Query to enhance context for",
                },
                maxItems: {
                  type: "number",
                  description: "Maximum items to return",
                  default: 5,
                },
                timeRange: {
                  type: "number",
                  description: "Days to look back",
                  default: 30,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "record-experience",
            description: "Record a new experience for future reference",
            inputSchema: {
              type: "object",
              properties: {
                input: {
                  type: "string",
                  description: "Original question or task",
                },
                output: {
                  type: "string",
                  description: "Solution or response provided",
                },
                category: {
                  type: "string",
                  description: "Category for this experience",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags for organization",
                },
              },
              required: ["input", "output"],
            },
          },
          {
            name: "create-workflow",
            description: "Create a new Multi-Role Pattern workflow",
            inputSchema: {
              type: "object",
              properties: {
                issueId: { type: "string", description: "Issue identifier" },
                title: { type: "string", description: "Task title" },
                description: {
                  type: "string",
                  description: "Detailed task description",
                },
              },
              required: ["title", "description"],
            },
          },
          {
            name: "execute-workflow-role",
            description: "Execute the next role in an existing workflow",
            inputSchema: {
              type: "object",
              properties: {
                workflowId: {
                  type: "string",
                  description: "Workflow identifier",
                },
              },
              required: ["workflowId"],
            },
          },
          {
            name: "create-pull-request",
            description:
              "Create a GitHub pull request using generated pr.md file",
            inputSchema: {
              type: "object",
              properties: {
                workflowId: {
                  type: "string",
                  description: "Workflow ID to create PR for",
                },
                baseBranch: {
                  type: "string",
                  description: "Base branch",
                  default: "main",
                },
                draft: {
                  type: "boolean",
                  description: "Create as draft PR",
                  default: false,
                },
              },
              required: ["workflowId"],
            },
          },
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!name || typeof name !== "string") {
        return {
          content: [{ type: "text", text: "Invalid tool name provided" }],
          isError: true,
        };
      }

      const result = await this.executeTool(name, args);
      return result as {
        content: Array<{ type: string; text: string }>;
        isError?: boolean;
      };
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("✅ Cortex MCP Server started successfully!");
  }

  async stop(): Promise<void> {
    // Simple cleanup
    console.log("✅ Cortex MCP Server stopped");
  }

  public async handleTask(args: {
    description: string;
    draftPr?: boolean;
    baseBranch?: string;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      // Import executeTask function from CLI commands
      const { executeTask } = await import("../../cli/mcp-commands.js");

      // Execute the task workflow
      await executeTask(args.description, this.projectRoot, {
        draftPr: args.draftPr || false,
        baseBranch: args.baseBranch || "main",
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ Task "${args.description}" executed successfully!`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Task execution failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
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
      const { query } = args;

      if (!query.trim()) {
        return {
          content: [{ type: "text", text: "Please provide a query." }],
          isError: true,
        };
      }

      // Use Cortex core to enhance context
      const context = await this.cortex.enhanceContext(query);

      let response = `## 📚 Enhanced Context for: ${query}\n\n`;

      if (
        context === "No relevant experiences found." ||
        context === "Error loading experiences."
      ) {
        response += context;
      } else {
        response += context;
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
      const { input, output, category = "general" } = args;

      if (!input.trim() || !output.trim()) {
        return {
          content: [
            { type: "text", text: "Both input and output are required." },
          ],
          isError: true,
        };
      }

      // Use Cortex core to record the experience
      await this.cortex.recordExperience(input, output, category);

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

  public async handleCreateWorkflow(args: {
    issueId?: string;
    title: string;
    description: string;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const { issueId, title, description } = args;

      if (!title.trim() || !description.trim()) {
        return {
          content: [
            { type: "text", text: "Both title and description are required." },
          ],
          isError: true,
        };
      }

      // Create workflow using integrated CortexCore
      const workflow = await this.cortex.createWorkflow(
        issueId || `workflow-${Date.now()}`,
        title,
        description
      );

      return {
        content: [
          {
            type: "text",
            text: `✅ Workflow created successfully! ID: ${workflow.id}`,
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

  public async handleExecuteWorkflowRole(args: {
    workflowId: string;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const { workflowId } = args;

      if (!workflowId.trim()) {
        return {
          content: [{ type: "text", text: "Workflow ID is required." }],
          isError: true,
        };
      }

      // Execute next role using integrated CortexCore
      const execution = await this.cortex.executeNextRole(workflowId);

      return {
        content: [
          {
            type: "text",
            text: `✅ Role executed successfully! Role: ${execution.roleId}`,
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

  public async handleCreatePullRequest(args: {
    workflowId: string;
    baseBranch?: string;
    draft?: boolean;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const { workflowId, baseBranch = "main", draft = false } = args;

      // Get workflow state to find the workspace
      const workflowState = await this.cortex.getWorkflowState(workflowId);
      if (!workflowState) {
        return {
          content: [
            { type: "text", text: `Workflow ${workflowId} not found.` },
          ],
          isError: true,
        };
      }

      if (workflowState.status !== "completed") {
        return {
          content: [
            {
              type: "text",
              text: `Workflow ${workflowId} is not completed yet. Status: ${workflowState.status}`,
            },
          ],
          isError: true,
        };
      }

      // Find the workspace directory
      const workspaceId = workflowState.handoffData.context
        .workspaceId as string;
      if (!workspaceId) {
        return {
          content: [
            {
              type: "text",
              text: "Workspace ID not found in workflow context.",
            },
          ],
          isError: true,
        };
      }

      const workspaceDir = path.join(
        this.projectRoot,
        ".cortex",
        "workspaces",
        workspaceId
      );
      const prFile = path.join(workspaceDir, "pr.md");

      // Check if pr.md exists
      if (!(await fs.pathExists(prFile))) {
        return {
          content: [
            {
              type: "text",
              text: `PR documentation file not found: ${prFile}`,
            },
          ],
          isError: true,
        };
      }

      // Get current branch
      const { execSync } = await import("child_process");
      let currentBranch: string;
      try {
        currentBranch = execSync("git branch --show-current", {
          cwd: this.projectRoot,
          encoding: "utf8",
        }).trim();
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to get current git branch. Make sure you're in a git repository.",
            },
          ],
          isError: true,
        };
      }

      // Create PR using GitHub CLI
      const prCommand = `gh pr create --base ${baseBranch} --head ${currentBranch} --title "${workflowState.issueTitle}" --body-file "${prFile}"${draft ? " --draft" : ""}`;

      try {
        const prUrl = execSync(prCommand, {
          cwd: this.projectRoot,
          encoding: "utf8",
        }).trim();

        return {
          content: [
            {
              type: "text",
              text: `✅ Pull request created successfully!\n\n**PR URL:** ${prUrl}`,
            },
          ],
        };
      } catch (error) {
        // If GitHub CLI fails, provide manual instructions
        const prContent = await fs.readFile(prFile, "utf8");

        return {
          content: [
            {
              type: "text",
              text: `⚠️  GitHub CLI not available. Please create the PR manually:\n\n**Title:** ${workflowState.issueTitle}\n**Base branch:** ${baseBranch}\n**Head branch:** ${currentBranch}\n\n**PR Description:**\n${prContent}`,
            },
          ],
        };
      }
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
}

/**
 * Create Cortex MCP server
 */
export function createCortexMCPServer(projectRoot?: string): CortexMCPServer {
  return new CortexMCPServer(projectRoot);
}
