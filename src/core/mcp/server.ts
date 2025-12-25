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

import { CortexAI } from "../index.js";
import { ToolHandler } from "./handlers/tool-handler.js";
import { ResourceHandler } from "./handlers/resource-handler.js";
import { StableWorkflowHandler } from "./handlers/stable-workflow-handler.js";
import type { CheckpointFile } from "./types/checkpoint.js";

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
  private toolHandler: ToolHandler;
  private resourceHandler: ResourceHandler;
  private stableWorkflowHandler: StableWorkflowHandler;

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
    this.stableWorkflowHandler = new StableWorkflowHandler(this.projectRoot);
    this.setupHandlers();
    this.initializeCortexWorkspace();
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

    // Handle list tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        return {
          tools: [
            {
              name: "spec",
              description:
                "Create feature specification (auto-creates workflow)",
              inputSchema: {
                type: "object",
                properties: {
                  description: {
                    type: "string",
                    description: "Feature description",
                  },
                },
                required: ["description"],
              },
            },
            {
              name: "workflow",
              description:
                "Execute workflow phases: clarify (resolve ambiguities), plan (create implementation plan), review (technical review), tasks (generate task breakdown), implement (execute with Multi-Role coordination), status (get workflow progress). Uses latest workflow if workflowId not provided.",
              inputSchema: {
                type: "object",
                properties: {
                  phase: {
                    type: "string",
                    enum: [
                      "clarify",
                      "plan",
                      "review",
                      "tasks",
                      "implement",
                      "status",
                    ],
                    description: "Workflow phase to execute",
                  },
                  workflowId: {
                    type: "string",
                    description: "Workflow ID (optional, defaults to latest)",
                  },
                },
                required: ["phase"],
              },
            },
            {
              name: "list",
              description: "List all workflows",
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
              name: "release",
              description:
                "Analyze changes and generate release documentation (CHANGELOG/RELEASE_NOTES) with optional git tag and push",
              inputSchema: {
                type: "object",
                properties: {
                  version: {
                    type: "string",
                    description:
                      "Version number (optional, auto-detected if not provided)",
                  },
                  tag: {
                    type: "boolean",
                    description: "Create git tag for this release",
                    default: false,
                  },
                  push: {
                    type: "boolean",
                    description: "Push commits and tags to remote",
                    default: false,
                  },
                },
              },
            },
            {
              name: "onboard",
              description:
                "Interactive onboarding for first-time users - guides through initialization and constitution creation",
              inputSchema: {
                type: "object",
                properties: {},
              },
            },
            {
              name: "constitution",
              description:
                "Create or update project constitution - AI guides through principles, governance, and versioning",
              inputSchema: {
                type: "object",
                properties: {
                  updates: {
                    type: "string",
                    description:
                      "Optional: specific updates to make (e.g., 'add testing principle')",
                  },
                },
              },
            },
            {
              name: "memory",
              description:
                "Interact with project memory: learn (record experience/pattern/decision/solution/lesson) or context (retrieve relevant experiences based on query)",
              inputSchema: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["learn", "context"],
                    description: "Memory action to perform",
                  },
                  title: {
                    type: "string",
                    description:
                      "[learn] Brief descriptive title (max 200 characters)",
                  },
                  content: {
                    type: "string",
                    description:
                      "[learn] Full markdown content of the experience",
                  },
                  type: {
                    type: "string",
                    enum: ["pattern", "decision", "solution", "lesson"],
                    description: "[learn] Experience category",
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "[learn] Searchable keywords (1-10 tags)",
                  },
                  query: {
                    type: "string",
                    description:
                      "[context] Search query to find relevant experiences",
                  },
                },
                required: ["action"],
              },
            },
            {
              name: "correct",
              description:
                "Record a correction to AI behavior - the AI will avoid repeating this mistake in future sessions",
              inputSchema: {
                type: "object",
                properties: {
                  wrongBehavior: {
                    type: "string",
                    description: "What the AI did wrong",
                  },
                  correctBehavior: {
                    type: "string",
                    description: "What the correct behavior should be",
                  },
                  severity: {
                    type: "string",
                    enum: ["minor", "moderate", "major"],
                    description:
                      "How serious the mistake was (default: moderate)",
                  },
                  filePatterns: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "File patterns where this applies (e.g., '*.tsx')",
                  },
                  triggerKeywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Keywords that should trigger this warning",
                  },
                },
                required: ["wrongBehavior", "correctBehavior"],
              },
            },
            {
              name: "checkpoint-save",
              description:
                "Save current task progress as a checkpoint for resuming later",
              inputSchema: {
                type: "object",
                properties: {
                  taskDescription: {
                    type: "string",
                    description:
                      "Brief description of the task being checkpointed",
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
                    description: "Additional context about current progress",
                  },
                  nextStep: {
                    type: "string",
                    description: "Guidance for what to do next when resuming",
                  },
                  workflowId: {
                    type: "string",
                    description: "Associated workflow ID (optional)",
                  },
                },
                required: ["taskDescription"],
              },
            },
            {
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
            },
            {
              name: "checkpoint-list",
              description: "List all saved checkpoints",
              inputSchema: {
                type: "object",
                properties: {
                  limit: {
                    type: "number",
                    description:
                      "Maximum number of checkpoints to return (default: 10)",
                    default: 10,
                  },
                },
              },
            },
            {
              name: "checkpoint-clear",
              description:
                "Clear checkpoint(s) - specific ID or all checkpoints",
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
            },
            {
              name: "mark-danger",
              description:
                "Mark a code region as protected (danger zone) that should not be modified without explicit user confirmation. Can mark entire files or specific line ranges.",
              inputSchema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    description: "File path relative to project root",
                  },
                  startLine: {
                    type: "number",
                    description:
                      "Starting line number (optional, protects entire file if not provided)",
                  },
                  endLine: {
                    type: "number",
                    description:
                      "Ending line number (optional, single line if not provided)",
                  },
                  reason: {
                    type: "string",
                    description:
                      "Why this region is protected (e.g., 'Production config - manually tuned', 'Critical auth logic')",
                  },
                },
                required: ["file", "reason"],
              },
            },
            {
              name: "unmark-danger",
              description:
                "Remove danger zone protection from a code region",
              inputSchema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    description: "File path relative to project root",
                  },
                  line: {
                    type: "number",
                    description:
                      "Specific line number (optional, removes all protections for file if not provided)",
                  },
                },
                required: ["file"],
              },
            },
            {
              name: "list-dangers",
              description:
                "List all protected danger zones (from both config and code comments)",
              inputSchema: {
                type: "object",
                properties: {},
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
          case "spec":
            result = await this.stableWorkflowHandler.handleSpec(
              args as { description: string }
            );
            break;
          case "workflow":
            result = await this.stableWorkflowHandler.handleWorkflow(
              args as {
                phase:
                  | "clarify"
                  | "plan"
                  | "review"
                  | "tasks"
                  | "implement"
                  | "status";
                workflowId?: string;
              }
            );
            break;
          case "list":
            result = await this.stableWorkflowHandler.handleList(
              args as { limit?: number }
            );
            break;
          case "release":
            result = await this.stableWorkflowHandler.handleRelease(
              args as { version?: string; tag?: boolean; push?: boolean }
            );
            break;
          case "onboard":
            result = await this.stableWorkflowHandler.handleOnboard();
            break;
          case "constitution":
            result = await this.stableWorkflowHandler.handleConstitution(
              args as { updates?: string }
            );
            break;
          case "memory":
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await this.stableWorkflowHandler.handleMemory(args as any);
            break;
          case "correct":
            result = await this.stableWorkflowHandler.handleCorrect(
              args as {
                wrongBehavior: string;
                correctBehavior: string;
                severity?: string;
                filePatterns?: string[];
                triggerKeywords?: string[];
              }
            );
            break;
          case "checkpoint-save":
            result = await this.stableWorkflowHandler.handleCheckpointSave(
              args as {
                taskDescription: string;
                completed?: CheckpointFile[];
                pending?: CheckpointFile[];
                context?: string;
                nextStep?: string;
                workflowId?: string;
              }
            );
            break;
          case "checkpoint-resume":
            result = await this.stableWorkflowHandler.handleCheckpointResume(
              args as { checkpointId?: string }
            );
            break;
          case "checkpoint-list":
            result = await this.stableWorkflowHandler.handleCheckpointList(
              args as { limit?: number }
            );
            break;
          case "checkpoint-clear":
            result = await this.stableWorkflowHandler.handleCheckpointClear(
              args as { checkpointId?: string }
            );
            break;
          case "mark-danger":
            result = await this.stableWorkflowHandler.handleMarkDanger(
              args as {
                file: string;
                startLine?: number;
                endLine?: number;
                reason: string;
              }
            );
            break;
          case "unmark-danger":
            result = await this.stableWorkflowHandler.handleUnmarkDanger(
              args as { file: string; line?: number }
            );
            break;
          case "list-dangers":
            result = await this.stableWorkflowHandler.handleListDangers();
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

    // Handle get prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        // Map prompt names to tool calls
        const toolName = name.replace("cortex-", "cortex.");

        let toolArgs: Record<string, unknown> = {};
        if (args) {
          // args is already a Record<string, string> from MCP SDK
          toolArgs = args as Record<string, unknown>;
        }

        // Call the corresponding tool
        let result;
        switch (toolName) {
          case "cortex.spec":
            result = await this.stableWorkflowHandler.handleSpec(
              toolArgs as { description: string }
            );
            break;
          case "cortex.clarify":
            result = await this.stableWorkflowHandler.handleClarify(
              toolArgs as { workflowId: string }
            );
            break;
          case "cortex.plan":
            result = await this.stableWorkflowHandler.handlePlan(
              toolArgs as { workflowId: string }
            );
            break;
          case "cortex.review":
            result = await this.stableWorkflowHandler.handleReview(
              toolArgs as { workflowId: string }
            );
            break;
          case "cortex.tasks":
            result = await this.stableWorkflowHandler.handleTasks(
              toolArgs as { workflowId: string }
            );
            break;
          case "cortex.implement":
            result = await this.stableWorkflowHandler.handleImplement(
              toolArgs as { workflowId: string }
            );
            break;
          case "cortex.decompose-task":
            result = await this.stableWorkflowHandler.handleTaskDecomposition(
              toolArgs as {
                workflowId: string;
                taskId: string;
                taskDescription: string;
              }
            );
            break;
          case "cortex.validate-implementation":
            result =
              await this.stableWorkflowHandler.handleImplementationValidation(
                toolArgs as { changedFiles: string[] }
              );
            break;
          case "cortex.release":
            result = await this.stableWorkflowHandler.handleRelease(
              toolArgs as { version?: string; tag?: boolean; push?: boolean }
            );
            break;
          case "cortex.onboard":
            result = await this.stableWorkflowHandler.handleOnboard();
            break;
          case "cortex.status":
            result = await this.stableWorkflowHandler.handleStatus(
              toolArgs as { workflowId: string }
            );
            break;
          case "cortex.list":
            result = await this.stableWorkflowHandler.handleList(
              toolArgs as { limit?: number }
            );
            break;
          default:
            throw new Error(`Unknown prompt: ${name}`);
        }

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
