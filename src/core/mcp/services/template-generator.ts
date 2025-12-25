/**
 * Template Generator Service
 *
 * Generates phase documents (spec, plan, tasks) from templates
 * with variable replacement and context enhancement.
 */

import * as path from "node:path";
import fs from "fs-extra";
import type { TemplateVariables } from "../types/template.js";
import type { MemoryService } from "./memory/index.js";
import { CorrectionService } from "./correction-service.js";

export class TemplateGenerator {
  private templatesPath: string;
  private correctionService: CorrectionService;

  constructor(
    private projectRoot: string,
    private memoryService?: MemoryService
  ) {
    this.templatesPath = path.join(projectRoot, ".cortex", "templates");
    this.correctionService = new CorrectionService(projectRoot);
  }

  /**
   * Load a template file
   */
  async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(this.templatesPath, templateName);

    if (!(await fs.pathExists(templatePath))) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return fs.readFile(templatePath, "utf-8");
  }

  /**
   * Replace variables in template content
   */
  private replaceVariables(
    content: string,
    variables: TemplateVariables
  ): string {
    let result = content;

    // Replace each variable
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined) {
        // Replace {VARIABLE} patterns
        const pattern = new RegExp(`\\{${key}\\}`, "g");
        result = result.replace(pattern, value);
      }
    }

    return result;
  }

  /**
   * Get current git branch name
   */
  private async getCurrentBranch(): Promise<string> {
    try {
      const { execSync } = await import("node:child_process");
      const branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd: this.projectRoot,
        encoding: "utf-8",
      }).trim();
      return branch;
    } catch {
      return "main";
    }
  }

  /**
   * Get corrections context for current task
   */
  private async getCorrectionsContext(
    taskDescription: string,
    phase: string
  ): Promise<string> {
    try {
      const warnings = await this.correctionService.getWarnings({
        taskDescription,
        phase,
      });
      return this.correctionService.formatWarningsAsContext(warnings);
    } catch (error) {
      console.warn("Failed to get corrections context:", error);
      return "";
    }
  }

  /**
   * Enrich content with memory and corrections context
   */
  private async enrichPromptWithContext(
    baseContent: string,
    searchQuery: string,
    phase: string,
    correctionsQuery?: string
  ): Promise<string> {
    // 1. Add memory context
    let memoryContext = "";
    if (this.memoryService) {
      try {
        const context = await this.memoryService.enhanceContext(searchQuery);
        if (context) {
          memoryContext = `\n\n## Relevant Past Experiences\n\n${context}`;
        }
      } catch (error) {
        console.warn("Failed to enhance context from memory:", error);
      }
    }

    // 2. Add corrections context
    const correctionsContext = await this.getCorrectionsContext(
      correctionsQuery || searchQuery,
      phase
    );

    // 3. Combine all parts
    return `${baseContent}${memoryContext}${correctionsContext}`;
  }

  /**
   * Generate specification prompt (command + template)
   * Returns prompt for AI to execute, not filled content
   */
  async generateSpecPrompt(description: string): Promise<string> {
    // 1. Load command (AI execution guide)
    const command = await this.loadTemplate("commands/spec.md");

    // 2. Load template (structure framework)
    const template = await this.loadTemplate("spec-template.md");

    // 3. Enrich with memory and corrections
    const basePrompt = `${command}\n\n## Template to Fill\n\n${template}`;
    return this.enrichPromptWithContext(basePrompt, description, "spec");
  }

  /**
   * Generate clarify prompt (command + current spec)
   * Returns prompt for AI to execute, not filled content
   */
  async generateClarifyPrompt(workflowId: string): Promise<string> {
    // 1. Load command (AI execution guide)
    const command = await this.loadTemplate("commands/clarify.md");

    // 2. Load current spec to analyze
    const workflowPath = path.join(
      this.projectRoot,
      ".cortex",
      "workflows",
      workflowId
    );
    const specPath = path.join(workflowPath, "spec.md");

    let currentSpec = "";
    if (await fs.pathExists(specPath)) {
      currentSpec = await fs.readFile(specPath, "utf-8");
    } else {
      throw new Error(
        `Specification not found at ${specPath}. Run cortex.spec first.`
      );
    }

    // 3. Replace $WORKFLOW_ID in command
    const commandWithId = command.replace(/\$WORKFLOW_ID/g, workflowId);

    // 4. Combine into complete prompt
    return `${commandWithId}\n\n## Current Specification to Analyze\n\n${currentSpec}`;
  }

  /**
   * Generate plan prompt (command + template)
   * Returns prompt for AI to execute, not filled content
   */
  async generatePlanPrompt(workflowId: string): Promise<string> {
    // 1. Load command (AI execution guide)
    const command = await this.loadTemplate("commands/plan.md");

    // 2. Load template (structure framework)
    const template = await this.loadTemplate("plan-template.md");

    // 3. Replace $WORKFLOW_ID in command
    const commandWithId = command.replace(/\$WORKFLOW_ID/g, workflowId);

    // 4. Get workflow context for memory search
    const workflowPath = path.join(
      this.projectRoot,
      ".cortex",
      "workflows",
      workflowId
    );
    const specPath = path.join(workflowPath, "spec.md");

    let searchQuery = "";
    let correctionsQuery = "";

    if (await fs.pathExists(specPath)) {
      const specContent = await fs.readFile(specPath, "utf-8");
      // Extract feature name or use first 200 chars for search
      const featureMatch = specContent.match(/Feature:\s*(.+)/i);
      searchQuery = featureMatch ? featureMatch[1] : specContent.slice(0, 200);
      correctionsQuery = specContent.slice(0, 200);
    }

    // 5. Enrich with memory and corrections
    const basePrompt = `${commandWithId}\n\n## Template to Fill\n\n${template}`;
    return this.enrichPromptWithContext(
      basePrompt,
      searchQuery,
      "plan",
      correctionsQuery
    );
  }

  /**
   * Generate review prompt (command + context)
   * Returns prompt for AI to execute technical review
   */
  async generateReviewPrompt(workflowId: string): Promise<string> {
    // 1. Load command (AI execution guide)
    const command = await this.loadTemplate("commands/review.md");

    // 2. Load plan to review
    const workflowPath = path.join(
      this.projectRoot,
      ".cortex",
      "workflows",
      workflowId
    );
    const planPath = path.join(workflowPath, "plan.md");

    let planContent = "";
    if (await fs.pathExists(planPath)) {
      planContent = await fs.readFile(planPath, "utf-8");
    } else {
      throw new Error(`Plan not found at ${planPath}. Run cortex.plan first.`);
    }

    // 3. Replace $WORKFLOW_ID in command
    const commandWithId = command.replace(/\$WORKFLOW_ID/g, workflowId);

    // 4. Combine into complete prompt
    return `${commandWithId}\n\n## Plan to Review\n\n${planContent}`;
  }

  /**
   * Generate tasks prompt (command + template)
   * Returns prompt for AI to execute, not filled content
   */
  async generateTasksPrompt(workflowId: string): Promise<string> {
    // 1. Load command (AI execution guide)
    const command = await this.loadTemplate("commands/tasks.md");

    // 2. Load template (structure framework)
    const template = await this.loadTemplate("tasks-template.md");

    // 3. Replace $WORKFLOW_ID in command
    const commandWithId = command.replace(/\$WORKFLOW_ID/g, workflowId);

    // 4. Get workflow context for memory search
    const workflowPath = path.join(
      this.projectRoot,
      ".cortex",
      "workflows",
      workflowId
    );
    const planPath = path.join(workflowPath, "plan.md");

    let searchQuery = "";
    let correctionsQuery = "";

    if (await fs.pathExists(planPath)) {
      const planContent = await fs.readFile(planPath, "utf-8");
      // Use plan content for search (task decomposition patterns)
      searchQuery = `task decomposition ${planContent.slice(0, 150)}`;
      correctionsQuery = planContent.slice(0, 200);
    }

    // 5. Enrich with memory and corrections
    const basePrompt = `${commandWithId}\n\n## Template to Fill\n\n${template}`;
    return this.enrichPromptWithContext(
      basePrompt,
      searchQuery,
      "tasks",
      correctionsQuery
    );
  }

  /**
   * Generate implement prompt (command only, no template)
   * Implementation phase uses commands to coordinate execution
   */
  async generateImplementPrompt(workflowId: string): Promise<string> {
    // 1. Load command (execution coordinator)
    const command = await this.loadTemplate("commands/implement.md");

    // 2. Replace $WORKFLOW_ID in command
    const commandWithId = command.replace(/\$WORKFLOW_ID/g, workflowId);

    // 3. Get workflow context for memory search
    const workflowPath = path.join(
      this.projectRoot,
      ".cortex",
      "workflows",
      workflowId
    );
    const tasksPath = path.join(workflowPath, "tasks.md");

    let searchQuery = "";
    let correctionsQuery = "";

    if (await fs.pathExists(tasksPath)) {
      const tasksContent = await fs.readFile(tasksPath, "utf-8");
      // Search for implementation patterns, solutions, and lessons
      searchQuery = `implementation patterns ${tasksContent.slice(0, 150)}`;
      correctionsQuery = tasksContent.slice(0, 200);
    }

    // 4. Enrich with memory and corrections
    return this.enrichPromptWithContext(
      commandWithId,
      searchQuery,
      "implement",
      correctionsQuery
    );
  }

  /**
   * Generate checklist
   */
  async generateChecklist(
    checklistType: string,
    featureName: string
  ): Promise<string> {
    const template = await this.loadTemplate("checklist-template.md");

    const variables: TemplateVariables = {
      CHECKLIST_TYPE: checklistType,
      FEATURE: featureName,
      DATE: new Date().toISOString().split("T")[0],
    };

    return this.replaceVariables(template, variables);
  }
}
