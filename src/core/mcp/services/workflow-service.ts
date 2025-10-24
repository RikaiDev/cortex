/**
 * Workflow Service
 * 
 * Manages workflow lifecycle, state transitions, and phase coordination.
 */

import * as path from 'node:path';
import * as fs from 'fs-extra';
import type { Workflow, WorkflowPhase, PhaseResult } from '../types/workflow.js';

export class WorkflowService {
  private workflowsPath: string;

  constructor(private projectRoot: string) {
    this.workflowsPath = path.join(projectRoot, '.cortex', 'workflows');
  }

  /**
   * Create a new workflow with readable ID format (001-feature-name)
   */
  async createWorkflow(title: string): Promise<string> {
    // 1. Get next sequential number
    const workflows = await this.listWorkflows();
    const nextNum = workflows.length + 1;

    // 2. Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);

    // 3. Combine into readable ID: 001-feature-name
    const workflowId = `${String(nextNum).padStart(3, '0')}-${slug}`;

    const workflowDir = path.join(this.workflowsPath, workflowId);

    await fs.ensureDir(workflowDir);
    await fs.ensureDir(path.join(workflowDir, 'execution'));

    const workflow: Workflow = {
      id: workflowId,
      title,
      status: 'spec',
      phases: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentRole: 'documentation-specialist',
    };

    await this.saveWorkflow(workflow);

    return workflowId;
  }

  /**
   * Load workflow by ID
   */
  async loadWorkflow(workflowId: string): Promise<Workflow> {
    const workflowFile = path.join(this.workflowsPath, workflowId, 'workflow.json');

    if (!(await fs.pathExists(workflowFile))) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    return fs.readJson(workflowFile);
  }

  /**
   * Save workflow state
   */
  async saveWorkflow(workflow: Workflow): Promise<void> {
    const workflowFile = path.join(this.workflowsPath, workflow.id, 'workflow.json');
    workflow.updatedAt = new Date().toISOString();
    await fs.writeJson(workflowFile, workflow, { spaces: 2 });
  }

  /**
   * Save phase result to workflow directory
   */
  async savePhaseResult(workflowId: string, phase: string, content: string): Promise<void> {
    const phaseFile = path.join(this.workflowsPath, workflowId, `${phase}.md`);
    await fs.writeFile(phaseFile, content, 'utf-8');
  }

  /**
   * Load phase content from workflow directory
   */
  async loadPhaseContent(workflowId: string, phase: string): Promise<string> {
    const phaseFile = path.join(this.workflowsPath, workflowId, `${phase}.md`);

    if (!(await fs.pathExists(phaseFile))) {
      throw new Error(`Phase content not found: ${phase} for workflow ${workflowId}`);
    }

    return fs.readFile(phaseFile, 'utf-8');
  }

  /**
   * Record phase completion
   */
  async recordPhaseCompletion(workflowId: string, result: PhaseResult): Promise<void> {
    const workflow = await this.loadWorkflow(workflowId);

    workflow.phases.push(result);
    workflow.status = this.getNextPhase(result.phase);
    workflow.currentRole = this.getRoleForPhase(workflow.status);

    await this.saveWorkflow(workflow);
  }

  /**
   * Get next phase based on current phase
   */
  private getNextPhase(currentPhase: string): Workflow['status'] {
    const phaseOrder: Workflow['status'][] = ['spec', 'plan', 'tasks', 'implement', 'completed'];
    const currentIndex = phaseOrder.indexOf(currentPhase as Workflow['status']);

    if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
      return 'completed';
    }

    return phaseOrder[currentIndex + 1];
  }

  /**
   * Get role responsible for phase
   */
  private getRoleForPhase(phase: Workflow['status']): string {
    const roleMap: Record<string, string> = {
      spec: 'documentation-specialist',
      plan: 'architecture-designer',
      tasks: 'code-assistant',
      implement: 'code-assistant',
      completed: '',
    };

    return roleMap[phase] || 'code-assistant';
  }

  /**
   * List all workflows
   */
  async listWorkflows(limit = 10): Promise<Workflow[]> {
    if (!(await fs.pathExists(this.workflowsPath))) {
      return [];
    }

    const workflowDirs = await fs.readdir(this.workflowsPath);
    const workflows: Workflow[] = [];

    for (const dir of workflowDirs.slice(0, limit)) {
      try {
        const workflow = await this.loadWorkflow(dir);
        workflows.push(workflow);
      } catch {
        // Skip invalid workflows
        continue;
      }
    }

    // Sort by updated time (most recent first)
    workflows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return workflows;
  }

  /**
   * Get workflow status summary
   */
  async getWorkflowStatus(workflowId: string): Promise<{
    workflow: Workflow;
    completedPhases: string[];
    currentPhase: string;
    nextPhase: string;
  }> {
    const workflow = await this.loadWorkflow(workflowId);

    const completedPhases = workflow.phases.map((p) => p.phase);
    const currentPhase = workflow.status;
    const nextPhase = this.getNextPhase(currentPhase);

    return {
      workflow,
      completedPhases,
      currentPhase,
      nextPhase,
    };
  }
}

