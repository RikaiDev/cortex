/**
 * Thinking Process System
 *
 * This module implements a CoT-like thinking process system using MCP tools
 * to provide structured thinking capabilities without requiring a CoT model.
 */

import { MCPWorkflow } from "../common/types.js";

/**
 * Thinking step definition
 */
export interface ThinkingStep {
  id: string;
  name: string;
  description: string;
  template: string;
  tool?: string;
}

/**
 * Thinking process configuration
 */
export interface ThinkingProcessConfig {
  enableParallelThinking: boolean;
  autoTriggerOnMessage: boolean;
  steps: ThinkingStep[];
  debugMode: boolean;
}

/**
 * Thinking process result
 */
export interface ThinkingProcessResult {
  steps: {
    id: string;
    result: string;
    timestamp: number;
  }[];
  nextStep: string;
  reasoning: string;
  executionTimeMs: number;
}

/**
 * Default thinking process configuration
 */
const DEFAULT_CONFIG: ThinkingProcessConfig = {
  enableParallelThinking: false,
  autoTriggerOnMessage: true,
  steps: [
    {
      id: "intent-analysis",
      name: "Intent Analysis",
      description: "Analyze the user's true intent and goals",
      template: "What is the user really trying to achieve?",
      tool: "intent-analyzer",
    },
    {
      id: "task-decomposition",
      name: "Task Decomposition",
      description: "Break down the problem into manageable sub-tasks",
      template: "What are the component parts of this problem?",
      tool: "task-decomposer",
    },
    {
      id: "context-gathering",
      name: "Context Gathering",
      description: "Identify relevant context and information needed",
      template: "What information do I need to solve this problem?",
    },
    {
      id: "solution-planning",
      name: "Solution Planning",
      description: "Plan the approach to solving the problem",
      template: "What is the best approach to solve this problem?",
    },
    {
      id: "implementation-steps",
      name: "Implementation Steps",
      description: "Define concrete implementation steps",
      template: "What specific steps should I take to implement the solution?",
    },
    {
      id: "validation-criteria",
      name: "Validation Criteria",
      description: "Define how to validate the solution",
      template: "How will I know if the solution is correct and complete?",
    },
    {
      id: "next-step-planning",
      name: "Next Step Planning",
      description: "Plan the immediate next step",
      template: "What is the immediate next step I should take?",
    },
  ],
  debugMode: false,
};

/**
 * Thinking process manager that implements CoT-like capabilities
 */
export class ThinkingProcess {
  private config: ThinkingProcessConfig;
  private mcpWorkflow: MCPWorkflow;
  private lastThinkingResult: ThinkingProcessResult | null = null;

  /**
   * Creates a new instance of the ThinkingProcess class
   * @param mcpWorkflow - MCP workflow instance to use for tool execution
   * @param customConfig - Custom configuration to override defaults
   */
  constructor(
    mcpWorkflow: MCPWorkflow,
    customConfig?: Partial<ThinkingProcessConfig>,
  ) {
    this.mcpWorkflow = mcpWorkflow;
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
  }

  /**
   * Execute the thinking process for a user message
   * @param message - User message to process
   * @param context - Additional context for the thinking process
   * @returns Thinking process result
   */
  async executeThinking(
    message: string,
    context: Record<string, any> = {},
  ): Promise<ThinkingProcessResult> {
    const startTime = Date.now();
    const results = [];

    // Execute thinking steps
    if (this.config.enableParallelThinking) {
      // Execute steps in parallel
      results.push(...(await this.executeParallelSteps(message, context)));
    } else {
      // Execute steps sequentially
      results.push(...(await this.executeSequentialSteps(message, context)));
    }

    // Generate next step plan
    const nextStep = await this.generateNextStep(results, message, context);

    // Record execution time
    const executionTimeMs = Date.now() - startTime;

    // Create thinking result
    const thinkingResult: ThinkingProcessResult = {
      steps: results,
      nextStep: nextStep.plan,
      reasoning: nextStep.reasoning,
      executionTimeMs,
    };

    // Store last thinking result
    this.lastThinkingResult = thinkingResult;

    // Record experience if debug mode is enabled
    if (this.config.debugMode) {
      await this.recordThinkingExperience(thinkingResult, message);
    }

    return thinkingResult;
  }

  /**
   * Execute thinking steps sequentially
   * @param message - User message to process
   * @param context - Additional context for the thinking process
   * @returns Array of step results
   */
  private async executeSequentialSteps(
    message: string,
    context: Record<string, any>,
  ): Promise<any[]> {
    const results = [];
    const stepContext = { ...context };

    for (const step of this.config.steps) {
      // Skip next-step-planning as it's handled separately
      if (step.id === "next-step-planning") continue;

      const stepResult = await this.executeStep(step, message, stepContext);
      results.push({
        id: step.id,
        result: stepResult,
        timestamp: Date.now(),
      });

      // Add result to context for next steps
      stepContext[step.id] = stepResult;
    }

    return results;
  }

