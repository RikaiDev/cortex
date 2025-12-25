/**
 * Handler Utilities
 *
 * Shared utility methods for all handlers
 */

import { WorkflowService } from "../../services/workflow-service.js";

export class HandlerUtils {
  /**
   * Ensure workflow ID exists (use provided or get latest)
   * @throws Error if no workflow found
   */
  static async ensureWorkflowId(
    workflowService: WorkflowService,
    providedId?: string
  ): Promise<string> {
    const workflowId =
      providedId || (await workflowService.getLatestWorkflow());
    if (!workflowId) {
      throw new Error("No workflow found. Create one first with `spec`.");
    }
    return workflowId;
  }

  /**
   * Generate checklist instruction block for AI to execute
   */
  static generateChecklistInstruction(
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
}
