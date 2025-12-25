/**
 * Performance Analysis Types
 *
 * Types for detecting performance anti-patterns
 */

export interface PerformanceIssue {
  file: string;
  line: number;
  pattern: string; // Pattern name that matched
  severity: "info" | "warning" | "error";
  description: string;
  suggestion: string;
  code?: string; // Code snippet that triggered the issue
  category: PerformanceCategory;
}

export type PerformanceCategory =
  | "database"
  | "async"
  | "memory"
  | "rendering"
  | "computation"
  | "io"
  | "resource-leak";

export interface PerformancePattern {
  name: string;
  category: PerformanceCategory;
  description: string;
  regex: string; // Regex pattern to match
  contextRegex?: string; // Optional context pattern (e.g., must be inside a loop)
  severity: "info" | "warning" | "error";
  suggestion: string;
  filePatterns?: string[]; // File patterns to apply this rule to (e.g., ["*.tsx", "*.ts"])
  excludePatterns?: string[]; // File patterns to exclude
}

export interface PerformanceAnalysisResult {
  hasIssues: boolean;
  issues: PerformanceIssue[];
  issuesByCategory: Record<PerformanceCategory, PerformanceIssue[]>;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

export interface PerformanceConfig {
  enabled: boolean;
  customPatterns: PerformancePattern[];
  disabledPatterns: string[]; // Pattern names to disable
  severityOverrides: Record<string, "info" | "warning" | "error">;
}