  /**
   * Execute thinking steps in parallel
   * @param message - User message to process
   * @param context - Additional context for the thinking process
   * @returns Array of step results
   */
  private async executeParallelSteps(
    message: string,
    context: Record<string, any>,
  ): Promise<any[]> {
    const stepPromises = this.config.steps
      // Skip next-step-planning as it's handled separately
      .filter((step) => step.id !== "next-step-planning")
      .map(async (step) => {
        const stepResult = await this.executeStep(step, message, context);
        return {
          id: step.id,
          result: stepResult,
          timestamp: Date.now(),
        };
      });

    return Promise.all(stepPromises);
  }

  /**
   * Execute a single thinking step
   * @param step - Thinking step to execute
   * @param message - User message to process
   * @param context - Additional context for the thinking step
   * @returns Step result
   */
  private async executeStep(
    step: ThinkingStep,
    message: string,
    context: Record<string, any>,
  ): Promise<string> {
    // If step has a tool, use it
    if (step.tool && this.mcpWorkflow) {
      try {
        // Execute MCP tool
        const toolResult = await this.executeMCPTool(step.tool, {
          userInput: message,
          context: JSON.stringify(context),
          stepId: step.id,
        });

        return typeof toolResult === "string"
          ? toolResult
          : JSON.stringify(toolResult);
      } catch (error) {
        console.error(
          `Error executing thinking step ${step.id} with tool ${step.tool}:`,
          error,
        );
        // Fall back to template-based thinking
      }
    }

    // If no tool or tool execution failed, use template-based thinking
    // In a real implementation, this would call an LLM to generate the thought
    return `Simulated thought for ${step.name}: ${step.template} (based on "${message}")`;
  }

  /**
   * Execute an MCP tool
   * @param toolName - Name of the MCP tool to execute
   * @param params - Parameters for the tool
   * @returns Tool execution result
   */
  private async executeMCPTool(
    toolName: string,
    params: Record<string, any>,
  ): Promise<any> {
    try {
      return await this.mcpWorkflow.executeTool(toolName, params);
    } catch (error) {
      console.error(`Error executing MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Generate the next step plan
   * @param stepResults - Results of previous thinking steps
   * @param message - Original user message
   * @param context - Additional context
   * @returns Next step plan and reasoning
   */
  private async generateNextStep(
    stepResults: any[],
    message: string,
    context: Record<string, any>,
  ): Promise<{ plan: string; reasoning: string }> {
    // Find next-step-planning step
    const nextStepPlanning = this.config.steps.find(
      (step) => step.id === "next-step-planning",
    );

    if (nextStepPlanning?.tool && this.mcpWorkflow) {
      try {
        // Create context with all step results
        const nextStepContext = {
          ...context,
          stepResults: stepResults.reduce((acc, step) => {
            acc[step.id] = step.result;
            return acc;
          }, {}),
        };

        // Execute next step planning tool
        const toolResult = await this.executeMCPTool(nextStepPlanning.tool, {
          userInput: message,
          context: JSON.stringify(nextStepContext),
          stepId: nextStepPlanning.id,
        });

        if (
          typeof toolResult === "object" &&
          toolResult.plan &&
          toolResult.reasoning
        ) {
          return toolResult;
        }

        // If tool result doesn't have the expected format, create a default response
        return {
          plan:
            typeof toolResult === "string"
              ? toolResult
              : JSON.stringify(toolResult),
          reasoning: "Generated by MCP tool",
        };
      } catch (error) {
        console.error("Error executing next step planning tool:", error);
        // Fall back to simulated next step planning
      }
    }

    // Simulated next step planning
    return {
      plan: `Based on analysis of "${message}", the next step is to implement a solution that addresses the core need.`,
      reasoning: "Simulated reasoning based on available information",
    };
  }

  /**
   * Record thinking experience for learning and improvement
   * @param thinkingResult - Thinking process result
   * @param message - Original user message
   */
  private async recordThinkingExperience(
    thinkingResult: ThinkingProcessResult,
    message: string,
  ): Promise<void> {
    try {
      if (this.mcpWorkflow) {
        await this.mcpWorkflow.executeTool("experience-recorder", {
          action: "thinking-process",
          context: JSON.stringify({
            userInput: message,
            thinkingResult,
          }),
          success: true,
          feedback: "Thinking process completed successfully",
        });
      }
    } catch (error) {
      console.error("Error recording thinking experience:", error);
    }
  }

  /**
   * Get the last thinking result
   * @returns Last thinking result or null if none exists
   */
  getLastThinkingResult(): ThinkingProcessResult | null {
    return this.lastThinkingResult;
  }

  /**
   * Create a message interceptor that automatically triggers thinking process
   * @returns Function that intercepts messages and triggers thinking process
   */
  createMessageInterceptor() {
    return async (
      message: string,
      processMessage: (
        msg: string,
        thinking?: ThinkingProcessResult,
      ) => Promise<string>,
    ) => {
      if (this.config.autoTriggerOnMessage) {
        // Execute thinking process first
        const thinkingResult = await this.executeThinking(message);

        // Process message with thinking result
        return processMessage(message, thinkingResult);
      }

      // If auto-trigger is disabled, process normally
      return processMessage(message);
    };
  }
}

/**
 * Create a thinking process manager with default configuration
 * @param mcpWorkflow - MCP workflow instance to use for tool execution
 * @returns Thinking process manager instance
 */
export function createThinkingProcess(
  mcpWorkflow: MCPWorkflow,
): ThinkingProcess {
  return new ThinkingProcess(mcpWorkflow);
}
