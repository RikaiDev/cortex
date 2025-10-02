#!/usr/bin/env node

/**
 * Cortex MCP Server - Enhanced implementation with npx support
 *
 * Based on Context7 design principles: Keep it simple, focused, and effective
 * Enhanced with better error handling, logging, and configuration options
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

// Enhanced logging interface
interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
}

// Server configuration interface
interface MCPServerConfig {
  projectRoot?: string;
  logLevel?: "debug" | "info" | "warn" | "error";
  enableDebugMode?: boolean;
  maxExecutionTime?: number;
  timeout?: number;
  enableHealthCheck?: boolean;
  healthCheckInterval?: number;
  maxRetries?: number;
  enableCircuitBreaker?: boolean;
  circuitBreakerThreshold?: number;
  enableResourceMonitoring?: boolean;
  maxMemoryUsage?: number;
  maxCpuUsage?: number;
}

/**
 * Cortex Master role definition
 */
interface CortexMaster {
  id: string;
  name: string;
  specialty: string;
  description: string;
  keywords: string[];
  systemPrompt: string;
}

// Cortex Master roles are now loaded dynamically from .cortex/roles directory

/**
 * Get version from package.json
 */
function getPackageVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packagePath = path.join(__dirname, "../../../package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    return packageJson.version;
  } catch (error) {
    console.error("Failed to read package.json version:", error);
    return "0.0.0";
  }
}

/**
 * Circuit Breaker for fault tolerance
 */
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private threshold: number,
    private timeout: number,
    private logger: Logger
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = "half-open";
        this.logger.info("🔄 Circuit breaker transitioning to half-open state");
      } else {
        throw new Error(
          "Circuit breaker is OPEN - service temporarily unavailable"
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === "half-open") {
      this.state = "closed";
      this.logger.info("✅ Circuit breaker closed - service recovered");
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = "open";
      this.logger.warn(
        `⚠️ Circuit breaker opened after ${this.failureCount} failures`
      );
    }
  }

  getState(): "closed" | "open" | "half-open" {
    return this.state;
  }
}

/**
 * Resource Monitor for system health
 */
class ResourceMonitor {
  private memoryUsage: NodeJS.MemoryUsage;
  private cpuUsage: NodeJS.CpuUsage;

  constructor(
    private config: MCPServerConfig,
    private logger: Logger
  ) {
    this.memoryUsage = process.memoryUsage();
    this.cpuUsage = process.cpuUsage();
  }

  checkHealth(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    const currentMemory = process.memoryUsage();

    // Memory check
    const memoryUsageMB = currentMemory.heapUsed / 1024 / 1024;
    if (
      this.config.maxMemoryUsage &&
      memoryUsageMB > this.config.maxMemoryUsage
    ) {
      issues.push(`Memory usage too high: ${memoryUsageMB.toFixed(1)}MB`);
    }

    // CPU check (rough approximation)
    const cpuUsage = process.cpuUsage(this.cpuUsage);
    const cpuUsagePercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    if (this.config.maxCpuUsage && cpuUsagePercent > this.config.maxCpuUsage) {
      issues.push(`CPU usage too high: ${cpuUsagePercent.toFixed(1)}%`);
    }

    // Update baseline
    this.memoryUsage = currentMemory;
    this.cpuUsage = process.cpuUsage();

    return {
      healthy: issues.length === 0,
      issues,
    };
  }

  getStats(): {
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    uptime: number;
  } {
    const mem = process.memoryUsage();
    return {
      memory: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
      },
      uptime: process.uptime(),
    };
  }
}

/**
 * Enhanced Cortex MCP Server with improved error handling and configuration
 */
export class CortexMCPServer {
  private server: Server;
  private cortex!: CortexCore;
  private knowledgeManager!: UnifiedKnowledgeManager;
  private ruleSystem!: DynamicRuleSystem;
  private projectRoot: string;
  private config: MCPServerConfig;
  private logger: Logger;
  private startTime: Date;
  private circuitBreaker?: CircuitBreaker;
  private resourceMonitor?: ResourceMonitor;
  private healthCheckTimer?: NodeJS.Timeout;
  private isShuttingDown = false;

