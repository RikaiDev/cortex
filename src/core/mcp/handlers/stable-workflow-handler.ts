/**
 * Stable Workflow Handler
 *
 * Handles cortex.* tools for the stable workflow system
 * (spec, plan, tasks, implement, context, learn)
 *
 * Note: This file serves as a minimal router that delegates to specialized handlers.
 * The handlers below are organized by domain for better maintainability.
 */

// These services are referenced in template strings sent to AI, not directly used in code
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ChecklistGenerator } from "../services/checklist-generator.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ContextManager } from "../services/context-manager.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { GitignoreValidator } from "../services/gitignore-validator.js";

import { CheckpointHandler } from "./checkpoint/checkpoint-handler.js";
import { MemoryHandler } from "./memory/memory-handler.js";
import { SpecHandler } from "./workflow/spec-handler.js";
import { PlanningHandler } from "./workflow/planning-handler.js";
import { ExecutionHandler } from "./workflow/execution-handler.js";
import { StatusHandler } from "./workflow/status-handler.js";
import { TaskValidator } from "./validation/task-validator.js";
import { ImplementationValidatorHandler } from "./validation/implementation-validator-handler.js";
import { ReleaseHandler } from "./project/release-handler.js";
import { OnboardHandler } from "./project/onboard-handler.js";
import { ConstitutionHandler } from "./project/constitution-handler.js";
import { DangerZoneHandler } from "./project/danger-zone-handler.js";
import { EnvironmentHandler } from "./project/environment-handler.js";
import { DependencyHandler } from "./project/dependency-handler.js";
import type {
  MCPToolResult,
  WorkflowToolArgs,
  MemoryToolArgs,
} from "../types/mcp-types.js";
import type { CheckpointFile } from "../types/checkpoint.js";

export class StableWorkflowHandler {
  // Delegated handlers (refactored architecture)
  private checkpointHandler: CheckpointHandler;
  private memoryHandler: MemoryHandler;
  private specHandler: SpecHandler;
  private planningHandler: PlanningHandler;
  private executionHandler: ExecutionHandler;
  private statusHandler: StatusHandler;
  private taskValidator: TaskValidator;
  private implementationValidatorHandler: ImplementationValidatorHandler;
  private releaseHandler: ReleaseHandler;
  private onboardHandler: OnboardHandler;
  private constitutionHandler: ConstitutionHandler;
  private dangerZoneHandler: DangerZoneHandler;
  private environmentHandler: EnvironmentHandler;
  private dependencyHandler: DependencyHandler;

  constructor(private projectRoot: string) {
    // Initialize delegated handlers
    this.checkpointHandler = new CheckpointHandler(projectRoot);
    this.memoryHandler = new MemoryHandler(projectRoot);
    this.specHandler = new SpecHandler(projectRoot);
    this.planningHandler = new PlanningHandler(projectRoot);
    this.executionHandler = new ExecutionHandler(projectRoot);
    this.statusHandler = new StatusHandler(projectRoot);
    this.taskValidator = new TaskValidator();
    this.implementationValidatorHandler = new ImplementationValidatorHandler(
      projectRoot
    );
    this.releaseHandler = new ReleaseHandler(projectRoot);
    this.onboardHandler = new OnboardHandler(projectRoot);
    this.constitutionHandler = new ConstitutionHandler(projectRoot);
    this.dangerZoneHandler = new DangerZoneHandler(projectRoot);
    this.environmentHandler = new EnvironmentHandler(projectRoot);
    this.dependencyHandler = new DependencyHandler(projectRoot);
  }

