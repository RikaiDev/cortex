/**
 * Planning Handler
 *
 * Handles planning and review phases
 * - plan: Create implementation plan
 * - review: Technical review of implementation plan
 */

import * as path from "node:path";
import { MCPTool } from "../../decorators/index.js";
import { TemplateGenerator } from "../../services/template-generator.js";
import { WorkflowService } from "../../services/workflow-service.js";
import { MemoryService } from "../../services/memory/index.js";
import { HandlerUtils } from "../utils/handler-utils.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class PlanningHandler {
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
   * Handle plan - Create implementation plan
   */
  @MCPTool({
    name: "plan",
    description: "Create an implementation plan for a workflow specification",
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

After generating the implementation plan, save it to:
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
  @MCPTool({
    name: "review",
    description:
      "Conduct a technical review of the implementation plan before execution",
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

After completing the review:
- Save review results to \`.cortex/workflows/${workflowId}/review.md\`
- Update plan.md if critical issues found

**Next steps**:
- If APPROVED: Proceed to tasks: \`tasks\`
- If NEEDS MINOR REVISION: Make quick fixes and re-run review
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
}
