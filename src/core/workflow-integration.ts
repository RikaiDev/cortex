/**
 * Workflow Integration Module
 *
 * Integrates Multi-Role Pattern workflow management with existing Cortex AI system
 * Uses existing role definitions from .cortex/roles/ directory
 * Adds workflow state management and handoff mechanisms
 */

import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { CortexCore } from "./index.js";

/**
 * Workflow execution record
 */
export interface WorkflowExecution {
  id: string;
  roleId: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  startTime: string;
  endTime?: string;
  output?: string;
  deliverables: string[];
  error?: string;
}

/**
 * Role definition interface for workflow execution
 */
export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  content: string;
}

/**
 * Handoff data structure for role communication
 */
export interface HandoffData {
  currentRole: string;
  previousRole?: string;
  context: Record<string, unknown>;
  completedTasks: string[];
  pendingTasks: string[];
  deliverables: string[];
  nextSteps: string[];
  notes?: string;
}

/**
 * Workflow state management
 */
export interface WorkflowState {
  id: string;
  issueId?: string;
  issueTitle?: string;
  issueDescription?: string;
  currentRole: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
  executions: WorkflowExecution[];
  handoffData: HandoffData;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Workspace data structure for individual workflow
 */
export interface WorkspaceData {
  id: string;
  workflowId: string;
  handoffFile: string;
  prFile: string;
  createdAt: string;
}

/**
 * Workflow Manager integrated with Cortex AI
 */
export class WorkflowManager {
  private cortex: CortexCore;
  private projectRoot: string;
  private workflowsDir: string;
  private workspacesDir: string;
  private rolesDir: string;

  constructor(cortex: CortexCore, projectRoot: string) {
    this.cortex = cortex;
    this.projectRoot = projectRoot;
    this.workflowsDir = path.join(projectRoot, ".cortex", "workflows");
    this.workspacesDir = path.join(projectRoot, ".cortex", "workspaces");
    this.rolesDir = path.join(projectRoot, ".cortex", "roles");
  }

