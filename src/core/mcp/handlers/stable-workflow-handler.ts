/**
 * Stable Workflow Handler
 *
 * Handles cortex.* tools for the stable workflow system
 * (spec, plan, tasks, implement, context, learn)
 */

import * as path from "node:path";
import fs from "fs-extra";
import { MemoryService } from "../services/memory-service.js";
import { CorrectionService } from "../services/correction-service.js";
import { CheckpointService } from "../services/checkpoint-service.js";
import { TemplateGenerator } from "../services/template-generator.js";
import { WorkflowService } from "../services/workflow-service.js";
import { ProjectDetector } from "../services/project-detector.js";
import { ChangeAnalyzer } from "../services/change-analyzer.js";
import { TaskDecomposer } from "../services/task-decomposer.js";
import { ImplementationValidator } from "../services/implementation-validator.js";
import type {
  MCPToolResult,
  WorkflowToolArgs,
  MemoryToolArgs,
} from "../types/mcp-types.js";
import type { Checkpoint, CheckpointFile } from "../types/checkpoint.js";

// These are used in template strings for AI execution, not directly in code
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { GitignoreValidator } from "../services/gitignore-validator.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ContextManager } from "../services/context-manager.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ChecklistGenerator } from "../services/checklist-generator.js";

export class StableWorkflowHandler {
  private memoryService: MemoryService;
  private correctionService: CorrectionService;
  private checkpointService: CheckpointService;
  private templateGenerator: TemplateGenerator;
  private workflowService: WorkflowService;

  constructor(private projectRoot: string) {
    this.memoryService = new MemoryService(projectRoot);
    this.correctionService = new CorrectionService(projectRoot);
    this.checkpointService = new CheckpointService(projectRoot);
    this.templateGenerator = new TemplateGenerator(
      projectRoot,
      this.memoryService
    );
    this.workflowService = new WorkflowService(projectRoot);
  }

  /**
   * Ensure workflow ID exists (use provided or get latest)
   * @throws Error if no workflow found
   */
  private async ensureWorkflowId(providedId?: string): Promise<string> {
    const workflowId =
      providedId || (await this.workflowService.getLatestWorkflow());
    if (!workflowId) {
      throw new Error("No workflow found. Create one first with `spec`.");
    }
    return workflowId;
  }

