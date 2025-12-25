/**
 * Template Generator Service
 * 
 * Generates phase documents (spec, plan, tasks) from templates
 * with variable replacement and context enhancement.
 */

import * as path from 'node:path';
import fs from 'fs-extra';
import type { TemplateVariables } from '../types/template.js';
import type { MemoryService } from './memory-service.js';
import { CorrectionService } from './correction-service.js';

export class TemplateGenerator {
  private templatesPath: string;
  private correctionService: CorrectionService;

  constructor(
    private projectRoot: string,
    private memoryService?: MemoryService
  ) {
    this.templatesPath = path.join(projectRoot, '.cortex', 'templates');
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

    return fs.readFile(templatePath, 'utf-8');
  }

  /**
   * Replace variables in template content
   */
  private replaceVariables(content: string, variables: TemplateVariables): string {
    let result = content;

    // Replace each variable
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined) {
        // Replace {VARIABLE} patterns
        const pattern = new RegExp(`\\{${key}\\}`, 'g');
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
      const { execSync } = await import('node:child_process');
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
      }).trim();
      return branch;
    } catch {
      return 'main';
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
      console.warn('Failed to get corrections context:', error);
      return '';
    }
  }

  /**
   * Generate specification prompt (command + template)
   * Returns prompt for AI to execute, not filled content
   */
  async generateSpecPrompt(description: string): Promise<string> {
    // 1. Load command (AI execution guide)
    const command = await this.loadTemplate('commands/spec.md');
    
    // 2. Load template (structure framework)
    const template = await this.loadTemplate('spec-template.md');
    
    // 3. Add relevant experiences from memory if available
    let memoryContext = '';
    if (this.memoryService) {
      try {
        const context = await this.memoryService.enhanceContext(description);
        if (context) {
          memoryContext = `\n\n## Relevant Past Experiences\n\n${context}`;
        }
      } catch (error) {
        console.warn('Failed to enhance context from memory:', error);
      }
    }

    // 4. Add corrections/warnings from previous sessions
    const correctionsContext = await this.getCorrectionsContext(
      description,
      'spec'
    );

    // 5. Combine into complete prompt
    return `${command}\n\n## Template to Fill\n\n${template}${memoryContext}${correctionsContext}`;
  }

  /**
   * Generate clarify prompt (command + current spec)
   * Returns prompt for AI to execute, not filled content
   */
  async generateClarifyPrompt(workflowId: string): Promise<string> {
    // 1. Load command (AI execution guide)
    const command = await this.loadTemplate('commands/clarify.md');
    
    // 2. Load current spec to analyze
    const workflowPath = path.join(this.projectRoot, '.cortex', 'workflows', workflowId);
    const specPath = path.join(workflowPath, 'spec.md');
    
    let currentSpec = '';
    if (await fs.pathExists(specPath)) {
      currentSpec = await fs.readFile(specPath, 'utf-8');
    } else {
      throw new Error(`Specification not found at ${specPath}. Run cortex.spec first.`);
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
    const command = await this.loadTemplate('commands/plan.md');

    // 2. Load template (structure framework)
    const template = await this.loadTemplate('plan-template.md');

    // 3. Replace $WORKFLOW_ID in command
    const commandWithId = command.replace(/\$WORKFLOW_ID/g, workflowId);

    // 4. Get workflow context for memory search
    const workflowPath = path.join(this.projectRoot, '.cortex', 'workflows', workflowId);
    const specPath = path.join(workflowPath, 'spec.md');
    let memoryContext = '';

    if (this.memoryService && (await fs.pathExists(specPath))) {
      try {
        const specContent = await fs.readFile(specPath, 'utf-8');
        // Extract feature name or use first 200 chars for search
        const featureMatch = specContent.match(/Feature:\s*(.+)/i);
        const searchQuery = featureMatch ? featureMatch[1] : specContent.slice(0, 200);
        const context = await this.memoryService.enhanceContext(searchQuery);
        if (context) {
          memoryContext = `\n\n## Relevant Past Experiences\n\n${context}`;
        }
      } catch (error) {
        console.warn('Failed to enhance context from memory:', error);
      }
    }

    // 5. Add corrections/warnings from previous sessions
    const specContent = (await fs.pathExists(specPath))
      ? await fs.readFile(specPath, 'utf-8')
      : '';
    const correctionsContext = await this.getCorrectionsContext(
      specContent.slice(0, 200),
      'plan'
    );

    // 6. Combine into complete prompt
    return `${commandWithId}\n\n## Template to Fill\n\n${template}${memoryContext}${correctionsContext}`;
  }

  /**
   * Generate review prompt (command + context)
   * Returns prompt for AI to execute technical review
   */
  async generateReviewPrompt(workflowId: string): Promise<string> {
    // 1. Load command (AI execution guide)
    const command = await this.loadTemplate('commands/review.md');
    
    // 2. Load plan to review
    const workflowPath = path.join(this.projectRoot, '.cortex', 'workflows', workflowId);
    const planPath = path.join(workflowPath, 'plan.md');
    
    let planContent = '';
    if (await fs.pathExists(planPath)) {
      planContent = await fs.readFile(planPath, 'utf-8');
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
    const command = await this.loadTemplate('commands/tasks.md');

    // 2. Load template (structure framework)
    const template = await this.loadTemplate('tasks-template.md');

    // 3. Replace $WORKFLOW_ID in command
    const commandWithId = command.replace(/\$WORKFLOW_ID/g, workflowId);

    // 4. Get workflow context for memory search
    const workflowPath = path.join(this.projectRoot, '.cortex', 'workflows', workflowId);
    const planPath = path.join(workflowPath, 'plan.md');
    let memoryContext = '';

    if (this.memoryService && (await fs.pathExists(planPath))) {
      try {
        const planContent = await fs.readFile(planPath, 'utf-8');
        // Use plan content for search (task decomposition patterns)
        const searchQuery = `task decomposition ${planContent.slice(0, 150)}`;
        const context = await this.memoryService.enhanceContext(searchQuery);
        if (context) {
          memoryContext = `\n\n## Relevant Past Experiences (Task Decomposition)\n\n${context}`;
        }
      } catch (error) {
        console.warn('Failed to enhance context from memory:', error);
      }
    }

    // 5. Add corrections/warnings from previous sessions
    const planContent = (await fs.pathExists(planPath))
      ? await fs.readFile(planPath, 'utf-8')
      : '';
    const correctionsContext = await this.getCorrectionsContext(
      planContent.slice(0, 200),
      'tasks'
    );

    // 6. Combine into complete prompt
    return `${commandWithId}\n\n## Template to Fill\n\n${template}${memoryContext}${correctionsContext}`;
  }

  /**
   * Generate implement prompt (command only, no template)
   * Implementation phase uses commands to coordinate execution
   */
  async generateImplementPrompt(workflowId: string): Promise<string> {
    // 1. Load command (execution coordinator)
    const command = await this.loadTemplate('commands/implement.md');

    // 2. Replace $WORKFLOW_ID in command
    const commandWithId = command.replace(/\$WORKFLOW_ID/g, workflowId);

    // 3. Get workflow context for memory search
    const workflowPath = path.join(this.projectRoot, '.cortex', 'workflows', workflowId);
    const tasksPath = path.join(workflowPath, 'tasks.md');
    let memoryContext = '';

    if (this.memoryService && (await fs.pathExists(tasksPath))) {
      try {
        const tasksContent = await fs.readFile(tasksPath, 'utf-8');
        // Search for implementation patterns, solutions, and lessons
        const searchQuery = `implementation patterns ${tasksContent.slice(0, 150)}`;
        const context = await this.memoryService.enhanceContext(searchQuery);
        if (context) {
          memoryContext = `\n\n## Relevant Past Experiences (Implementation)\n\n${context}`;
        }
      } catch (error) {
        console.warn('Failed to enhance context from memory:', error);
      }
    }

    // 4. Add corrections/warnings from previous sessions
    const tasksContent = (await fs.pathExists(tasksPath))
      ? await fs.readFile(tasksPath, 'utf-8')
      : '';
    const correctionsContext = await this.getCorrectionsContext(
      tasksContent.slice(0, 200),
      'implement'
    );

    // 5. Combine command with memory context and corrections
    return `${commandWithId}${memoryContext}${correctionsContext}`;
  }

  /**
   * Generate checklist
   */
  async generateChecklist(checklistType: string, featureName: string): Promise<string> {
    const template = await this.loadTemplate('checklist-template.md');
    
    const variables: TemplateVariables = {
      CHECKLIST_TYPE: checklistType,
      FEATURE: featureName,
      DATE: new Date().toISOString().split('T')[0],
    };

    return this.replaceVariables(template, variables);
  }
}

