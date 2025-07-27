import { Role, ProjectKnowledge } from "./types.js";
import fs from "fs-extra";
import path from "path";

export interface CursorRule {
  description: string;
  globs?: string[];
  alwaysApply?: boolean;
  content: string;
}

export interface CursorConfig {
  rules: CursorRule[];
  settings?: Record<string, any>;
}

export class CursorAdapter {
  private projectRoot: string;
  private roles: Role[];
  private projectKnowledge: ProjectKnowledge;

  constructor(
    projectRoot: string,
    roles: Role[],
    projectKnowledge: ProjectKnowledge
  ) {
    this.projectRoot = projectRoot;
    this.roles = roles;
    this.projectKnowledge = projectKnowledge;
  }

  async generateCursorRules(): Promise<void> {
    const cursorDir = path.join(this.projectRoot, ".cursor");
    const rulesDir = path.join(cursorDir, "rules");

    // Create directories
    await fs.ensureDir(cursorDir);
    await fs.ensureDir(rulesDir);

    // Generate single main rule that reads from docs
    const mainRule = this.generateMainRule();
    await fs.writeFile(path.join(rulesDir, "cortex.mdc"), mainRule);

    // Generate settings
    const settings = this.generateSettings();
    await fs.writeFile(
      path.join(cursorDir, "settings.json"),
      JSON.stringify(settings, null, 2)
    );
  }

  private generateMainRule(): string {
    return `---
alwaysApply: true
---

# Cortex AI

## Core Principle

**Learn from docs, adapt to project, execute with precision, EVOLVE through experience.**

## Self-Evolution Protocol

### 1. Experience-Driven Learning (CORE)
- **MANDATORY**: Record experience in \`docs/experiences/daily/\` after EVERY interaction (internal use only)
- **MANDATORY**: Use template: \`docs/experiences/daily/templates/experience-record.md\`
- **MANDATORY**: Analyze patterns weekly, synthesize monthly
- **MANDATORY**: Update internal documentation based on learnings
- **MANDATORY**: Apply previous experiences to current tasks

### 2. Role Declaration (MANDATORY)
- **MANDATORY**: Scan \`docs/ai-collaboration/roles/\` for suitable role
- **MANDATORY**: Declare role and approach in response header
- **MANDATORY**: Use format: "🎭 **ROLE DISCOVERY: Scanning docs/ai-collaboration/roles/**"
- **MANDATORY**: List discovered roles and selected role
- **MANDATORY**: **LEARN** from role-specific experiences

### 3. Documentation Learning (MANDATORY)
- **MANDATORY**: Search \`docs/\` before any action
- **MANDATORY**: Use format: "📚 **LEARNING PHASE:**"
- **MANDATORY**: Learn patterns from existing code and documentation
- **MANDATORY**: **EVOLVE** documentation based on new experiences

### 4. Execution (MANDATORY)
- **MANDATORY**: Follow project conventions
- **MANDATORY**: Use established patterns and libraries first
- **MANDATORY**: Write code comments in English only
- **MANDATORY**: **APPLY** learned patterns from previous experiences
- **MANDATORY**: Use format: "🔍 **ANALYSIS PLAN:**" or "⚡ **EXECUTION:**"

### 5. Task Coordination (MANDATORY)
- **MANDATORY**: For complex tasks, activate Task Coordinator role
- **MANDATORY**: Break down complex tasks into manageable components
- **MANDATORY**: Select appropriate roles for each component
- **MANDATORY**: Coordinate role transitions smoothly
- **MANDATORY**: Synthesize multiple role outputs into coherent solutions

### 6. Continuous Self-Improvement
- **EVERY INTERACTION** must contribute to knowledge growth
- **EVERY PROBLEM** must become a learning opportunity
- **EVERY SOLUTION** must be documented for internal future use
- **EVERY PATTERN** must be identified and applied internally

## Evolution Metrics

**Track your evolution:**
- **Experience Records**: Number of experiences captured
- **Pattern Recognition**: New patterns discovered
- **Documentation Updates**: Knowledge base improvements
- **Problem-Solving Speed**: Time reduction through experience
- **Solution Quality**: Improvement through learned patterns

**Self-Evolution Checklist:**
- [ ] Experience recorded after interaction
- [ ] Patterns identified and documented
- [ ] Documentation updated with learnings
- [ ] Previous experiences applied to current task
- [ ] Knowledge applied for internal improvement

**Simple, efficient, self-evolving through systematic experience learning.**
- **EVERY interaction = Learning opportunity**
- **EVERY experience = Knowledge growth**
- **EVERY pattern = Self-improvement**
- **EVERY solution = Internal future reference**
`;
  }

  private generateSettings(): Record<string, any> {
    return {
      "cortex.enabled": true,
      "cortex.rolesPath": "./docs/ai-collaboration/roles",
      "cortex.autoDiscover": true,
      "editor.formatOnSave": true,
      "editor.codeActionsOnSave": {
        "source.fixAll": true,
        "source.organizeImports": true,
      },
    };
  }

  async validateCursorSetup(): Promise<boolean> {
    const cursorDir = path.join(this.projectRoot, ".cursor");
    const rulesDir = path.join(cursorDir, "rules");

    try {
      const exists =
        (await fs.pathExists(cursorDir)) && (await fs.pathExists(rulesDir));
      if (exists) {
        const files = await fs.readdir(rulesDir);
        return files.length > 0;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}
