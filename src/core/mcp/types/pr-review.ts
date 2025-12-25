/**
 * PR Review Types
 *
 * Type definitions for PR review automation
 */

import type { PRReviewPattern } from "./team-knowledge.js";

/**
 * Severity levels for review findings
 */
export type ReviewSeverity = "critical" | "warning" | "suggestion" | "info";

/**
 * Categories of review findings
 */
export type ReviewCategory =
  | "error-handling"
  | "testing"
  | "security"
  | "performance"
  | "naming"
  | "documentation"
  | "code-style"
  | "architecture"
  | "duplication"
  | "validation"
  | "general";

/**
 * Individual review finding/suggestion
 */
export interface ReviewFinding {
  /** Severity of the finding */
  severity: ReviewSeverity;
  /** Category of the finding */
  category: ReviewCategory;
  /** File path where finding was detected */
  file: string;
  /** Line number (if applicable) */
  line?: number;
  /** Description of the issue */
  message: string;
  /** Suggestion for fixing */
  suggestion: string;
  /** Pattern that triggered this finding */
  matchedPattern?: string;
  /** Code snippet (if applicable) */
  codeSnippet?: string;
}

/**
 * PR information from GitHub
 */
export interface PRInfo {
  /** PR number */
  number: number;
  /** PR title */
  title: string;
  /** PR body/description */
  body: string;
  /** PR author */
  author: string;
  /** Base branch */
  baseBranch: string;
  /** Head branch */
  headBranch: string;
  /** PR state */
  state: "open" | "closed" | "merged";
  /** Files changed */
  files: PRFile[];
  /** Labels */
  labels: string[];
  /** Current reviewers */
  reviewers: string[];
  /** PR URL */
  url: string;
  /** Created at */
  createdAt: string;
  /** Number of commits */
  commits: number;
  /** Lines added */
  additions: number;
  /** Lines deleted */
  deletions: number;
}

/**
 * File changed in a PR
 */
export interface PRFile {
  /** File path */
  path: string;
  /** Change type */
  status: "added" | "modified" | "deleted" | "renamed";
  /** Lines added */
  additions: number;
  /** Lines deleted */
  deletions: number;
  /** File diff/patch */
  patch?: string;
  /** Previous path (for renamed files) */
  previousPath?: string;
}

/**
 * Code owner entry
 */
export interface CodeOwner {
  /** File pattern (glob) */
  pattern: string;
  /** Owners (users or teams) */
  owners: string[];
}

/**
 * Suggested reviewer
 */
export interface ReviewerSuggestion {
  /** Reviewer username */
  username: string;
  /** Reason for suggestion */
  reason: string;
  /** Files this reviewer owns */
  ownedFiles: string[];
  /** Priority (1 = highest) */
  priority: number;
  /** Whether reviewer is a team */
  isTeam: boolean;
}

/**
 * Review checklist item
 */
export interface ChecklistItem {
  /** Checklist category */
  category: ReviewCategory;
  /** Item description */
  description: string;
  /** Whether this is required */
  required: boolean;
  /** Whether this is auto-checked */
  autoChecked: boolean;
  /** Auto-check result (if applicable) */
  status?: "pass" | "fail" | "warning" | "skip";
  /** Details about the check result */
  details?: string;
}

/**
 * Complete PR review result
 */
export interface PRReviewResult {
  /** PR info */
  pr: PRInfo;
  /** Review findings */
  findings: ReviewFinding[];
  /** Overall review verdict */
  verdict: "approve" | "request-changes" | "comment";
  /** Summary of review */
  summary: string;
  /** Patterns applied */
  appliedPatterns: PRReviewPattern[];
  /** Statistics */
  stats: ReviewStats;
  /** Review timestamp */
  reviewedAt: string;
}

/**
 * Review statistics
 */
export interface ReviewStats {
  /** Total findings */
  totalFindings: number;
  /** Findings by severity */
  bySeverity: Record<ReviewSeverity, number>;
  /** Findings by category */
  byCategory: Record<ReviewCategory, number>;
  /** Files reviewed */
  filesReviewed: number;
  /** Lines reviewed */
  linesReviewed: number;
  /** Patterns matched */
  patternsMatched: number;
}

/**
 * Reviewer suggestions result
 */
export interface ReviewerSuggestionsResult {
  /** PR info */
  pr: PRInfo;
  /** Suggested reviewers */
  suggestions: ReviewerSuggestion[];
  /** Code owners parsed */
  codeOwners: CodeOwner[];
  /** Files without owners */
  unownedFiles: string[];
}

/**
 * Review checklist result
 */
export interface ReviewChecklistResult {
  /** PR info */
  pr: PRInfo;
  /** Checklist items */
  items: ChecklistItem[];
  /** Overall readiness */
  readyForReview: boolean;
  /** Blocking items */
  blockingItems: string[];
  /** Generated based on */
  basedOn: string[];
}

/**
 * PR review options
 */
export interface PRReviewOptions {
  /** Apply team patterns */
  useTeamPatterns?: boolean;
  /** Include suggestions (not just issues) */
  includeSuggestions?: boolean;
  /** Minimum severity to report */
  minSeverity?: ReviewSeverity;
  /** Maximum findings to report */
  maxFindings?: number;
  /** Focus on specific files */
  focusFiles?: string[];
}
