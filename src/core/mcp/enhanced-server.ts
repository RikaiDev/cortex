#!/usr/bin/env node

/**
 * Enhanced Cortex MCP Server - Modular architecture with advanced features
 *
 * This is the refactored version of the original CortexMCPServer with:
 * - Modular architecture (ToolManager, SessionManager, ConfigManager, PerformanceMonitor)
 * - Enhanced error handling and recovery
 * - Performance monitoring and metrics
 * - Configuration management with hot-reload
 * - Session management and state tracking
 */

import { readFileSync } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  InitializeRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  CortexCore,
  UnifiedKnowledgeManager,
  DynamicRuleSystem,
} from "../index.js";

// Import new modular components
import { ToolManager } from "./modules/tool-manager.js";
import { SessionManager } from "./modules/session-manager.js";
import { ConfigManager } from "./modules/config-manager.js";
import { PerformanceMonitor } from "./modules/performance-monitor.js";
import {
  Logger,
  MCPServerConfig,
  ToolDefinition,
  ToolExecutionContext,
  ToolExecutionResult,
} from "./types.js";

/**
 * Enhanced Logger implementation
 */
class EnhancedLogger implements Logger {
  private logLevel: string;
  private enableDebugMode: boolean;

  constructor(logLevel: string = "info", enableDebugMode: boolean = false) {
    this.logLevel = logLevel;
    this.enableDebugMode = enableDebugMode;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      console.log(
        `[${new Date().toISOString()}] ℹ️  ${message}`,
        meta ? JSON.stringify(meta) : ""
      );
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) {
      console.warn(
        `[${new Date().toISOString()}] ⚠️  ${message}`,
        meta ? JSON.stringify(meta) : ""
      );
    }
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(
      `[${new Date().toISOString()}] ❌ ${message}`,
      meta ? JSON.stringify(meta) : ""
    );
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      console.debug(
        `[${new Date().toISOString()}] 🔍 ${message}`,
        meta ? JSON.stringify(meta) : ""
      );
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }
}

/**
 * Enhanced Cortex MCP Server with modular architecture
 */
export class EnhancedCortexMCPServer {
  private server: Server;
  private cortex!: CortexCore;
  private knowledgeManager!: UnifiedKnowledgeManager;
  private ruleSystem!: DynamicRuleSystem;

  // Modular components
  private toolManager: ToolManager;
  private sessionManager: SessionManager;
  private configManager: ConfigManager;
  private performanceMonitor: PerformanceMonitor;

  private logger: Logger;
  private startTime: Date;
  private isInitialized = false;

