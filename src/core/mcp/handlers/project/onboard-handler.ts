/**
 * Onboard Handler
 *
 * Handles interactive onboarding for first-time users
 */

import * as path from "node:path";
import fs from "fs-extra";
import { MCPTool } from "../../decorators/index.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class OnboardHandler {
  constructor(private projectRoot: string) {}

  @MCPTool({
    name: "onboard",
    description:
      "Interactive onboarding for new projects (setup .cortex, create constitution)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  })
  async handleOnboard(): Promise<MCPToolResult> {
    try {
      // 1. Check current state
      const cortexDir = path.join(this.projectRoot, ".cortex");
      const needsInit = !(await fs.pathExists(cortexDir));
      const needsConstitution = !(await fs.pathExists(
        path.join(cortexDir, "templates", "constitution.md")
      ));

      // 2. Load onboard command template
      const commandPath = path.join(
        this.projectRoot,
        ".cortex",
        "templates",
        "commands",
        "onboard.md"
      );

      // If command doesn't exist yet (first time), use built-in
      let command: string;
      if (await fs.pathExists(commandPath)) {
        command = await fs.readFile(commandPath, "utf-8");
      } else {
        // Return instructions to run cortex init first
        return {
          content: [
            {
              type: "text",
              text: `
## Welcome to Cortex AI!

It looks like this is your first time using Cortex in this project.

**Initial Setup Required:**

Please run the following command first to initialize the basic structure:
\`\`\`bash
npx @rikaidev/cortex init
\`\`\`

This will create:
- .cortex/ directory structure
- Template files
- Command files

After initialization completes, run \`cortex.onboard\` again to continue with the interactive setup.
`,
            },
          ],
        };
      }

      // 3. Build context for AI
      const context = `
## Onboarding Context

**Current State**:
- .cortex/ exists: ${!needsInit}
- Constitution exists: ${!needsConstitution}
- Project root: ${this.projectRoot}

**Detected Files**:
- package.json: ${await fs.pathExists(path.join(this.projectRoot, "package.json"))}
- requirements.txt: ${await fs.pathExists(path.join(this.projectRoot, "requirements.txt"))}
- go.mod: ${await fs.pathExists(path.join(this.projectRoot, "go.mod"))}
- README.md: ${await fs.pathExists(path.join(this.projectRoot, "README.md"))}
- .git/: ${await fs.pathExists(path.join(this.projectRoot, ".git"))}

**What needs to be done**:
${needsInit ? "- Initialize .cortex/ structure" : "✓ .cortex/ already initialized"}
${needsConstitution ? "- Create constitution via Q&A" : "✓ Constitution already exists"}
`;

      // 4. Return command + context to AI
      return {
        content: [
          {
            type: "text",
            text: `${command}\n\n${context}\n\nPlease execute the onboarding process as specified above.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to start onboarding: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
