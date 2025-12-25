/**
 * Constitution Handler
 *
 * Handles project constitution creation and updates
 */

import * as path from "node:path";
import fs from "fs-extra";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class ConstitutionHandler {
  constructor(private projectRoot: string) {}

  async handleConstitution(args: { updates?: string }): Promise<MCPToolResult> {
    try {
      const constitutionPath = path.join(
        this.projectRoot,
        ".cortex",
        "constitution.md"
      );

      // Load constitution command template
      const commandPath = path.join(
        this.projectRoot,
        ".cortex",
        "templates",
        "commands",
        "constitution.md"
      );

      if (!(await fs.pathExists(commandPath))) {
        return {
          content: [
            {
              type: "text",
              text: `Constitution command template not found. Please run \`cortex init\` first.

The constitution command template should be at: ${commandPath}`,
            },
          ],
          isError: true,
        };
      }

      const command = await fs.readFile(commandPath, "utf-8");

      // Build context for AI
      const context = `
## Current State

**Constitution Path**: ${constitutionPath}
**Constitution Exists**: ${(await fs.pathExists(constitutionPath)) ? "Yes" : "No (will be created)"}

${args.updates ? `**Requested Updates**: ${args.updates}\n` : "**Mode**: Interactive (AI will guide through constitution creation/update)\n"}

## Your Task

You are helping the user create or update their project constitution. Follow the instructions in the command template above.

${args.updates ? "Focus on the specific updates requested by the user." : "Guide the user through the constitution creation/update process interactively."}
`;

      return {
        content: [
          {
            type: "text",
            text: `${command}\n\n${context}\n\nPlease execute the constitution management process as specified above.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to manage constitution: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