  constructor(config: MCPServerConfig = {}) {
    // Initialize logger first
    this.logger = new EnhancedLogger(config.logLevel, config.enableDebugMode);

    // Record start time
    this.startTime = new Date();

    // Initialize modular components
    this.toolManager = new ToolManager(this.logger, {
      maxConcurrentTools: config.maxExecutionTime
        ? Math.floor(config.maxExecutionTime / 1000)
        : 5,
      toolTimeout: config.timeout || 30000,
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
    });

    this.sessionManager = new SessionManager(this.logger, {
      sessionTimeout: 3600000, // 1 hour
      maxSessions: 100,
      enablePersistence: true,
      cleanupInterval: 300000, // 5 minutes
    });

    this.configManager = new ConfigManager(this.logger, {
      enableHotReload: true,
      validationStrict: true,
    });

    this.performanceMonitor = new PerformanceMonitor(this.logger, {
      collectionInterval: 10000, // 10 seconds
      enableDetailedMetrics: true,
      enableMemoryTracking: true,
      enableCPUTracking: true,
    });

    // Create MCP server
    this.server = new Server(
      {
        name: "cortex-mcp-enhanced",
        version: this.getPackageVersion(),
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.logger.info(
      `🚀 Initializing Enhanced Cortex MCP Server v${this.getPackageVersion()}`
    );
    this.logger.debug(`Configuration: ${JSON.stringify(config, null, 2)}`);

    // Initialize core components
    this.initializeCoreComponents(config.projectRoot);

    // Register built-in tools
    this.registerBuiltInTools();

    // Setup handlers
    this.setupHandlers();

    // Setup configuration change listeners
    this.setupConfigListeners();

    this.logger.info("✅ Enhanced Cortex MCP Server initialized successfully");
    this.isInitialized = true;
  }

  /**
   * Initialize core Cortex components
   */
  private initializeCoreComponents(projectRoot?: string): void {
    try {
      const resolvedProjectRoot = this.resolveProjectRoot(projectRoot);

      this.cortex = new CortexCore(resolvedProjectRoot);
      this.knowledgeManager = new UnifiedKnowledgeManager(resolvedProjectRoot);
      this.ruleSystem = new DynamicRuleSystem(
        resolvedProjectRoot,
        this.knowledgeManager
      );

      this.logger.debug("Core components initialized successfully");
    } catch (error) {
      this.logger.error(`Failed to initialize core components: ${error}`);
      throw new Error(`Cortex initialization failed: ${error}`);
    }
  }

  /**
   * Register built-in tools
   */
  private registerBuiltInTools(): void {
    const tools: ToolDefinition[] = [
      {
        name: "enhance-context",
        description:
          "Enhance current context with relevant past experiences and knowledge from Cortex AI system",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Current task or question to enhance context for",
            },
            maxItems: {
              type: "number",
              description: "Maximum number of relevant items to return",
              default: 5,
            },
            timeRange: {
              type: "number",
              description: "Days to look back for relevant experiences",
              default: 30,
            },
          },
          required: ["query"],
        },
        execute: async (args, context): Promise<ToolExecutionResult> => {
          return await this.handleEnhanceContext(
            args as { query: string; maxItems?: number; timeRange?: number },
            context
          );
        },
      },
      {
        name: "record-experience",
        description:
          "Record a new experience or solution for future reference in Cortex AI learning system",
        inputSchema: {
          type: "object",
          properties: {
            input: {
              type: "string",
              description: "The original question or task",
            },
            output: {
              type: "string",
              description: "The solution or response provided",
            },
            category: {
              type: "string",
              description: "Category for this experience",
              enum: [
                "bugfix",
                "feature",
                "refactor",
                "debug",
                "optimization",
                "workflow-execution",
                "general",
              ],
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags for better organization",
            },
          },
          required: ["input", "output"],
        },
        execute: async (args, context): Promise<ToolExecutionResult> => {
          return await this.handleRecordExperience(
            args as {
              input: string;
              output: string;
              category?: string;
              tags?: string[];
            },
            context
          );
        },
      },
      {
        name: "create-workflow",
        description:
          "Create a new Multi-Role Pattern workflow for complex development tasks",
        inputSchema: {
          type: "object",
          properties: {
            issueId: {
              type: "string",
              description: "Issue or task identifier",
            },
            title: {
              type: "string",
              description: "Task title",
            },
            description: {
              type: "string",
              description: "Detailed task description",
            },
          },
          required: ["title", "description"],
        },
        execute: async (args, context): Promise<ToolExecutionResult> => {
          return await this.handleCreateWorkflow(
            args as { issueId?: string; title: string; description: string },
            context
          );
        },
      },
      {
        name: "execute-workflow-role",
        description: "Execute the next role in an existing Multi-Role workflow",
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
        execute: async (args, context): Promise<ToolExecutionResult> => {
          return await this.handleExecuteWorkflowRole(
            args as { workflowId: string },
            context
          );
        },
      },
    ];

