/**
 * Execution Handler
 *
 * Handles task breakdown and implementation execution phases
 * - tasks: Generate detailed task breakdown
 * - implement: Execute implementation with Multi-Role coordination
 */

import * as path from "node:path";
import { MCPTool } from "../../decorators/index.js";
import { TemplateGenerator } from "../../services/template-generator.js";
import { WorkflowService } from "../../services/workflow-service.js";
import { MemoryService } from "../../services/memory-service.js";
import { HandlerUtils } from "../utils/handler-utils.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class ExecutionHandler {
  private templateGenerator: TemplateGenerator;
  private workflowService: WorkflowService;
  private memoryService: MemoryService;

  constructor(private projectRoot: string) {
    this.memoryService = new MemoryService(projectRoot);
    this.templateGenerator = new TemplateGenerator(
      projectRoot,
      this.memoryService
    );
    this.workflowService = new WorkflowService(projectRoot);
  }

  /**
   * Ensure workflow ID exists (use provided or get latest)
   */
  private async ensureWorkflowId(providedId?: string): Promise<string> {
    return HandlerUtils.ensureWorkflowId(this.workflowService, providedId);
  }

  /**
   * Generate checklist instruction
   */
  private generateChecklistInstruction(
    checklistType: string,
    workflowPath: string,
    featureName: string,
    workflowId?: string
  ): string {
    return HandlerUtils.generateChecklistInstruction(
      checklistType,
      workflowPath,
      featureName,
      workflowId
    );
  }

  /**
   * Handle tasks - Generate task breakdown
   */
  @MCPTool({
    name: "tasks",
    description:
      "Generate a detailed task breakdown from the implementation plan",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: {
          type: "string",
          description: "Workflow ID (optional, uses latest if not provided)",
        },
      },
    },
  })
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
  @MCPTool({
    name: "implement",
    description:
      "Start implementation execution with Multi-Role AI coordination",
    inputSchema: {
      type: "object",
      properties: {
        workflowId: {
          type: "string",
          description: "Workflow ID (optional, uses latest if not provided)",
        },
      },
    },
  })
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

${prompt}

---

**Tools available during implementation**:
- Task decomposition: \`new TaskDecomposer().analyzeTask(description)\`
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
}
