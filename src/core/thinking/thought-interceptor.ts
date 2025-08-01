/**
 * Thought Interceptor System
 *
 * This module provides mechanisms to intercept user messages and
 * automatically trigger thinking processes before processing the message.
 */

import { ThinkingProcess, ThinkingProcessResult } from "./thinking-process.js";
import { MessageProcessor } from "../common/types.js";

/**
 * Configuration for thought interceptor
 */
export interface ThoughtInterceptorConfig {
  enableAutoIntercept: boolean;
  enhanceMessages: boolean;
  includeThinkingMetadata: boolean;
  debugMode: boolean;
}

/**
 * Default configuration for thought interceptor
 */
const DEFAULT_CONFIG: ThoughtInterceptorConfig = {
  enableAutoIntercept: true,
  enhanceMessages: true,
  includeThinkingMetadata: true,
  debugMode: false,
};

/**
 * Thought interceptor that automatically triggers thinking processes
 */
export class ThoughtInterceptor {
  private config: ThoughtInterceptorConfig;
  private thinkingProcess: ThinkingProcess;

  /**
   * Creates a new instance of the ThoughtInterceptor class
   * @param thinkingProcess - Thinking process instance to use
   * @param customConfig - Custom configuration to override defaults
   */
  constructor(
    thinkingProcess: ThinkingProcess,
    customConfig?: Partial<ThoughtInterceptorConfig>,
  ) {
    this.thinkingProcess = thinkingProcess;
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
  }

  /**
   * Intercept a message and trigger thinking process
   * @param message - Original user message
   * @param processor - Message processor function
   * @param context - Additional context
   * @returns Processed message result
   */
  async interceptMessage(
    message: string,
    processor: MessageProcessor,
    context: Record<string, any> = {},
  ): Promise<string> {
    if (!this.config.enableAutoIntercept) {
      return processor(message, context);
    }

    try {
      // Execute thinking process
      const thinkingResult = await this.thinkingProcess.executeThinking(
        message,
        context,
      );

      // Enhance message with thinking results if enabled
      const enhancedMessage = this.config.enhanceMessages
        ? this.enhanceMessage(message, thinkingResult)
        : message;

      // Create enhanced context with thinking results
      const enhancedContext = {
        ...context,
        thinking: thinkingResult,
      };

      // Process enhanced message with enhanced context
      return processor(enhancedMessage, enhancedContext);
    } catch (error) {
      console.error("Error in thought interception:", error);

      // Fall back to normal processing if thinking fails
      return processor(message, context);
    }
  }

  /**
   * Enhance a message with thinking results
   * @param message - Original message
   * @param thinking - Thinking process result
   * @returns Enhanced message with thinking context
   */
  private enhanceMessage(
    message: string,
    thinking: ThinkingProcessResult,
  ): string {
    if (!this.config.includeThinkingMetadata) {
      return message;
    }

    // Create thinking metadata prefix
    const thinkingMetadata = `
[THINKING_METADATA]
${thinking.steps.map((step) => `${step.id}: ${this.truncate(step.result)}`).join("\n")}

Next step: ${thinking.nextStep}
Reasoning: ${thinking.reasoning}
[/THINKING_METADATA]

`;

    return thinkingMetadata + message;
  }

  /**
   * Truncate a string to a reasonable length
   * @param text - Text to truncate
   * @param maxLength - Maximum length
   * @returns Truncated text
   */
  private truncate(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + "...";
  }

  /**
   * Create an interceptor function that can be used to wrap message processors
   * @returns Interceptor function
   */
  createInterceptor(): (
    message: string,
    processor: MessageProcessor,
    context?: Record<string, any>,
  ) => Promise<string> {
    return this.interceptMessage.bind(this);
  }
}

/**
 * Create a thought interceptor with default configuration
 * @param thinkingProcess - Thinking process instance to use
 * @returns Thought interceptor instance
 */
export function createThoughtInterceptor(
  thinkingProcess: ThinkingProcess,
): ThoughtInterceptor {
  return new ThoughtInterceptor(thinkingProcess);
}