  /**
   * Unified workflow handler - routes to phase-specific handlers
   */
  async handleWorkflow(args: WorkflowToolArgs): Promise<MCPToolResult> {
    const { phase, workflowId } = args;

    switch (phase) {
      case "clarify":
        return this.handleClarify({ workflowId });
      case "plan":
        return this.handlePlan({ workflowId });
      case "review":
        return this.handleReview({ workflowId });
      case "tasks":
        return this.handleTasks({ workflowId });
      case "implement":
        return this.handleImplement({ workflowId });
      case "status":
        return this.handleStatus({ workflowId });
      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown workflow phase: ${phase}. Valid phases: clarify, plan, review, tasks, implement, status`,
            },
          ],
          isError: true,
        };
    }
  }

  /**
   * Unified memory handler - routes to action-specific handlers
   */
  async handleMemory(args: MemoryToolArgs): Promise<MCPToolResult> {
    switch (args.action) {
      case "learn":
        return this.handleLearn({
          title: args.title,
          content: args.content,
          type: args.type,
          tags: args.tags,
        });
      case "context":
        return this.handleContext({ query: args.query });
      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown memory action. Valid actions: learn, context`,
            },
          ],
          isError: true,
        };
    }
  }

  /**
   * Handle cortex.spec - Create feature specification
   * @deprecated Delegated to SpecHandler
   */
  async handleSpec(args: { description: string }): Promise<MCPToolResult> {
    return this.specHandler.handleSpec(args);
  }

  /**
   * Handle clarify - Resolve specification ambiguities
   * @deprecated Delegated to SpecHandler
   */
  async handleClarify(args: { workflowId?: string }): Promise<MCPToolResult> {
    return this.specHandler.handleClarify(args);
  }

  /**
   * Handle plan - Create implementation plan
   * @deprecated Delegated to PlanningHandler
   */
  async handlePlan(args: { workflowId?: string }): Promise<MCPToolResult> {
    return this.planningHandler.handlePlan(args);
  }

  /**
   * Handle review - Technical review of implementation plan
   * @deprecated Delegated to PlanningHandler
   */
  async handleReview(args: { workflowId?: string }): Promise<MCPToolResult> {
    return this.planningHandler.handleReview(args);
  }

  /**
   * Handle tasks - Generate task breakdown
   * @deprecated Delegated to ExecutionHandler
   */
  async handleTasks(args: { workflowId?: string }): Promise<MCPToolResult> {
    return this.executionHandler.handleTasks(args);
  }

  /**
   * Handle implement - Execute implementation
   * @deprecated Delegated to ExecutionHandler
   */
  async handleImplement(args: { workflowId?: string }): Promise<MCPToolResult> {
    return this.executionHandler.handleImplement(args);
  }

  /**
   * Handle task decomposition - Break down a large task into smaller subtasks
   * @deprecated Delegated to TaskValidator
   */
  async handleTaskDecomposition(args: {
    workflowId: string;
    taskId: string;
    taskDescription: string;
  }): Promise<MCPToolResult> {
    return this.taskValidator.handleTaskDecomposition(args);
  }

  /**
   * Handle implementation validation - Check for mocks, TODOs, unused code
   * @deprecated Delegated to ImplementationValidatorHandler
   */
  async handleImplementationValidation(args: {
    changedFiles: string[];
  }): Promise<MCPToolResult> {
    return this.implementationValidatorHandler.handleImplementationValidation(
      args
    );
  }

  /**
   * Handle cortex.context - Enhance context from memory
   * @deprecated Delegated to MemoryHandler
   */
  async handleContext(args: { query: string }): Promise<MCPToolResult> {
    return this.memoryHandler.handleContext(args);
  }

  /**
   * Handle cortex.correct - Record correction to prevent future mistakes
   * @deprecated Delegated to MemoryHandler
   */
  async handleCorrect(args: {
    wrongBehavior: string;
    correctBehavior: string;
    severity?: string;
    filePatterns?: string[];
    triggerKeywords?: string[];
  }): Promise<MCPToolResult> {
    return this.memoryHandler.handleCorrect(args);
  }

  /**
   * Handle cortex.learn - Record experience to memory
   * @deprecated Delegated to MemoryHandler
   */
  async handleLearn(args: {
    title: string;
    content: string;
    type: string;
    tags?: string[];
  }): Promise<MCPToolResult> {
    return this.memoryHandler.handleLearn(args);
  }

  /**
   * Handle status - Get workflow status
   * @deprecated Delegated to StatusHandler
   */
  async handleStatus(args: { workflowId?: string }): Promise<MCPToolResult> {
    return this.statusHandler.handleStatus(args);
  }

  /**
   * Handle list - List workflows
   * @deprecated Delegated to StatusHandler
   */
  async handleList(args: { limit?: number }): Promise<MCPToolResult> {
    return this.statusHandler.handleList(args);
  }

  /**
   * Handle release - Analyze changes and generate release documentation
   * @deprecated Delegated to ReleaseHandler
   */
  async handleRelease(args: {
    version?: string;
    tag?: boolean;
    push?: boolean;
  }): Promise<MCPToolResult> {
    return this.releaseHandler.handleRelease(args);
  }

  /**
   * Handle onboard - Interactive onboarding for first-time users
   * @deprecated Delegated to OnboardHandler
   */
  async handleOnboard(): Promise<MCPToolResult> {
    return this.onboardHandler.handleOnboard();
  }

  /**
   * Handle constitution - Create or update project constitution
   * @deprecated Delegated to ConstitutionHandler
   */
  async handleConstitution(args: { updates?: string }): Promise<MCPToolResult> {
    return this.constitutionHandler.handleConstitution(args);
  }

  /**
   * Handle mark-danger - Mark a code region as protected
   * @deprecated Delegated to DangerZoneHandler
   */
  async handleMarkDanger(args: {
    file: string;
    startLine?: number;
    endLine?: number;
    reason: string;
  }): Promise<MCPToolResult> {
    return this.dangerZoneHandler.handleMarkDanger(args);
  }

  /**
   * Handle unmark-danger - Remove protection from a code region
   * @deprecated Delegated to DangerZoneHandler
   */
  async handleUnmarkDanger(args: {
    file: string;
    line?: number;
  }): Promise<MCPToolResult> {
    return this.dangerZoneHandler.handleUnmarkDanger(args);
  }

  /**
   * Handle list-dangers - List all protected danger zones
   * @deprecated Delegated to DangerZoneHandler
   */
  async handleListDangers(): Promise<MCPToolResult> {
    return this.dangerZoneHandler.handleListDangerZones();
  }

  /**
   * Handle environment-detect - Auto-detect environments from project files
   * @deprecated Delegated to EnvironmentHandler
   */
  async handleEnvironmentDetect(): Promise<MCPToolResult> {
    return this.environmentHandler.handleDetectEnvironments();
  }

  /**
   * Handle environment-add - Add or update environment profile
   * @deprecated Delegated to EnvironmentHandler
   */
  async handleEnvironmentAdd(args: {
    name: string;
    description?: string;
    nodeVersion?: string;
    envVarsMissing?: string[];
    constraints?: string[];
  }): Promise<MCPToolResult> {
    return this.environmentHandler.handleAddEnvironment(args);
  }

  /**
   * Handle environment-remove - Remove environment profile
   * @deprecated Delegated to EnvironmentHandler
   */
  async handleEnvironmentRemove(args: { name: string }): Promise<MCPToolResult> {
    return this.environmentHandler.handleRemoveEnvironment(args);
  }

  /**
   * Handle environment-list - List all environment profiles
   * @deprecated Delegated to EnvironmentHandler
   */
  async handleEnvironmentList(): Promise<MCPToolResult> {
    return this.environmentHandler.handleListEnvironments();
  }

  /**
   * Handle environment-check - Check code compatibility with environments
   * @deprecated Delegated to EnvironmentHandler
   */
  async handleEnvironmentCheck(args: {
    files: string[];
  }): Promise<MCPToolResult> {
    return this.environmentHandler.handleCheckCompatibility(args);
  }

  /**
   * Handle dependency-analyze - Analyze all project dependencies
   * @deprecated Delegated to DependencyHandler
   */
  async handleDependencyAnalyze(): Promise<MCPToolResult> {
    return this.dependencyHandler.handleAnalyzeDependencies();
  }

  /**
   * Handle dependency-check - Check dependency compatibility
   * @deprecated Delegated to DependencyHandler
   */
  async handleDependencyCheck(args: {
    files: string[];
  }): Promise<MCPToolResult> {
    return this.dependencyHandler.handleCheckCompatibility(args);
  }

  /**
   * Handle dependency-version - Get version of a specific dependency
   * @deprecated Delegated to DependencyHandler
   */
  async handleDependencyVersion(args: {
    package: string;
  }): Promise<MCPToolResult> {
    return this.dependencyHandler.handleGetVersion(args);
  }

  /**
   * Handle dependency-suggest - Suggest compatibility for adding new dependency
   * @deprecated Delegated to DependencyHandler
   */
  async handleDependencySuggest(args: {
    package: string;
    version?: string;
  }): Promise<MCPToolResult> {
    return this.dependencyHandler.handleSuggestDependency(args);
  }

  /**
   * Handle checkpoint-save - Save task progress
   * @deprecated Delegated to CheckpointHandler
   */
  async handleCheckpointSave(args: {
    taskDescription: string;
    completed?: CheckpointFile[];
    pending?: CheckpointFile[];
    context?: string;
    nextStep?: string;
    workflowId?: string;
  }): Promise<MCPToolResult> {
    return this.checkpointHandler.handleCheckpointSave(args);
  }

  /**
   * Handle checkpoint-resume - Resume from checkpoint
   * @deprecated Delegated to CheckpointHandler
   */
  async handleCheckpointResume(args: {
    checkpointId?: string;
  }): Promise<MCPToolResult> {
    return this.checkpointHandler.handleCheckpointResume(args);
  }

  /**
   * Handle checkpoint-list - List saved checkpoints
   * @deprecated Delegated to CheckpointHandler
   */
  async handleCheckpointList(args: { limit?: number }): Promise<MCPToolResult> {
    return this.checkpointHandler.handleCheckpointList(args);
  }

  /**
   * Handle checkpoint-clear - Clear checkpoint(s)
   * @deprecated Delegated to CheckpointHandler
   */
  async handleCheckpointClear(args: {
    checkpointId?: string;
  }): Promise<MCPToolResult> {
    return this.checkpointHandler.handleCheckpointClear(args);
  }
}
