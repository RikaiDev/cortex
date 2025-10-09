#!/usr/bin/env node

/**
 * Cortex MCP Server - Refactored Architecture
 */

import { readFileSync } from "fs";
import * as path from "path";
import * as os from "os";
import fs from "fs-extra";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  InitializeRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { CortexAI } from "../index.js";
import { ToolHandler } from "./handlers/tool-handler.js";
import { ResourceHandler } from "./handlers/resource-handler.js";

/**
 * Get version from package.json
 */
function getPackageVersion(): string {
  try {
    const currentDir = __dirname;
    const possiblePaths = [
      path.join(currentDir, "..", "..", "package.json"),
      path.join(currentDir, "..", "..", "..", "package.json"),
      path.join(process.cwd(), "package.json"),
    ];

    for (const packagePath of possiblePaths) {
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
        return packageJson.version;
      }
    }

    return "0.0.0";
  } catch (error) {
    return "0.0.0";
  }
}

/**
 * Cortex MCP Server - Refactored Architecture
 */
export class CortexMCPServer {
  private server: Server;
  private cortex: CortexAI;
  private projectRoot: string;
  private toolHandler: ToolHandler;
  private resourceHandler: ResourceHandler;

  constructor() {
    this.server = new Server(
      {
        name: "cortex-mcp",
        version: getPackageVersion(),
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.projectRoot = this.detectProjectRoot();
    this.cortex = new CortexAI(this.projectRoot);
    this.toolHandler = new ToolHandler(this.projectRoot, this.cortex);
    this.resourceHandler = new ResourceHandler(this.projectRoot);
    this.setupHandlers();
    this.initializeCortexWorkspace();
  }

  /**
   * Detect project root directory
   */
  private detectProjectRoot(): string {
    // Priority 1: Environment variables (VS Code/Cursor specific)
    if (process.env.VSCODE_CWD && process.env.VSCODE_CWD.trim() !== '') {
      return process.env.VSCODE_CWD;
    }
    if (process.env.CURSOR_CWD && process.env.CURSOR_CWD.trim() !== '') {
      return process.env.CURSOR_CWD;
    }

    // Priority 2: Current working directory if it contains package.json
    const cwd = process.cwd();
    if (cwd && cwd.trim() !== '' && fs.existsSync(path.join(cwd, "package.json"))) {
      return cwd;
    }

    // Priority 3: Look for .cortex directory in current or parent directories
    let currentDir = cwd;
    while (currentDir && currentDir !== path.dirname(currentDir) && currentDir !== '/') {
      if (fs.existsSync(path.join(currentDir, ".cortex"))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }

    // Priority 4: Look for cortex.json in current or parent directories
    currentDir = cwd;
    while (currentDir && currentDir !== path.dirname(currentDir) && currentDir !== '/') {
      if (fs.existsSync(path.join(currentDir, "cortex.json"))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }

    // Priority 5: Relative to this file's location
    const currentFileDir = __dirname;
    const possiblePaths = [
      path.join(currentFileDir, "..", "..", ".."), // dist/core/mcp -> project root
      path.join(currentFileDir, "..", ".."), // dist/core -> project root
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(path.join(possiblePath, "package.json"))) {
        return possiblePath;
      }
    }

    // Fallback to current working directory, but ensure it's not empty or root
    const fallback = process.cwd();
    if (fallback && fallback.trim() !== '' && fallback !== '/') {
      return fallback;
    }

    // Last resort: use home directory
    return os.homedir();
  }

  /**
   * Initialize Cortex workspace
   */
  private initializeCortexWorkspace(): void {
    // Safety check: ensure project root is valid and not root directory
    if (!this.projectRoot || this.projectRoot.trim() === '' || this.projectRoot === '/') {
      throw new Error(`Invalid project root: ${this.projectRoot}. Cannot initialize workspace in root directory.`);
    }

    const cortexDir = path.join(this.projectRoot, ".cortex");
    const rolesDir = path.join(cortexDir, "roles");
    const workflowsDir = path.join(cortexDir, "workflows");
    const workspacesDir = path.join(cortexDir, "workspaces");
    const experiencesDir = path.join(cortexDir, "experiences");

    // Create directories
    fs.ensureDirSync(rolesDir);
    fs.ensureDirSync(workflowsDir);
    fs.ensureDirSync(workspacesDir);
    fs.ensureDirSync(experiencesDir);

    // Copy default role files if they don't exist
    const defaultRolesDir = path.join(this.projectRoot, "templates", "roles");
    if (fs.existsSync(defaultRolesDir)) {
      const roleFiles = fs.readdirSync(defaultRolesDir);
      for (const roleFile of roleFiles) {
        const sourcePath = path.join(defaultRolesDir, roleFile);
        const targetPath = path.join(rolesDir, roleFile);
        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
        }
      }
    }
  }

  /**
   * Setup MCP handlers
   */
  private setupHandlers(): void {
    // Handle initialization
    this.server.setRequestHandler(InitializeRequestSchema, async () => {
      try {
        return {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
          serverInfo: {
            name: "cortex-mcp",
            version: getPackageVersion(),
          },
        };
      } catch (error) {
        console.error("Error in InitializeRequestSchema handler:", error);
        throw error;
      }
    });

    // Handle list tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        return {
          tools: [
            {
              name: "cortex-task",
              description:
                "Create and execute a complete AI collaboration workflow",
              inputSchema: {
                type: "object",
                properties: {
                  description: {
                    type: "string",
                    description: "Task description for AI collaboration",
                  },
                },
                required: ["description"],
              },
            },
            {
              name: "execute-workflow-role",
              description: "Execute the next role in a workflow",
              inputSchema: {
                type: "object",
                properties: {
                  workflowId: {
                    type: "string",
                    description: "Workflow ID",
                  },
                },
                required: ["workflowId"],
              },
            },
            {
              name: "submit-role-result",
              description:
                "Submit AI-processed result for a role back to the workflow",
              inputSchema: {
                type: "object",
                properties: {
                  workflowId: {
                    type: "string",
                    description: "Workflow identifier",
                  },
                  roleId: {
                    type: "string",
                    description: "Role identifier",
                  },
                  result: {
                    type: "string",
                    description: "AI-processed result content",
                  },
                },
                required: ["workflowId", "roleId", "result"],
              },
            },
            {
              name: "get-workflow-status",
              description: "Get status and progress of a workflow",
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
              name: "list-workflows",
              description: "List all available workflows",
              inputSchema: {
                type: "object",
                properties: {
                  limit: {
                    type: "number",
                    description: "Maximum number of workflows to return",
                    default: 10,
                  },
                },
              },
            },
            {
              name: "create-pull-request",
              description: "Create a pull request for workflow results",
              inputSchema: {
                type: "object",
                properties: {
                  workflowId: {
                    type: "string",
                    description: "Workflow identifier",
                  },
                  baseBranch: {
                    type: "string",
                    description: "Base branch for the pull request",
                    default: "main",
                  },
                  draft: {
                    type: "boolean",
                    description: "Create as draft pull request",
                    default: false,
                  },
                },
                required: ["workflowId"],
              },
            },
          ],
        };
      } catch (error) {
        console.error("Error in ListToolsRequestSchema handler:", error);
        throw error;
      }
    });

    // Handle call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        let result;
        switch (name) {
          case "cortex-task":
            result = await this.toolHandler.handleTask(
              args as { description: string }
            );
            break;
          case "execute-workflow-role":
            result = await this.toolHandler.handleExecuteWorkflowRole(
              args as { workflowId: string }
            );
            break;
          case "submit-role-result":
            result = await this.toolHandler.handleSubmitRoleResult(
              args as { workflowId: string; roleId: string; result: string }
            );
            break;
          case "create-pull-request":
            result = await this.toolHandler.handleCreatePullRequest(
              args as {
                workflowId: string;
                baseBranch?: string;
                draft?: boolean;
              }
            );
            break;
          case "get-workflow-status":
            result = await this.toolHandler.handleGetWorkflowStatus(
              args as { workflowId: string }
            );
            break;
          case "list-workflows":
            result = await this.toolHandler.handleListWorkflows(
              args as { limit?: number }
            );
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: result.content,
          isError: result.isError,
        };
      } catch (error) {
        console.error("Error in CallToolRequestSchema handler:", error);
        throw error;
      }
    });

    // Handle list resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        return {
          resources: [
            {
              uri: "cortex://workflows",
              name: "Cortex Workflows",
              description: "List of all Cortex AI workflows",
              mimeType: "application/json",
            },
            {
              uri: "cortex://workflows/{workflowId}/handoff",
              name: "Workflow Handoff",
              description: "Handoff document for a specific workflow",
              mimeType: "text/markdown",
            },
            {
              uri: "cortex://workflows/{workflowId}/pr",
              name: "Workflow PR",
              description: "Pull request document for a specific workflow",
              mimeType: "text/markdown",
            },
            {
              uri: "cortex://snapshots/project",
              name: "Project Snapshot",
              description:
                "Current project structure and architecture snapshot",
              mimeType: "application/json",
            },
            {
              uri: "cortex://snapshots/{workflowId}",
              name: "Workflow Snapshot",
              description: "Snapshot of workflow execution and decisions",
              mimeType: "application/json",
            },
            {
              uri: "cortex://project/tasks",
              name: "Project Tasks",
              description:
                "Available development tasks from .vscode/tasks.json",
              mimeType: "application/json",
            },
            {
              uri: "cortex://ide/integration-guide",
              name: "IDE Integration Guide",
              description:
                "Guide for setting up IDE integration with Cortex AI",
              mimeType: "text/markdown",
            },
          ],
        };
      } catch (error) {
        console.error("Error listing resources:", error);
        throw error;
      }
    });

    // Handle read resource
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        try {
          const { uri } = request.params;
          const result = await this.resourceHandler.handleResourceRequest(uri);
          return {
            contents: result.contents,
          };
        } catch (error) {
          console.error("Error reading resource:", error);
          throw error;
        }
      }
    );

    // Handle list prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      try {
        return {
          prompts: [
            {
              name: "workflow-role-analysis",
              description:
                "Generate structured analysis for a role in the current workflow",
              arguments: [
                {
                  name: "roleId",
                  description:
                    "The role ID to analyze (e.g., architecture-designer, code-assistant)",
                  required: true,
                },
                {
                  name: "workflowId",
                  description: "The workflow ID containing the role",
                  required: true,
                },
              ],
            },
            {
              name: "technical-code-review",
              description: "Generate technical code review and assessment",
              arguments: [
                {
                  name: "codebase",
                  description: "The codebase or technical context to review",
                  required: true,
                },
                {
                  name: "requirements",
                  description: "The requirements and technical specifications",
                  required: true,
                },
                {
                  name: "role",
                  description:
                    "The role performing the review (e.g., code-assistant)",
                  required: true,
                },
              ],
            },
            {
              name: "workflow-progress-summary",
              description:
                "Generate executive summary of workflow progress and decisions",
              arguments: [
                {
                  name: "workflowId",
                  description: "The workflow ID to summarize",
                  required: true,
                },
                {
                  name: "includeTechnicalDetails",
                  description:
                    "Whether to include technical implementation details",
                  required: false,
                },
              ],
            },
          ],
        };
      } catch (error) {
        console.error("Error listing prompts:", error);
        throw error;
      }
    });

    // Handle get prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case "workflow-role-analysis":
            return await this.generateWorkflowRoleAnalysisPrompt(
              args as {
                roleId: string;
                workflowId: string;
              }
            );
          case "technical-code-review":
            return await this.generateTechnicalCodeReviewPrompt(
              args as {
                codebase: string;
                requirements: string;
                role: string;
              }
            );
          case "workflow-progress-summary":
            return await this.generateWorkflowProgressSummaryPrompt(
              args as unknown as {
                workflowId: string;
                includeTechnicalDetails?: boolean;
              }
            );
          default:
            throw new Error(`Unknown prompt: ${name}`);
        }
      } catch (error) {
        console.error("Error getting prompt:", error);
        throw error;
      }
    });
  }

  /**
   * Generate workflow role analysis prompt
   */
  private async generateWorkflowRoleAnalysisPrompt(args: {
    roleId: string;
    workflowId: string;
  }): Promise<{
    description: string;
    messages: Array<{
      role: string;
      content: {
        type: string;
        text: string;
      };
    }>;
  }> {
    const role = await this.cortex.getRole(args.roleId);
    const workflowState = await this.cortex.getWorkflowState(args.workflowId);

    // Read handoff.md content
    const handoffFile = path.join(
      this.projectRoot,
      ".cortex",
      "workspaces",
      args.workflowId,
      "handoff.md"
    );
    let handoffContent = "";
    if (fs.existsSync(handoffFile)) {
      handoffContent = fs.readFileSync(handoffFile, "utf-8");
    }

    return {
      description: `Generate structured analysis for ${role?.name || args.roleId} role in workflow`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `# Workflow Role Analysis Prompt

## Role Information
- **Role ID:** ${args.roleId}
- **Role Name:** ${role?.name || "Unknown"}
- **Role Description:** ${role?.description || "No description available"}
- **System Prompt:** ${role?.systemPrompt || role?.description || "No system prompt"}

## Workflow Context
- **Workflow ID:** ${args.workflowId}
- **Workflow Title:** ${workflowState?.title || "Unknown"}
- **Workflow Status:** ${workflowState?.status || "Unknown"}

## Previous Context
${handoffContent || "No previous context available"}

## Instructions
Please analyze this task according to your role's expertise and provide:

1. **Task Understanding:** Clear understanding of requirements
2. **Analysis:** Detailed analysis from your role's perspective
3. **Recommendations:** Specific, actionable recommendations
4. **Implementation:** If applicable, implementation details
5. **Handoff:** Clear information for the next role

## Expected Output Format
- Structured analysis with clear sections
- Specific recommendations with rationale
- Implementation details where applicable
- Clear handoff information for workflow continuation

**Important:** Provide genuine analysis based on your role's expertise, not template content.`,
          },
        },
      ],
    };
  }

  /**
   * Generate technical code review prompt
   */
  private async generateTechnicalCodeReviewPrompt(args: {
    codebase: string;
    requirements: string;
    role: string;
  }): Promise<{
    description: string;
    messages: Array<{
      role: string;
      content: {
        type: string;
        text: string;
      };
    }>;
  }> {
    return {
      description: `Generate technical code review for ${args.role}`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `# Technical Code Review Prompt

## Review Context
- **Role:** ${args.role}
- **Codebase:** ${args.codebase}
- **Requirements:** ${args.requirements}

## Instructions
Provide a comprehensive technical code review including:

1. **Code Quality Analysis:** Review of code structure and quality
2. **Architecture Assessment:** Evaluation of system architecture
3. **Performance Considerations:** Performance implications and recommendations
4. **Security Review:** Security considerations and recommendations
5. **Best Practices:** Adherence to best practices and improvements
6. **Recommendations:** Specific actionable recommendations

## Expected Output Format
- Structured assessment with clear sections
- Specific technical recommendations
- Implementation guidance where applicable
- Clear rationale for recommendations

**Important:** Provide detailed technical analysis based on your role's expertise.`,
          },
        },
      ],
    };
  }

  /**
   * Generate workflow progress summary prompt
   */
  private async generateWorkflowProgressSummaryPrompt(args: {
    workflowId: string;
    includeTechnicalDetails?: boolean;
  }): Promise<{
    description: string;
    messages: Array<{
      role: string;
      content: {
        type: string;
        text: string;
      };
    }>;
  }> {
    const workflowState = await this.cortex.getWorkflowState(args.workflowId);

    return {
      description: `Generate workflow progress summary for ${args.workflowId}`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `# Workflow Progress Summary Prompt

## Workflow Information
- **Workflow ID:** ${args.workflowId}
- **Title:** ${workflowState?.title || "Unknown"}
- **Status:** ${workflowState?.status || "Unknown"}
- **Include Technical Details:** ${args.includeTechnicalDetails ? "Yes" : "No"}

## Instructions
Generate an executive summary including:

1. **Workflow Overview:** Brief description of the workflow
2. **Progress Summary:** Current status and progress made
3. **Key Achievements:** Major accomplishments and deliverables
4. **Challenges:** Any obstacles or issues encountered
5. **Next Steps:** Recommended next actions
${args.includeTechnicalDetails ? "6. **Technical Details:** Implementation specifics and technical decisions" : ""}

## Expected Output Format
- Executive-level summary
- Clear progress indicators
- Actionable next steps
- Concise but comprehensive overview

**Important:** Focus on providing a clear, executive-level summary suitable for stakeholders.`,
          },
        },
      ],
    };
  }

  /**
   * Start the MCP server
   */
  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  /**
   * Stop the MCP server
   */
  public async stop(): Promise<void> {
    // Server cleanup if needed
  }
}

/**
 * Create and start MCP server
 */
export async function createCortexMCPServer(): Promise<void> {
  const server = new CortexMCPServer();
  await server.start();
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createCortexMCPServer().catch((error) => {
    console.error("Failed to start Cortex MCP server:", error);
    process.exit(1);
  });
}
