/**
 * CI Pipeline Service
 *
 * Integrates with GitHub Actions to provide build awareness
 */

import { execSync } from "node:child_process";
import * as path from "node:path";
import fs from "fs-extra";
import type {
  WorkflowRun,
  TestFailure,
  BuildHistoryEntry,
  FileChangeImpact,
  CIValidationResult,
  CIStatusSummary,
  FailurePattern,
  CIPipelineOptions,
  BuildStatus,
  WorkflowConclusion,
} from "../types/ci-pipeline.js";

interface GHWorkflowRun {
  databaseId: number;
  name: string;
  status: string;
  conclusion: string | null;
  headBranch: string;
  headSha: string;
  displayTitle: string;
  actor: { login: string };
  createdAt: string;
  updatedAt: string;
  url: string;
}

export class CIPipelineService {
  private readonly historyPath: string;
  private readonly failurePatternsPath: string;

  constructor(private projectRoot: string) {
    const cortexDir = path.join(projectRoot, ".cortex");
    this.historyPath = path.join(cortexDir, "ci-history.json");
    this.failurePatternsPath = path.join(cortexDir, "ci-failure-patterns.json");
  }

  /**
   * Check if gh CLI is available
   */
  private isGhAvailable(): boolean {
    try {
      execSync("gh --version", { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute gh CLI command
   */
  private executeGh(args: string): string {
    try {
      const result = execSync(`gh ${args}`, {
        cwd: this.projectRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return result.trim();
    } catch (error) {
      if (error instanceof Error && "stderr" in error) {
        throw new Error(`GitHub CLI error: ${(error as { stderr: string }).stderr}`);
      }
      throw error;
    }
  }

  /**
   * Get current CI status
   */
  async getStatus(options: CIPipelineOptions = {}): Promise<CIStatusSummary> {
    if (!this.isGhAvailable()) {
      throw new Error("GitHub CLI (gh) is not installed or not authenticated");
    }

    const branch = options.branch || this.getCurrentBranch();
    const limit = options.limit || 10;

    // Get repository name
    const repoName = this.getRepoName();

    // Get recent workflow runs
    const runsJson = this.executeGh(
      `run list --branch "${branch}" --limit ${limit} --json databaseId,name,status,conclusion,headBranch,headSha,displayTitle,actor,createdAt,updatedAt,url`
    );

    const ghRuns: GHWorkflowRun[] = JSON.parse(runsJson || "[]");
    const runs = ghRuns.map((run) => this.mapWorkflowRun(run));

    // Calculate summary
    const failingWorkflows = runs
      .filter((r) => r.conclusion === "failure")
      .map((r) => r.name);
    const pendingWorkflows = runs
      .filter((r) => r.status === "pending")
      .map((r) => r.name);

    const completedRuns = runs.filter((r) => r.conclusion !== null);
    const successCount = completedRuns.filter(
      (r) => r.conclusion === "success"
    ).length;
    const successRate =
      completedRuns.length > 0
        ? Math.round((successCount / completedRuns.length) * 100)
        : 0;

    const durations = runs
      .filter((r) => r.duration !== null)
      .map((r) => r.duration as number);
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    // Determine overall status
    let overallStatus: BuildStatus = "success";
    if (pendingWorkflows.length > 0) {
      overallStatus = "pending";
    } else if (failingWorkflows.length > 0) {
      overallStatus = "failure";
    }

    return {
      repository: repoName,
      branch,
      lastRun: runs[0] || null,
      recentRuns: runs,
      overallStatus,
      failingWorkflows: [...new Set(failingWorkflows)],
      pendingWorkflows: [...new Set(pendingWorkflows)],
      successRate,
      avgDuration,
    };
  }

  /**
   * Get failing tests from recent runs
   */
  async getFailures(options: CIPipelineOptions = {}): Promise<TestFailure[]> {
    if (!this.isGhAvailable()) {
      throw new Error("GitHub CLI (gh) is not installed or not authenticated");
    }

    const limit = options.limit || 5;
    const failures: TestFailure[] = [];

    // Get recent failed runs
    const runsJson = this.executeGh(
      `run list --status failure --limit ${limit} --json databaseId,name`
    );

    const failedRuns: Array<{ databaseId: number; name: string }> = JSON.parse(
      runsJson || "[]"
    );

    for (const run of failedRuns.slice(0, 3)) {
      try {
        // Get run logs
        const logs = this.getRunLogs(run.databaseId);
        const testFailures = this.parseTestFailures(
          logs,
          run.databaseId,
          run.name
        );
        failures.push(...testFailures);
      } catch {
        // Skip if can't get logs
      }
    }

    return failures;
  }

  /**
   * Get build history for specific files
   */
  async getHistory(
    files: string[],
    options: CIPipelineOptions = {}
  ): Promise<BuildHistoryEntry[]> {
    if (!this.isGhAvailable()) {
      throw new Error("GitHub CLI (gh) is not installed or not authenticated");
    }

    const limit = options.limit || 20;
    const history: BuildHistoryEntry[] = [];

    // Get recent runs
    const runsJson = this.executeGh(
      `run list --limit ${limit} --json databaseId,name,status,conclusion,headBranch,headSha,displayTitle,actor,createdAt,updatedAt`
    );

    const runs: GHWorkflowRun[] = JSON.parse(runsJson || "[]");

    for (const run of runs) {
      // Check if any of the files were modified in this commit
      const changedFiles = this.getCommitFiles(run.headSha);
      const isRelevant = files.some((f) =>
        changedFiles.some(
          (cf) => cf.includes(f) || f.includes(cf)
        )
      );

      if (isRelevant || files.length === 0) {
        const duration = this.calculateDuration(run.createdAt, run.updatedAt);

        history.push({
          runId: run.databaseId,
          workflowName: run.name,
          status: this.mapStatus(run.status),
          conclusion: this.mapConclusion(run.conclusion),
          branch: run.headBranch,
          commit: run.headSha.substring(0, 7),
          commitMessage: run.displayTitle,
          author: run.actor.login,
          timestamp: run.createdAt,
          duration,
          failedJobs: [],
          failedTests: 0,
        });
      }
    }

    // Save to local history for learning
    await this.saveHistory(history);

    return history;
  }

  /**
   * Validate changes against CI history
   */
  async validateChanges(files: string[]): Promise<CIValidationResult> {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const relatedFailures: BuildHistoryEntry[] = [];
    const affectedWorkflows: string[] = [];

    // Load failure patterns
    const patterns = await this.loadFailurePatterns();

    // Check each file against failure patterns
    for (const file of files) {
      const impact = await this.getFileImpact(file, patterns);

      if (impact.riskLevel === "high") {
        warnings.push(
          `High risk: ${file} has ${impact.recentFailures} recent failures`
        );
        suggestions.push(impact.suggestion);
      } else if (impact.riskLevel === "medium") {
        warnings.push(
          `Medium risk: ${file} - ${impact.failurePatterns.join(", ")}`
        );
      }
    }

    // Get related failures from history
    try {
      const history = await this.getHistory(files, { limit: 10 });
      const failures = history.filter((h) => h.conclusion === "failure");
      relatedFailures.push(...failures.slice(0, 5));

      // Collect affected workflows
      const workflows = new Set(failures.map((f) => f.workflowName));
      affectedWorkflows.push(...workflows);
    } catch {
      // If we can't get history, continue with local patterns
    }

    // Determine overall risk level
    let riskLevel: "low" | "medium" | "high" = "low";
    if (warnings.some((w) => w.startsWith("High risk"))) {
      riskLevel = "high";
    } else if (warnings.length > 0) {
      riskLevel = "medium";
    }

    // Add general suggestions
    if (riskLevel !== "low") {
      suggestions.push("Run tests locally before pushing: npm test");
      suggestions.push("Consider running the full CI workflow locally if available");
    }

    return {
      isValid: riskLevel !== "high",
      riskLevel,
      warnings,
      suggestions,
      relatedFailures,
      affectedWorkflows,
    };
  }

  /**
   * Get file change impact based on failure history
   */
  private async getFileImpact(
    file: string,
    patterns: FailurePattern[]
  ): Promise<FileChangeImpact> {
    const relevantPatterns = patterns.filter((p) =>
      p.affectedFiles.some((f) => f.includes(file) || file.includes(f))
    );

    const recentFailures = relevantPatterns.reduce(
      (sum, p) => sum + p.occurrences,
      0
    );
    const lastFailure =
      relevantPatterns.length > 0 ? relevantPatterns[0].lastSeen : null;

    let riskLevel: "low" | "medium" | "high" = "low";
    if (recentFailures >= 3) {
      riskLevel = "high";
    } else if (recentFailures >= 1) {
      riskLevel = "medium";
    }

    const suggestion =
      relevantPatterns.length > 0
        ? relevantPatterns[0].suggestedFix
        : "No known issues with this file";

    return {
      file,
      recentFailures,
      lastFailure,
      failurePatterns: relevantPatterns.map((p) => p.pattern),
      riskLevel,
      suggestion,
    };
  }

  /**
   * Get run logs
   */
  private getRunLogs(runId: number): string {
    try {
      return this.executeGh(`run view ${runId} --log`);
    } catch {
      return "";
    }
  }

  /**
   * Parse test failures from logs
   */
  private parseTestFailures(
    logs: string,
    runId: number,
    jobName: string
  ): TestFailure[] {
    const failures: TestFailure[] = [];
    const lines = logs.split("\n");

    // Common test failure patterns
    const jestFailPattern = /FAIL\s+(.+\.(?:test|spec)\.[jt]sx?)/;
    const errorPattern = /✕\s+(.+)/;
    const assertionPattern = /expect\(.+\)\..+/;

    let currentTestFile = "";
    let currentError = "";
    let collectingStack = false;
    let stackTrace = "";

    for (const line of lines) {
      // Detect test file failures
      const fileMatch = line.match(jestFailPattern);
      if (fileMatch) {
        currentTestFile = fileMatch[1];
      }

      // Detect individual test failures
      const errorMatch = line.match(errorPattern);
      if (errorMatch && currentTestFile) {
        if (currentError) {
          failures.push({
            testName: currentError,
            testFile: currentTestFile,
            errorMessage: currentError,
            stackTrace: stackTrace.trim(),
            duration: 0,
            retries: 0,
            workflowRunId: runId,
            jobName,
          });
        }
        currentError = errorMatch[1];
        stackTrace = "";
        collectingStack = true;
      }

      // Collect stack trace
      if (collectingStack && line.includes("at ")) {
        stackTrace += line + "\n";
      }

      // Detect assertion errors
      if (assertionPattern.test(line)) {
        stackTrace += line + "\n";
      }
    }

    // Add last failure
    if (currentError && currentTestFile) {
      failures.push({
        testName: currentError,
        testFile: currentTestFile,
        errorMessage: currentError,
        stackTrace: stackTrace.trim(),
        duration: 0,
        retries: 0,
        workflowRunId: runId,
        jobName,
      });
    }

    return failures;
  }

  /**
   * Get current branch
   */
  private getCurrentBranch(): string {
    try {
      return execSync("git branch --show-current", {
        cwd: this.projectRoot,
        encoding: "utf-8",
      }).trim();
    } catch {
      return "main";
    }
  }

  /**
   * Get repository name
   */
  private getRepoName(): string {
    try {
      const remote = execSync("git remote get-url origin", {
        cwd: this.projectRoot,
        encoding: "utf-8",
      }).trim();
      // Extract owner/repo from URL
      const match = remote.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
      return match ? match[1] : "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Get files changed in a commit
   */
  private getCommitFiles(commit: string): string[] {
    try {
      const output = execSync(`git show --name-only --format="" ${commit}`, {
        cwd: this.projectRoot,
        encoding: "utf-8",
      });
      return output.trim().split("\n").filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Calculate duration between two timestamps
   */
  private calculateDuration(start: string, end: string): number {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return Math.round((endTime - startTime) / 1000);
  }

  /**
   * Map workflow run from gh CLI format
   */
  private mapWorkflowRun(run: GHWorkflowRun): WorkflowRun {
    return {
      id: run.databaseId,
      name: run.name,
      status: this.mapStatus(run.status),
      conclusion: this.mapConclusion(run.conclusion),
      branch: run.headBranch,
      commit: run.headSha,
      commitMessage: run.displayTitle,
      author: run.actor.login,
      startedAt: run.createdAt,
      completedAt: run.updatedAt,
      duration: this.calculateDuration(run.createdAt, run.updatedAt),
      url: run.url,
      jobs: [],
    };
  }

  /**
   * Map status string to BuildStatus
   */
  private mapStatus(status: string): BuildStatus {
    const statusMap: Record<string, BuildStatus> = {
      completed: "success",
      in_progress: "pending",
      queued: "pending",
      waiting: "pending",
      requested: "pending",
      pending: "pending",
    };
    return statusMap[status.toLowerCase()] || "unknown";
  }

  /**
   * Map conclusion string to WorkflowConclusion
   */
  private mapConclusion(conclusion: string | null): WorkflowConclusion | null {
    if (!conclusion) return null;
    const conclusionMap: Record<string, WorkflowConclusion> = {
      success: "success",
      failure: "failure",
      cancelled: "cancelled",
      skipped: "skipped",
      timed_out: "timed_out",
      action_required: "action_required",
      neutral: "neutral",
      stale: "stale",
    };
    return conclusionMap[conclusion.toLowerCase()] || null;
  }

  /**
   * Save history to local file
   */
  private async saveHistory(history: BuildHistoryEntry[]): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.historyPath));

      let existingHistory: BuildHistoryEntry[] = [];
      if (await fs.pathExists(this.historyPath)) {
        existingHistory = await fs.readJson(this.historyPath);
      }

      // Merge and deduplicate by runId
      const merged = [...history, ...existingHistory];
      const seen = new Set<number>();
      const deduplicated = merged.filter((h) => {
        if (seen.has(h.runId)) return false;
        seen.add(h.runId);
        return true;
      });

      // Keep last 100 entries
      const trimmed = deduplicated.slice(0, 100);
      await fs.writeJson(this.historyPath, trimmed, { spaces: 2 });
    } catch {
      // Ignore save errors
    }
  }

  /**
   * Load failure patterns from local file
   */
  private async loadFailurePatterns(): Promise<FailurePattern[]> {
    try {
      if (await fs.pathExists(this.failurePatternsPath)) {
        return await fs.readJson(this.failurePatternsPath);
      }
    } catch {
      // Ignore load errors
    }
    return [];
  }

  /**
   * Record a failure pattern for learning
   */
  async recordFailurePattern(pattern: FailurePattern): Promise<void> {
    try {
      const patterns = await this.loadFailurePatterns();

      // Update existing or add new
      const existingIndex = patterns.findIndex(
        (p) => p.pattern === pattern.pattern
      );
      if (existingIndex >= 0) {
        patterns[existingIndex].occurrences++;
        patterns[existingIndex].lastSeen = pattern.lastSeen;
        patterns[existingIndex].affectedFiles = [
          ...new Set([
            ...patterns[existingIndex].affectedFiles,
            ...pattern.affectedFiles,
          ]),
        ];
      } else {
        patterns.push(pattern);
      }

      await fs.ensureDir(path.dirname(this.failurePatternsPath));
      await fs.writeJson(this.failurePatternsPath, patterns, { spaces: 2 });
    } catch {
      // Ignore save errors
    }
  }
}
