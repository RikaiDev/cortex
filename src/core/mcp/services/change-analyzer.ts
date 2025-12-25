import fs from "fs-extra";
import * as path from "path";
import { execSync } from "child_process";
import type { ProjectConventions } from "./project-detector.js";

export interface ChangeEntry {
  type: "feat" | "fix" | "refactor" | "chore" | "docs" | "breaking";
  description: string;
  source: "git" | "workflow" | "both";
  details?: string;
  scope?: string;
}

export interface GitCommit {
  hash: string;
  type?: string;
  scope?: string;
  description: string;
  body?: string;
  breaking: boolean;
}

export interface WorkflowChange {
  workflowId: string;
  feature: string;
  userStories: string[];
  tasks: string[];
}

export interface ReleaseAnalysis {
  gitCommits: GitCommit[];
  workflowChanges: WorkflowChange[];
  mergedChanges: ChangeEntry[];
}

export class ChangeAnalyzer {
  constructor(private projectRoot: string) {}

  /**
   * Analyze changes based on project conventions
   */
  async analyze(conventions: ProjectConventions): Promise<ReleaseAnalysis> {
    const analysis: ReleaseAnalysis = {
      gitCommits: [],
      workflowChanges: [],
      mergedChanges: [],
    };

    // Strategy selection based on conventions
    if (conventions.hasCortexWorkflows && conventions.workflowCount > 0) {
      // Strategy C: Hybrid (Cortex workflows + Git commits)
      analysis.workflowChanges = await this.analyzeWorkflows();
      analysis.gitCommits = await this.analyzeGitCommits(conventions);
      analysis.mergedChanges = this.mergeChanges(
        analysis.workflowChanges,
        analysis.gitCommits
      );
    } else {
      // Strategy A: Git-based only
      analysis.gitCommits = await this.analyzeGitCommits(conventions);
      analysis.mergedChanges = this.convertGitToChanges(analysis.gitCommits);
    }

    return analysis;
  }

