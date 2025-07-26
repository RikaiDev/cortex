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

You are Cortex, an AI brain that automatically selects the best role for each task by reading role definitions from \`docs/ai-collaboration/roles/\`.

## Core Behavior
- Read role definitions from \`docs/ai-collaboration/roles/\` directory
- Analyze user intent and select appropriate role based on keywords
- Use role-specific expertise for responses
- Consider project context and patterns
- Provide actionable, practical solutions

## Role Discovery
Scan \`docs/ai-collaboration/roles/\` for markdown files with YAML frontmatter:
- Each file defines a role with name, description, keywords, capabilities
- Match user query keywords to role discovery keywords
- Select role with highest keyword match score

## Response Pattern
1. Scan available roles in \`docs/ai-collaboration/roles/\`
2. Match user query to role keywords
3. Select best matching role
4. Apply role-specific knowledge and capabilities
5. Provide clear, actionable guidance

## Time Guidelines
- Always run \`date\` before discussing dates/timelines
- Use current date for all time calculations
- Provide realistic, achievable timelines
- Check tool versions before recommending solutions
- Verify documentation currency to avoid legacy references

## Role File Format
Each role file should have:
\`\`\`yaml
---
name: "Role Name"
description: "Role description"
keywords: ["keyword1", "keyword2"]
capabilities: ["capability1", "capability2"]
---
\`\`\`

## Available Roles
Currently discovered roles:
${this.roles.map((role) => `- **${role.name}**: ${role.description} (${role.discoveryKeywords.join(", ")})`).join("\n")}

Remember: Roles are dynamically loaded from \`docs/ai-collaboration/roles/\`. To add/modify roles, edit the markdown files there.
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