  /**
   * Create new workflow for complex task
   */
  async createWorkflow(
    issueId: string,
    issueTitle: string,
    issueDescription: string
  ): Promise<WorkflowState> {
    await fs.ensureDir(this.workflowsDir);
    await fs.ensureDir(this.workspacesDir);

    const workflowId = uuidv4();
    const workspaceId = this.generateWorkspaceHash(workflowId, issueTitle);

    const workflowState: WorkflowState = {
      id: workflowId,
      issueId,
      issueTitle,
      issueDescription,
      currentRole: "Issue Analyst",
      status: "pending",
      executions: [],
      handoffData: {
        currentRole: "Issue Analyst",
        context: { workspaceId },
        completedTasks: [],
        pendingTasks: [],
        deliverables: [],
        nextSteps: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create workspace directory
    const workspaceDir = path.join(this.workspacesDir, workspaceId);
    await fs.ensureDir(workspaceDir);

    // Save workflow state
    const workflowFile = path.join(this.workflowsDir, `${workflowId}.json`);
    await fs.writeJson(workflowFile, workflowState, { spaces: 2 });

    // Initialize workspace files
    await this.initializeWorkspaceFiles(workflowState, workspaceId);

    return workflowState;
  }

  /**
   * Execute next step in workflow
   */
  async executeWorkflowStep(workflowId: string): Promise<WorkflowExecution> {
    const workflowState = await this.getWorkflowState(workflowId);
    if (!workflowState) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    return await this.executeCurrentRole(workflowState);
  }

  /**
   * Get workflow state
   */
  async getWorkflowState(workflowId: string): Promise<WorkflowState | null> {
    const workflowFile = path.join(this.workflowsDir, `${workflowId}.json`);

    if (!(await fs.pathExists(workflowFile))) {
      return null;
    }

    return await fs.readJson(workflowFile);
  }

  /**
   * Select appropriate role based on current context
   */
  private async selectAppropriateRole(
    workflowState: WorkflowState
  ): Promise<string> {
    // Use Cortex's role selection logic
    const query = `Current workflow: ${workflowState.issueTitle}. Current role: ${workflowState.currentRole}`;
    const selectedMaster = await this.cortex.selectCortexMaster(query);
    return selectedMaster.id;
  }

  /**
   * Execute current role
   */
  private async executeCurrentRole(
    workflowState: WorkflowState
  ): Promise<WorkflowExecution> {
    const roleId = workflowState.currentRole;
    const executionId = uuidv4();
    const startTime = new Date().toISOString();

    const execution: WorkflowExecution = {
      id: executionId,
      roleId,
      status: "in_progress",
      startTime,
      deliverables: [],
    };

    try {
      // Update workflow state
      workflowState.status = "in_progress";
      workflowState.executions.push(execution);
      await this.saveWorkflowState(workflowState);

      // Execute role-specific logic
      const result = await this.executeRole(roleId, workflowState);

      // Update execution
      execution.status = "completed";
      execution.endTime = new Date().toISOString();
      execution.output = result.output;
      execution.deliverables = result.deliverables;

      // Update workflow state
      workflowState.updatedAt = new Date().toISOString();
      workflowState.handoffData = result.handoffData;

      // Check if workflow should continue
      if (this.shouldContinueWorkflow(workflowState)) {
        workflowState.currentRole = this.selectNextRole(workflowState);
      } else {
        workflowState.status = "completed";
        workflowState.completedAt = new Date().toISOString();
        await this.generatePRDocumentation(workflowState);
      }

      await this.saveWorkflowState(workflowState);
      await this.updateHandoffFile(workflowState);

      return execution;
    } catch (error) {
      execution.status = "failed";
      execution.endTime = new Date().toISOString();
      execution.error = error instanceof Error ? error.message : String(error);

      workflowState.status = "failed";
      await this.saveWorkflowState(workflowState);

      return execution;
    }
  }

  /**
   * Execute specific role
   */
  private async executeRole(
    roleId: string,
    workflowState: WorkflowState
  ): Promise<{
    output: string;
    deliverables: string[];
    handoffData: HandoffData;
  }> {
    const roleDefinition = await this.getRoleDefinition(roleId);
    const context = this.buildRoleExecutionContext(
      workflowState,
      roleDefinition
    );

    // Use Cortex's context enhancement
    const enhancedContext = await this.cortex.enhanceContext(
      context.query,
      5,
      30
    );

    const response = await this.generateRoleResponse(
      roleDefinition,
      enhancedContext,
      context
    );

    const deliverables = this.extractDeliverables(response);

    return {
      output: response,
      deliverables,
      handoffData: {
        currentRole: roleId,
        previousRole: workflowState.handoffData.currentRole,
        context: { ...workflowState.handoffData.context, ...context },
        completedTasks: [
          ...workflowState.handoffData.completedTasks,
          ...deliverables,
        ],
        pendingTasks: this.generatePendingTasks(roleId),
        deliverables: [
          ...workflowState.handoffData.deliverables,
          ...deliverables,
        ],
        nextSteps: this.generateNextSteps(roleId, workflowState),
        notes: response,
      },
    };
  }

  /**
   * Generate workspace hash for unique workspace identification
   */
  private generateWorkspaceHash(
    workflowId: string,
    issueTitle: string
  ): string {
    const hash = crypto.createHash("md5");
    hash.update(`${workflowId}-${issueTitle}-${Date.now()}`);
    return hash.digest("hex").substring(0, 8);
  }

  /**
   * Get role definition from .cortex/roles
   */
  private async getRoleDefinition(roleId: string): Promise<RoleDefinition> {
    const roleFile = path.join(this.rolesDir, `${roleId}.md`);

    if (!(await fs.pathExists(roleFile))) {
      throw new Error(`Role definition not found: ${roleId}`);
    }

    const content = await fs.readFile(roleFile, "utf-8");
    return this.parseRoleFile(roleId, content);
  }

  /**
   * Parse role file content
   */
  private parseRoleFile(roleId: string, content: string): RoleDefinition {
    const lines = content.split("\n");
    const title = lines[0].replace(/^#\s+/, "");
    const description = lines.slice(1).join("\n").trim();

    return {
      id: roleId,
      name: title,
      description,
      content,
    };
  }

  /**
   * Build execution context for role
   */
  private buildRoleExecutionContext(
    workflowState: WorkflowState,
    roleDefinition: RoleDefinition
  ): {
    query: string;
    workflowState: WorkflowState;
    roleDefinition: RoleDefinition;
    projectContext: Record<string, unknown>;
  } {
    return {
      query: `Role: ${roleDefinition.name}. Task: ${workflowState.issueTitle}. Description: ${workflowState.issueDescription}`,
      workflowState,
      roleDefinition,
      projectContext: this.getProjectContext(),
    };
  }

  /**
   * Generate role response
   */
  private async generateRoleResponse(
    roleDefinition: RoleDefinition,
    enhancedContext: string,
    context: {
      query: string;
      workflowState: WorkflowState;
      roleDefinition: RoleDefinition;
      projectContext: Record<string, unknown>;
    }
  ): Promise<string> {
    // This would integrate with the actual AI model
    // For now, return a structured response
    return `# ${roleDefinition.name} Analysis

## Task Understanding
${context.query}

## Enhanced Context
${enhancedContext}

## Analysis
Based on my expertise as a ${roleDefinition.name}, I recommend:

1. **Immediate Actions**: Analyze the requirements thoroughly
2. **Key Considerations**: Focus on ${roleDefinition.description}
3. **Next Steps**: Proceed with detailed implementation

## Deliverables
- Analysis report
- Recommendations
- Next action items`;
  }

  /**
   * Extract deliverables from response
   */
  private extractDeliverables(response: string): string[] {
    const deliverables: string[] = [];
    const lines = response.split("\n");

    for (const line of lines) {
      if (line.trim().startsWith("- ")) {
        const cleanLine = line.trim().substring(2).trim();
        if (cleanLine && !deliverables.includes(cleanLine)) {
          deliverables.push(cleanLine);
        }
      }
    }

    return deliverables;
  }

  /**
   * Check if workflow should continue
   */
  private shouldContinueWorkflow(workflowState: WorkflowState): boolean {
    const finalRoles = ["Documentation Specialist"];
    return !finalRoles.includes(workflowState.currentRole);
  }

  /**
   * Select next role
   */
  private selectNextRole(workflowState: WorkflowState): string {
    const roleSequence = [
      "Issue Analyst",
      "Code Archaeologist",
      "Solution Architect",
      "Build Engineer",
      "Implementation Specialist",
      "Test Engineer",
      "Quality Assurance Specialist",
      "Documentation Specialist",
    ];

    const currentIndex = roleSequence.indexOf(workflowState.currentRole);
    if (currentIndex === -1 || currentIndex >= roleSequence.length - 1) {
      return "Documentation Specialist";
    }

    return roleSequence[currentIndex + 1];
  }

  /**
   * Initialize workspace files (handoff.md and pr.md)
   */
  private async initializeWorkspaceFiles(
    workflowState: WorkflowState,
    workspaceId: string
  ): Promise<void> {
    const workspaceDir = path.join(this.workspacesDir, workspaceId);

    // Initialize handoff file
    const handoffFile = path.join(workspaceDir, "handoff.md");
    const handoffContent = this.formatHandoffContent(workflowState);
    await fs.writeFile(handoffFile, handoffContent);

    // Initialize pr file
    const prFile = path.join(workspaceDir, "pr.md");
    const prContent = this.formatPRContent(workflowState);
    await fs.writeFile(prFile, prContent);
  }

  /**
   * Update handoff file in workspace
   */
  private async updateHandoffFile(workflowState: WorkflowState): Promise<void> {
    const workspaceId = workflowState.handoffData.context.workspaceId as string;
    if (!workspaceId) {
      throw new Error("Workspace ID not found in workflow context");
    }

    const workspaceDir = path.join(this.workspacesDir, workspaceId);
    const handoffFile = path.join(workspaceDir, "handoff.md");
    const handoffContent = this.formatHandoffContent(workflowState);
    await fs.writeFile(handoffFile, handoffContent);
  }

  /**
   * Generate PR documentation in workspace
   */
  private async generatePRDocumentation(
    workflowState: WorkflowState
  ): Promise<void> {
    const workspaceId = workflowState.handoffData.context.workspaceId as string;
    if (!workspaceId) {
      throw new Error("Workspace ID not found in workflow context");
    }

    const workspaceDir = path.join(this.workspacesDir, workspaceId);
    const prFile = path.join(workspaceDir, "pr.md");
    const prContent = this.formatPRContent(workflowState);
    await fs.writeFile(prFile, prContent);
  }

  /**
   * Format handoff content
   */
  private formatHandoffContent(workflowState: WorkflowState): string {
    return `# Workflow Handoff

## Current Status
- **Workflow ID**: ${workflowState.id}
- **Current Role**: ${workflowState.currentRole}
- **Status**: ${workflowState.status}
- **Last Updated**: ${workflowState.updatedAt}

## Issue Details
- **Title**: ${workflowState.issueTitle}
- **Description**: ${workflowState.issueDescription}

## Completed Tasks
${workflowState.handoffData.completedTasks.map((task) => `- ${task}`).join("\n")}

## Pending Tasks
${workflowState.handoffData.pendingTasks.map((task) => `- ${task}`).join("\n")}

## Deliverables
${workflowState.handoffData.deliverables.map((del) => `- ${del}`).join("\n")}

## Next Steps
${workflowState.handoffData.nextSteps.map((step) => `- ${step}`).join("\n")}

## Context
${JSON.stringify(workflowState.handoffData.context, null, 2)}

## Notes
${workflowState.handoffData.notes || "No additional notes"}
`;
  }

  /**
   * Format PR content
   */
  private formatPRContent(workflowState: WorkflowState): string {
    const prContent = {
      title: workflowState.issueTitle || "Multi-Role Workflow Implementation",
      description:
        workflowState.issueDescription || "Automated workflow execution",
      testing: workflowState.handoffData.deliverables.filter((d) =>
        d.includes("test")
      ),
      documentation: workflowState.handoffData.deliverables.filter((d) =>
        d.includes("doc")
      ),
      relatedIssues: [workflowState.issueId].filter(Boolean),
    };

    return `# Pull Request

## Title
${prContent.title}

## Description
${prContent.description}

## Testing
${prContent.testing.map((test) => `- ${test}`).join("\n")}

## Documentation
${prContent.documentation.map((doc) => `- ${doc}`).join("\n")}

## Related Issues
${prContent.relatedIssues.map((issue) => `- ${issue}`).join("\n")}

## Workflow Details
- **Workflow ID**: ${workflowState.id}
- **Completed At**: ${workflowState.completedAt}
- **Total Executions**: ${workflowState.executions.length}
`;
  }

  /**
   * Get project context
   */
  private getProjectContext(): Record<string, unknown> {
    return {
      projectRoot: this.projectRoot,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Save workflow state
   */
  private async saveWorkflowState(workflowState: WorkflowState): Promise<void> {
    const workflowFile = path.join(
      this.workflowsDir,
      `${workflowState.id}.json`
    );
    await fs.writeJson(workflowFile, workflowState, { spaces: 2 });
  }

  /**
   * Generate pending tasks
   */
  private generatePendingTasks(roleId: string): string[] {
    const taskMap: Record<string, string[]> = {
      "Issue Analyst": ["Analyze requirements", "Identify stakeholders"],
      "Code Archaeologist": ["Review existing code", "Identify patterns"],
      "Solution Architect": ["Design solution", "Create architecture"],
      "Build Engineer": ["Setup environment", "Configure build"],
      "Implementation Specialist": ["Write code", "Implement features"],
      "Test Engineer": ["Write tests", "Run test suite"],
      "Quality Assurance Specialist": ["Code review", "Quality check"],
      "Documentation Specialist": ["Update docs", "Create guides"],
    };

    return taskMap[roleId] || [];
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(
    roleId: string,
    workflowState: WorkflowState
  ): string[] {
    const nextRole = this.selectNextRole(workflowState);
    return [
      `Hand off to ${nextRole}`,
      "Review deliverables",
      "Update progress",
    ];
  }

  /**
   * Get workspace information for a workflow
   */
  async getWorkspaceInfo(workflowId: string): Promise<WorkspaceData | null> {
    const workflowState = await this.getWorkflowState(workflowId);
    if (!workflowState) {
      return null;
    }

    const workspaceId = workflowState.handoffData.context.workspaceId as string;
    if (!workspaceId) {
      return null;
    }

    const workspaceDir = path.join(this.workspacesDir, workspaceId);

    return {
      id: workspaceId,
      workflowId,
      handoffFile: path.join(workspaceDir, "handoff.md"),
      prFile: path.join(workspaceDir, "pr.md"),
      createdAt: workflowState.createdAt,
    };
  }

  /**
   * List all workspaces
   */
  async listWorkspaces(): Promise<WorkspaceData[]> {
    await fs.ensureDir(this.workspacesDir);

    const workspaceEntries = await fs.readdir(this.workspacesDir, {
      withFileTypes: true,
    });

    const workspaces: WorkspaceData[] = [];

    for (const entry of workspaceEntries) {
      if (entry.isDirectory()) {
        const workspaceDir = path.join(this.workspacesDir, entry.name);

        // Try to find the workflow file for this workspace
        const workflowFiles = await fs.readdir(this.workflowsDir);
        let workflowId: string | null = null;

        for (const file of workflowFiles) {
          if (file.endsWith(".json")) {
            const workflowFile = path.join(this.workflowsDir, file);
            const workflowState: WorkflowState =
              await fs.readJson(workflowFile);

            if (workflowState.handoffData.context.workspaceId === entry.name) {
              workflowId = workflowState.id;
              break;
            }
          }
        }

        if (workflowId) {
          workspaces.push({
            id: entry.name,
            workflowId,
            handoffFile: path.join(workspaceDir, "handoff.md"),
            prFile: path.join(workspaceDir, "pr.md"),
            createdAt: new Date().toISOString(), // Would need to track this properly
          });
        }
      }
    }

    return workspaces;
  }

  /**
   * Record workflow experience
   */
  private async recordWorkflowExperience(
    workflowState: WorkflowState,
    execution: WorkflowExecution
  ): Promise<void> {
    await this.cortex.recordExperience({
      input: `Workflow execution: ${execution.roleId} for ${workflowState.issueTitle}`,
      output: `Role ${execution.roleId} completed: ${execution.deliverables.join(", ")}`,
      category: "workflow-execution",
      tags: [execution.roleId, "multi-role", workflowState.currentRole],
      timestamp: new Date().toISOString(),
    });
  }
}
