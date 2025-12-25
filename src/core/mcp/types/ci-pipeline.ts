/**
 * CI/CD Pipeline Types
 *
 * Type definitions for CI/CD build and pipeline awareness
 */

/**
 * Build status values
 */
export type BuildStatus =
  | "success"
  | "failure"
  | "pending"
  | "cancelled"
  | "skipped"
  | "unknown";

/**
 * Workflow run conclusion
 */
export type WorkflowConclusion =
  | "success"
  | "failure"
  | "cancelled"
  | "skipped"
  | "timed_out"
  | "action_required"
  | "neutral"
  | "stale";

/**
 * Individual workflow run
 */
export interface WorkflowRun {
  id: number;
  name: string;
  status: BuildStatus;
  conclusion: WorkflowConclusion | null;
  branch: string;
  commit: string;
  commitMessage: string;
  author: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  url: string;
  jobs: WorkflowJob[];
}

/**
 * Job within a workflow run
 */
export interface WorkflowJob {
  id: number;
  name: string;
  status: BuildStatus;
  conclusion: WorkflowConclusion | null;
  startedAt: string;
  completedAt: string | null;
  steps: WorkflowStep[];
}

/**
 * Step within a job
 */
export interface WorkflowStep {
  name: string;
  status: BuildStatus;
  conclusion: WorkflowConclusion | null;
  number: number;
}

/**
 * Test failure information
 */
export interface TestFailure {
  testName: string;
  testFile: string;
  errorMessage: string;
  stackTrace: string;
  duration: number;
  retries: number;
  workflowRunId: number;
  jobName: string;
}

/**
 * Build history entry
 */
export interface BuildHistoryEntry {
  runId: number;
  workflowName: string;
  status: BuildStatus;
  conclusion: WorkflowConclusion | null;
  branch: string;
  commit: string;
  commitMessage: string;
  author: string;
  timestamp: string;
  duration: number | null;
  failedJobs: string[];
  failedTests: number;
}

/**
 * File change impact on CI
 */
export interface FileChangeImpact {
  file: string;
  recentFailures: number;
  lastFailure: string | null;
  failurePatterns: string[];
  riskLevel: "low" | "medium" | "high";
  suggestion: string;
}

/**
 * CI validation result
 */
export interface CIValidationResult {
  isValid: boolean;
  riskLevel: "low" | "medium" | "high";
  warnings: string[];
  suggestions: string[];
  relatedFailures: BuildHistoryEntry[];
  affectedWorkflows: string[];
}

/**
 * Current CI status summary
 */
export interface CIStatusSummary {
  repository: string;
  branch: string;
  lastRun: WorkflowRun | null;
  recentRuns: WorkflowRun[];
  overallStatus: BuildStatus;
  failingWorkflows: string[];
  pendingWorkflows: string[];
  successRate: number;
  avgDuration: number;
}

/**
 * Failure pattern for learning
 */
export interface FailurePattern {
  pattern: string;
  occurrences: number;
  lastSeen: string;
  affectedFiles: string[];
  suggestedFix: string;
}

/**
 * CI/CD service options
 */
export interface CIPipelineOptions {
  branch?: string;
  limit?: number;
  workflowName?: string;
  includeJobs?: boolean;
  includeLogs?: boolean;
}
