/**
 * Resource Handler
 */

import * as path from "path";
import fs from "fs-extra";
import { SnapshotService } from "../services/snapshot-service.js";
import { TasksReader } from "../utils/tasks-reader.js";
import { MemoryService } from "../services/memory-service.js";
import { MCPResourceResult } from "../types/mcp-types.js";

export class ResourceHandler {
  private snapshotService: SnapshotService;
  private tasksReader: TasksReader;
  private memoryService: MemoryService;

  constructor(private projectRoot: string) {
    this.snapshotService = new SnapshotService(projectRoot);
    this.tasksReader = new TasksReader(projectRoot);
    this.memoryService = new MemoryService(projectRoot);
  }

  /**
   * Handle resource request
   */
  async handleResourceRequest(uri: string): Promise<MCPResourceResult> {
    try {
      if (uri === "cortex://workflows") {
        // List all workflows
        const workflowsDir = path.join(
          this.projectRoot,
          ".cortex",
          "workflows"
        );
        const workflows: string[] = [];

        if (fs.existsSync(workflowsDir)) {
          const files = fs.readdirSync(workflowsDir);
          workflows.push(...files.filter((file) => file.endsWith(".json")));
        }

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({ workflows }, null, 2),
            },
          ],
        };
      }

      // Handle workflow-specific resources
      if (uri.startsWith("cortex://workflows/")) {
        const uriParts = uri.split("/");
        if (uriParts.length >= 4) {
          const workflowId = uriParts[2];
          const resourceType = uriParts[3];

          if (resourceType === "handoff") {
            const handoffFile = path.join(
              this.projectRoot,
              ".cortex",
              "workspaces",
              workflowId,
              "handoff.md"
            );
            if (fs.existsSync(handoffFile)) {
              const content = fs.readFileSync(handoffFile, "utf-8");
              return {
                contents: [
                  {
                    uri,
                    mimeType: "text/markdown",
                    text: content,
                  },
                ],
              };
            }
          }

          if (resourceType === "pr") {
            const prFile = path.join(
              this.projectRoot,
              ".cortex",
              "workspaces",
              workflowId,
              "pr.md"
            );
            if (fs.existsSync(prFile)) {
              const content = fs.readFileSync(prFile, "utf-8");
              return {
                contents: [
                  {
                    uri,
                    mimeType: "text/markdown",
                    text: content,
                  },
                ],
              };
            }
          }
        }
      }

      // Handle snapshot resources
      if (uri.startsWith("cortex://snapshots/")) {
        return await this.snapshotService.handleSnapshotRequest(uri);
      }

      // Handle project tasks resource
      if (uri === "cortex://project/tasks") {
        const hasTasks = await this.tasksReader.hasTasksConfig();

        if (!hasTasks) {
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(
                  {
                    hasTasks: false,
                    message:
                      "No .vscode/tasks.json found. Run 'npx cortex-ai init ide' to set up IDE integration.",
                    tasks: [],
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const allTasks = await this.tasksReader.getAllTasks();
        const tasksData = allTasks.map(({ task, purpose }) => ({
          label: task.label,
          purpose,
          command: this.tasksReader.generateTaskCommand(task),
          type: task.type,
          group: task.group?.kind || null,
        }));

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  hasTasks: true,
                  tasks: tasksData,
                  defaultBuildTask:
                    await this.tasksReader.getDefaultBuildTask(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Handle IDE integration guide resource
      if (uri === "cortex://ide/integration-guide") {
        const guidePath = path.join(
          this.projectRoot,
          "docs",
          "ide-integration.md"
        );

        if (fs.existsSync(guidePath)) {
          const content = fs.readFileSync(guidePath, "utf-8");
          return {
            contents: [
              {
                uri,
                mimeType: "text/markdown",
                text: content,
              },
            ],
          };
        }

        // Fallback to embedded guide
        return {
          contents: [
            {
              uri,
              mimeType: "text/markdown",
              text: `# IDE Integration Guide

## Quick Setup

Run the following command in your project root:

\`\`\`bash
npx cortex-ai init ide
\`\`\`

This will:
- Detect your IDE type
- Create appropriate configuration files
- Set up development tasks
- Configure Cortex AI integration

## Supported IDEs

- **VS Code / Cursor**: Uses .vscode/tasks.json
- **JetBrains IDEs**: Uses .idea/runConfigurations/
- **Sublime Text**: Uses build systems

## Manual Setup

### VS Code / Cursor

Create \`.vscode/tasks.json\`:

\`\`\`json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build Project",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
\`\`\`

For complete documentation, see: docs/ide-integration.md`,
            },
          ],
        };
      }

      // Handle memory resources
      if (uri === "cortex://memory/index") {
        const indexPath = path.join(
          this.projectRoot,
          ".cortex",
          "memory",
          "index.json"
        );

        if (fs.existsSync(indexPath)) {
          const index = await fs.readJson(indexPath);
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(index, null, 2),
              },
            ],
          };
        }

        // Return empty index if doesn't exist
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  version: "1.0",
                  lastUpdated: new Date().toISOString(),
                  totalExperiences: 0,
                  categories: {
                    patterns: 0,
                    decisions: 0,
                    solutions: 0,
                    lessons: 0,
                  },
                  index: [],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (uri.startsWith("cortex://memory/experiences/")) {
        const type = uri.split("/").pop() as string;
        const result = await this.memoryService.searchExperiences(type, 50);
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(result.experiences, null, 2),
            },
          ],
        };
      }

      if (uri.startsWith("cortex://memory/search")) {
        const urlParts = uri.split("?");
        const params = new URLSearchParams(urlParts[1] || "");
        const query = params.get("query") || "";

        const result = await this.memoryService.searchExperiences(query, 10);
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      throw new Error(`Resource not found: ${uri}`);
    } catch (error) {
      throw new Error(
        `Failed to read resource ${uri}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
