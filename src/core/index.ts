/**
 * Cortex AI - Balanced Core
 * Linus philosophy: "Don't over-engineer, but don't under-engineer either"
 */

import fs from "fs-extra";
import path from "path";

/**
 * Simple Role Definition
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

/**
 * Experience Record
 */
export interface Experience {
  input: string;
  output: string;
  category: string;
  tags?: string[];
  timestamp: string;
}

/**
 * Workflow Context
 */
export interface WorkflowContext {
  workspaceId: string;
  issueTitle: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  previousRole?: string;
  currentRoleOutput?: string;
}

/**
 * Workflow State
 */
export interface WorkflowState {
  id: string;
  issueId: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
  currentRole?: string;
  roles: string[];
  handoffData: {
    context: WorkflowContext;
  };
  issueTitle: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Workflow Execution Result
 */
export interface WorkflowExecution {
  roleId: string;
  status: "success" | "error";
  output?: string;
  error?: string;
}

/**
 * Cortex AI Core - Essential functionality without over-engineering
 */
export class CortexAI {
  private projectRoot: string;
  private experiencesDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.experiencesDir = path.join(projectRoot, ".cortex", "experiences");
  }

  /**
   * Load available roles from templates
   */
  async loadRoles(): Promise<Role[]> {
    const rolesDir = path.join(this.projectRoot, ".cortex", "roles");

    if (!(await fs.pathExists(rolesDir))) {
      return this.getDefaultRoles();
    }

    const files = await fs.readdir(rolesDir);
    const roles: Role[] = [];

    for (const file of files) {
      if (file.endsWith(".md")) {
        const filePath = path.join(rolesDir, file);
        const content = await fs.readFile(filePath, "utf-8");

        const role: Role = {
          id: file.replace(".md", ""),
          name: this.extractTitle(content),
          description: this.extractDescription(content),
          systemPrompt: this.extractSystemPrompt(content),
        };

        roles.push(role);
      }
    }

    // Sort roles by priority/order
    const roleOrder = [
      "architecture-designer",
      "code-assistant",
      "testing-specialist",
      "documentation-specialist",
      "security-specialist",
      "ui-ux-designer",
      "react-expert",
    ];

    roles.sort((a, b) => {
      const aIndex = roleOrder.indexOf(a.id);
      const bIndex = roleOrder.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return roles.length > 0 ? roles : this.getDefaultRoles();
  }

  /**
   * Find best role for a task
   */
  async findBestRole(query: string): Promise<Role | null> {
    const roles = await this.loadRoles();
    const queryLower = query.toLowerCase();

    // Simple keyword matching
    for (const role of roles) {
      const roleText = `${role.name} ${role.description}`.toLowerCase();
      if (
        roleText.includes(queryLower) ||
        this.hasKeywordMatch(roleText, queryLower)
      ) {
        return role;
      }
    }

    return roles[0] || null; // Return first role as fallback
  }

  /**
   * Enhance context with past experiences
   */
  async enhanceContext(query: string, maxItems: number = 5): Promise<string> {
    try {
      await fs.ensureDir(this.experiencesDir);

      if (!(await fs.pathExists(this.experiencesDir))) {
        return "No past experiences found.";
      }

      const files = await fs.readdir(this.experiencesDir);
      const experiences: Experience[] = [];

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(this.experiencesDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const experience = JSON.parse(content);

          // Simple relevance check
          const searchText =
            `${experience.input} ${experience.output}`.toLowerCase();
          if (this.hasKeywordMatch(searchText, query.toLowerCase())) {
            experiences.push(experience);
          }
        }
      }

      if (experiences.length === 0) {
        return "No relevant experiences found.";
      }

      // Sort by recency and return top results
      const sorted = experiences
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, maxItems);

      return sorted
        .map(
          (exp) =>
            `**Problem:** ${exp.input}\n**Solution:** ${exp.output}\n**Category:** ${exp.category}`
        )
        .join("\n\n");
    } catch (error) {
      console.error("Error enhancing context:", error);
      return "Error loading experiences.";
    }
  }

  /**
   * Record a new experience
   */
  async recordExperience(
    input: string,
    output: string,
    category: string = "general"
  ): Promise<void> {
    try {
      await fs.ensureDir(this.experiencesDir);

      const experience: Experience = {
        input: input.substring(0, 200), // Keep it concise
        output: output.substring(0, 500),
        category,
        timestamp: new Date().toISOString(),
      };

      const hash = Buffer.from(`${input}${output}${Date.now()}`)
        .toString("base64")
        .substring(0, 8);
      const filePath = path.join(this.experiencesDir, `${hash}.json`);

      await fs.writeJson(filePath, experience, { spaces: 2 });
    } catch (error) {
      console.error("Error recording experience:", error);
      throw error;
    }
  }