  /**
   * Select appropriate Cortex Master role based on query content
   */
  private async selectCortexMaster(query: string): Promise<CortexMaster> {
    const lowerQuery = query.toLowerCase();

    // Load roles from .cortex/roles directory
    const masters = await this.loadCortexMasters();

    // Calculate matching scores for each role
    const scores = masters.map((master) => {
      let score = 0;

      // Keyword matching with weighted scoring
      for (const keyword of master.keywords) {
        const keywordLower = keyword.toLowerCase();
        if (lowerQuery.includes(keywordLower)) {
          // Give higher weight to more specific keywords
          if (
            keywordLower === "scalability" ||
            keywordLower === "architecture" ||
            keywordLower === "typescript" ||
            keywordLower === "react" ||
            keywordLower === "security" ||
            keywordLower === "debug"
          ) {
            score += 3; // Specific domain keywords get 3 points
          } else {
            score += 1; // General keywords get 1 point
          }
        }
      }

      // Specialty field relevance - higher weight
      if (lowerQuery.includes(master.specialty.toLowerCase())) {
        score += 5; // Specialty match adds 5 points
      }

      // Bonus for exact phrase matches
      if (lowerQuery.includes(master.name.toLowerCase())) {
        score += 10; // Exact name match gets highest priority
      }

      return { master, score };
    });

    // Sort by score (descending) and return highest scoring role
    scores.sort((a, b) => b.score - a.score);

    console.log(
      `🎯 Master selection scores:`,
      scores.map((s) => `${s.master.name}: ${s.score}`).join(", ")
    );

    // If highest score is 0, return default System Architect for architecture questions
    if (scores[0].score === 0) {
      if (
        lowerQuery.includes("architecture") ||
        lowerQuery.includes("design") ||
        lowerQuery.includes("system")
      ) {
        return masters.find((m) => m.id === "architect")!;
      }
      return masters.find((m) => m.id === "code-assistant")!;
    }

    return scores[0].master;
  }

