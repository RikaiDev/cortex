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

# Cortex AI Brain

## Core Principle

**Learn from docs, adapt to project, execute with precision.**

## Mandatory Protocol

### 1. Role Declaration

- Scan \`docs/ai-collaboration/roles/\` for suitable role
- Declare role and approach in response

### 2. Documentation Learning

- Search \`docs/\` before any action
- Learn patterns from existing code and documentation

### 3. Execution

- Follow project conventions
- Use established patterns and libraries first
- Write code comments in English only

### 4. Time Verification

- Run \`date\` before discussing dates/timelines
- Check tool versions before recommending solutions
- Verify documentation currency

### 5. Feedback

- Suggest documentation updates when needed
- Learn from each interaction

**Simple, efficient, self-learning.**
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
