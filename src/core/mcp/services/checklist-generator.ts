import fs from 'fs-extra';
import * as path from 'path';

export type ChecklistType = 'requirements' | 'design' | 'tasks' | 'implementation';

export class ChecklistGenerator {
  private workflowDir: string;
  private checklistsDir: string;

  constructor(workflowDir: string) {
    this.workflowDir = workflowDir;
    this.checklistsDir = path.join(workflowDir, 'checklists');
  }

  /**
   * Generate checklist based on phase
   */
  async generateChecklist(type: ChecklistType, featureName: string): Promise<string> {
    // Ensure checklists directory exists
    await this.ensureChecklistsDir();

    const checklistPath = path.join(this.checklistsDir, `${type}.md`);

    let content = '';
    switch (type) {
      case 'requirements':
        content = this.generateRequirementsChecklist(featureName);
        break;
      case 'design':
        content = this.generateDesignChecklist(featureName);
        break;
      case 'tasks':
        content = this.generateTasksChecklist(featureName);
        break;
      case 'implementation':
        content = this.generateImplementationChecklist(featureName);
        break;
      default:
        throw new Error(`Unknown checklist type: ${type}`);
    }

    await fs.writeFile(checklistPath, content, 'utf-8');
    console.log(`✓ Generated ${type} checklist at ${checklistPath}`);

    return checklistPath;
  }

  /**
   * Validate checklist completion
   */
  async validateChecklist(type: ChecklistType): Promise<{
    total: number;
    completed: number;
    incomplete: number;
    passed: boolean;
  }> {
    const checklistPath = path.join(this.checklistsDir, `${type}.md`);

    try {
      const content = await fs.readFile(checklistPath, 'utf-8');
      
      const lines = content.split('\n');
      let total = 0;
      let completed = 0;

      for (const line of lines) {
        if (line.match(/^-\s+\[X\]/i)) {
          total++;
          completed++;
        } else if (line.match(/^-\s+\[\s\]/)) {
          total++;
        }
      }

      const incomplete = total - completed;
      const passed = incomplete === 0;

      return { total, completed, incomplete, passed };
    } catch {
      // Checklist doesn't exist or can't be read
      return { total: 0, completed: 0, incomplete: 0, passed: true };
    }
  }

  /**
   * Validate all checklists in workflow
   */
  async validateAllChecklists(): Promise<{
    checklists: Record<string, { total: number; completed: number; incomplete: number; passed: boolean }>;
    allPassed: boolean;
  }> {
    const types: ChecklistType[] = ['requirements', 'design', 'tasks', 'implementation'];
    const checklists: Record<string, { total: number; completed: number; incomplete: number; passed: boolean }> = {};
    let allPassed = true;

    for (const type of types) {
      const result = await this.validateChecklist(type);
      if (result.total > 0) {
        checklists[type] = result;
        if (!result.passed) {
          allPassed = false;
        }
      }
    }

    return { checklists, allPassed };
  }

  /**
   * Generate Requirements Checklist (after spec generation)
   */
  private generateRequirementsChecklist(featureName: string): string {
    const date = new Date().toISOString().split('T')[0];
    
    return `# Specification Quality Checklist: ${featureName}

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: ${date}
**Status**: Pending Review

## Content Quality

- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

## Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Success criteria are technology-agnostic (no implementation details)
- [ ] All acceptance scenarios are defined
- [ ] Edge cases are identified
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

## Feature Readiness

- [ ] All functional requirements have clear acceptance criteria
- [ ] User scenarios cover primary flows
- [ ] Feature meets measurable outcomes defined in Success Criteria
- [ ] No implementation details leak into specification

## Notes

_Items marked incomplete require spec updates before proceeding to /cortex.plan_
`;
  }

