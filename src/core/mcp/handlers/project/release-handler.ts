/**
 * Release Handler
 *
 * Handles release documentation generation
 */

import * as path from "node:path";
import fs from "fs-extra";
import { ProjectDetector } from "../../services/project-detector.js";
import { ChangeAnalyzer } from "../../services/change-analyzer.js";
import type { MCPToolResult } from "../../types/mcp-types.js";

export class ReleaseHandler {
  constructor(private projectRoot: string) {}

  async handleRelease(args: {
    version?: string;
    tag?: boolean;
    push?: boolean;
  }): Promise<MCPToolResult> {
    try {
      // 1. Detect project conventions
      const detector = new ProjectDetector(this.projectRoot);
      const conventions = await detector.analyze();

      // 2. Analyze changes
      const analyzer = new ChangeAnalyzer(this.projectRoot);
      const analysis = await analyzer.analyze(conventions);

      // 3. Load release command template
      const commandPath = path.join(
        this.projectRoot,
        ".cortex",
        "templates",
        "commands",
        "release.md"
      );
      if (!(await fs.pathExists(commandPath))) {
        return {
          content: [
            {
              type: "text",
              text: "Error: release.md command template not found. Run cortex init to set up templates.",
            },
          ],
          isError: true,
        };
      }

      const command = await fs.readFile(commandPath, "utf-8");

      // 4. Build context for AI
      const context = `
## Release Context

**Project Conventions**:
- Has CHANGELOG: ${conventions.hasChangelog}
- Has RELEASE_NOTES: ${conventions.hasReleaseNotes}
- Uses Conventional Commits: ${conventions.usesConventionalCommits}
- Commit Types: ${conventions.commitTypes.join(", ")}
- Has Cortex Workflows: ${conventions.hasCortexWorkflows} (${conventions.workflowCount} workflows)

**Change Analysis**:
- Git Commits: ${analysis.gitCommits.length}
- Workflow Changes: ${analysis.workflowChanges.length}
- Merged Changes: ${analysis.mergedChanges.length}

**Changes Summary**:
${analysis.mergedChanges
  .map((c, i) => `${i + 1}. [${c.type}] ${c.description}`)
  .slice(0, 20)
  .join("\n")}
${analysis.mergedChanges.length > 20 ? `\n... and ${analysis.mergedChanges.length - 20} more changes` : ""}

**Arguments**:
- Version: ${args.version || "auto-detect"}
- Create Tag: ${args.tag || false}
- Push to Remote: ${args.push || false}
`;

      // 5. Return command + context to AI
      return {
        content: [
          {
            type: "text",
            text: `${command}\n\n${context}\n\nPlease execute the release process as specified in the command above.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to prepare release: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}
