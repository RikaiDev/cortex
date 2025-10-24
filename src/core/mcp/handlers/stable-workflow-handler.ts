/**
 * Stable Workflow Handler
 * 
 * Handles cortex.* tools for the stable workflow system
 * (spec, plan, tasks, implement, context, learn)
 */

import * as path from 'node:path';
import { MemoryService } from '../services/memory-service.js';
import { TemplateGenerator } from '../services/template-generator.js';
import { ConstitutionValidator } from '../services/constitution-validator.js';
import { WorkflowService } from '../services/workflow-service.js';
import { GitignoreValidator } from '../services/gitignore-validator.js';
import { ContextManager } from '../services/context-manager.js';
import { ChecklistGenerator } from '../services/checklist-generator.js';
import type { MCPToolResult } from '../types/mcp-types.js';

export class StableWorkflowHandler {
  private memoryService: MemoryService;
  private templateGenerator: TemplateGenerator;
  private constitutionValidator: ConstitutionValidator;
  private workflowService: WorkflowService;

  constructor(private projectRoot: string) {
    this.memoryService = new MemoryService(projectRoot);
    this.templateGenerator = new TemplateGenerator(projectRoot, this.memoryService);
    this.constitutionValidator = new ConstitutionValidator(projectRoot);
    this.workflowService = new WorkflowService(projectRoot);
  }