  // Helper methods
  private extractTitle(content: string): string {
    const lines = content.split("\n");
    const titleLine = lines.find((line) => line.startsWith("# "));
    return titleLine ? titleLine.replace("# ", "").trim() : "Unknown Role";
  }

  private extractDescription(content: string): string {
    const lines = content.split("\n");
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith("#") && line.length > 20) {
        return line;
      }
    }
    return "AI collaboration role";
  }

  private extractSystemPrompt(content: string): string {
    const description = this.extractDescription(content);
    return `You are ${description}. Follow the principles and best practices defined for this role.`;
  }

  private hasKeywordMatch(text: string, query: string): boolean {
    const queryWords = query.split(" ").filter((word) => word.length > 2);
    return queryWords.some((word) => text.includes(word));
  }

  private getDefaultRoles(): Role[] {
    return [
      {
        id: "architecture-designer",
        name: "Architecture Designer",
        description: "System architecture and design specialist",
        systemPrompt: "You are an architecture design specialist.",
      },
      {
        id: "code-assistant",
        name: "Code Assistant",
        description: "General purpose coding assistant",
        systemPrompt: "You are a helpful coding assistant.",
      },
      {
        id: "testing-specialist",
        name: "Testing Specialist",
        description: "Quality assurance and testing expert",
        systemPrompt: "You are a testing and quality assurance specialist.",
      },
      {
        id: "documentation-specialist",
        name: "Documentation Specialist",
        description: "Technical documentation expert",
        systemPrompt: "You are a documentation specialist.",
      },
    ];
  }

  /**
   * Create a new Multi-Role workflow
   */
  async createWorkflow(
    issueId: string,
    title: string,
    description: string
  ): Promise<WorkflowState> {
    const workflowId = `workflow-${Date.now()}`;
    const roles = await this.loadRoles();
    const roleIds = roles.map((role) => role.id);

    const workflowState: WorkflowState = {
      id: workflowId,
      issueId,
      title,
      description,
      status: "pending",
      roles: roleIds,
      handoffData: {
        context: {
          workspaceId: workflowId,
          issueTitle: title,
          description,
          currentStep: 0,
          totalSteps: roleIds.length,
        },
      },
      issueTitle: title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save workflow state
    try {
      await this.saveWorkflowState(workflowState);
      // Don't log to stdout as it breaks MCP JSON-RPC protocol
      // console.log(`✅ Workflow state saved: ${workflowId}`);
    } catch (error) {
      console.error(`❌ Failed to save workflow state: ${error}`);
      throw error;
    }

    return workflowState;
  }

  /**
   * Execute the next role in a workflow
   */
  async executeNextRole(workflowId: string): Promise<WorkflowExecution> {
    const workflowState = await this.getWorkflowState(workflowId);
    if (!workflowState) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (workflowState.status !== "in_progress") {
      workflowState.status = "in_progress";
    }

    const currentStep = workflowState.handoffData.context.currentStep || 0;
    const roles = workflowState.roles;

    if (currentStep >= roles.length) {
      workflowState.status = "completed";
      await this.saveWorkflowState(workflowState);
      return {
        roleId: "workflow-completed",
        status: "success",
        output: "Workflow completed successfully",
      };
    }

    const currentRoleId = roles[currentStep];
    const role = await this.getRole(currentRoleId);

    if (!role) {
      throw new Error(`Role ${currentRoleId} not found`);
    }

    // Read handoff.md content from previous role
    const handoffContent = await this.readHandoffContent(workflowId);

    // Execute role logic - this should be handled by Cursor's AI, not the MCP server
    let output: string;

    try {
      // Don't log to stdout as it breaks MCP JSON-RPC protocol
      // console.log(`🎭 Executing role: ${role.name} (${role.id})`);

      // Prepare context for Cursor's AI to process
      const systemPrompt = role.systemPrompt || role.description;
      const previousContext = handoffContent || "No previous context available";

      // Don't log to stdout as it breaks MCP JSON-RPC protocol
      // console.log(`📝 Task description: ${taskDescription}`);
      // console.log(`📋 Previous context length: ${previousContext.length} characters`);

      // Create a structured context for Cursor's AI to work with
      output = `## Role Context for Cursor AI Processing

**Current Role:** ${role.name} (${role.id})
**Role Description:** ${role.description}
**System Prompt:** ${systemPrompt}

**Task Details:**
- **Title:** ${workflowState.title}
- **Description:** ${workflowState.description}

**Previous Context:**
${previousContext}

**Instructions for Cursor AI:**
Please process this task according to the role's expertise and system prompt. The output should be structured and actionable for the next role in the workflow.

**Expected Output Format:**
- Analysis and recommendations
- Specific actionable steps
- Clear handoff information for the next role

**Note:** This role execution should be completed by Cursor's AI capabilities, not by the MCP server.`;

      // Don't log to stdout as it breaks MCP JSON-RPC protocol
      // console.log(`📄 Context prepared for Cursor AI processing, length: ${output.length} characters`);
    } catch (error) {
      console.error("❌ Error preparing role context:", error);
      output = `Error preparing context for ${role.name}: ${error instanceof Error ? error.message : String(error)}`;
    }

    // Update workflow state
    workflowState.handoffData.context.currentStep = currentStep + 1;
    workflowState.currentRole = currentRoleId;
    workflowState.updatedAt = new Date().toISOString();

    // Update handoff data with current role output
    workflowState.handoffData.context.previousRole =
      currentStep > 0 ? roles[currentStep - 1] : undefined;
    workflowState.handoffData.context.currentRoleOutput = output;

    await this.saveWorkflowState(workflowState);

    // Generate handoff.md file for next role
    await this.generateHandoffFile(workflowState, currentRoleId, output);

    return {
      roleId: currentRoleId,
      status: "success",
      output,
    };
  }

  /**
   * Read handoff content from previous role
   */
  private async readHandoffContent(workflowId: string): Promise<string | null> {
    const handoffFile = path.join(
      this.projectRoot,
      ".cortex",
      "workspaces",
      workflowId,
      "handoff.md"
    );

    if (!(await fs.pathExists(handoffFile))) {
      return null;
    }

    try {
      return await fs.readFile(handoffFile, "utf-8");
    } catch (error) {
      console.error(`Failed to read handoff file: ${error}`);
      return null;
    }
  }

  /**
   * Generate handoff.md file for next role
   */
  private async generateHandoffFile(
    workflowState: WorkflowState,
    currentRoleId: string,
    output: string
  ): Promise<void> {
    const workspaceDir = path.join(
      this.projectRoot,
      ".cortex",
      "workspaces",
      workflowState.id
    );
    await fs.ensureDir(workspaceDir);

    const handoffFile = path.join(workspaceDir, "handoff.md");
    const nextRoleId =
      workflowState.roles[workflowState.handoffData.context.currentStep];

    const handoffContent = `# Workflow Handoff

## Current Status
- **Workflow ID**: ${workflowState.id}
- **Completed Role**: ${currentRoleId}
- **Next Role**: ${nextRoleId || "Workflow Complete"}
- **Status**: ${workflowState.status}
- **Last Updated**: ${workflowState.updatedAt}

## Issue Details
- **Title**: ${workflowState.title}
- **Description**: ${workflowState.description}

## Previous Role Output
${output}

## Context
${JSON.stringify(workflowState.handoffData.context, null, 2)}

## Next Steps
${nextRoleId ? `The next role "${nextRoleId}" should continue from this point.` : "Workflow is complete."}
`;

    await fs.writeFile(handoffFile, handoffContent);
  }

  /**
   * Get workflow state
   */
  async getWorkflowState(workflowId: string): Promise<WorkflowState | null> {
    try {
      const workflowsDir = path.join(this.projectRoot, ".cortex", "workflows");
      const workflowFile = path.join(workflowsDir, `${workflowId}.json`);

      if (!(await fs.pathExists(workflowFile))) {
        return null;
      }

      const content = await fs.readFile(workflowFile, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error("Error loading workflow state:", error);
      return null;
    }
  }

  /**
   * Save workflow state
   */
  private async saveWorkflowState(workflowState: WorkflowState): Promise<void> {
    const workflowsDir = path.join(this.projectRoot, ".cortex", "workflows");
    await fs.ensureDir(workflowsDir);

    const workflowFile = path.join(workflowsDir, `${workflowState.id}.json`);
    await fs.writeJson(workflowFile, workflowState, { spaces: 2 });
  }

  /**
   * Find role by ID
   */
  public async getRole(roleId: string): Promise<Role | null> {
    const roles = await this.loadRoles();
    return roles.find((role) => role.id === roleId) || null;
  }
}

// Export MCP server for compatibility
export { CortexMCPServer, createCortexMCPServer } from "./mcp/server.js";