    this.toolManager.registerTools(tools);
    this.logger.info(`Registered ${tools.length} built-in tools`);
  }

  /**
   * Setup configuration change listeners
   */
  private setupConfigListeners(): void {
    this.configManager.onConfigChange((newConfig) => {
      this.logger.info("Configuration changed, updating components");

      // Update tool manager configuration
      if (newConfig.tools) {
        this.toolManager = new ToolManager(this.logger, {
          maxConcurrentTools: newConfig.tools.maxConcurrentTools,
          toolTimeout: newConfig.tools.toolTimeout,
          enableCaching: newConfig.tools.cacheResults,
        });
      }

      // Update session manager configuration
      if (newConfig.server) {
        this.sessionManager = new SessionManager(this.logger, {
          sessionTimeout: newConfig.server.timeout,
          maxSessions: newConfig.server.maxConnections,
        });
      }
    });
  }

  /**
   * Setup MCP server handlers
   */
  private setupHandlers(): void {
    // Handle initialization
    this.server.setRequestHandler(InitializeRequestSchema, async () => {
      return {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "cortex-mcp-enhanced",
          version: this.getPackageVersion(),
        },
      };
    });

    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.toolManager.getTools();
      return {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const executionStartTime = Date.now();

      this.logger.debug(`🔧 Executing tool: ${name}`);

      try {
        // Create execution context
        const context: ToolExecutionContext = {
          sessionId: this.generateSessionId(),
          projectRoot: this.cortex
            ? ((this.cortex as unknown as Record<string, unknown>)
                .projectRoot as string)
            : undefined,
          metadata: {
            requestId: this.generateRequestId(),
            timestamp: new Date().toISOString(),
          },
        };

        // Execute tool through tool manager
        const result = await this.toolManager.executeTool(name, args, context);

        // Record performance metrics
        const executionTime = Date.now() - executionStartTime;
        this.performanceMonitor.recordRequest(executionTime);
        this.performanceMonitor.recordToolExecution(
          name,
          executionTime,
          !result.isError
        );

        // Update session
        if (context.sessionId) {
          this.sessionManager.addActiveTool(context.sessionId, name);
        }

        return {
          content: result.content,
          isError: result.isError || false,
        };
      } catch (error) {
        const executionTime = Date.now() - executionStartTime;
        this.performanceMonitor.recordError();
        this.performanceMonitor.recordToolExecution(name, executionTime, false);

        this.logger.error(
          `❌ Tool ${name} failed after ${executionTime}ms: ${error instanceof Error ? error.message : String(error)}`
        );

        return {
          content: [
            {
              type: "text",
              text: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Handle enhance context tool
   */
  private async handleEnhanceContext(
    args: {
      query: string;
      maxItems?: number;
      timeRange?: number;
    },
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    try {
      const { query, maxItems = 5, timeRange = 30 } = args;

      if (!query.trim()) {
        return {
          content: [
            {
              type: "text",
              text: "Please provide a query to enhance context for.",
            },
          ],
          isError: true,
        };
      }

      // Select appropriate Cortex Master role
      const selectedMaster = await this.selectCortexMaster(query);
      this.logger.debug(
        `Selected Cortex Master: ${selectedMaster.name} (${selectedMaster.specialty})`
      );

      // Log the context enhancement request with session info
      this.logger.info(
        `Context enhancement requested for session ${context.sessionId}`,
        {
          query,
          maxItems,
          timeRange,
          selectedMaster: selectedMaster.name,
          requestId: context.metadata?.requestId,
        }
      );

      // Use Cortex core to find relevant experiences
      const relevantExperiences = await this.cortex.findRelevantExperiences(
        query,
        maxItems,
        timeRange
      );

      // Build enhanced response
      let response = `## 🎭 Cortex Master: ${selectedMaster.name}\n`;
      response += `**Specialty:** ${selectedMaster.specialty}\n`;
      response += `**Role Description:** ${selectedMaster.description}\n\n`;

      response += `## 📋 Problem Analysis\n`;
      response += `**Original Query:** ${query}\n\n`;

      if (relevantExperiences.length === 0) {
        response += `## 🤔 Master Recommendations\n`;
        response += `While no relevant historical experiences were found, I can help you based on my professional expertise:\n\n`;
        response += `**Role Definition:**\n${selectedMaster.systemPrompt}\n\n`;
        response += `**Please provide more specific problem details, and I'll give you professional solutions!**`;
      } else {
        response += `## 📚 Related Historical Experiences\n`;
        response += `Based on experiences learned by the system, I found the following relevant cases:\n\n`;

        const formattedExperiences = relevantExperiences
          .map((exp, index) => {
            const tags = exp.tags?.length ? ` [${exp.tags.join(", ")}]` : "";
            return `### 💡 Experience ${index + 1}${tags}
**Problem:** ${exp.input}
**Solution:** ${exp.output}
**Category:** ${exp.category}
**Time:** ${exp.timestamp}`;
          })
          .join("\n\n");

        response += formattedExperiences;
        response += `\n\n## 🎯 Master Insights\n`;
        response += `Based on these experiences and my professional knowledge as a ${selectedMaster.name}, I recommend:\n\n`;
        response += `**My Expertise:**\n${selectedMaster.systemPrompt}\n\n`;
        response += `**Specific Recommendations:**\n`;
        response += `1. **Reference Historical Solutions** - The above experiences may provide direct solution ideas\n`;
        response += `2. **Apply Professional Expertise** - Consider ${selectedMaster.specialty} best practices\n`;
        response += `3. **Systematic Analysis** - Re-evaluate the problem from my domain expertise perspective\n\n`;
        response += `**Need more in-depth guidance? I can provide detailed solutions based on your specific situation!**`;
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

  /**
   * Handle record experience tool
   */
  private async handleRecordExperience(
    args: {
      input: string;
      output: string;
      category?: string;
      tags?: string[];
    },
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    try {
      const { input, output, category = "general", tags = [] } = args;

      if (!input.trim() || !output.trim()) {
        return {
          content: [
            { type: "text", text: "Both input and output are required." },
          ],
          isError: true,
        };
      }

      // Use Cortex core to record the experience
      await this.cortex.recordExperience({
        input,
        output,
        category,
        tags,
        timestamp: new Date().toISOString(),
      });

      // Log the experience recording with context
      this.logger.info(`Experience recorded for session ${context.sessionId}`, {
        category,
        tags,
        requestId: context.metadata?.requestId,
      });

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

  /**
   * Handle create workflow tool
   */
  private async handleCreateWorkflow(
    args: {
      issueId?: string;
      title: string;
      description: string;
    },
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    try {
      const { issueId, title, description } = args;

      if (!title.trim() || !description.trim()) {
        return {
          content: [
            {
              type: "text",
              text: "Both title and description are required for workflow creation.",
            },
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

      // Log the workflow creation with context
      this.logger.info(`Workflow created for session ${context.sessionId}`, {
        workflowId: workflow.id,
        title,
        requestId: context.metadata?.requestId,
      });

      return {
        content: [
          {
            type: "text",
            text: `## ✅ Multi-Role Workflow Created Successfully

**Workflow ID:** ${workflow.id}
**Title:** ${workflow.issueTitle || title}
**Status:** ${workflow.status}
**Current Role:** ${workflow.currentRole}

The workflow has been initialized and is ready for execution. Use the \`execute-workflow-role\` tool to start executing roles.

**Next Steps:**
1. Execute the first role (Issue Analyst) using: \`execute-workflow-role\` with workflow ID \`${workflow.id}\`
2. Continue executing subsequent roles until completion
3. Final PR documentation will be generated automatically

**Workflow File:** handoff.md (for role communication)
**PR File:** pr.md (generated upon completion)`,
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
   * Handle execute workflow role tool
   */
  private async handleExecuteWorkflowRole(
    args: {
      workflowId: string;
    },
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    try {
      const { workflowId } = args;

      if (!workflowId.trim()) {
        return {
          content: [
            {
              type: "text",
              text: "Workflow ID is required.",
            },
          ],
          isError: true,
        };
      }

      // Execute next role using integrated CortexCore
      const execution = await this.cortex.executeNextRole(workflowId);

      // Log the workflow execution with context
      this.logger.info(
        `Workflow role executed for session ${context.sessionId}`,
        {
          workflowId,
          roleId: execution.roleId,
          requestId: context.metadata?.requestId,
        }
      );

      // Get updated workflow state
      const workflowState = await this.cortex.getWorkflowState(workflowId);

      let response = `## 🎭 Role Execution Completed

**Role:** ${execution.roleId}
**Status:** ${execution.status}
**Execution Time:** ${execution.endTime ? new Date(execution.endTime).toLocaleString() : "N/A"}`;

      if (execution.output) {
        response += `\n\n**Execution Report:**\n${execution.output}`;
      }

      if (execution.deliverables.length > 0) {
        response += `\n\n**Deliverables:**\n${execution.deliverables.map((del: string) => `- ${del}`).join("\n")}`;
      }

      if (workflowState && workflowState.status === "completed") {
        response += `\n\n## 🎉 Workflow Completed Successfully!

The Multi-Role Pattern workflow has been completed. Check the generated files:
- **handoff.md**: Contains all role communication and handoff information
- **pr.md**: Contains the complete PR documentation ready for submission`;
      } else if (workflowState) {
        response += `\n\n**Next Role:** ${workflowState.currentRole}
**Workflow Status:** ${workflowState.status}

Continue with the next role or check the updated handoff.md file for progress details.`;
      }

      return {
        content: [
          {
            type: "text",
            text: response,
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
   * Select appropriate Cortex Master role based on query content
   */
  private async selectCortexMaster(query: string): Promise<{
    id: string;
    name: string;
    specialty: string;
    description: string;
    keywords: string[];
    systemPrompt: string;
  }> {
    // Use the existing selectCortexMaster method from CortexCore
    return await this.cortex.selectCortexMaster(query);
  }

  /**
   * Resolve project root with enhanced detection
   */
  private resolveProjectRoot(projectPath?: string): string {
    if (projectPath) {
      return path.resolve(projectPath);
    }

    // Enhanced project root detection
    const candidates = [
      process.env.WORKSPACE_ROOT,
      process.env.WORKSPACE_FOLDER,
      process.env.CURSOR_WORKSPACE_ROOT,
      process.env.VSCODE_WORKSPACE_ROOT,
      process.cwd(),
    ];

    for (const candidate of candidates) {
      if (candidate && this.isValidProjectRoot(candidate)) {
        return candidate;
      }
    }

    // Fallback to current directory
    return process.cwd();
  }

  /**
   * Validate if a path is a valid project root
   */
  private isValidProjectRoot(projectPath: string): boolean {
    try {
      // Check if path exists and has basic project indicators
      if (!fs.existsSync(projectPath)) {
        return false;
      }

      // Look for common project indicators
      const indicators = ["package.json", ".git", "tsconfig.json", "src"];
      return indicators.some((indicator) => {
        const indicatorPath = path.join(projectPath, indicator);
        return fs.existsSync(indicatorPath);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get version from package.json
   */
  private getPackageVersion(): string {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const packagePath = path.join(__dirname, "../../../package.json");
      const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
      return packageJson.version;
    } catch (error) {
      this.logger.error("Failed to read package.json version:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return "0.0.0";
    }
  }

  /**
   * Start the enhanced MCP server
   */
  async start(): Promise<void> {
    try {
      this.logger.info("🚀 Starting Enhanced Cortex MCP Server...");

      // Load configuration
      await this.configManager.loadConfig();

      // Validate server state before starting
      if (!this.server) {
        throw new Error("Server not properly initialized");
      }

      // Create transport with error handling
      const transport = new StdioServerTransport();

      // Connect server with timeout
      await Promise.race([
        this.server.connect(transport),
        new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Server connection timeout")),
            10000
          );
        }),
      ]);

      const uptime = Date.now() - this.startTime.getTime();
      this.logger.info(
        `✅ Enhanced Cortex MCP Server started successfully in ${uptime}ms`
      );
      this.logger.info("🔧 Available tools:");

      const tools = this.toolManager.getTools();
      for (const tool of tools) {
        this.logger.info(`  • ${tool.name} - ${tool.description}`);
      }

      this.logger.info("📝 Server is ready to receive MCP requests");
    } catch (error) {
      this.logger.error(`❌ Failed to start Enhanced MCP server: ${error}`);
      throw error;
    }
  }

  /**
   * Stop the server gracefully
   */
  async stop(): Promise<void> {
    try {
      this.logger.info("🛑 Stopping Enhanced Cortex MCP Server...");

      // Cleanup modular components
      this.toolManager.clearCache();
      this.sessionManager.destroy();
      this.configManager.destroy();
      this.performanceMonitor.destroy();

      if (this.server) {
        // Note: MCP SDK doesn't have a disconnect method in current version
        this.logger.debug("Server cleanup completed");
      }

      const uptime = Date.now() - this.startTime.getTime();
      this.logger.info(
        `✅ Enhanced Cortex MCP Server stopped gracefully after ${uptime}ms`
      );
    } catch (error) {
      this.logger.error(`❌ Error during server shutdown: ${error}`);
      throw error;
    }
  }

  /**
   * Get server status information
   */
  getStatus(): {
    version: string;
    uptime: number;
    isRunning: boolean;
    toolsCount: number;
    metrics: Record<string, unknown>;
  } {
    const uptime = Date.now() - this.startTime.getTime();
    const metrics = this.performanceMonitor.getMetricsSummary();

    return {
      version: this.getPackageVersion(),
      uptime,
      isRunning: this.isInitialized,
      toolsCount: this.toolManager.getTools().length,
      metrics,
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics(): unknown {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Get session statistics
   */
  getSessionStats(): Record<string, unknown> {
    return this.sessionManager.getSessionStats();
  }
}

/**
 * Create Enhanced Cortex MCP server with configuration support
 */
export function createEnhancedCortexMCPServer(
  config: MCPServerConfig = {}
): EnhancedCortexMCPServer {
  return new EnhancedCortexMCPServer(config);
}

/**
 * Direct execution entry point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createEnhancedCortexMCPServer();
  server.start().catch((error) => {
    console.error("Failed to start Enhanced Cortex MCP server:", error);
    process.exit(1);
  });
}