  /**
   * Generate Design Checklist (after plan generation)
   */
  private generateDesignChecklist(featureName: string): string {
    const date = new Date().toISOString().split('T')[0];
    
    return `# Design Quality Checklist: ${featureName}

**Purpose**: Validate technical design completeness before task breakdown
**Created**: ${date}
**Status**: Pending Review

## Technical Context

- [ ] Language/Version specified
- [ ] Primary Dependencies identified
- [ ] Storage solution defined (if applicable)
- [ ] Testing framework chosen
- [ ] Target Platform specified
- [ ] Performance Goals defined
- [ ] Constraints documented
- [ ] Scale/Scope clarified

## Constitution Compliance

- [ ] All constitution gates reviewed
- [ ] Violations justified in Complexity Tracking table
- [ ] Simpler alternatives considered
- [ ] Complexity justified with specific rationale

## Architecture Design

- [ ] Project structure defined
- [ ] Source code organization clear
- [ ] Data model documented (if applicable)
- [ ] API contracts specified (if applicable)
- [ ] Integration points identified
- [ ] Error handling strategy defined

## Quality Attributes

- [ ] Observability requirements specified
- [ ] Security requirements documented
- [ ] Performance targets defined
- [ ] Scalability considerations noted
- [ ] Deployment strategy outlined

## Notes

_Items marked incomplete require plan updates before proceeding to /cortex.tasks_
`;
  }

  /**
   * Generate Tasks Checklist (after task generation)
   */
  private generateTasksChecklist(featureName: string): string {
    const date = new Date().toISOString().split('T')[0];
    
    return `# Tasks Quality Checklist: ${featureName}

**Purpose**: Validate task breakdown completeness before implementation
**Created**: ${date}
**Status**: Pending Review

## Task Organization

- [ ] Tasks organized by user story
- [ ] Each user story has independent test criteria
- [ ] Setup phase tasks defined
- [ ] Foundational phase tasks identified (blocking prerequisites)
- [ ] Polish phase tasks included

## Task Details

- [ ] All tasks follow checklist format: \`- [ ] [ID] [P?] [Story?] Description with file path\`
- [ ] Task IDs are sequential (T001, T002, T003...)
- [ ] [P] marker used correctly for parallelizable tasks
- [ ] [Story] label present for user story tasks (US1, US2, etc.)
- [ ] File paths included in task descriptions
- [ ] Tasks are specific and actionable

## Dependencies & Execution

- [ ] Phase dependencies documented
- [ ] User story dependencies specified
- [ ] Within-story dependencies clear
- [ ] Parallel opportunities identified
- [ ] Execution order makes sense

## Completeness

- [ ] All entities from data-model.md have corresponding tasks
- [ ] All endpoints from contracts/ have corresponding tasks
- [ ] All requirements from spec.md covered
- [ ] Test tasks included (if TDD requested)
- [ ] Integration tasks present
- [ ] Documentation tasks included

## Notes

_Items marked incomplete require tasks updates before proceeding to /cortex.implement_
`;
  }

  /**
   * Generate Implementation Checklist (before starting implementation)
   */
  private generateImplementationChecklist(featureName: string): string {
    const date = new Date().toISOString().split('T')[0];
    
    return `# Implementation Checklist: ${featureName}

**Purpose**: Track implementation progress and quality
**Created**: ${date}
**Status**: In Progress

## Pre-Implementation

- [ ] All previous checklists passed (requirements, design, tasks)
- [ ] Git repository clean (no uncommitted changes)
- [ ] Branch created for feature
- [ ] Dependencies installed
- [ ] Development environment configured

## Code Quality

- [ ] Code follows project style guide
- [ ] No linter errors
- [ ] No TypeScript/compiler errors
- [ ] All functions documented
- [ ] Complex logic has comments
- [ ] No hardcoded values (use config/env)
- [ ] No mock data in production code

## Testing

- [ ] Unit tests written (if requested)
- [ ] Integration tests written (if requested)
- [ ] Contract tests written (if requested)
- [ ] All tests passing
- [ ] Edge cases tested
- [ ] Error handling tested

## Security & Performance

- [ ] Input validation implemented
- [ ] Authentication/authorization correct
- [ ] Sensitive data not logged
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Performance targets met

## Documentation

- [ ] README updated (if needed)
- [ ] API documentation current
- [ ] Architecture diagrams updated (if needed)
- [ ] Deployment instructions current
- [ ] CHANGELOG updated

## Final Validation

- [ ] Feature works as specified
- [ ] All acceptance criteria met
- [ ] All tasks marked complete in tasks.md
- [ ] Code reviewed (if team process)
- [ ] Ready for commit/PR

## Notes

_Track any issues, blockers, or decisions made during implementation_
`;
  }

  /**
   * Ensure checklists directory exists
   */
  private async ensureChecklistsDir(): Promise<void> {
    try {
      await fs.access(this.checklistsDir);
    } catch {
      await fs.mkdir(this.checklistsDir, { recursive: true });
    }
  }
}

