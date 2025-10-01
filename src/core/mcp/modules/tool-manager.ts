/**
 * Tool Manager - Manages MCP tools and their execution
 *
 * This module handles tool discovery, registration, and execution lifecycle
 */

import { Logger } from "../types.js";
import {
  ToolDefinition,
  ToolExecutionResult,
  ToolExecutionContext,
} from "../types.js";

export interface ToolManagerConfig {
  maxConcurrentTools?: number;
  toolTimeout?: number;
  enableCaching?: boolean;
  cacheTTL?: number;
}

export class ToolManager {
  private tools: Map<string, ToolDefinition> = new Map();
  private logger: Logger;
  private config: ToolManagerConfig;
  private executionQueue: Map<string, Promise<ToolExecutionResult>> = new Map();
  private cache: Map<
    string,
    { result: ToolExecutionResult; timestamp: number }
  > = new Map();

  constructor(logger: Logger, config: ToolManagerConfig = {}) {
    this.logger = logger;
    this.config = {
      maxConcurrentTools: 5,
      toolTimeout: 30000,
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
      ...config,
    };
  }

  /**
   * Register a new tool
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    this.logger.info(`Tool registered: ${tool.name}`);
  }

  /**
   * Register multiple tools
   */
  registerTools(tools: ToolDefinition[]): void {
    for (const tool of tools) {
      this.registerTool(tool);
    }
  }

  /**
   * Get all registered tools
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool with caching and concurrency control
   */
  async executeTool(
    name: string,
    args: unknown,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    // Check cache first
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(name, args);
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL!) {
        this.logger.debug(`Cache hit for tool: ${name}`);
        return cached.result;
      }
    }

    // Check if tool is already executing
    const executionKey = `${name}:${JSON.stringify(args)}`;
    if (this.executionQueue.has(executionKey)) {
      this.logger.debug(`Tool already executing: ${name}`);
      return await this.executionQueue.get(executionKey)!;
    }

    // Execute tool
    const executionPromise = this.executeToolInternal(tool, args, context);
    this.executionQueue.set(executionKey, executionPromise);

    try {
      const result = await executionPromise;

      // Cache result
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(name, args);
        this.cache.set(cacheKey, {
          result,
          timestamp: Date.now(),
        });
      }

      return result;
    } finally {
      this.executionQueue.delete(executionKey);
    }
  }

  /**
   * Internal tool execution with timeout
   */
  private async executeToolInternal(
    tool: ToolDefinition,
    args: unknown,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Executing tool: ${tool.name}`);

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Tool execution timeout: ${tool.name}`));
        }, this.config.toolTimeout);
      });

      // Execute tool with timeout
      const result = await Promise.race([
        tool.execute(args, context),
        timeoutPromise,
      ]);

      const executionTime = Date.now() - startTime;
      this.logger.debug(
        `Tool ${tool.name} executed successfully in ${executionTime}ms`
      );

      return {
        ...result,
        executionTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `Tool ${tool.name} failed after ${executionTime}ms: ${error}`
      );

      return {
        content: [
          {
            type: "text",
            text: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
        executionTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate cache key for tool execution
   */
  private generateCacheKey(name: string, args: unknown): string {
    return `${name}:${JSON.stringify(args)}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info("Tool cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }

  /**
   * Get execution queue status
   */
  getExecutionStatus(): { activeExecutions: number; queuedExecutions: number } {
    return {
      activeExecutions: this.executionQueue.size,
      queuedExecutions: 0, // TODO: Implement queue management
    };
  }
}
