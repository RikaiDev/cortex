/**
 * Handoff Service
 */

import * as path from "path";
import fs from "fs-extra";
import { TextProcessor } from "../utils/text-processor.js";
import { MCPToolResult } from "../types/mcp-types.js";

export class HandoffService {
  constructor(private projectRoot: string) {}

  /**
   * Update handoff.md with AI-processed result
   */
  async updateHandoffWithAIResult(
    workflowId: string,
    roleId: string,
    result: string
  ): Promise<MCPToolResult> {
    try {
      const handoffFile = path.join(
        this.projectRoot,
        ".cortex",
        "workspaces",
        workflowId,
        "handoff.md"
      );

      if (fs.existsSync(handoffFile)) {
        const handoffContent = fs.readFileSync(handoffFile, "utf-8");

        // Generate structured, concise handoff content
        const structuredResult = TextProcessor.generateStructuredHandoff(
          roleId,
          result
        );

        // Replace the placeholder content with the structured AI result
        const placeholderPattern =
          /## Role Context for Cursor AI Processing[\s\S]*?\*\*Note:\*\* This role execution should be completed by Cursor's AI capabilities, not by the MCP server\./;
        const updatedContent = handoffContent.replace(
          placeholderPattern,
          structuredResult
        );

        fs.writeFileSync(handoffFile, updatedContent);
      }

      return {
        content: [
          {
            type: "text",
            text: ` Role result submitted successfully! Role: ${roleId}

AI GUIDANCE: AI-processed result has been submitted and saved to handoff.md. You can now:

1.  execute-workflow-role - Continue with the next role in the workflow
2.  create-pull-request - Create a pull request if workflow is completed
3.  enhance-context - Get more context for the next role

**Current Status:**
- AI result saved to handoff.md
- Ready for next role execution
- Workflow context updated

Recommended next action: Call execute-workflow-role to continue with the next role.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to submit role result: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Generate role prompt for AI processing
   */
  async generateRolePrompt(
    workflowId: string,
    roleId: string,
    workflowState: Record<string, unknown>,
    role: Record<string, unknown>
  ): Promise<MCPToolResult> {
    try {
      // Read handoff.md content
      const handoffFile = path.join(
        this.projectRoot,
        ".cortex",
        "workspaces",
        workflowId,
        "handoff.md"
      );
      let handoffContent = "";
      if (fs.existsSync(handoffFile)) {
        handoffContent = fs.readFileSync(handoffFile, "utf-8");
      }

      // Create structured prompt for AI processing
      const prompt = `# AI Role Processing Prompt

## Role Information
- **Role ID:** ${roleId}
- **Role Name:** ${role.name}
- **Role Description:** ${role.description}
- **System Prompt:** ${role.systemPrompt || role.description}

## Task Context
- **Workflow ID:** ${workflowId}
- **Task Title:** ${workflowState.title}
- **Task Description:** ${workflowState.description}

## Previous Context
${handoffContent || "No previous context available"}

## Instructions for AI Processing
Please process this task according to the role's expertise and system prompt. Your output should be:

1. **Analysis:** Understand the task requirements and context
2. **Recommendations:** Provide specific, actionable recommendations
3. **Implementation:** If applicable, provide implementation details
4. **Handoff:** Prepare clear information for the next role in the workflow

## Expected Output Format
- Structured analysis and recommendations
- Clear actionable steps
- Specific implementation details where applicable
- Clear handoff information for the next role

**Important:** This is a real task that requires actual AI processing, not template content. Please provide genuine analysis and recommendations based on the role's expertise.`;

      return {
        content: [
          {
            type: "text",
            text: `Structured prompt generated for role: ${roleId}

AI GUIDANCE: Use this prompt to process the role context with Cursor AI. The prompt contains:

1. Role information and system prompt
2. Task context and description
3. Previous context from handoff.md
4. Clear instructions for AI processing
5. Expected output format

**Next Steps:**
1. Use this prompt with Cursor AI to process the role context
2. Generate actual analysis and recommendations
3. Call submit-role-result to save the AI-processed results

**Prompt Content:**
${prompt}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get role prompt: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