  /**
   * Handle cortex.spec - Create feature specification
   */
  async handleSpec(args: { description: string }): Promise<MCPToolResult> {
    try {
      // 1. Create workflow with readable ID
      const workflowId = await this.workflowService.createWorkflow(args.description);
      const workflowPath = path.join(this.projectRoot, '.cortex', 'workflows', workflowId);

      // 2. Generate prompt (command + template)
      const prompt = await this.templateGenerator.generateSpecPrompt(args.description);

      // 3. Return prompt to AI for execution
      return {
        content: [
          {
            type: 'text',
            text: `## Workflow Created: ${workflowId}

Please execute the following specification command to generate spec.md:

---

${prompt}

---

After generating the specification, save it to:
\`.cortex/workflows/${workflowId}/spec.md\`

**THEN immediately execute this automated step**:

1. **Generate Requirements Checklist**:
\`\`\`typescript
const checklistGenerator = new ChecklistGenerator('${workflowPath}');
await checklistGenerator.generateChecklist('requirements', '${args.description}');
\`\`\`

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
            type: 'text',
            text: `Failed to create specification: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle cortex.clarify - Resolve specification ambiguities
   */
  async handleClarify(args: { workflowId: string }): Promise<MCPToolResult> {
    try {
      // 1. Generate prompt (command + current spec)
      const prompt = await this.templateGenerator.generateClarifyPrompt(args.workflowId);

      // 2. Return prompt to AI for execution
      return {
        content: [
          {
            type: 'text',
            text: `Please execute the following clarify command to resolve ambiguities in spec.md:

---

${prompt}

---

This command will:
1. Scan the specification for ambiguities (11 categories)
2. Ask up to 5 targeted questions sequentially
3. Update spec.md after each answer
4. Save clarifications to \`.cortex/workflows/${args.workflowId}/clarifications.md\`

**Note**: Questions are asked ONE AT A TIME. Answer each before the next is presented.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to start clarification: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle cortex.plan - Create implementation plan
   */
  async handlePlan(args: { workflowId: string }): Promise<MCPToolResult> {
    try {
      const workflowPath = path.join(this.projectRoot, '.cortex', 'workflows', args.workflowId);
      
      // 1. Generate prompt (command + template)
      const prompt = await this.templateGenerator.generatePlanPrompt(args.workflowId);

      // 2. Return prompt to AI for execution
      return {
        content: [
          {
            type: 'text',
            text: `Please execute the following plan command to generate plan.md:

---

${prompt}

---

After generating the plan, save it to:
\`.cortex/workflows/${args.workflowId}/plan.md\`

**THEN immediately execute these automated steps**:

1. **Update Context Memory**:
\`\`\`typescript
const contextManager = new ContextManager('${workflowPath}');
await contextManager.updateContext('${args.workflowId}');
\`\`\`

2. **Generate Design Checklist**:
\`\`\`typescript
const checklistGenerator = new ChecklistGenerator('${workflowPath}');
await checklistGenerator.generateChecklist('design', workflowTitle);
\`\`\`

3. **Report completion**:
✓ plan.md created
✓ Context memory updated → CONTEXT.md
✓ Design checklist generated → checklists/design.md

**Next steps**:
- Review (optional): \`cortex.review ${args.workflowId}\`
- Or proceed to tasks: \`cortex.tasks ${args.workflowId}\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to create plan: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle cortex.review - Technical review of implementation plan
   */
  async handleReview(args: { workflowId: string }): Promise<MCPToolResult> {
    try {
      // 1. Generate prompt (command + plan to review)
      const prompt = await this.templateGenerator.generateReviewPrompt(args.workflowId);

      // 2. Return prompt to AI for execution
      return {
        content: [
          {
            type: 'text',
            text: `Please execute the following review command to conduct technical review:

---

${prompt}

---

This command will:
1. Review plan.md across 6 categories (Architecture, Security, Performance, Maintainability, Data Model, Integration)
2. Check constitution compliance
3. Categorize action items (Must Fix, Should Fix, Consider)
4. Make overall decision (Approved, Approved with Changes, Needs Major Revision)
5. Save review to \`.cortex/workflows/${args.workflowId}/review.md\`

**After review**:
- If APPROVED: Proceed to \`cortex.tasks ${args.workflowId}\`
- If APPROVED WITH CHANGES: Address action items, update plan.md, then proceed
- If NEEDS MAJOR REVISION: Make substantial changes and re-run review`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to start review: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle cortex.tasks - Generate task breakdown
   */
  async handleTasks(args: { workflowId: string }): Promise<MCPToolResult> {
    try {
      const workflowPath = path.join(this.projectRoot, '.cortex', 'workflows', args.workflowId);
      
      // 1. Generate prompt (command + template)
      const prompt = await this.templateGenerator.generateTasksPrompt(args.workflowId);

      // 2. Return prompt to AI for execution
      return {
        content: [
          {
            type: 'text',
            text: `Please execute the following tasks command to generate tasks.md:

---

${prompt}

---

After generating the task breakdown, save it to:
\`.cortex/workflows/${args.workflowId}/tasks.md\`

**THEN immediately execute this automated step**:

1. **Generate Tasks Checklist**:
\`\`\`typescript
const checklistGenerator = new ChecklistGenerator('${workflowPath}');
const workflowData = await workflowService.getWorkflowStatus('${args.workflowId}');
await checklistGenerator.generateChecklist('tasks', workflowData.workflow.title);
\`\`\`

2. **Report completion**:
✓ tasks.md created
✓ Tasks checklist generated → checklists/tasks.md

**Next steps**:
- Review task breakdown
- When ready: \`cortex.implement ${args.workflowId}\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to create tasks: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle cortex.implement - Execute implementation
   */
  async handleImplement(args: { workflowId: string }): Promise<MCPToolResult> {
    try {
      const workflowPath = path.join(this.projectRoot, '.cortex', 'workflows', args.workflowId);
      const planPath = path.join(workflowPath, 'plan.md');
      
      // 1. Generate prompt (implementation coordinator)
      const prompt = await this.templateGenerator.generateImplementPrompt(args.workflowId);

      // 2. Return prompt to AI for execution
      return {
        content: [
          {
            type: 'text',
            text: `**FIRST execute these automated pre-implementation checks**:

1. **Validate Gitignore Files**:
\`\`\`typescript
const validator = new GitignoreValidator('${this.projectRoot}');
await validator.validateIgnoreFiles('${planPath}');
\`\`\`

2. **Generate Implementation Checklist**:
\`\`\`typescript
const checklistGenerator = new ChecklistGenerator('${workflowPath}');
const workflowData = await workflowService.getWorkflowStatus('${args.workflowId}');
await checklistGenerator.generateChecklist('implementation', workflowData.workflow.title);
\`\`\`

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
Progress will be logged to: \`.cortex/workflows/${args.workflowId}/execution/\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to start implementation: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
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
              type: 'text',
              text: 'No relevant experiences found in memory for this query.',
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: context,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to enhance context: ${error instanceof Error ? error.message : String(error)}`,
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
        type: args.type as 'pattern' | 'decision' | 'solution' | 'lesson',
        tags: args.tags || [],
      });

      return {
        content: [
          {
            type: 'text',
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
            type: 'text',
            text: `Failed to record experience: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle cortex.status - Get workflow status
   */
  async handleStatus(args: { workflowId: string }): Promise<MCPToolResult> {
    try {
      const status = await this.workflowService.getWorkflowStatus(args.workflowId);

      return {
        content: [
          {
            type: 'text',
            text: `## Workflow Status

**ID**: ${status.workflow.id}
**Title**: ${status.workflow.title}
**Status**: ${status.workflow.status.toUpperCase()}
**Created**: ${status.workflow.createdAt}
**Updated**: ${status.workflow.updatedAt}

### Progress
- Completed phases: ${status.completedPhases.join(', ') || 'None'}
- Current phase: ${status.currentPhase}
- Next phase: ${status.nextPhase}

### Current Role
${status.workflow.currentRole || 'None assigned'}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to get workflow status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle cortex.list - List workflows
   */
  async handleList(args: { limit?: number }): Promise<MCPToolResult> {
    try {
      const workflows = await this.workflowService.listWorkflows(args.limit || 10);

      if (workflows.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No workflows found. Create one with `cortex.spec <description>`.',
            },
          ],
        };
      }

      const lines = ['## Active Workflows', ''];
      for (const workflow of workflows) {
        lines.push(`### ${workflow.title}`);
        lines.push(`- **ID**: ${workflow.id}`);
        lines.push(`- **Status**: ${workflow.status.toUpperCase()}`);
        lines.push(`- **Updated**: ${workflow.updatedAt}`);
        lines.push('');
      }

      return {
        content: [
          {
            type: 'text',
            text: lines.join('\n'),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to list workflows: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}

