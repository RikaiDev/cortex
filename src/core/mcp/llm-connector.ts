/**
 * LLM Connector - Handles interaction with LLMs
 * Linus: Keep it simple, one job per file
 */

import { ProjectAnalyzer } from "../project/project-analyzer.js";
import { MCPContextTools } from "./mcp-context-tools.js";
import { MCPWorkflow } from "./mcp-workflow.js";
import { DiagnosticEngine, DiagnosticResult } from "./diagnostic.js";
import { QueryParser, ParsedQuery } from "./parse.js";
import { TaskEnhancer, EnhancedTask } from "../project/task-enhancer.js";

interface LLMRequest {
  query: string;
  context?: Record<string, unknown>;
  projectId?: string;
}

interface LLMResponse {
  content: string;
  context?: Record<string, unknown>;
  diagnostic?: DiagnosticResult;
  experiences?: unknown[];
}

/**
 * LLM Connector - Handles interaction with LLMs
 */
export class LLMConnector {
  private projectAnalyzer: ProjectAnalyzer;
  private contextTools: MCPContextTools;
  private workflow: MCPWorkflow;
  private diagnosticEngine: DiagnosticEngine;
  private queryParser: QueryParser;
  private taskEnhancer: TaskEnhancer;

  constructor(projectRoot: string) {
    this.projectAnalyzer = new ProjectAnalyzer(projectRoot);
    this.workflow = new MCPWorkflow(projectRoot);
    this.contextTools = new MCPContextTools(this.workflow, projectRoot);
    this.diagnosticEngine = new DiagnosticEngine();
    this.queryParser = new QueryParser(this.contextTools);
    this.taskEnhancer = new TaskEnhancer(projectRoot);
    this.taskEnhancer.setContextTools(this.contextTools);
    this.initialize();
  }

  /**
   * Initialize the connector
   */
  private async initialize(): Promise<void> {
    try {
      await this.taskEnhancer.initialize();
    } catch (error) {
      console.warn("Failed to initialize task enhancer:", error);
    }
  }

