/**
 * File Analysis Utilities
 */

import * as path from "path";
import fs from "fs-extra";

export class FileAnalyzer {
  constructor(private projectRoot: string) {}

  /**
   * Analyze file structure
   */
  async analyzeFileStructure(): Promise<Record<string, unknown>> {
    const structure = {
      src: {},
      docs: {},
      config: {},
      tests: {},
    };

    const analyzeDir = (
      dirPath: string,
      maxDepth = 3,
      currentDepth = 0
    ): Record<string, unknown> => {
      if (currentDepth >= maxDepth) return {};

      const items: Record<string, unknown> = {};
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith(".")) {
            items[entry.name] = analyzeDir(
              path.join(dirPath, entry.name),
              maxDepth,
              currentDepth + 1
            );
          } else if (entry.isFile() && entry.name.endsWith(".ts")) {
            items[entry.name] = {
              type: "typescript",
              size: fs.statSync(path.join(dirPath, entry.name)).size,
            };
          }
        }
      } catch {
        // Directory doesn't exist or can't be read
      }

      return items;
    };

    structure.src = analyzeDir(path.join(this.projectRoot, "src"));
    structure.docs = analyzeDir(path.join(this.projectRoot, "docs"));
    structure.config = analyzeDir(path.join(this.projectRoot, "config"));
    structure.tests = analyzeDir(path.join(this.projectRoot, "test"));

    return structure;
  }

  /**
   * Get recent workflows
   */
  async getRecentWorkflows(): Promise<Array<Record<string, unknown>>> {
    const workflowsDir = path.join(this.projectRoot, ".cortex", "workflows");
    const workflows: Array<Record<string, unknown>> = [];

    if (fs.existsSync(workflowsDir)) {
      const files = fs.readdirSync(workflowsDir);
      const workflowFiles = files
        .filter((file) => file.endsWith(".json"))
        .slice(-5); // Last 5 workflows

      for (const file of workflowFiles) {
        try {
          const workflowPath = path.join(workflowsDir, file);
          const workflow = JSON.parse(fs.readFileSync(workflowPath, "utf-8"));
          workflows.push({
            id: file.replace(".json", ""),
            title: workflow.title,
            status: workflow.status,
            createdAt: workflow.createdAt,
            updatedAt: workflow.updatedAt,
          });
        } catch {
          // Skip invalid workflow files
        }
      }
    }

    return workflows;
  }

  /**
   * Extract key decisions from handoff content
   */
  extractKeyDecisions(content: string): string[] {
    const decisions: string[] = [];
    const patterns = [
      /## Key Findings[\s\S]*?(?=##|$)/,
      /### Key Findings[\s\S]*?(?=###|$)/,
      /## Architecture Assessment[\s\S]*?(?=##|$)/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        decisions.push(match[0].trim());
      }
    }

    return decisions;
  }

  /**
   * Extract lessons learned from handoff content
   */
  extractLessonsLearned(content: string): string[] {
    const lessons: string[] = [];
    const patterns = [
      /## Lessons Learned[\s\S]*?(?=##|$)/,
      /### Lessons Learned[\s\S]*?(?=###|$)/,
      /## Implementation Recommendations[\s\S]*?(?=##|$)/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        lessons.push(match[0].trim());
      }
    }

    return lessons;
  }

  /**
   * Extract technical debt from handoff content
   */
  extractTechnicalDebt(content: string): string[] {
    const debt: string[] = [];
    const patterns = [
      /## Areas for Improvement[\s\S]*?(?=##|$)/,
      /### Areas for Improvement[\s\S]*?(?=###|$)/,
      /## Technical Debt[\s\S]*?(?=##|$)/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        debt.push(match[0].trim());
      }
    }

    return debt;
  }

  /**
   * Extract recommendations from handoff content
   */
  extractRecommendations(content: string): string[] {
    const recommendations: string[] = [];
    const patterns = [
      /## Recommendations[\s\S]*?(?=##|$)/,
      /### Recommendations[\s\S]*?(?=###|$)/,
      /## Next Steps[\s\S]*?(?=##|$)/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        recommendations.push(match[0].trim());
      }
    }

    return recommendations;
  }

  /**
   * Generate snapshot summary
   */
  generateSnapshotSummary(snapshot: Record<string, unknown>): string {
    if (snapshot.type === "project") {
      const projectInfo =
        (snapshot.projectInfo as Record<string, unknown>) || {};
      const recentWorkflows =
        (snapshot.recentWorkflows as Array<unknown>) || [];
      return `Project: ${projectInfo.name || "Unknown"} - ${recentWorkflows.length} recent workflows`;
    } else if (snapshot.type === "workflow") {
      const workflowState =
        (snapshot.workflowState as Record<string, unknown>) || {};
      const keyDecisions = (snapshot.keyDecisions as Array<unknown>) || [];
      return `Workflow: ${workflowState.title || "Unknown"} - ${keyDecisions.length} key decisions`;
    }
    return "Unknown snapshot type";
  }
}