  /**
   * Generate checklist instruction block for AI to execute
   */
  private generateChecklistInstruction(
    checklistType: string,
    workflowPath: string,
    featureName: string,
    workflowId?: string
  ): string {
    const workflowLookup = workflowId
      ? `const workflowData = await workflowService.getWorkflowStatus('${workflowId}');\n`
      : "";
    const featureNameVar = workflowId
      ? "workflowData.workflow.title"
      : `'${featureName}'`;

    return `**Generate ${checklistType.charAt(0).toUpperCase() + checklistType.slice(1)} Checklist**:
\`\`\`typescript
const checklistGenerator = new ChecklistGenerator('${workflowPath}');
${workflowLookup}await checklistGenerator.generateChecklist('${checklistType}', ${featureNameVar});
\`\`\``;
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
   */
  async handleSpec(args: { description: string }): Promise<MCPToolResult> {
    try {
      // 1. Create workflow with readable ID
      const workflowId = await this.workflowService.createWorkflow(
        args.description
      );
      const workflowPath = path.join(
        this.projectRoot,
        ".cortex",
        "workflows",
        workflowId
      );

      // 2. Generate prompt (command + template)
      const prompt = await this.templateGenerator.generateSpecPrompt(
        args.description
      );

      // 3. Return prompt to AI for execution
      return {
        content: [
          {
            type: "text",
            text: `## Workflow Created: ${workflowId}

Please execute the following specification command to generate spec.md:

---

${prompt}

---

After generating the specification, save it to:
\`.cortex/workflows/${workflowId}/spec.md\`

**THEN immediately execute this automated step**:

1. ${this.generateChecklistInstruction("requirements", workflowPath, args.description)}

2. **Report completion**:
✓ spec.md created
✓ Requirements checklist generated → checklists/requirements.md

**Next steps**:
- Clarify ambiguities (optional): \`cortex.clarify ${workflowId}\`
- Or proceed to plan: \`cortex.plan ${workflowId}\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to create specification: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle clarify - Resolve specification ambiguities
   */
  async handleClarify(args: { workflowId?: string }): Promise<MCPToolResult> {
    try {
      const workflowId = await this.ensureWorkflowId(args.workflowId);

      // 1. Generate prompt (command + current spec)
      const prompt =
        await this.templateGenerator.generateClarifyPrompt(workflowId);

      // 2. Return prompt to AI for execution
      return {
        content: [
          {
            type: "text",
            text: `Please execute the following clarify command to resolve ambiguities in spec.md:

---

${prompt}

---

This command will:
1. Scan the specification for ambiguities (11 categories)
2. Ask up to 5 targeted questions sequentially
3. Update spec.md after each answer
4. Save clarifications to \`.cortex/workflows/${workflowId}/clarifications.md\`

**Note**: Questions are asked ONE AT A TIME. Answer each before the next is presented.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to start clarification: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle plan - Create implementation plan
   */
  async handlePlan(args: { workflowId?: string }): Promise<MCPToolResult> {
    try {
      const workflowId = await this.ensureWorkflowId(args.workflowId);
      const workflowPath = path.join(
        this.projectRoot,
        ".cortex",
        "workflows",
        workflowId
      );

      // 1. Generate prompt (command + template)
      const prompt =
        await this.templateGenerator.generatePlanPrompt(workflowId);

      // 2. Return prompt to AI for execution
      return {
        content: [
          {
            type: "text",
            text: `Please execute the following plan command to generate plan.md:

---

${prompt}

---

After generating the plan, save it to:
\`.cortex/workflows/${workflowId}/plan.md\`

**THEN immediately execute these automated steps**:

1. **Update Context Memory**:
\`\`\`typescript
const contextManager = new ContextManager('${workflowPath}');
await contextManager.updateContext('${workflowId}');
\`\`\`

2. ${this.generateChecklistInstruction("design", workflowPath, "", workflowId)}

3. **Report completion**:
✓ plan.md created
✓ Context memory updated → CONTEXT.md
✓ Design checklist generated → checklists/design.md

**Next steps**:
- Review (optional): \`review\`
- Or proceed to tasks: \`tasks\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to create plan: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle review - Technical review of implementation plan
   */
  async handleReview(args: { workflowId?: string }): Promise<MCPToolResult> {
    try {
      const workflowId = await this.ensureWorkflowId(args.workflowId);

      // 1. Generate prompt (command + plan to review)
      const prompt =
        await this.templateGenerator.generateReviewPrompt(workflowId);

      // 2. Return prompt to AI for execution
      return {
        content: [
          {
            type: "text",
            text: `Please execute the following review command to conduct technical review:

---

${prompt}

---

This command will:
1. Review plan.md across 6 categories (Architecture, Security, Performance, Maintainability, Data Model, Integration)
2. Check constitution compliance
3. Categorize action items (Must Fix, Should Fix, Consider)
4. Make overall decision (Approved, Approved with Changes, Needs Major Revision)
5. Save review to \`.cortex/workflows/${workflowId}/review.md\`

**After review**:
- If APPROVED: Proceed to \`tasks\`
- If APPROVED WITH CHANGES: Address action items, update plan.md, then proceed
- If NEEDS MAJOR REVISION: Make substantial changes and re-run review`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to start review: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle tasks - Generate task breakdown
   */
  async handleTasks(args: { workflowId?: string }): Promise<MCPToolResult> {
    try {
      const workflowId = await this.ensureWorkflowId(args.workflowId);
      const workflowPath = path.join(
        this.projectRoot,
        ".cortex",
        "workflows",
        workflowId
      );

      // 1. Generate prompt (command + template)
      const prompt =
        await this.templateGenerator.generateTasksPrompt(workflowId);

      // 2. Return prompt to AI for execution
      return {
        content: [
          {
            type: "text",
            text: `Please execute the following tasks command to generate tasks.md:

---

${prompt}

---

After generating the task breakdown, save it to:
\`.cortex/workflows/${workflowId}/tasks.md\`

**THEN immediately execute this automated step**:

1. ${this.generateChecklistInstruction("tasks", workflowPath, "", workflowId)}

2. **Report completion**:
✓ tasks.md created
✓ Tasks checklist generated → checklists/tasks.md

**Next steps**:
- Review task breakdown
- When ready: \`implement\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to create tasks: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle implement - Execute implementation
   */
  async handleImplement(args: { workflowId?: string }): Promise<MCPToolResult> {
    try {
      const workflowId = await this.ensureWorkflowId(args.workflowId);
      const workflowPath = path.join(
        this.projectRoot,
        ".cortex",
        "workflows",
        workflowId
      );
      const planPath = path.join(workflowPath, "plan.md");

      // 1. Generate prompt (implementation coordinator)
      const prompt =
        await this.templateGenerator.generateImplementPrompt(workflowId);

      // 2. Return prompt to AI for execution
      return {
        content: [
          {
            type: "text",
            text: `**FIRST execute these automated pre-implementation checks**:

1. **Validate Gitignore Files**:
\`\`\`typescript
const validator = new GitignoreValidator('${this.projectRoot}');
await validator.validateIgnoreFiles('${planPath}');
\`\`\`

2. ${this.generateChecklistInstruction("implementation", workflowPath, "", workflowId)}

3. **Report pre-checks**:
✓ Gitignore files validated (based on tech stack from plan.md)
✓ .dockerignore, .eslintignore, .npmignore checked if applicable
✓ Implementation checklist generated → checklists/implementation.md

---

**THEN execute the following implement command to coordinate implementation**:

---

${prompt}

---

This command will coordinate task execution using the Multi-Role system.
Progress will be logged to: \`.cortex/workflows/${args.workflowId}/execution/\`

**NOTE**: TaskDecomposer and ImplementationValidator services are available for:
- Breaking down large tasks: \`new TaskDecomposer('${this.projectRoot}').decomposeTask(...)\`
- Validating implementation: \`new ImplementationValidator('${this.projectRoot}').validate([...files])\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to start implementation: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle task decomposition - Break down a large task into smaller subtasks
   */
  async handleTaskDecomposition(args: {
    workflowId: string;
    taskId: string;
    taskDescription: string;
  }): Promise<MCPToolResult> {
    try {
      const decomposer = new TaskDecomposer();

      // Analyze the task
      const analysis = decomposer.analyzeTask(args.taskDescription);

      if (!analysis.isTooLarge) {
        return {
          content: [
            {
              type: "text",
              text: `Task ${args.taskId} does not need decomposition.\nComplexity is manageable - proceed with implementation.`,
            },
          ],
        };
      }

      // Task needs decomposition
      const breakdown = analysis.suggestedBreakdown || [];
      const subtasksText = breakdown
        .map(
          (st, i) =>
            `${args.taskId}-${i + 1}: ${st.description}\n  Dependencies: ${st.dependencies.join(", ") || "none"}\n  Acceptance: ${st.acceptanceCriteria.join(", ")}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `⚠️ Task ${args.taskId} is TOO LARGE and must be decomposed.\n\n**Reason**: ${analysis.reason}\n**Estimated tokens**: ${analysis.estimatedTokens}\n\n**Suggested Breakdown**:\n\n${subtasksText}\n\n**REQUIRED ACTION**: Update tasks.md with these subtasks before proceeding.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to decompose task: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle implementation validation - Check for mocks, TODOs, unused code
   */
  async handleImplementationValidation(args: {
    changedFiles: string[];
  }): Promise<MCPToolResult> {
    try {
      const validator = new ImplementationValidator(this.projectRoot);
      const result = await validator.validateImplementation(args.changedFiles);

      if (result.isComplete) {
        return {
          content: [
            {
              type: "text",
              text: "✅ Implementation validation passed:\n- No TODO/FIXME comments\n- No mock data or placeholders\n- No unused code (Knip)\n- No scaffold patterns\n\nReady to proceed.",
            },
          ],
        };
      } else {
        // Format issues
        const issuesText = result.issues
          .map(
            (issue) =>
              `**${issue.severity.toUpperCase()}** [${issue.type}] ${issue.file}:${issue.line}\n  ${issue.description}`
          )
          .join("\n\n");

        // Generate fix tasks
        const fixTasks = validator.generateFixTasks(result.issues);
        const fixTasksText = fixTasks
          .map(
            (task) => `- [ ] ${task.id} (${task.priority}): ${task.description}`
          )
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `❌ Implementation validation FAILED:\n\n**Issues Found**:\n${issuesText}\n\n**Fix Tasks Required**:\n${fixTasksText}\n\n**REQUIRED ACTION**: Fix all blocker issues before proceeding.\n- Mock detected: ${result.mockDetected}\n- Scaffold detected: ${result.scaffoldDetected}\n- Unused code: ${result.unusedCodeDetected}`,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to validate implementation: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Simple task parser from markdown (can be improved)
   */
  private parseTasksFromMarkdown(content: string): Array<{
    id: string;
    description: string;
    status: "pending" | "completed" | "blocked";
  }> {
    const tasks: Array<{
      id: string;
      description: string;
      status: "pending" | "completed" | "blocked";
    }> = [];

    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^- \[([ xX])\] (T-[\w-]+): (.+)$/);
      if (match) {
        const status = match[1] === " " ? "pending" : "completed";
        tasks.push({
          id: match[2],
          description: match[3],
          status,
        });
      }
    }

    return tasks;
  }

  /**
   * Handle cortex.context - Enhance context from memory
   */
  async handleContext(args: { query: string }): Promise<MCPToolResult> {
    try {
      const context = await this.memoryService.enhanceContext(args.query);

      if (!context) {
        return {
          content: [
            {
              type: "text",
              text: "No relevant experiences found in memory for this query.",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: context,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to enhance context: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle cortex.correct - Record correction to prevent future mistakes
   */
  async handleCorrect(args: {
    wrongBehavior: string;
    correctBehavior: string;
    severity?: string;
    filePatterns?: string[];
    triggerKeywords?: string[];
  }): Promise<MCPToolResult> {
    try {
      const correctionId = await this.correctionService.recordCorrection({
        wrongBehavior: args.wrongBehavior,
        correctBehavior: args.correctBehavior,
        severity:
          (args.severity as "minor" | "moderate" | "major" | undefined) ||
          "moderate",
        context: {
          filePatterns: args.filePatterns || [],
          techStack: [],
          triggerKeywords: args.triggerKeywords || [],
          phases: [],
        },
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ Correction recorded successfully!

**ID**: ${correctionId}
**Wrong**: ${args.wrongBehavior}
**Correct**: ${args.correctBehavior}
**Severity**: ${args.severity || "moderate"}

This correction has been saved to project memory. The AI will be warned before repeating similar mistakes in future sessions.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to record correction: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle cortex.learn - Record experience to memory
   */
  async handleLearn(args: {
    title: string;
    content: string;
    type: string;
    tags?: string[];
  }): Promise<MCPToolResult> {
    try {
      const experienceId = await this.memoryService.recordExperience({
        title: args.title,
        content: args.content,
        type: args.type as "pattern" | "decision" | "solution" | "lesson",
        tags: args.tags || [],
      });

      return {
        content: [
          {
            type: "text",
            text: `Experience recorded successfully!

**ID**: ${experienceId}
**Type**: ${args.type}
**Title**: ${args.title}

This experience is now searchable via \`cortex.context\`.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to record experience: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle status - Get workflow status
   */
  async handleStatus(args: { workflowId?: string }): Promise<MCPToolResult> {
    try {
      const workflowId = await this.ensureWorkflowId(args.workflowId);
      const status = await this.workflowService.getWorkflowStatus(workflowId);

      return {
        content: [
          {
            type: "text",
            text: `## Workflow Status

**ID**: ${status.workflow.id}
**Title**: ${status.workflow.title}
**Status**: ${status.workflow.status.toUpperCase()}
**Created**: ${status.workflow.createdAt}
**Updated**: ${status.workflow.updatedAt}

### Progress
- Completed phases: ${status.completedPhases.join(", ") || "None"}
- Current phase: ${status.currentPhase}
- Next phase: ${status.nextPhase}

### Current Role
${status.workflow.currentRole || "None assigned"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get workflow status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle list - List workflows
   */
  async handleList(args: { limit?: number }): Promise<MCPToolResult> {
    try {
      const workflows = await this.workflowService.listWorkflows(
        args.limit || 10
      );

      if (workflows.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No workflows found. Create one with `spec <description>`.",
            },
          ],
        };
      }

      const lines = ["## Active Workflows", ""];
      for (const workflow of workflows) {
        lines.push(`### ${workflow.title}`);
        lines.push(`- **ID**: ${workflow.id}`);
        lines.push(`- **Status**: ${workflow.status.toUpperCase()}`);
        lines.push(`- **Updated**: ${workflow.updatedAt}`);
        lines.push("");
      }

      return {
        content: [
          {
            type: "text",
            text: lines.join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to list workflows: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle release - Analyze changes and generate release documentation
   */
  async handleRelease(args: {
    version?: string;
    tag?: boolean;
    push?: boolean;
  }): Promise<MCPToolResult> {
    try {
      // 1. Detect project conventions
      const detector = new ProjectDetector(this.projectRoot);
      const conventions = await detector.analyze();

      // 2. Analyze changes
      const analyzer = new ChangeAnalyzer(this.projectRoot);
      const analysis = await analyzer.analyze(conventions);

      // 3. Load release command template
      const commandPath = path.join(
        this.projectRoot,
        ".cortex",
        "templates",
        "commands",
        "release.md"
      );
      if (!(await fs.pathExists(commandPath))) {
        return {
          content: [
            {
              type: "text",
              text: "Error: release.md command template not found. Run cortex init to set up templates.",
            },
          ],
          isError: true,
        };
      }

      const command = await fs.readFile(commandPath, "utf-8");

      // 4. Build context for AI
      const context = `
## Release Context

**Project Conventions**:
- Has CHANGELOG: ${conventions.hasChangelog}
- Has RELEASE_NOTES: ${conventions.hasReleaseNotes}
- Uses Conventional Commits: ${conventions.usesConventionalCommits}
- Commit Types: ${conventions.commitTypes.join(", ")}
- Has Cortex Workflows: ${conventions.hasCortexWorkflows} (${conventions.workflowCount} workflows)

**Change Analysis**:
- Git Commits: ${analysis.gitCommits.length}
- Workflow Changes: ${analysis.workflowChanges.length}
- Merged Changes: ${analysis.mergedChanges.length}

**Changes Summary**:
${analysis.mergedChanges
  .map((c, i) => `${i + 1}. [${c.type}] ${c.description}`)
  .slice(0, 20)
  .join("\n")}
${analysis.mergedChanges.length > 20 ? `\n... and ${analysis.mergedChanges.length - 20} more changes` : ""}

**Arguments**:
- Version: ${args.version || "auto-detect"}
- Create Tag: ${args.tag || false}
- Push to Remote: ${args.push || false}
`;

      // 5. Return command + context to AI
      return {
        content: [
          {
            type: "text",
            text: `${command}\n\n${context}\n\nPlease execute the release process as specified in the command above.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to prepare release: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle onboard - Interactive onboarding for first-time users
   */
  async handleOnboard(): Promise<MCPToolResult> {
    try {
      // 1. Check current state
      const cortexDir = path.join(this.projectRoot, ".cortex");
      const needsInit = !(await fs.pathExists(cortexDir));
      const needsConstitution = !(await fs.pathExists(
        path.join(cortexDir, "templates", "constitution.md")
      ));

      // 2. Load onboard command template
      const commandPath = path.join(
        this.projectRoot,
        ".cortex",
        "templates",
        "commands",
        "onboard.md"
      );

      // If command doesn't exist yet (first time), use built-in
      let command: string;
      if (await fs.pathExists(commandPath)) {
        command = await fs.readFile(commandPath, "utf-8");
      } else {
        // Return instructions to run cortex init first
        return {
          content: [
            {
              type: "text",
              text: `
## Welcome to Cortex AI!

It looks like this is your first time using Cortex in this project.

**Initial Setup Required:**

Please run the following command first to initialize the basic structure:
\`\`\`bash
cortex init
\`\`\`

This will create:
- .cortex/ directory structure
- Template files
- Command files

After initialization completes, run \`cortex.onboard\` again to continue with the interactive setup.
`,
            },
          ],
        };
      }

      // 3. Build context for AI
      const context = `
## Onboarding Context

**Current State**:
- .cortex/ exists: ${!needsInit}
- Constitution exists: ${!needsConstitution}
- Project root: ${this.projectRoot}

**Detected Files**:
- package.json: ${await fs.pathExists(path.join(this.projectRoot, "package.json"))}
- requirements.txt: ${await fs.pathExists(path.join(this.projectRoot, "requirements.txt"))}
- go.mod: ${await fs.pathExists(path.join(this.projectRoot, "go.mod"))}
- README.md: ${await fs.pathExists(path.join(this.projectRoot, "README.md"))}
- .git/: ${await fs.pathExists(path.join(this.projectRoot, ".git"))}

**What needs to be done**:
${needsInit ? "- Initialize .cortex/ structure" : "✓ .cortex/ already initialized"}
${needsConstitution ? "- Create constitution via Q&A" : "✓ Constitution already exists"}
`;

      // 4. Return command + context to AI
      return {
        content: [
          {
            type: "text",
            text: `${command}\n\n${context}\n\nPlease execute the onboarding process as specified above.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to start onboarding: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle constitution - Create or update project constitution
   */
  async handleConstitution(args: { updates?: string }): Promise<MCPToolResult> {
    try {
      const constitutionPath = path.join(
        this.projectRoot,
        ".cortex",
        "constitution.md"
      );

      // Load constitution command template
      const commandPath = path.join(
        this.projectRoot,
        ".cortex",
        "templates",
        "commands",
        "constitution.md"
      );

      if (!(await fs.pathExists(commandPath))) {
        return {
          content: [
            {
              type: "text",
              text: `Constitution command template not found. Please run \`cortex init\` first.

The constitution command template should be at: ${commandPath}`,
            },
          ],
          isError: true,
        };
      }

      const command = await fs.readFile(commandPath, "utf-8");

      // Build context for AI
      const context = `
## Current State

**Constitution Path**: ${constitutionPath}
**Constitution Exists**: ${(await fs.pathExists(constitutionPath)) ? "Yes" : "No (will be created)"}

${args.updates ? `**Requested Updates**: ${args.updates}\n` : "**Mode**: Interactive (AI will guide through constitution creation/update)\n"}

## Your Task

You are helping the user create or update their project constitution. Follow the instructions in the command template above.

${args.updates ? "Focus on the specific updates requested by the user." : "Guide the user through the constitution creation/update process interactively."}
`;

      return {
        content: [
          {
            type: "text",
            text: `${command}\n\n${context}\n\nPlease execute the constitution management process as specified above.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to manage constitution: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle checkpoint-save - Save task progress
   */
  async handleCheckpointSave(args: {
    taskDescription: string;
    completed?: CheckpointFile[];
    pending?: CheckpointFile[];
    context?: string;
    nextStep?: string;
    workflowId?: string;
  }): Promise<MCPToolResult> {
    try {
      // Get current git info
      let branch: string | undefined;
      let lastCommit: string | undefined;

      try {
        const { execSync } = await import("node:child_process");
        branch = execSync("git rev-parse --abbrev-ref HEAD", {
          cwd: this.projectRoot,
          encoding: "utf-8",
        }).trim();
        lastCommit = execSync("git rev-parse --short HEAD", {
          cwd: this.projectRoot,
          encoding: "utf-8",
        }).trim();
      } catch {
        // Git info optional
      }

      // Get modified files from git
      let modifiedFiles: string[] = [];
      try {
        const { execSync } = await import("node:child_process");
        const gitStatus = execSync("git status --porcelain", {
          cwd: this.projectRoot,
          encoding: "utf-8",
        });
        modifiedFiles = gitStatus
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => line.substring(3).trim());
      } catch {
        // Modified files optional
      }

      const checkpointId = await this.checkpointService.saveCheckpoint({
        taskDescription: args.taskDescription,
        completed: args.completed || [],
        pending: args.pending || [],
        context: args.context || "",
        nextStep: args.nextStep || "",
        workflowId: args.workflowId,
        metadata: {
          branch,
          lastCommit,
          modifiedFiles,
          totalFiles: 0, // Will be calculated by service
          completedCount: 0, // Will be calculated by service
        },
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ **Checkpoint saved successfully!**

**Checkpoint ID**: ${checkpointId}
**Task**: ${args.taskDescription}
**Progress**: ${args.completed?.length || 0} completed, ${args.pending?.length || 0} pending
${branch ? `**Branch**: ${branch}` : ""}

You can resume this task later using:
\`checkpoint-resume ${checkpointId}\`

Or resume from the latest checkpoint:
\`checkpoint-resume\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to save checkpoint: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle checkpoint-resume - Resume from checkpoint
   */
  async handleCheckpointResume(args: {
    checkpointId?: string;
  }): Promise<MCPToolResult> {
    try {
      let checkpoint: Checkpoint | null;

      if (args.checkpointId) {
        checkpoint = await this.checkpointService.loadCheckpoint(
          args.checkpointId
        );
        if (!checkpoint) {
          return {
            content: [
              {
                type: "text",
                text: `Checkpoint not found: ${args.checkpointId}\n\nUse \`checkpoint-list\` to see available checkpoints.`,
              },
            ],
            isError: true,
          };
        }
      } else {
        checkpoint = await this.checkpointService.getLatestCheckpoint();
        if (!checkpoint) {
          return {
            content: [
              {
                type: "text",
                text: "No checkpoints found. Save a checkpoint first using `checkpoint-save`.",
              },
            ],
            isError: true,
          };
        }
      }

      // Format checkpoint context
      const context =
        this.checkpointService.formatCheckpointAsContext(checkpoint);

      // Mark as active
      await this.checkpointService.setCheckpointActive(checkpoint.id, true);

      return {
        content: [
          {
            type: "text",
            text: `${context}

**Instructions**:
1. Review the completed files and context above
2. Continue with the pending files in order
3. Follow the next step guidance
4. Save a new checkpoint after completing each file

Ready to continue!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to resume checkpoint: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle checkpoint-list - List saved checkpoints
   */
  async handleCheckpointList(args: { limit?: number }): Promise<MCPToolResult> {
    try {
      const checkpoints = await this.checkpointService.listCheckpoints(
        args.limit || 10
      );

      if (checkpoints.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No checkpoints found.\n\nSave a checkpoint using `checkpoint-save` to enable resumable work sessions.",
            },
          ],
        };
      }

      const lines = ["## 📍 Saved Checkpoints", ""];

      for (const checkpoint of checkpoints) {
        const date = new Date(checkpoint.checkpoint).toLocaleString();
        const progress = `${checkpoint.completedCount}/${checkpoint.totalFiles}`;
        const status = checkpoint.isActive ? "🟢" : "⚪";

        lines.push(`### ${status} ${checkpoint.taskDescription}`);
        lines.push(`- **ID**: \`${checkpoint.id}\``);
        lines.push(`- **Progress**: ${progress} files`);
        lines.push(`- **Checkpoint**: ${date}`);
        lines.push("");
      }

      lines.push(
        "**Resume a checkpoint**: `checkpoint-resume <checkpoint-id>`"
      );
      lines.push("**Resume latest**: `checkpoint-resume`");

      return {
        content: [
          {
            type: "text",
            text: lines.join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to list checkpoints: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle checkpoint-clear - Clear checkpoint(s)
   */
  async handleCheckpointClear(args: {
    checkpointId?: string;
    all?: boolean;
  }): Promise<MCPToolResult> {
    try {
      if (args.all) {
        const count = await this.checkpointService.clearAllCheckpoints();
        return {
          content: [
            {
              type: "text",
              text: `✅ Cleared ${count} checkpoint(s).`,
            },
          ],
        };
      }

      if (!args.checkpointId) {
        return {
          content: [
            {
              type: "text",
              text: "Please specify a checkpoint ID or use `all: true` to clear all checkpoints.",
            },
          ],
          isError: true,
        };
      }

      const success = await this.checkpointService.clearCheckpoint(
        args.checkpointId
      );
      if (!success) {
        return {
          content: [
            {
              type: "text",
              text: `Checkpoint not found: ${args.checkpointId}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ Checkpoint cleared: ${args.checkpointId}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to clear checkpoint: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
