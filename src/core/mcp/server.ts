#!/usr/bin/env node

/**
 * Cortex MCP Server - Refactored Architecture
 */

import { readFileSync } from "fs";
import * as path from "path";
import * as os from "os";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname } from "path";
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

import "reflect-metadata";
import { CortexAI } from "../index.js";
import { ResourceHandler } from "./handlers/resource-handler.js";
import { MCPToolRegistry } from "./registry/index.js";

// Domain handlers
import { CheckpointHandler } from "./handlers/checkpoint/checkpoint-handler.js";
import { MemoryHandler } from "./handlers/memory/memory-handler.js";
import { TeamKnowledgeHandler } from "./handlers/collaboration/team-knowledge-handler.js";
import { PRReviewHandler } from "./handlers/collaboration/pr-review-handler.js";
import { DependencyHandler } from "./handlers/project/dependency-handler.js";
import { EnvironmentHandler } from "./handlers/project/environment-handler.js";
import { ImpactAnalysisHandler } from "./handlers/analysis/impact-analysis-handler.js";
import { PerformanceAnalysisHandler } from "./handlers/analysis/performance-analysis-handler.js";
import { TestCoverageHandler } from "./handlers/analysis/test-coverage-handler.js";
import { CIPipelineHandler } from "./handlers/analysis/ci-pipeline-handler.js";
import { ArchitectureHandler } from "./handlers/analysis/architecture-handler.js";
import { DangerZoneHandler } from "./handlers/project/danger-zone-handler.js";
import { SpecHandler } from "./handlers/workflow/spec-handler.js";
import { PlanningHandler } from "./handlers/workflow/planning-handler.js";
import { ExecutionHandler } from "./handlers/workflow/execution-handler.js";
import { StatusHandler } from "./handlers/workflow/status-handler.js";
import { ReleaseHandler } from "./handlers/project/release-handler.js";
import { OnboardHandler } from "./handlers/project/onboard-handler.js";
import { ConstitutionHandler } from "./handlers/project/constitution-handler.js";

