/**
 * Simple Configuration Manager - Linus Torvalds' Simplicity Obsession
 *
 * **I am Linus Torvalds**. I don't believe in complex systems. This is a simple
 * configuration manager that stores and retrieves project-specific settings.
 *
 * If you need more than 3 levels of indentation, you're doing it wrong.
 * If your code is complex, simplify it.
 * If you can't understand it in 5 minutes, rewrite it.
 */

import {
  MCPWorkflow as IMCPWorkflow,
  ToolResult,
  ToolParameters,
} from "../common/types.js";
import fs from "fs-extra";
import path from "path";

/**
 * Simple configuration storage interface
 */
export interface ConfigStorage {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}

/**
 * Simple configuration manager - no complex workflows, just get/set
 */
export class MCPWorkflow implements IMCPWorkflow {
  private configPath: string;
  private registeredTools: Map<
    string,
    (params: ToolParameters) => Promise<ToolResult>
  > = new Map();

  constructor(projectRoot: string) {
    this.configPath = path.join(projectRoot, ".cortex", "config.json");
    this.ensureConfigDirectory();
  }

  private async ensureConfigDirectory(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
    } catch (error) {
      console.warn("Failed to create config directory:", error);
    }
  }

  /**
   * Get configuration value
   */
  async getConfig(key: string): Promise<unknown> {
    try {
      const config = await fs.readJson(this.configPath);
      return config[key];
    } catch {
      return null;
    }
  }

  /**
   * Set configuration value
   */
  async setConfig(key: string, value: unknown): Promise<void> {
    try {
      let config: Record<string, unknown> = {};
      try {
        config = await fs.readJson(this.configPath);
      } catch {
        // Config doesn't exist, that's fine
      }

      config[key] = value;
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJson(this.configPath, config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  /**
   * Register a tool
   */
  registerTool(
    toolName: string,
    handler: (params: ToolParameters) => Promise<ToolResult>
  ): void {
    this.registeredTools.set(toolName, handler);
  }

  /**
   * Get available tools
   */
  getAvailableTools(): string[] {
    return Array.from(this.registeredTools.keys());
  }

  /**
   * Execute tool
   */
  async executeTool(
    toolName: string,
    params: ToolParameters
  ): Promise<ToolResult> {
    try {
      // Check if tool is registered
      const registeredHandler = this.registeredTools.get(toolName);
      if (registeredHandler) {
        return await registeredHandler(params);
      }

      // Fallback to built-in tools
      switch (toolName) {
        case "getConfig": {
          const configValue = await this.getConfig(params.key as string);
          return { success: true, data: configValue };
        }
        case "setConfig": {
          await this.setConfig(params.key as string, params.value);
          return { success: true };
        }
        case "experience-recorder": {
          // Simple experience recording - just log and return success
          console.log(`Experience recorded: ${params.action || "unknown"}`);
          return { success: true, data: { recorded: true } };
        }
        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Check if configuration exists
   */
  async hasConfig(key: string): Promise<boolean> {
    const value = await this.getConfig(key);
    return value !== null;
  }

  /**
   * Delete configuration
   */
  async deleteConfig(key: string): Promise<void> {
    try {
      let config: Record<string, unknown> = {};
      try {
        config = await fs.readJson(this.configPath);
      } catch {
        // Config doesn't exist, nothing to delete
        return;
      }

      delete config[key];
      await fs.writeJson(this.configPath, config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to delete config: ${error}`);
    }
  }

  /**
   * Get all configuration keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const config = await fs.readJson(this.configPath);
      return Object.keys(config);
    } catch {
      return [];
    }
  }

  /**
   * Execute workflow with basic intent analysis
   */
  async executeWorkflow(
    userInput: string,
    context?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simple intent analysis based on keywords
    const intentAnalysis = this.analyzeIntent(userInput);

    // Create basic workflow steps
    const steps = [
      {
        id: "1",
        name: "Analyze Input",
        content: `Analyzed user input: "${userInput}"`,
        status: "completed",
      },
      {
        id: "2",
        name: "Determine Intent",
        content: `Primary intent: ${intentAnalysis.primaryIntent}`,
        status: "completed",
      },
    ];

    // Generate recommendations based on intent
    const recommendations = this.generateRecommendations(intentAnalysis);

    return {
      workflowId,
      success: true,
      steps,
      recommendations,
      finalResult: {
        intentAnalysis,
        originalInput: userInput,
        context: context || {},
      },
    };
  }

  /**
   * Generate recommendations based on intent analysis
   */
  private generateRecommendations(intentAnalysis: {
    primaryIntent: string;
    complexity: string;
    painPoints: string[];
  }): string[] {
    const recommendations: string[] = [];

    switch (intentAnalysis.primaryIntent) {
      case "help_request":
        recommendations.push("Check the documentation first");
        recommendations.push("Search for similar issues in the repository");
        recommendations.push("Ask specific questions about the problem");
        break;

      case "bug_report":
        recommendations.push("Provide detailed steps to reproduce");
        recommendations.push("Include error messages and stack traces");
        recommendations.push(
          "Mention your environment (OS, Node version, etc.)"
        );
        break;

      case "feature_request":
        recommendations.push("Describe the use case clearly");
        recommendations.push("Explain why this feature would be valuable");
        recommendations.push("Consider alternative solutions");
        break;

      default:
        recommendations.push("Provide more context about your question");
        recommendations.push("Be specific about what you need help with");
        break;
    }

    return recommendations;
  }

  /**
   * Simple intent analysis based on keywords
   */
  private analyzeIntent(input: string): {
    primaryIntent: string;
    complexity: string;
    painPoints: string[];
  } {
    const lowerInput = input.toLowerCase();

    // Simple keyword-based intent detection
    if (lowerInput.includes("help") || lowerInput.includes("how")) {
      return {
        primaryIntent: "help_request",
        complexity: "low",
        painPoints: ["learning_curve"],
      };
    }

    if (lowerInput.includes("error") || lowerInput.includes("bug")) {
      return {
        primaryIntent: "bug_report",
        complexity: "medium",
        painPoints: ["technical_issue"],
      };
    }

    if (lowerInput.includes("feature") || lowerInput.includes("add")) {
      return {
        primaryIntent: "feature_request",
        complexity: "high",
        painPoints: ["missing_functionality"],
      };
    }

    return {
      primaryIntent: "general_inquiry",
      complexity: "low",
      painPoints: [],
    };
  }

  /**
   * Get workflow status (simple stub for compatibility)
   */
  getWorkflowStatus(): {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    successRate: number;
  } {
    return { totalSteps: 0, completedSteps: 0, failedSteps: 0, successRate: 0 };
  }

  /**
   * Get registered tools (for backward compatibility)
   */
  getRegisteredTools(): string[] {
    return ["getConfig", "setConfig", "experience-recorder"];
  }
}
