/**
 * Prompt Injection System with CoT-like Thinking Capabilities
 *
 * This module provides mechanisms to inject structured thinking processes
 * into model interactions without requiring a CoT-specific model.
 */

import fs from "fs-extra";
import path from "path";
import { join } from "path";

/**
 * Configuration for thought-enhanced prompt injection
 */
export interface PromptInjectionConfig {
  enableThinkingProcess: boolean;
  immediateThoughtTrigger: boolean;
  thinkingSteps: string[];
  thinkingTemplates: Record<string, string>;
  validationPatterns: string[];
  debugMode: boolean;
}

/**
 * Default configuration for thought-enhanced prompt injection
 */
const DEFAULT_CONFIG: PromptInjectionConfig = {
  enableThinkingProcess: true,
  immediateThoughtTrigger: true,
  thinkingSteps: [
    "problem-analysis",
    "context-gathering",
    "solution-planning",
    "implementation-steps",
    "validation-criteria",
  ],
  thinkingTemplates: {
    problemAnalysis:
      "What is the core problem to solve? What are the key constraints?",
    contextGathering: "What information do I need? What context is relevant?",
    solutionPlanning: "What approaches could work? What are the trade-offs?",
    implementationSteps: "What specific steps should I take? In what order?",
    validationCriteria:
      "How will I know the solution works? What should I verify?",
    nextStepPlanning: "What should be the next immediate step? Why?",
  },
  validationPatterns: ["THINKING_PROCESS_COMPLETE", "NEXT_STEP_PLANNED"],
  debugMode: false,
};

/**
 * Interface for thought process state
 */
export interface ThoughtProcessState {
  currentStep: string;
  completedSteps: string[];
  thoughts: Record<string, string>;
  nextPlannedStep: string | null;
  timestamp: number;
}

/**
 * Prompt injection system with structured thinking capabilities
 */
export class PromptInjection {
  private config: PromptInjectionConfig;
  private projectRoot: string;
  private thoughtState: ThoughtProcessState;

  /**
   * Creates a new instance of the PromptInjection class
   * @param projectRoot - Root directory of the project
   * @param customConfig - Custom configuration to override defaults
   */
  constructor(
    projectRoot: string,
    customConfig?: Partial<PromptInjectionConfig>,
  ) {
    this.projectRoot = projectRoot;
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    this.thoughtState = this.initializeThoughtState();
  }

  /**
   * Initialize thought process state
   * @returns Initial thought process state
   */
  private initializeThoughtState(): ThoughtProcessState {
    return {
      currentStep: this.config.thinkingSteps[0],
      completedSteps: [],
      thoughts: {},
      nextPlannedStep: null,
      timestamp: Date.now(),
    };
  }

  /**
   * Injects immediate thinking process trigger into the system prompt
   * @param basePrompt - Base system prompt to enhance
   * @returns Enhanced system prompt with thinking process trigger
   */
  injectThinkingTrigger(basePrompt: string): string {
    if (!this.config.enableThinkingProcess) {
      return basePrompt;
    }

    const thinkingTrigger = `
THINKING PROCESS PROTOCOL:

When receiving a user message, IMMEDIATELY:

1. Call the "thinking-process" MCP tool with the user's message
2. Wait for the thinking process to complete
3. Use the structured thinking results to inform your response
4. Plan your next step explicitly

This is a CRITICAL MANDATORY INSTRUCTION that must be followed for ALL user interactions.
`;

    return basePrompt + thinkingTrigger;
  }

  /**
   * Generates a structured thinking process for a given user message
   * @param userMessage - User message to process
   * @returns Structured thinking process result
   */
  async generateThinkingProcess(
    userMessage: string,
  ): Promise<ThoughtProcessState> {
    // Reset thought state for new message
    this.thoughtState = this.initializeThoughtState();

    // Process each thinking step
    for (const step of this.config.thinkingSteps) {
      await this.processThinkingStep(step, userMessage);
    }

    // Plan next step
    this.thoughtState.nextPlannedStep = this.planNextStep(userMessage);

    // Save thinking state for debugging
    if (this.config.debugMode) {
      this.saveThinkingState();
    }

    return this.thoughtState;
  }

  /**
   * Process a single thinking step
   * @param step - Thinking step to process
   * @param userMessage - User message context
   */
  private async processThinkingStep(
    step: string,
    userMessage: string,
  ): Promise<void> {
    // Get template for current step
    const templateKey = this.stepToTemplateKey(step);
    const template =
      this.config.thinkingTemplates[templateKey] ||
      `Think about ${step.replace(/-/g, " ")}`;

    // In a real implementation, this would call an LLM to generate the thought
    // For now, we'll simulate the thought generation
    const thought = `Simulated thought for ${step}: ${template} (based on "${userMessage}")`;

    // Update thought state
    this.thoughtState.currentStep = step;
    this.thoughtState.thoughts[step] = thought;
    this.thoughtState.completedSteps.push(step);
  }

  /**
   * Plan the next step based on thinking process
   * @param userMessage - User message context
   * @returns Planned next step
   */
  private planNextStep(userMessage: string): string {
    // In a real implementation, this would analyze the thoughts and determine next step
    // For now, we'll return a simulated next step
    return `Based on analysis of "${userMessage}", the next step is to implement a solution that addresses the core need.`;
  }

  /**
   * Convert step name to template key
   * @param step - Step name (kebab-case)
   * @returns Template key (camelCase)
   */
  private stepToTemplateKey(step: string): string {
    return step.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Save thinking state for debugging
   */
  private saveThinkingState(): void {
    try {
      const logDir = join(this.projectRoot, "logs");
      fs.ensureDirSync(logDir);
      fs.writeFileSync(
        path.join(logDir, "thinking-process.log"),
        JSON.stringify(this.thoughtState, null, 2),
      );
    } catch (error) {
      console.error("Failed to save thinking state:", error);
    }
  }

  /**
   * Creates a thinking process interceptor for message processing
   * @returns Function that intercepts messages and triggers thinking process
   */
  createThinkingInterceptor() {
    return async (
      message: string,
      processMessage: (_msg: string) => Promise<string>,
    ) => {
      if (this.config.immediateThoughtTrigger) {
        // Generate thinking process first
        const thinkingResult = await this.generateThinkingProcess(message);

        // Enhance message with thinking context
        const enhancedMessage = this.enhanceMessageWithThinking(
          message,
          thinkingResult,
        );

        // Process enhanced message
        return processMessage(enhancedMessage);
      }

      // If immediate thought trigger is disabled, process normally
      return processMessage(message);
    };
  }

  /**
   * Enhances user message with thinking context
   * @param message - Original user message
   * @param thinkingResult - Thinking process result
   * @returns Enhanced message with thinking context
   */
  private enhanceMessageWithThinking(
    message: string,
    thinkingResult: ThoughtProcessState,
  ): string {
    // Create a thinking context prefix
    const thinkingContext = `
[THINKING_CONTEXT]
${Object.entries(thinkingResult.thoughts)
  .map(([step, thought]) => `${step}: ${thought}`)
  .join("\n")}

Next planned step: ${thinkingResult.nextPlannedStep}
[/THINKING_CONTEXT]

`;

    return thinkingContext + message;
  }
}

/**
 * Creates a prompt injector with default configuration
 * @param projectRoot - Root directory of the project
 * @returns Prompt injector instance
 */
export function createPromptInjector(projectRoot: string): PromptInjection {
  return new PromptInjection(projectRoot);
}