  /**
   * Load Cortex Masters from .cortex/roles directory
   */
  private async loadCortexMasters(): Promise<CortexMaster[]> {
    const rolesDir = path.join(this.projectRoot, ".cortex", "roles");
    const masters: CortexMaster[] = [];

    try {
      // Check if roles directory exists
      if (!(await fs.pathExists(rolesDir))) {
        console.warn(
          "⚠️ .cortex/roles directory not found, using fallback roles"
        );
        return this.getFallbackMasters();
      }

      // Read all .md files from roles directory
      const files = await fs.readdir(rolesDir);
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      for (const file of mdFiles) {
        try {
          const filePath = path.join(rolesDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const master = this.parseRoleFile(file, content);
          if (master) {
            masters.push(master);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to parse role file ${file}:`, error);
        }
      }

      if (masters.length === 0) {
        console.warn("⚠️ No valid role files found, using fallback roles");
        return this.getFallbackMasters();
      }

      return masters;
    } catch (error) {
      console.error("❌ Failed to load Cortex Masters:", error);
      return this.getFallbackMasters();
    }
  }

  /**
   * Parse role file content into CortexMaster object
   */
  private parseRoleFile(
    filename: string,
    content: string
  ): CortexMaster | null {
    try {
      const id = filename.replace(".md", "");

      // Extract title (first # heading)
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const name = titleMatch ? titleMatch[1] : id;

      // Extract description from ## Description section
      const descMatch = content.match(
        /## Description\n\n(.+?)(?=\n\n##|\n\n\*\*|$)/s
      );
      const description = descMatch
        ? descMatch[1].trim()
        : `${name} specialist`;

      // Generate specialty based on role ID
      const specialty = this.generateSpecialty(id);

      // Generate keywords based on filename and content
      const keywords = this.generateKeywords(id);

      // Use the full content as system prompt
      const systemPrompt = content;

      return {
        id,
        name,
        specialty,
        description,
        keywords,
        systemPrompt,
      };
    } catch (error) {
      console.warn(`⚠️ Failed to parse role file ${filename}:`, error);
      return null;
    }
  }

  /**
   * Generate specialty from role ID
   */
  private generateSpecialty(id: string): string {
    if (id.includes("react")) {
      return "React & Frontend Development";
    } else if (id.includes("typescript")) {
      return "TypeScript Development";
    } else if (id.includes("architect")) {
      return "Software Architecture Design";
    } else if (id.includes("security")) {
      return "Network Security & Cybersecurity";
    } else if (id.includes("debug")) {
      return "Debugging & Problem Solving";
    } else if (id.includes("code-assistant")) {
      return "General Programming";
    } else if (id.includes("documentation")) {
      return "Technical Documentation";
    } else if (id.includes("testing")) {
      return "Software Testing & Quality Assurance";
    } else if (id.includes("ui-ux")) {
      return "UI/UX Design";
    }
    return "General Development";
  }

  /**
   * Generate keywords from role ID and content
   */
  private generateKeywords(id: string): string[] {
    const keywords = [id];

    // Add common keywords based on role ID
    if (id.includes("react")) {
      keywords.push("react", "frontend", "component", "hook", "jsx", "ui");
    } else if (id.includes("typescript")) {
      keywords.push(
        "typescript",
        "type",
        "interface",
        "generic",
        "type-safety"
      );
    } else if (id.includes("architect")) {
      keywords.push(
        "architecture",
        "design",
        "system",
        "structure",
        "pattern",
        "scalability"
      );
    } else if (id.includes("security")) {
      keywords.push(
        "security",
        "auth",
        "authentication",
        "authorization",
        "encryption"
      );
    } else if (id.includes("debug")) {
      keywords.push("debug", "error", "bug", "fix", "troubleshoot", "issue");
    } else if (id.includes("code-assistant")) {
      keywords.push("code", "programming", "development", "quality", "clean");
    } else if (id.includes("documentation")) {
      keywords.push("docs", "documentation", "writing", "technical", "guide");
    } else if (id.includes("testing")) {
      keywords.push("test", "testing", "quality", "qa", "automation");
    } else if (id.includes("ui-ux")) {
      keywords.push("ui", "ux", "design", "user", "interface", "experience");
    }

    return keywords;
  }

  /**
   * Get fallback masters when file loading fails
   */
  private getFallbackMasters(): CortexMaster[] {
    return [
      {
        id: "code-assistant",
        name: "Code Assistant",
        specialty: "General Programming",
        description: "General programming and code quality specialist",
        keywords: ["code", "programming", "development", "quality", "clean"],
        systemPrompt:
          "You are a general code assistant focused on clean, maintainable code.",
      },
    ];
  }

  constructor(config: MCPServerConfig = {}) {
    // Set default configuration with enhanced resilience features
    this.config = {
      logLevel: "info",
      enableDebugMode: false,
      maxExecutionTime: 30000, // 30 seconds
      timeout: 600000, // 10 minutes
      enableHealthCheck: true,
      healthCheckInterval: 30000, // 30 seconds
      maxRetries: 3,
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      enableResourceMonitoring: true,
      maxMemoryUsage: 512, // 512MB
      maxCpuUsage: 80, // 80%
      ...config,
    };

    // Initialize logger
    this.logger = this.createLogger();

    // Create server with enhanced configuration
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

    // Record start time for performance monitoring
    this.startTime = new Date();

    // Resolve project root with enhanced detection
    this.projectRoot = this.resolveProjectRoot(config.projectRoot);

    this.logger.info(
      `🚀 Initializing Cortex MCP Server v${getPackageVersion()}`
    );
    this.logger.debug(`Project root: ${this.projectRoot}`);
    this.logger.debug(`Configuration: ${JSON.stringify(this.config, null, 2)}`);

    // Initialize resilience components
    this.initializeResilienceComponents();

    // Initialize Cortex core components with error handling
    this.initializeCoreComponents();

    // Setup handlers with enhanced error handling
    this.setupHandlers();

    this.logger.info("✅ Cortex MCP Server initialized successfully");
  }

  /**
   * Create logger instance based on configuration
   */
  private createLogger(): Logger {
    const isDebug =
      this.config.logLevel === "debug" || this.config.enableDebugMode;

    return {
      info: (message: string): void => {
        if (["debug", "info"].includes(this.config.logLevel || "info")) {
          console.log(`[${new Date().toISOString()}] ℹ️  ${message}`);
        }
      },
      warn: (message: string): void => {
        if (
          ["debug", "info", "warn"].includes(this.config.logLevel || "info")
        ) {
          console.warn(`[${new Date().toISOString()}] ⚠️  ${message}`);
        }
      },
      error: (message: string): void => {
        console.error(`[${new Date().toISOString()}] ❌ ${message}`);
      },
      debug: (message: string): void => {
        if (isDebug) {
          console.debug(`[${new Date().toISOString()}] 🔍 ${message}`);
        }
      },
    };
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
   * Initialize resilience components (Circuit Breaker, Resource Monitor)
   */
  private initializeResilienceComponents(): void {
    try {
      if (this.config.enableCircuitBreaker) {
        this.circuitBreaker = new CircuitBreaker(
          this.config.circuitBreakerThreshold || 5,
          60000, // 1 minute timeout
          this.logger
        );
        this.logger.debug("Circuit breaker initialized");
      }

      if (this.config.enableResourceMonitoring) {
        this.resourceMonitor = new ResourceMonitor(this.config, this.logger);
        this.logger.debug("Resource monitor initialized");
      }
    } catch (error) {
      this.logger.error(`Failed to initialize resilience components: ${error}`);
      // Don't throw - resilience components are optional
    }
  }

  /**
   * Initialize core Cortex components with error handling
   */
  private initializeCoreComponents(): void {
    try {
      this.cortex = new CortexCore(this.projectRoot);
      this.knowledgeManager = new UnifiedKnowledgeManager(this.projectRoot);
      this.ruleSystem = new DynamicRuleSystem(
        this.projectRoot,
        this.knowledgeManager
      );
      this.logger.debug("Core components initialized successfully");
    } catch (error) {
      this.logger.error(`Failed to initialize core components: ${error}`);
      throw new Error(`Cortex initialization failed: ${error}`);
    }
  }

  private async executeTool(name: string, args: unknown): Promise<unknown> {
    // Check if we're shutting down
    if (this.isShuttingDown) {
      return {
        content: [
          {
            type: "text",
            text: "Server is shutting down. Please try again later.",
          },
        ],
        isError: true,
      };
    }

    // Check resource health before executing
    if (this.resourceMonitor) {
      const health = this.resourceMonitor.checkHealth();
      if (!health.healthy) {
        this.logger.warn(
          `Resource health check failed: ${health.issues.join(", ")}`
        );
        return {
          content: [
            {
              type: "text",
              text: `Server resource constraints exceeded. Issues: ${health.issues.join(", ")}`,
            },
          ],
          isError: true,
        };
      }
    }

    // Execute with circuit breaker protection
    if (this.circuitBreaker) {
      return await this.circuitBreaker.execute(async () => {
        return await this.executeToolWithRetry(name, args);
      });
    } else {
      return await this.executeToolWithRetry(name, args);
    }
  }

  private async executeToolWithRetry(
    name: string,
    args: unknown,
    retryCount = 0
  ): Promise<unknown> {
    try {
      switch (name) {
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
          this.logger.warn(`Unknown tool requested: ${name}`);
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
      const maxRetries = this.config.maxRetries || 3;
      if (retryCount < maxRetries) {
        this.logger.warn(
          `Tool ${name} failed (attempt ${retryCount + 1}/${maxRetries + 1}), retrying...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        ); // Exponential backoff
        return await this.executeToolWithRetry(name, args, retryCount + 1);
      }
      throw error;
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

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "enhance-context",
            description:
              "Enhance current context with relevant past experiences and knowledge from Cortex AI system",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description:
                    "Current task or question to enhance context for",
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
          },
          {
            name: "execute-workflow-role",
            description:
              "Execute the next role in an existing Multi-Role workflow",
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
              "Create a GitHub pull request using the generated pr.md file",
            inputSchema: {
              type: "object",
              properties: {
                workflowId: {
                  type: "string",
                  description: "Workflow ID to create PR for",
                },
                baseBranch: {
                  type: "string",
                  description: "Base branch to merge into (default: main)",
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

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (
        request
      ): Promise<{
        content: Array<{ type: string; text: string }>;
        isError?: boolean;
      }> => {
        const { name, arguments: args } = request.params;
        const executionStartTime = Date.now();

        this.logger.debug(`🔧 Executing tool: ${name}`);

        // Validate tool name
        if (!name || typeof name !== "string") {
          this.logger.warn(`Invalid tool name: ${name}`);
          return {
            content: [{ type: "text", text: "Invalid tool name provided" }],
            isError: true,
          };
        }

        try {
          // Execute tool with timeout and performance monitoring
          const executionPromise = this.executeTool(name, args);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(
                  `Tool execution timed out after ${this.config.timeout}ms`
                )
              );
            }, this.config.timeout);
          });

          const result = await Promise.race([executionPromise, timeoutPromise]);

          const executionTime = Date.now() - executionStartTime;
          this.logger.debug(
            `✅ Tool ${name} executed successfully in ${executionTime}ms`
          );

          return result as {
            content: Array<{ type: string; text: string }>;
            isError?: boolean;
          };
        } catch (error) {
          const executionTime = Date.now() - executionStartTime;
          this.logger.error(
            `❌ Tool ${name} failed after ${executionTime}ms: ${error}`
          );

          // Enhanced error response
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Tool execution failed: ${errorMessage}\n\nExecution time: ${executionTime}ms`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  /**
   * Handle enhanced context tool
   */
  private async handleEnhanceContext(args: {
    query: string;
    maxItems?: number;
    timeRange?: number;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
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
      console.log(
        `🎭 Selected Cortex Master: ${selectedMaster.name} (${selectedMaster.specialty})`
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

  public async handleExternalKnowledgeIntegration(args: {
    query: string;
    context?: string;
    includePatterns?: boolean;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const { query, context, includePatterns = true } = args;

      if (!query.trim()) {
        return {
          content: [
            {
              type: "text",
              text: "Please provide a search query.",
            },
          ],
          isError: true,
        };
      }

      // Build enhanced response based on query analysis
      let response = `## 🌐 External Knowledge Integration\n`;
      response += `**Search Query:** ${query}\n`;

      if (context) {
        response += `**Context:** ${context}\n`;
      }
      response += `\n`;

      // Provide integration guidance based on query type
      const queryLower = query.toLowerCase();

      if (
        queryLower.includes("library") ||
        queryLower.includes("package") ||
        queryLower.includes("dependency")
      ) {
        response += `## 📚 Library Integration Guidance\n\n`;
        response += `**Recommended Approach:**\n`;
        response += `1. **Use Context7 MCP Tool** - Search for specific libraries and their documentation\n`;
        response += `2. **Check Compatibility** - Verify version compatibility and license terms\n`;
        response += `3. **Integration Patterns** - Follow established integration patterns for the library type\n`;
        response += `4. **Testing Strategy** - Include comprehensive tests for external dependencies\n\n`;

        if (includePatterns) {
          response += `**Common Patterns:**\n`;
          response += `- **npm/pnpm packages**: Use specific versions, check peer dependencies\n`;
          response += `- **GitHub libraries**: Verify maintenance status and community support\n`;
          response += `- **Enterprise libraries**: Ensure compliance with organizational standards\n`;
        }
      } else if (
        queryLower.includes("framework") ||
        queryLower.includes("architecture")
      ) {
        response += `## 🏗️ Framework Integration Guidance\n\n`;
        response += `**Recommended Approach:**\n`;
        response += `1. **Use Context7 MCP Tool** - Find framework documentation and examples\n`;
        response += `2. **Evaluate Fit** - Assess framework alignment with project requirements\n`;
        response += `3. **Migration Strategy** - Plan gradual adoption with rollback options\n`;
        response += `4. **Team Training** - Ensure team familiarity with new framework\n\n`;

        if (includePatterns) {
          response += `**Architecture Patterns:**\n`;
          response += `- **MVC Frameworks**: Understand routing and data flow patterns\n`;
          response += `- **Component Frameworks**: Master component lifecycle and state management\n`;
          response += `- **Micro-frameworks**: Identify integration points with existing architecture\n`;
        }
      } else if (
        queryLower.includes("pattern") ||
        queryLower.includes("design")
      ) {
        response += `## 🎨 Design Pattern Integration\n\n`;
        response += `**Recommended Approach:**\n`;
        response += `1. **Use Context7 MCP Tool** - Search for design pattern implementations\n`;
        response += `2. **Pattern Analysis** - Understand pattern applicability and trade-offs\n`;
        response += `3. **Implementation Strategy** - Adapt patterns to project context\n`;
        response += `4. **Documentation** - Document pattern usage and rationale\n\n`;

        if (includePatterns) {
          response += `**Common Design Patterns:**\n`;
          response += `- **Creational**: Factory, Singleton, Builder patterns\n`;
          response += `- **Structural**: Adapter, Decorator, Facade patterns\n`;
          response += `- **Behavioral**: Observer, Strategy, Command patterns\n`;
        }
      } else {
        response += `## 🔍 General Integration Guidance\n\n`;
        response += `**Recommended Approach:**\n`;
        response += `1. **Use Context7 MCP Tool** - Search for relevant external resources\n`;
        response += `2. **Cross-reference Sources** - Validate information across multiple sources\n`;
        response += `3. **Context Adaptation** - Adapt external knowledge to project needs\n`;
        response += `4. **Knowledge Preservation** - Document insights for future reference\n\n`;

        response += `**Integration Best Practices:**\n`;
        response += `- **Source Evaluation**: Assess credibility and recency of information\n`;
        response += `- **Context Mapping**: Relate external knowledge to current project context\n`;
        response += `- **Incremental Adoption**: Start with small, low-risk integrations\n`;
        response += `- **Feedback Loop**: Monitor impact and adjust approach as needed\n`;
      }

      // Add Cortex Master integration
      const selectedMaster = await this.selectCortexMaster(query);
      response += `## 🎭 Cortex Master Integration\n`;
      response += `**Selected Master:** ${selectedMaster.name}\n`;
      response += `**Specialty:** ${selectedMaster.specialty}\n`;
      response += `**Integration Role:** Guide the application of external knowledge to project context\n\n`;

      response += `**Next Steps:**\n`;
      response += `1. Use Context7 MCP tool to search for specific resources\n`;
      response += `2. Apply the selected Cortex Master's expertise\n`;
      response += `3. Integrate findings with project requirements\n`;
      response += `4. Document integration decisions and rationale\n`;

      return {
        content: [{ type: "text", text: response }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to integrate external knowledge: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  public async handleUnifiedKnowledgeSearch(args: {
    query: string;
    maxResults?: number;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    try {
      const { query, maxResults = 5 } = args;

      if (!query.trim()) {
        return {
          content: [
            {
              type: "text",
              text: "Please provide a search query.",
            },
          ],
          isError: true,
        };
      }

      // Search across all internal knowledge sources
      const knowledgeResults = await this.knowledgeManager.searchKnowledge(
        query,
        maxResults
      );

      // Build enhanced response
      let response = `## 🧠 Unified Knowledge Search\n`;
      response += `**Search Query:** ${query}\n\n`;

      if (knowledgeResults.length === 0) {
        response += `## 📚 No Internal Knowledge Found\n`;
        response += `No relevant internal knowledge found for "${query}". `;
        response += `I can still help you based on my general expertise.\n\n`;

        // Select appropriate Cortex Master for fallback
        const selectedMaster = await this.selectCortexMaster(query);
        response += `## 🎭 Selected Cortex Master: ${selectedMaster.name}\n`;
        response += `**Specialty:** ${selectedMaster.specialty}\n`;
        response += `**Expertise:** ${selectedMaster.description}\n\n`;
        response += `**Recommendation:** Let me provide guidance based on professional best practices!`;
      } else {
        response += `## 📖 Internal Knowledge Results\n`;
        response += `Found ${knowledgeResults.length} relevant internal resources:\n\n`;

        knowledgeResults.forEach((result, index) => {
          response += `### ${index + 1}. ${result.title}\n`;
          response += `**Source:** ${result.source}\n`;
          response += `**Relevance:** ${result.relevance.toFixed(1)}\n`;
          response += `**Content:** ${result.content}\n\n`;
        });

        response += `## 🎯 Integration Recommendations\n`;
        response += `Based on these internal knowledge sources and my analysis:\n\n`;
        response += `1. **Reference Internal Best Practices** - Use patterns from existing documentation\n`;
        response += `2. **Learn from Past Experiences** - Apply lessons from similar projects\n`;
        response += `3. **Follow Established Patterns** - Use role templates for consistent approaches\n\n`;

        // Select appropriate Cortex Master based on search results
        const selectedMaster = await this.selectCortexMaster(query);
        response += `## 🎭 Cortex Master Integration\n`;
        response += `**Selected Master:** ${selectedMaster.name} (${selectedMaster.specialty})\n`;
        response += `**Integration Approach:** Combine internal knowledge with domain expertise\n\n`;
        response += `**Ready to proceed with implementation!**`;
      }

      return {
        content: [{ type: "text", text: response }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to search internal knowledge: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Start the MCP server with enhanced error handling and resilience features
   */
  async start(): Promise<void> {
    try {
      this.logger.info("🚀 Starting Cortex MCP Server...");

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
        `✅ Cortex MCP Server started successfully in ${uptime}ms`
      );
      this.logger.info("🔧 Available tools:");
      this.logger.info(
        "  • enhance-context - Enhance current context with relevant experiences"
      );
      this.logger.info(
        "  • record-experience - Record new experiences for future reference"
      );
      this.logger.info(
        "  • external-knowledge-integration - Integrate external knowledge sources"
      );
      this.logger.info(
        "  • unified-knowledge-search - Search across all internal knowledge sources"
      );
      this.logger.info("📝 Server is ready to receive MCP requests");

      // Start health check monitoring if enabled
      if (this.config.enableHealthCheck) {
        this.startHealthCheck();
        this.logger.info("🏥 Health monitoring enabled");
      }

      // Setup graceful shutdown handlers
      this.setupGracefulShutdown();
    } catch (error) {
      this.logger.error(`❌ Failed to start MCP server: ${error}`);
      throw error;
    }
  }

  /**
   * Stop the server gracefully with proper cleanup
   */
  async stop(): Promise<void> {
    try {
      this.logger.info("🛑 Stopping Cortex MCP Server...");
      this.isShuttingDown = true;

      // Stop health check monitoring
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = undefined;
        this.logger.debug("Health check monitoring stopped");
      }

      if (this.server) {
        // Note: MCP SDK doesn't have a disconnect method in current version
        // This is a placeholder for future versions
        this.logger.debug("Server cleanup completed");
      }

      const uptime = Date.now() - this.startTime.getTime();
      this.logger.info(
        `✅ Cortex MCP Server stopped gracefully after ${uptime}ms`
      );
    } catch (error) {
      this.logger.error(`❌ Error during server shutdown: ${error}`);
      throw error;
    }
  }

  /**
   * Get server status information with enhanced health metrics
   */
  getStatus(): {
    version: string;
    projectRoot: string;
    uptime: number;
    isRunning: boolean;
    toolsCount: number;
    config: unknown;
    health?: { healthy: boolean; issues: string[]; stats: unknown };
    circuitBreaker?: { state: string; failureCount: number };
  } {
    const uptime = Date.now() - this.startTime.getTime();
    const status: {
      version: string;
      projectRoot: string;
      uptime: number;
      isRunning: boolean;
      toolsCount: number;
      config: unknown;
      health?: { healthy: boolean; issues: string[]; stats: unknown };
      circuitBreaker?: { state: string; failureCount: number };
    } = {
      version: getPackageVersion(),
      projectRoot: this.projectRoot,
      uptime,
      isRunning: !this.isShuttingDown,
      toolsCount: 4, // We have 4 tools defined
      config: this.config,
    };

    // Add health information if monitoring is enabled
    if (this.resourceMonitor) {
      const health = this.resourceMonitor.checkHealth();
      status.health = {
        healthy: health.healthy,
        issues: health.issues,
        stats: this.resourceMonitor.getStats(),
      };
    }

    // Add circuit breaker information if enabled
    if (this.circuitBreaker) {
      status.circuitBreaker = {
        state: this.circuitBreaker.getState(),
        failureCount: 0, // CircuitBreaker doesn't expose failureCount publicly
      };
    }

    return status;
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    if (!this.config.enableHealthCheck || !this.config.healthCheckInterval) {
      return;
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logger.error(`Health check failed: ${error}`);
      }
    }, this.config.healthCheckInterval);

    this.logger.debug(
      `Health check monitoring started (interval: ${this.config.healthCheckInterval}ms)`
    );
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const issues: string[] = [];

    // Resource health check
    if (this.resourceMonitor) {
      const resourceHealth = this.resourceMonitor.checkHealth();
      if (!resourceHealth.healthy) {
        issues.push(...resourceHealth.issues);
      }
    }

    // Circuit breaker health check
    if (this.circuitBreaker && this.circuitBreaker.getState() === "open") {
      issues.push("Circuit breaker is open - service temporarily unavailable");
    }

    // Core components health check
    try {
      // Simple health check by attempting to access core components
      if (!this.cortex || !this.knowledgeManager || !this.ruleSystem) {
        issues.push("Core components not properly initialized");
      }
    } catch (error) {
      issues.push(`Core components health check failed: ${error}`);
    }

    // Log health status
    if (issues.length > 0) {
      this.logger.warn(
        `🏥 Health check detected ${issues.length} issue(s): ${issues.join(", ")}`
      );
    } else {
      this.logger.debug("🏥 Health check passed - all systems operational");
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    // Handle process termination signals
    const shutdownHandler = async (signal: string): Promise<void> => {
      this.logger.info(`Received ${signal}, initiating graceful shutdown...`);
      await this.stop();
      process.exit(0);
    };

    process.on("SIGINT", (): void => {
      shutdownHandler("SIGINT");
    });
    process.on("SIGTERM", (): void => {
      shutdownHandler("SIGTERM");
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error): void => {
      this.logger.error(`Uncaught exception: ${error}`);
      this.stop().finally(() => {
        process.exit(1);
      });
    });

    // Handle unhandled promise rejections
    process.on(
      "unhandledRejection",
      (reason: unknown, promise: Promise<unknown>): void => {
        this.logger.error(`Unhandled rejection at ${promise}: ${reason}`);
        // Don't exit on unhandled rejections during normal operation
        // Just log and continue
      }
    );

    this.logger.debug("Graceful shutdown handlers configured");
  }

  /**
   * Handle create workflow tool
   */
  private async handleCreateWorkflow(args: {
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
  private async handleExecuteWorkflowRole(args: {
    workflowId: string;
  }): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
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
   * Public method to execute MCP tools from CLI
   */
  public async executeMCPTool(
    name: string,
    args: unknown
  ): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    return (await this.executeTool(name, args)) as {
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
    };
  }

  /**
   * Handle create pull request tool
   */
  private async handleCreatePullRequest(args: {
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
            {
              type: "text",
              text: `Workflow ${workflowId} not found.`,
            },
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
              text: `✅ Pull request created successfully!\n\n**PR URL:** ${prUrl}\n**Title:** ${workflowState.issueTitle}\n**Base:** ${baseBranch}\n**Head:** ${currentBranch}\n**Draft:** ${draft ? "Yes" : "No"}`,
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
              text: `⚠️  GitHub CLI not available or failed to create PR automatically.\n\nPlease create the PR manually:\n\n**Title:** ${workflowState.issueTitle}\n**Base branch:** ${baseBranch}\n**Head branch:** ${currentBranch}\n\n**PR Description:**\n${prContent}\n\nTo install GitHub CLI: \`brew install gh\` (macOS) or visit https://cli.github.com/`,
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
 * Create Cortex MCP server with enhanced configuration support and resilience features
 */
export function createCortexMCPServer(
  config: MCPServerConfig = {}
): CortexMCPServer {
  // Apply default resilience configurations
  const defaultConfig: Partial<MCPServerConfig> = {
    enableHealthCheck: true,
    healthCheckInterval: 30000,
    maxRetries: 3,
    enableCircuitBreaker: true,
    circuitBreakerThreshold: 5,
    enableResourceMonitoring: true,
    maxMemoryUsage: 512,
    maxCpuUsage: 80,
  };

  const mergedConfig = { ...defaultConfig, ...config };
  return new CortexMCPServer(mergedConfig);
}

/**
 * Create Cortex MCP server with project path (backward compatibility)
 */
export function createCortexMCPServerWithProject(
  projectPath?: string
): CortexMCPServer {
  return new CortexMCPServer({ projectRoot: projectPath });
}

/**
 * Direct execution entry point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createCortexMCPServer();
  server.start().catch((error) => {
    console.error("Failed to start Cortex MCP server:", error);
    process.exit(1);
  });
}
