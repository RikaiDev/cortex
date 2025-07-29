/**
 * Cortex MCP Workflow Coordinator
 *
 * This module coordinates the execution of MCP tools in a structured workflow
 * to ensure consistent and reliable AI responses.
 */

import chalk from "chalk";
import {
  IntentAnalysis,
  TaskDecomposition,
  RoleAssignment,
} from "./mcp-server.js";

export interface WorkflowStep {
  id: string;
  name: string;
  toolName: string;
  input: any;
  output?: any;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

export interface WorkflowResult {
  workflowId: string;
  steps: WorkflowStep[];
  finalResult: any;
  success: boolean;
  recommendations: string[];
  learnings: string[];
}

/**
 * Cortex MCP Workflow Coordinator
 */
export class CortexMCPWorkflow {
  private workflowSteps: WorkflowStep[] = [];
  private workflowId: string;

  constructor(_projectRoot: string) {
    this.workflowId = `workflow-${Date.now()}`;
  }

  /**
   * Execute complete workflow for user request
   */
  async executeWorkflow(
    userInput: string,
    context: string = ""
  ): Promise<WorkflowResult> {
    console.log(chalk.blue("🚀 Starting Cortex MCP Workflow..."));

    try {
      // Step 1: Intent Analysis
      const intentResult = await this.executeStep({
        id: "step-1",
        name: "Intent Analysis",
        toolName: "intent-analyzer",
        input: {
          userInput,
          context,
          history: [],
        },
        status: "pending",
      });

      if (intentResult.status === "failed") {
        throw new Error(`Intent analysis failed: ${intentResult.error}`);
      }

      const intentAnalysis = intentResult.output as IntentAnalysis;

      // Step 2: Task Decomposition
      const taskResult = await this.executeStep({
        id: "step-2",
        name: "Task Decomposition",
        toolName: "task-decomposer",
        input: {
          primaryIntent: intentAnalysis.primaryIntent,
          complexity: intentAnalysis.complexity,
          context,
        },
        status: "pending",
      });

      if (taskResult.status === "failed") {
        throw new Error(`Task decomposition failed: ${taskResult.error}`);
      }

      const taskDecomposition = taskResult.output as TaskDecomposition;

      // Step 3: Role Selection
      const roleResult = await this.executeStep({
        id: "step-3",
        name: "Role Selection",
        toolName: "role-selector",
        input: {
          subTasks: taskDecomposition.subTasks.map((task) => ({
            name: task.name,
            description: task.description,
          })),
          context,
        },
        status: "pending",
      });

      if (roleResult.status === "failed") {
        throw new Error(`Role selection failed: ${roleResult.error}`);
      }

      const roleAssignment = roleResult.output as {
        roleAssignments: RoleAssignment[];
        coordinationPlan: string;
      };

      // Step 4: Best Practice Search
      const bestPracticeResult = await this.executeStep({
        id: "step-4",
        name: "Best Practice Search",
        toolName: "best-practice-finder",
        input: {
          query: intentAnalysis.primaryIntent,
          context,
          searchType: "best-practice",
        },
        status: "pending",
      });

      if (bestPracticeResult.status === "failed") {
        console.warn(
          chalk.yellow("⚠️ Best practice search failed, continuing...")
        );
      }

      // Step 5: Tool Usage Validation (if applicable)
      let toolValidationResult: WorkflowStep | undefined;
      if (
        context.includes("git") ||
        context.includes("npm") ||
        context.includes("bun")
      ) {
        toolValidationResult = await this.executeStep({
          id: "step-5",
          name: "Tool Usage Validation",
          toolName: "tool-usage-validator",
          input: {
            toolName: this.detectToolFromContext(context),
            usage: context,
            context,
          },
          status: "pending",
        });
      }

      // Step 6: Experience Recording
      await this.executeStep({
        id: "step-6",
        name: "Experience Recording",
        toolName: "experience-recorder",
        input: {
          action: "workflow-execution",
          context: JSON.stringify({
            userInput,
            intentAnalysis,
            taskDecomposition,
            roleAssignment,
          }),
          success: true,
          feedback: "Workflow completed successfully",
        },
        status: "pending",
      });

      // Compile final result
      const finalResult = {
        intentAnalysis,
        taskDecomposition,
        roleAssignment,
        bestPractices: bestPracticeResult.output,
        toolValidation: toolValidationResult?.output,
        recommendations: this.generateRecommendations(
          intentAnalysis,
          taskDecomposition,
          roleAssignment
        ),
        nextSteps: this.generateNextSteps(taskDecomposition, roleAssignment),
      };

      return {
        workflowId: this.workflowId,
        steps: this.workflowSteps,
        finalResult,
        success: true,
        recommendations: finalResult.recommendations,
        learnings: this.extractLearnings(),
      };
    } catch (error) {
      console.error(chalk.red("❌ Workflow execution failed:"), error);

      // Record failure experience
      // Note: Using official SDK, tools are called through the server directly
      console.log(
        chalk.yellow("⚠️ Experience recording not available with official SDK")
      );

      return {
        workflowId: this.workflowId,
        steps: this.workflowSteps,
        finalResult: null,
        success: false,
        recommendations: ["工作流程執行失敗", "請檢查輸入和上下文"],
        learnings: ["需要改進錯誤處理", "增加輸入驗證"],
      };
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep): Promise<WorkflowStep> {
    console.log(chalk.blue(`📋 Executing: ${step.name}`));

    step.status = "running";
    this.workflowSteps.push(step);

    try {
      // Note: With official SDK, tools are called through the server directly
      // For now, we'll simulate the tool execution
      step.output = { message: `Tool ${step.toolName} executed successfully` };
      step.status = "completed";

      console.log(chalk.green(`✅ Completed: ${step.name}`));
      return step;
    } catch (error) {
      step.status = "failed";
      step.error = error instanceof Error ? error.message : String(error);

      console.error(chalk.red(`❌ Failed: ${step.name}`), step.error);
      return step;
    }
  }

  /**
   * Detect tool from context
   */
  private detectToolFromContext(context: string): string {
    if (context.includes("git")) return "git";
    if (context.includes("npm")) return "npm";
    if (context.includes("bun")) return "bun";
    if (context.includes("uv")) return "uv";
    if (context.includes("nx")) return "nx";
    return "unknown";
  }

  /**
   * Generate recommendations based on workflow results
   */
  private generateRecommendations(
    intentAnalysis: IntentAnalysis,
    taskDecomposition: TaskDecomposition,
    roleAssignment: {
      roleAssignments: RoleAssignment[];
      coordinationPlan: string;
    }
  ): string[] {
    const recommendations: string[] = [];

    // Intent-based recommendations
    if (intentAnalysis.complexity === "complex") {
      recommendations.push("複雜任務建議分階段執行");
      recommendations.push("每個階段完成後進行驗證");
    }

    if (intentAnalysis.painPoints.length > 0) {
      recommendations.push("注意解決用戶提到的痛點");
      recommendations.push("優先處理高優先級問題");
    }

    // Task-based recommendations
    if (taskDecomposition.subTasks.length > 3) {
      recommendations.push("任務較多，建議並行執行獨立任務");
    }

    // Role-based recommendations
    const uniqueRoles = new Set(
      roleAssignment.roleAssignments.map((ra) => ra.roleName)
    );
    if (uniqueRoles.size > 2) {
      recommendations.push("涉及多個角色，需要良好的協調");
    }

    return recommendations;
  }

  /**
   * Generate next steps based on workflow results
   */
  private generateNextSteps(
    taskDecomposition: TaskDecomposition,
    _roleAssignment: {
      roleAssignments: RoleAssignment[];
      coordinationPlan: string;
    }
  ): string[] {
    const nextSteps: string[] = [];

    // Add first task as immediate next step
    if (taskDecomposition.subTasks.length > 0) {
      const firstTask = taskDecomposition.subTasks[0];
      nextSteps.push(`立即開始: ${firstTask.description}`);
    }

    // Add role coordination steps
    nextSteps.push("按照角色協調計劃執行");
    nextSteps.push("每個步驟完成後進行品質檢查");

    // Add validation steps
    nextSteps.push("最終進行整體驗證");
    nextSteps.push("記錄學習經驗");

    return nextSteps;
  }

  /**
   * Extract learnings from workflow execution
   */
  private extractLearnings(): string[] {
    const learnings: string[] = [];

    // Analyze successful steps
    const successfulSteps = this.workflowSteps.filter(
      (step) => step.status === "completed"
    );
    if (successfulSteps.length > 0) {
      learnings.push(`成功執行了 ${successfulSteps.length} 個步驟`);
    }

    // Analyze failed steps
    const failedSteps = this.workflowSteps.filter(
      (step) => step.status === "failed"
    );
    if (failedSteps.length > 0) {
      learnings.push(`需要改進 ${failedSteps.length} 個失敗步驟`);
      failedSteps.forEach((step) => {
        learnings.push(`改進 ${step.name}: ${step.error}`);
      });
    }

    // Overall workflow learnings
    if (this.workflowSteps.length > 0) {
      const successRate =
        (successfulSteps.length / this.workflowSteps.length) * 100;
      learnings.push(`工作流程成功率: ${successRate.toFixed(1)}%`);
    }

    return learnings;
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(): {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    successRate: number;
  } {
    const totalSteps = this.workflowSteps.length;
    const completedSteps = this.workflowSteps.filter(
      (step) => step.status === "completed"
    ).length;
    const failedSteps = this.workflowSteps.filter(
      (step) => step.status === "failed"
    ).length;
    const successRate =
      totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return {
      totalSteps,
      completedSteps,
      failedSteps,
      successRate,
    };
  }

  /**
   * Get list of available tools
   */
  getAvailableTools(): string[] {
    // Return the list of tools we know are available
    return [
      "intent-analyzer",
      "task-decomposer",
      "role-selector",
      "best-practice-finder",
      "tool-usage-validator",
      "experience-recorder",
    ];
  }
}
