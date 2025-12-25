/**
 * Specification Handler
 *
 * Handles specification creation and clarification phases
 * - spec: Create initial feature specification
 * - clarify: Resolve specification ambiguities
 */

import * as path from "node:path";
import { MCPTool } from "../../decorators/index.js";
import { TemplateGenerator } from "../../services/template-generator.js";
import { WorkflowService } from "../../services/workflow-service.js";
import { MemoryService } from "../../services/memory/index.js";
import { HandlerUtils } from "../utils/handler-utils.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class SpecHandler {
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
   * Handle spec - Create feature specification
   */
  @MCPTool({
    name: "spec",
    description:
      "Create a new workflow with feature specification (starts the development lifecycle)",
    inputSchema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Description of the feature to build",
        },
      },
      required: ["description"],
    },
  })
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
  @MCPTool({
    name: "clarify",
    description:
      "Resolve ambiguities in a workflow specification through targeted questions",
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
}