  /**
   * Process requests from LLM
   */
  async processRequest(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Parse the query
      const parsedQuery = this.queryParser.parse(request.query);

      // Check if this is a simple task that needs enhancement
      if (this.shouldEnhanceTask(request.query, parsedQuery)) {
        return await this.handleEnhancedTaskRequest(request.query);
      }

      // Handle based on query type
      switch (parsedQuery.intent) {
        case "diagnostic":
          return await this.handleDiagnosticRequest(parsedQuery);
        case "context":
          return await this.handleContextRequest(parsedQuery);
        case "experience":
          return await this.handleExperienceRequest(parsedQuery);
        default:
          return await this.handleDefaultRequest(
            request.query,
            request.context
          );
      }
    } catch (error) {
      console.error("Error processing LLM request:", error);
      return {
        content: `Error processing request: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Handle diagnostic requests
   */
  private async handleDiagnosticRequest(
    parsedQuery: ParsedQuery
  ): Promise<LLMResponse> {
    // Analyze project to get context
    const projectAnalysis = await this.projectAnalyzer.analyzeProject();

    // Generate diagnostic result
    const diagnostic = this.diagnosticEngine.diagnose(
      parsedQuery.description,
      parsedQuery.component,
      parsedQuery.technology,
      {
        framework: projectAnalysis.framework || "unknown",
        dependencies: projectAnalysis.architecture?.dependencies || [],
        patterns: projectAnalysis.patterns.map((p) => p.name) || [],
        conventions: {},
      }
    );

    // Record experience
    await this.recordExperience({
      userInput: parsedQuery.description,
      response: diagnostic.diagnosticPrompt || "",
      timestamp: new Date().toISOString(),
      tags: [
        `intent:${parsedQuery.intent}`,
        parsedQuery.technology ? `tech:${parsedQuery.technology}` : undefined,
      ].filter((tag): tag is string => tag !== undefined),
    });

    return {
      content: diagnostic.diagnosticPrompt || "Diagnostic analysis completed",
      context: projectAnalysis as unknown as Record<string, unknown>,
      diagnostic,
    };
  }

  /**
   * Handle context requests
   */
  private async handleContextRequest(
    parsedQuery: ParsedQuery
  ): Promise<LLMResponse> {
    // Analyze project to get context
    const projectAnalysis = await this.projectAnalyzer.analyzeProject();

    // Build context response
    const responseContent = this.buildContextResponse(
      projectAnalysis,
      parsedQuery
    );

    // Record experience
    await this.recordExperience({
      userInput: parsedQuery.description,
      response: responseContent,
      timestamp: new Date().toISOString(),
      tags: [
        `intent:${parsedQuery.intent}`,
        parsedQuery.contextType
          ? `context:${parsedQuery.contextType}`
          : undefined,
      ].filter((tag): tag is string => tag !== undefined),
    });

    return {
      content: responseContent,
      context: projectAnalysis as unknown as Record<string, unknown>,
    };
  }

  /**
   * Handle experience requests
   */
  private async handleExperienceRequest(
    parsedQuery: ParsedQuery
  ): Promise<LLMResponse> {
    // Get relevant experiences from experience library
    // Note: This would need to be implemented in MCPContextTools
    const experienceResult = {
      output: "Experience data would be retrieved here",
      success: true,
    };

    // Record experience query
    await this.recordExperience({
      userInput: parsedQuery.description,
      response: experienceResult.output,
      timestamp: new Date().toISOString(),
      tags: [
        `intent:${parsedQuery.intent}`,
        parsedQuery.technology ? `tech:${parsedQuery.technology}` : undefined,
      ].filter((tag): tag is string => tag !== undefined),
    });

    return {
      content: experienceResult.output,
      experiences: [], // Simplified handling, would parse experience data in actual implementation
    };
  }

  /**
   * Handle default requests
   */
  private async handleDefaultRequest(
    query: string,
    context?: Record<string, unknown>
  ): Promise<LLMResponse> {
    // Analyze project to get context
    const projectAnalysis = await this.projectAnalyzer.analyzeProject();

    // Build comprehensive response
    const responseContent = this.buildComprehensiveResponse(
      query,
      projectAnalysis
    );

    // Record experience
    await this.recordExperience({
      userInput: query,
      response: responseContent,
      timestamp: new Date().toISOString(),
      tags: ["intent:general"],
    });

    return {
      content: responseContent,
      context: context
        ? { ...context, ...projectAnalysis }
        : (projectAnalysis as unknown as Record<string, unknown>),
    };
  }

  /**
   * Build context response
   */
  private buildContextResponse(
    projectAnalysis: import("../project/project-analyzer.js").ProjectAnalysis,
    parsedQuery: ParsedQuery
  ): string {
    let response = `# Project Context Analysis

`;

    response += `## Query Context
`;
    response += `Intent: ${parsedQuery.intent}
`;
    response += `Component: ${parsedQuery.component || "General"}
`;
    response += `Technology: ${parsedQuery.technology || "Not specified"}
`;
    response += `Description: ${parsedQuery.description}

`;

    response += `## Project Information
`;
    response += `Name: ${projectAnalysis.structure?.name || "Unknown"}
`;
    response += `Type: ${projectAnalysis.projectType || "Unknown"}
`;
    response += `Framework: ${projectAnalysis.framework || "Unknown"}

`;

    if (projectAnalysis.architecture?.dependencies?.length) {
      response += `## Dependencies
`;
      projectAnalysis.architecture.dependencies
        .slice(0, 10)
        .forEach((dep: string) => {
          response += `- ${dep}
`;
        });
      response += `
`;
    }

    if (projectAnalysis.patterns?.length) {
      response += `## Code Patterns
`;
      projectAnalysis.patterns
        .slice(0, 5)
        .forEach(
          (pattern: import("../project/project-analyzer.js").CodePattern) => {
            response += `- ${pattern.name}: ${pattern.description}
`;
          }
        );
      response += `
`;
    }

    return response;
  }

  /**
   * Build comprehensive response
   */
  private buildComprehensiveResponse(
    query: string,
    projectAnalysis: import("../project/project-analyzer.js").ProjectAnalysis
  ): string {
    let response = `# Comprehensive Analysis

`;

    response += `## Query
${query}

`;

    response += `## Project Overview
`;
    response += `Name: ${projectAnalysis.structure?.name || "Unknown"}
`;
    response += `Type: ${projectAnalysis.projectType || "Unknown"}
`;
    response += `Framework: ${projectAnalysis.framework || "Unknown"}

`;

    if (projectAnalysis.architecture?.dependencies?.length) {
      response += `## Key Dependencies
`;
      projectAnalysis.architecture.dependencies
        .slice(0, 5)
        .forEach((dep: string) => {
          response += `- ${dep}
`;
        });
      response += `
`;
    }

    return response;
  }

  /**
   * Check if a task should be enhanced
   */
  private shouldEnhanceTask(query: string, parsedQuery: ParsedQuery): boolean {
    // Check if this is a simple task instruction that needs enhancement
    const simpleTaskKeywords = [
      "implement",
      "create",
      "build",
      "add",
      "fix",
      "update",
      "change",
      "實現",
      "創建",
      "建立",
      "新增",
      "修復",
      "更新",
      "修改",
    ];

    const lowerQuery = query.toLowerCase();
    const hasSimpleTaskKeyword = simpleTaskKeywords.some((keyword) =>
      lowerQuery.includes(keyword)
    );

    // If this is a simple task instruction without detailed context, enhancement is needed
    if (hasSimpleTaskKeyword && query.length < 100) {
      return true;
    }

    // Use parsedQuery information for better enhancement decision
    // If intent is task_enhancement, always enhance
    if (parsedQuery.intent === "task_enhancement") {
      return true;
    }

    // If component is specified but description is too brief, enhance
    if (parsedQuery.component && parsedQuery.description.length < 50) {
      return true;
    }

    // If user explicitly requests task enhancement
    if (
      lowerQuery.includes("enhance") ||
      lowerQuery.includes("expand") ||
      lowerQuery.includes("詳細")
    ) {
      return true;
    }

    return false;
  }

  /**
   * Handle enhanced task requests
   */
  private async handleEnhancedTaskRequest(query: string): Promise<LLMResponse> {
    try {
      // Enhance the task
      const enhancedTask = await this.taskEnhancer.enhanceTask(query);

      // Format the enhanced task for readable output
      const formattedContent = this.formatEnhancedTask(enhancedTask);

      // 記錄經驗
      await this.recordExperience({
        userInput: query,
        response: formattedContent,
        timestamp: new Date().toISOString(),
        tags: ["intent:task_enhancement"],
      });

      return {
        content: formattedContent,
        context: {
          enhancedTask,
          originalQuery: query,
          suggestedRole: enhancedTask.suggestedRole,
        },
      };
    } catch (error) {
      console.error("Error handling enhanced task request:", error);
      return {
        content: `Task enhancement failed: ${error instanceof Error ? error.message : String(error)}\n\nOriginal query: ${query}`,
      };
    }
  }

  /**
   * Format enhanced task for display
   */
  private formatEnhancedTask(task: EnhancedTask): string {
    let output = `# 🤖 Cortex AI - Task Enhancement Results\n\n`;
    output += `**Original Query:** "${task.originalQuery}"\n\n`;

    // Role Setting
    output += `## 🎭 Role Setting\n\n`;
    output += `**Suggested Role:** ${task.suggestedRole}\n\n`;

    if (task.roleSetting.requiredRoles.length > 0) {
      output += `**Available Roles:**\n`;
      task.roleSetting.requiredRoles.forEach((role) => {
        output += `- ${role.name}: ${role.description}\n`;
      });
      output += `\n`;
    }

    output += `**Required Domain Knowledge:**\n`;
    task.roleSetting.domainKnowledge.forEach((knowledge) => {
      output += `- ${knowledge}\n`;
    });
    output += `\n**Expertise Level:** ${task.roleSetting.expertiseLevel}\n\n`;

    // Task details
    output += `## 🎯 Task Objectives\n\n`;
    output += `**Primary Objective:** ${task.task.primaryObjective}\n\n`;

    output += `**Sub-tasks:**\n`;
    task.task.subTasks.forEach((subTask, index) => {
      output += `${index + 1}. ${subTask}\n`;
    });
    output += `\n**Success Criteria:**\n`;
    task.task.successCriteria.forEach((criteria) => {
      output += `- ${criteria}\n`;
    });
    output += `\n**Estimated Complexity:** ${task.task.estimatedComplexity}\n\n`;

    // Context information
    output += `## 📋 Task Context\n\n`;
    output += `**Project Background:** ${task.context.projectBackground}\n\n`;

    if (task.context.constraints.length > 0) {
      output += `**Constraints:**\n`;
      task.context.constraints.forEach((constraint) => {
        output += `- ${constraint}\n`;
      });
      output += `\n`;
    }

    if (task.context.stakeholders.length > 0) {
      output += `**Stakeholders:** ${task.context.stakeholders.join(", ")}\n\n`;
    }

    if (task.context.dependencies.length > 0) {
      output += `**Key Dependencies:** ${task.context.dependencies.join(", ")}\n\n`;
    }

    // Output format
    output += `## 📝 Output Format\n\n`;
    output += `**Output Type:** ${task.format.outputType}\n`;
    output += `**Language:** ${task.format.language}\n`;
    output += `**Detail Level:** ${task.format.detailLevel}\n\n`;

    if (task.format.structure.length > 0) {
      output += `**Suggested Structure:**\n`;
      task.format.structure.forEach((section, index) => {
        output += `${index + 1}. ${section}\n`;
      });
      output += `\n`;
    }

    // Enhancement process information
    output += `## 🔍 Enhancement Analysis\n\n`;
    output += `**Confidence Score:** ${(task.confidenceScore * 100).toFixed(1)}%\n\n`;
    output += `**Enhancement Reasoning:**\n`;
    task.enhancementReasoning.forEach((reasoning) => {
      output += `- ${reasoning}\n`;
    });
    output += `\n`;

    output += `---\n`;
    output += `*Enhancement Time: ${new Date(task.timestamp).toLocaleString("zh-TW")}*\n`;

    return output;
  }

  /**
   * Record experience
   */
  private async recordExperience(
    experienceData: import("./types.js").Experience
  ): Promise<void> {
    try {
      // Note: This would need to be implemented in MCPContextTools
      console.log("Recording experience:", experienceData.userInput);
    } catch (error) {
      console.error("Failed to record experience:", error);
    }
  }
}