  /**
   * Analyze git commits since last tag
   */
  private async analyzeGitCommits(
    conventions: ProjectConventions
  ): Promise<GitCommit[]> {
    const commits: GitCommit[] = [];

    try {
      // Get last tag
      let sinceRef = "";
      try {
        sinceRef = execSync("git describe --tags --abbrev=0", {
          cwd: this.projectRoot,
          encoding: "utf-8",
        }).trim();
      } catch {
        // No tags exist, get all commits
        sinceRef = "";
      }

      // Get commits
      const range = sinceRef ? `${sinceRef}..HEAD` : "HEAD";
      const log = execSync(`git log ${range} --format=%H|||%s|||%b|||%n|||`, {
        cwd: this.projectRoot,
        encoding: "utf-8",
      });

      const commitBlocks = log.split("\n|||\n").filter((block) => block.trim());

      for (const block of commitBlocks) {
        const [hash, subject, body] = block.split("|||");
        if (!hash || !subject) continue;

        const commit: GitCommit = {
          hash: hash.trim(),
          description: subject.trim(),
          body: body?.trim(),
          breaking: false,
        };

        // Parse conventional commit format
        if (conventions.usesConventionalCommits) {
          const match = subject.match(
            /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci)(\(([^)]+)\))?:\s+(.+)/i
          );
          if (match) {
            commit.type = match[1].toLowerCase();
            commit.scope = match[3];
            commit.description = match[4];
          }
        }

        // Check for breaking changes
        if (body?.includes("BREAKING CHANGE") || subject.includes("!")) {
          commit.breaking = true;
        }

        commits.push(commit);
      }
    } catch {
      // If git command fails, return empty array
    }

    return commits;
  }

  /**
   * Analyze Cortex workflow files
   */
  private async analyzeWorkflows(): Promise<WorkflowChange[]> {
    const workflowChanges: WorkflowChange[] = [];
    const workflowsPath = path.join(this.projectRoot, ".cortex", "workflows");

    if (!(await fs.pathExists(workflowsPath))) {
      return workflowChanges;
    }

    try {
      const workflows = await fs.readdir(workflowsPath);

      for (const workflowId of workflows) {
        const workflowDir = path.join(workflowsPath, workflowId);
        const stat = await fs.stat(workflowDir);
        if (!stat.isDirectory()) continue;

        const change: WorkflowChange = {
          workflowId,
          feature: "",
          userStories: [],
          tasks: [],
        };

        // Read spec.md for feature description
        const specPath = path.join(workflowDir, "spec.md");
        if (await fs.pathExists(specPath)) {
          const spec = await fs.readFile(specPath, "utf-8");

          // Extract feature name from title
          const titleMatch = spec.match(/^#\s+(.+)$/m);
          if (titleMatch) {
            change.feature = titleMatch[1];
          }

          // Extract user stories
          const storyMatches = spec.matchAll(/^##\s+(US-\d+):\s+(.+)$/gm);
          for (const match of storyMatches) {
            change.userStories.push(`${match[1]}: ${match[2]}`);
          }
        }

        // Read tasks.md for task details
        const tasksPath = path.join(workflowDir, "tasks.md");
        if (await fs.pathExists(tasksPath)) {
          const tasks = await fs.readFile(tasksPath, "utf-8");

          // Extract completed tasks
          const taskMatches = tasks.matchAll(/^-\s+\[x\]\s+(.+)$/gim);
          for (const match of taskMatches) {
            change.tasks.push(match[1]);
          }
        }

        if (change.feature || change.userStories.length > 0) {
          workflowChanges.push(change);
        }
      }
    } catch {
      // If reading workflows fails, return what we have
    }

    return workflowChanges;
  }

  /**
   * Merge workflow changes and git commits
   */
  private mergeChanges(
    workflows: WorkflowChange[],
    commits: GitCommit[]
  ): ChangeEntry[] {
    const changes: ChangeEntry[] = [];

    // Add workflow-based changes (prioritize these for high-level description)
    for (const workflow of workflows) {
      if (workflow.userStories.length > 0) {
        for (const story of workflow.userStories) {
          changes.push({
            type: "feat",
            description: story,
            source: "workflow",
            details: workflow.tasks.join("; "),
          });
        }
      } else if (workflow.feature) {
        changes.push({
          type: "feat",
          description: workflow.feature,
          source: "workflow",
          details: workflow.tasks.join("; "),
        });
      }
    }

    // Add git commits (for technical details not covered by workflows)
    for (const commit of commits) {
      // Skip if already covered by workflow
      const alreadyCovered = changes.some((change) =>
        change.description
          .toLowerCase()
          .includes(commit.description.toLowerCase().substring(0, 20))
      );

      if (!alreadyCovered) {
        changes.push({
          type: this.mapCommitType(commit.type),
          description: commit.description,
          source: "git",
          details: commit.body,
          scope: commit.scope,
        });
      }
    }

    return changes;
  }

  /**
   * Convert git commits to change entries
   */
  private convertGitToChanges(commits: GitCommit[]): ChangeEntry[] {
    return commits.map((commit) => ({
      type: this.mapCommitType(commit.type),
      description: commit.description,
      source: "git" as const,
      details: commit.body,
      scope: commit.scope,
    }));
  }

  /**
   * Map git commit type to change entry type
   */
  private mapCommitType(
    type?: string
  ): "feat" | "fix" | "refactor" | "chore" | "docs" | "breaking" {
    if (!type) return "chore";

    switch (type.toLowerCase()) {
      case "feat":
      case "feature":
        return "feat";
      case "fix":
      case "bugfix":
        return "fix";
      case "refactor":
      case "refact":
        return "refactor";
      case "docs":
      case "doc":
        return "docs";
      case "chore":
      case "build":
      case "ci":
      case "test":
      case "style":
      case "perf":
      default:
        return "chore";
    }
  }
}
