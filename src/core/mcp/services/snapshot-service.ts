/**
 * Snapshot Service
 */

import * as path from "path";
import fs from "fs-extra";
import { FileAnalyzer } from "../utils/file-analyzer.js";
import {
  ProjectSnapshot,
  WorkflowSnapshot,
  SnapshotSearchResults,
  MCPResourceResult,
} from "../types/mcp-types.js";

export class SnapshotService {
  private fileAnalyzer: FileAnalyzer;

  constructor(private projectRoot: string) {
    this.fileAnalyzer = new FileAnalyzer(projectRoot);
  }

  /**
   * Generate project snapshot
   */
  async generateProjectSnapshot(): Promise<ProjectSnapshot> {
    const packageJsonPath = path.join(this.projectRoot, "package.json");
    const tsconfigPath = path.join(this.projectRoot, "tsconfig.json");

    let projectInfo: Record<string, unknown> = {};
    let architecture: Record<string, unknown> = {};
    let dependencies: {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    } = { dependencies: {}, devDependencies: {} };

    // Read package.json
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      projectInfo = {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        scripts: packageJson.scripts,
      };
      dependencies = {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
      };
    }

    // Read tsconfig.json
    if (fs.existsSync(tsconfigPath)) {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
      architecture = {
        typescript: {
          target: tsconfig.compilerOptions?.target,
          module: tsconfig.compilerOptions?.module,
          strict: tsconfig.compilerOptions?.strict,
          outDir: tsconfig.compilerOptions?.outDir,
        },
      };
    }

    const fileStructure = await this.fileAnalyzer.analyzeFileStructure();
    const recentWorkflows =
      (await this.fileAnalyzer.getRecentWorkflows()) as Array<{
        id: string;
        title: string;
        status: string;
        createdAt: string;
        updatedAt: string;
      }>;

    return {
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      projectInfo,
      architecture,
      dependencies,
      fileStructure,
      recentWorkflows,
      keyDecisions: [],
      bestPractices: [],
    };
  }

  /**
   * Generate workflow snapshot
   */
  async generateWorkflowSnapshot(
    workflowId: string
  ): Promise<WorkflowSnapshot> {
    const workflowFile = path.join(
      this.projectRoot,
      ".cortex",
      "workflows",
      `${workflowId}.json`
    );
    const handoffFile = path.join(
      this.projectRoot,
      ".cortex",
      "workspaces",
      workflowId,
      "handoff.md"
    );

    let workflowState: Record<string, unknown> = {};
    let handoffContent = "";

    if (fs.existsSync(workflowFile)) {
      workflowState = JSON.parse(fs.readFileSync(workflowFile, "utf-8"));
    }

    if (fs.existsSync(handoffFile)) {
      handoffContent = fs.readFileSync(handoffFile, "utf-8");
    }

    const keyDecisions = this.fileAnalyzer.extractKeyDecisions(handoffContent);
    const lessonsLearned =
      this.fileAnalyzer.extractLessonsLearned(handoffContent);
    const technicalDebt =
      this.fileAnalyzer.extractTechnicalDebt(handoffContent);
    const recommendations =
      this.fileAnalyzer.extractRecommendations(handoffContent);

    return {
      timestamp: new Date().toISOString(),
      workflowId,
      workflowState,
      handoffContent,
      keyDecisions,
      lessonsLearned,
      technicalDebt,
      recommendations,
    };
  }

  /**
   * Search across all snapshots
   */
  async searchSnapshots(): Promise<SnapshotSearchResults> {
    const workflowsDir = path.join(this.projectRoot, ".cortex", "workflows");
    const projectSnapshot = await this.generateProjectSnapshot();
    const workflowSnapshots: WorkflowSnapshot[] = [];

    if (fs.existsSync(workflowsDir)) {
      const files = fs.readdirSync(workflowsDir);
      const workflowFiles = files
        .filter((file) => file.endsWith(".json"))
        .slice(-10); // Last 10 workflows

      for (const file of workflowFiles) {
        const workflowId = file.replace(".json", "");
        try {
          const snapshot = await this.generateWorkflowSnapshot(workflowId);
          workflowSnapshots.push(snapshot);
        } catch {
          // Skip invalid workflows
        }
      }
    }

    const searchableContent = [
      {
        id: "project",
        type: "project",
        timestamp: projectSnapshot.timestamp,
        summary: this.fileAnalyzer.generateSnapshotSummary({
          type: "project",
          ...projectSnapshot,
        }),
      },
      ...workflowSnapshots.map((snapshot) => ({
        id: snapshot.workflowId,
        type: "workflow",
        timestamp: snapshot.timestamp,
        summary: this.fileAnalyzer.generateSnapshotSummary({
          type: "workflow",
          ...snapshot,
        }),
      })),
    ];

    return {
      timestamp: new Date().toISOString(),
      totalSnapshots: 1 + workflowSnapshots.length,
      projectSnapshots: [projectSnapshot],
      workflowSnapshots,
      searchableContent,
    };
  }

  /**
   * Handle snapshot resource request
   */
  async handleSnapshotRequest(uri: string): Promise<MCPResourceResult> {
    try {
      if (uri === "cortex://snapshots/project") {
        const projectSnapshot = await this.generateProjectSnapshot();
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(projectSnapshot, null, 2),
            },
          ],
        };
      }

      if (uri === "cortex://snapshots/search") {
        const searchResults = await this.searchSnapshots();
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(searchResults, null, 2),
            },
          ],
        };
      }

      // Handle workflow-specific snapshots
      const uriParts = uri.split("/");
      if (
        uriParts.length >= 3 &&
        uriParts[2] !== "project" &&
        uriParts[2] !== "search"
      ) {
        const workflowId = uriParts[2];
        const workflowSnapshot =
          await this.generateWorkflowSnapshot(workflowId);
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(workflowSnapshot, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown snapshot URI: ${uri}`);
    } catch (error) {
      throw new Error(
        `Failed to handle snapshot request ${uri}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
