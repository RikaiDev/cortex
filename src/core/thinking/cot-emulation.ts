/**
 * CoT Emulation System
 *
 * This module provides a unified interface for emulating Chain-of-Thought (CoT)
 * capabilities without requiring a CoT-specific model.
 */

import { MCPWorkflow, MessageProcessor } from "../common/types.js";
import { ThinkingProcess } from "./thinking-process.js";
import { ThoughtInterceptor } from "./thought-interceptor.js";
import { PromptInjection } from "./prompt-injection.js";
import { MCPThinkingTools } from "../mcp/mcp-thinking-tools.js";

/**
 * Configuration for CoT emulation
 */
export interface CoTEmulationConfig {
  enableAutoThinking: boolean;
  enhancePrompts: boolean;
  interceptMessages: boolean;
  debugMode: boolean;
}

/**
 * Default configuration for CoT emulation
 */
const DEFAULT_CONFIG: CoTEmulationConfig = {
  enableAutoThinking: true,
  enhancePrompts: true,
  interceptMessages: true,
  debugMode: false,
};

/**
 * CoT emulation system that coordinates all thinking components
 */
export class CoTEmulation {
  private config: CoTEmulationConfig;
  private mcpWorkflow: MCPWorkflow;
  private thinkingProcess: ThinkingProcess;
  private thoughtInterceptor: ThoughtInterceptor;
  private mcpThinkingTools: MCPThinkingTools;
  private promptInjection: PromptInjection;

  /**
   * Creates a new instance of the CoTEmulation class
   * @param mcpWorkflow - MCP workflow instance to use
   * @param projectRoot - Project root directory
   * @param customConfig - Custom configuration to override defaults
   */
  constructor(
    mcpWorkflow: MCPWorkflow,
    projectRoot: string,
    customConfig?: Partial<CoTEmulationConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    this.mcpWorkflow = mcpWorkflow;

    // Initialize components
    this.mcpThinkingTools = new MCPThinkingTools(mcpWorkflow);
    this.thinkingProcess = new ThinkingProcess(mcpWorkflow);
    this.thoughtInterceptor = new ThoughtInterceptor(this.thinkingProcess);
    this.promptInjection = new PromptInjection(projectRoot);
  }

  /**
   * Initialize the CoT emulation system
   */
  async initialize(): Promise<void> {
    // Register MCP thinking tools
    // (This happens automatically in the MCPThinkingTools constructor)

    // Record initialization
    if (this.config.debugMode) {
      await this.recordEvent("cot-emulation-initialized", {
        config: this.config,
      });
    }
  }

  /**
   * Enhance a system prompt with thinking process instructions
   * @param basePrompt - Base system prompt
   * @returns Enhanced system prompt
   */
  enhanceSystemPrompt(basePrompt: string): string {
    if (!this.config.enhancePrompts) {
      return basePrompt;
    }

    return this.promptInjection.injectThinkingTrigger(basePrompt);
  }

  /**
   * Process a user message with CoT-like thinking
   * @param message - User message
   * @param processor - Message processor function
   * @param context - Additional context
   * @returns Processed message result
   */
  async processMessage(
    message: string,
    processor: MessageProcessor,
    context: Record<string, any> = {},
  ): Promise<string> {
    if (!this.config.interceptMessages) {
      return processor(message, context);
    }

    return this.thoughtInterceptor.interceptMessage(
      message,
      processor,
      context,
    );
  }

  /**
   * Execute thinking process explicitly
   * @param message - User message
   * @param context - Additional context
   * @returns Thinking process result
   */
  async executeThinking(
    message: string,
    context: Record<string, any> = {},
  ): Promise<any> {
    return this.thinkingProcess.executeThinking(message, context);
  }

  /**
   * Record an event for debugging and analysis
   * @param eventType - Type of event
   * @param data - Event data
   */
  private async recordEvent(
    eventType: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      await this.mcpWorkflow.executeTool("experience-recorder", {
        action: eventType,
        context: JSON.stringify(data),
        success: true,
        feedback: `Event ${eventType} recorded`,
      });
    } catch (error) {
      console.error(`Error recording event ${eventType}:`, error);
    }
  }
}

/**
 * Create a CoT emulation system with default configuration
 * @param mcpWorkflow - MCP workflow instance to use
 * @param projectRoot - Project root directory
 * @returns CoT emulation system instance
 */
export function createCoTEmulation(
  mcpWorkflow: MCPWorkflow,
  customConfig?: Partial<CoTEmulationConfig>,
): CoTEmulation {
  return new CoTEmulation(mcpWorkflow, "", customConfig);
}