// ES Module support for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  } catch {
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
  private resourceHandler: ResourceHandler;
  private registry: MCPToolRegistry;

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
    this.resourceHandler = new ResourceHandler(this.projectRoot);

    // Initialize registry and register all domain handlers
    this.registry = new MCPToolRegistry();
    this.registerHandlers();

    this.setupHandlers();
    this.initializeCortexWorkspace();
  }

  /**
   * Register all domain handlers with the registry
   */
  private registerHandlers(): void {
    this.registry.registerHandler(new CheckpointHandler(this.projectRoot));
    this.registry.registerHandler(new MemoryHandler(this.projectRoot));
    this.registry.registerHandler(new TeamKnowledgeHandler(this.projectRoot));
    this.registry.registerHandler(new PRReviewHandler(this.projectRoot));
    this.registry.registerHandler(new DependencyHandler(this.projectRoot));
    this.registry.registerHandler(new EnvironmentHandler(this.projectRoot));
    this.registry.registerHandler(new ImpactAnalysisHandler(this.projectRoot));
    this.registry.registerHandler(
      new PerformanceAnalysisHandler(this.projectRoot)
    );
    this.registry.registerHandler(new TestCoverageHandler(this.projectRoot));
    this.registry.registerHandler(new CIPipelineHandler(this.projectRoot));
    this.registry.registerHandler(new ArchitectureHandler(this.projectRoot));
    this.registry.registerHandler(new DangerZoneHandler(this.projectRoot));
    this.registry.registerHandler(new SpecHandler(this.projectRoot));
    this.registry.registerHandler(new PlanningHandler(this.projectRoot));
    this.registry.registerHandler(new ExecutionHandler(this.projectRoot));
    this.registry.registerHandler(new StatusHandler(this.projectRoot));
    this.registry.registerHandler(new ReleaseHandler(this.projectRoot));
    this.registry.registerHandler(new OnboardHandler(this.projectRoot));
    this.registry.registerHandler(new ConstitutionHandler(this.projectRoot));
  }

  /**
   * Detect project root directory
   */
  private detectProjectRoot(): string {
    // Priority 1: Environment variables (VS Code/Cursor specific)
    if (process.env.VSCODE_CWD && process.env.VSCODE_CWD.trim() !== "") {
      const vsCodeCwd = process.env.VSCODE_CWD.trim();
      if (vsCodeCwd !== "/" && fs.existsSync(vsCodeCwd)) {
        return vsCodeCwd;
      }
    }
    if (process.env.CURSOR_CWD && process.env.CURSOR_CWD.trim() !== "") {
      const cursorCwd = process.env.CURSOR_CWD.trim();
      if (cursorCwd !== "/" && fs.existsSync(cursorCwd)) {
        return cursorCwd;
      }
    }

    // Priority 2: Current working directory if it contains package.json
    const cwd = process.cwd();
    if (
      cwd &&
      cwd.trim() !== "" &&
      cwd !== "/" &&
      fs.existsSync(path.join(cwd, "package.json"))
    ) {
      return cwd;
    }

    // Priority 3: Look for .cortex directory in current or parent directories
    let currentDir = cwd;
    while (
      currentDir &&
      currentDir !== path.dirname(currentDir) &&
      currentDir !== "/" &&
      currentDir.length > 1
    ) {
      if (fs.existsSync(path.join(currentDir, ".cortex"))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }

    // Priority 4: Look for cortex.json in current or parent directories
    currentDir = cwd;
    while (
      currentDir &&
      currentDir !== path.dirname(currentDir) &&
      currentDir !== "/" &&
      currentDir.length > 1
    ) {
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
    if (
      fallback &&
      fallback.trim() !== "" &&
      fallback !== "/" &&
      fallback.length > 1
    ) {
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
    if (
      !this.projectRoot ||
      this.projectRoot.trim() === "" ||
      this.projectRoot === "/"
    ) {
      throw new Error(
        `Invalid project root: ${this.projectRoot}. Cannot initialize workspace in root directory.`
      );
    }

    const cortexDir = path.join(this.projectRoot, ".cortex");
    const rolesDir = path.join(cortexDir, "roles");
    const workflowsDir = path.join(cortexDir, "workflows");
    const memoryDir = path.join(cortexDir, "memory");
    const templatesDir = path.join(cortexDir, "templates");
    const checkpointsDir = path.join(cortexDir, "checkpoints");

    // Create directories
    fs.ensureDirSync(rolesDir);
    fs.ensureDirSync(workflowsDir);
    fs.ensureDirSync(memoryDir);
    fs.ensureDirSync(templatesDir);
    fs.ensureDirSync(checkpointsDir);

    // Find cortex-ai tool's installation directory
    const toolRoot = this.findToolRoot();

    // Copy stable workflow templates from tool to user project
    const toolTemplatesDir = path.join(toolRoot, "templates", "cortex");
    if (fs.existsSync(toolTemplatesDir)) {
      // Copy all template files
      const templateFiles = [
        "constitution.md",
        "spec-template.md",
        "clarify-template.md",
        "plan-template.md",
        "review-template.md",
        "tasks-template.md",
        "checklist-template.md",
        "execution-template.md",
        "memory-index.json",
      ];

      for (const templateFile of templateFiles) {
        const sourcePath = path.join(toolTemplatesDir, templateFile);
        const targetPath = path.join(templatesDir, templateFile);
        if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
          fs.copyFileSync(sourcePath, targetPath);
        }
      }

      // Copy commands directory
      const commandsSourceDir = path.join(toolTemplatesDir, "commands");
      const commandsTargetDir = path.join(templatesDir, "commands");
      if (fs.existsSync(commandsSourceDir)) {
        fs.ensureDirSync(commandsTargetDir);
        const commandFiles = fs.readdirSync(commandsSourceDir);
        for (const commandFile of commandFiles) {
          const sourcePath = path.join(commandsSourceDir, commandFile);
          const targetPath = path.join(commandsTargetDir, commandFile);
          if (!fs.existsSync(targetPath)) {
            fs.copyFileSync(sourcePath, targetPath);
          }
        }
      }
    }

    // Copy default role files if they don't exist
    const defaultRolesDir = path.join(toolRoot, "templates", "roles");
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

    // Initialize empty memory index
    const memoryIndexPath = path.join(memoryDir, "index.json");
    if (!fs.existsSync(memoryIndexPath)) {
      const emptyIndex = {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        totalExperiences: 0,
        categories: {
          patterns: 0,
          decisions: 0,
          solutions: 0,
          lessons: 0,
        },
        index: [],
      };
      fs.writeJsonSync(memoryIndexPath, emptyIndex, { spaces: 2 });
    }
  }

  /**
   * Find cortex-ai tool's root directory
   */
  private findToolRoot(): string {
    // Try relative to current file location (works in development and production)
    const currentFileDir = __dirname;
    const possiblePaths = [
      path.join(currentFileDir, "..", "..", ".."), // dist/core/mcp -> root
      path.join(currentFileDir, "..", ".."), // dist/core -> root
      path.join(currentFileDir, ".."), // dist -> root
    ];

    for (const possiblePath of possiblePaths) {
      const templatesPath = path.join(possiblePath, "templates", "cortex");
      if (fs.existsSync(templatesPath)) {
        return possiblePath;
      }
    }

    // Fallback to project root if in development
    return this.projectRoot;
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

    // Handle list tools - auto-generated from registry
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        return {
          tools: this.registry.getToolDefinitions(),
        };
      } catch (error) {
        console.error("Error in ListToolsRequestSchema handler:", error);
        throw error;
      }
    });

    // Handle call tool - routed through registry
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        if (!this.registry.hasTool(name)) {
          throw new Error(`Unknown tool: ${name}`);
        }

        const result = await this.registry.executeTool(name, args ?? {});

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
            {
              uri: "cortex://memory/index",
              name: "Memory Index",
              description:
                "Index of all stored experiences (patterns, decisions, solutions, lessons)",
              mimeType: "application/json",
            },
            {
              uri: "cortex://memory/experiences/{type}",
              name: "Memory Experiences by Type",
              description:
                "Experiences filtered by type (patterns, decisions, solutions, lessons)",
              mimeType: "application/json",
            },
            {
              uri: "cortex://memory/search?query={query}",
              name: "Memory Search",
              description: "Search experiences by query with relevance scoring",
              mimeType: "application/json",
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
              name: "spec",
              description: "Create feature specification for a new feature",
              arguments: [
                {
                  name: "description",
                  description: "Feature description",
                  required: true,
                },
              ],
            },
            {
              name: "clarify",
              description:
                "Resolve specification ambiguities (max 5 questions)",
              arguments: [
                {
                  name: "workflowId",
                  description: "Workflow ID to clarify",
                  required: true,
                },
              ],
            },
            {
              name: "plan",
              description: "Create implementation plan from specification",
              arguments: [
                {
                  name: "workflowId",
                  description: "Workflow ID to plan",
                  required: true,
                },
              ],
            },
            {
              name: "review",
              description: "Technical review of implementation plan",
              arguments: [
                {
                  name: "workflowId",
                  description: "Workflow ID to review",
                  required: true,
                },
              ],
            },
            {
              name: "tasks",
              description: "Generate task breakdown from implementation plan",
              arguments: [
                {
                  name: "workflowId",
                  description: "Workflow ID to create tasks for",
                  required: true,
                },
              ],
            },
            {
              name: "implement",
              description:
                "Execute implementation phase with Multi-Role coordination",
              arguments: [
                {
                  name: "workflowId",
                  description: "Workflow ID to implement",
                  required: true,
                },
              ],
            },
            {
              name: "decompose-task",
              description: "Break down large task into atomic subtasks",
              arguments: [
                {
                  name: "workflowId",
                  description: "Workflow ID",
                  required: true,
                },
                {
                  name: "taskId",
                  description: "Task ID to decompose",
                  required: true,
                },
                {
                  name: "taskDescription",
                  description: "Task description",
                  required: true,
                },
              ],
            },
            {
              name: "validate-implementation",
              description:
                "Validate implementation for mocks, TODOs, unused code",
              arguments: [
                {
                  name: "changedFiles",
                  description: "Array of changed file paths",
                  required: true,
                },
              ],
            },
            {
              name: "release",
              description: "Analyze changes and generate release documentation",
              arguments: [
                {
                  name: "version",
                  description:
                    "Version number (optional, auto-detected if not provided)",
                  required: false,
                },
                {
                  name: "tag",
                  description: "Create git tag (default: false)",
                  required: false,
                },
                {
                  name: "push",
                  description: "Push to remote (default: false)",
                  required: false,
                },
              ],
            },
            {
              name: "onboard",
              description: "Interactive onboarding for first-time users",
              arguments: [],
            },
            {
              name: "status",
              description: "Get workflow status and progress",
              arguments: [
                {
                  name: "workflowId",
                  description: "Workflow ID to check status",
                  required: true,
                },
              ],
            },
            {
              name: "list",
              description: "List all workflows",
              arguments: [
                {
                  name: "limit",
                  description:
                    "Maximum number of workflows to return (default: 10)",
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

    // Handle get prompt - routed through registry
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        // Map prompt names (cortex-xxx) to tool names (xxx)
        const promptName = name.replace("cortex-", "");

        // Map workflow phase prompts to the workflow tool with phase argument
        const workflowPhases = ["clarify", "plan", "review", "tasks"];
        let toolName: string;
        let toolArgs: Record<string, unknown> = args
          ? (args as Record<string, unknown>)
          : {};

        if (workflowPhases.includes(promptName)) {
          // These are workflow phases - call the "workflow" tool with phase
          toolName = "workflow";
          toolArgs = { ...toolArgs, phase: promptName };
        } else {
          // Direct mapping for other prompts
          toolName = promptName;
        }

        // Execute through registry
        if (!this.registry.hasTool(toolName)) {
          throw new Error(`Unknown prompt: ${name}`);
        }

        const result = await this.registry.executeTool(toolName, toolArgs);

        // Convert tool result to prompt response
        return {
          description: `Cortex AI - ${name}`,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: result.content[0]?.text || "No content",
              },
            },
          ],
        };
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
