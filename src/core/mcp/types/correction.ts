/**
 * Correction System Types
 *
 * Types for storing and recalling developer corrections.
 * Uses AI-native detection - the LLM detects corrections naturally
 * without regex pattern matching.
 */

export interface Correction {
  /** Unique identifier */
  id: string;

  /** What the AI did wrong */
  wrongBehavior: string;

  /** What the correct behavior should be */
  correctBehavior: string;

  /** Context where this applies */
  context: CorrectionContext;

  /** Severity of the mistake */
  severity: "minor" | "moderate" | "major";

  /** Creation timestamp (ISO 8601) */
  createdAt: string;

  /** How many times this warning was shown */
  warnCount: number;

  /** Related workflow IDs */
  workflowIds: string[];

  /** Tags for searching */
  tags: string[];
}

export interface CorrectionContext {
  /** File patterns where this applies (e.g., "*.tsx", "src/api/*") */
  filePatterns: string[];

  /** Tech stack context (e.g., "React", "TypeScript") */
  techStack: string[];

  /** Keywords that trigger this correction */
  triggerKeywords: string[];

  /** Phases where this applies */
  phases: ("spec" | "plan" | "tasks" | "implement")[];
}

export interface CorrectionWarning {
  /** The correction being warned about */
  correction: Correction;

  /** Why this warning was triggered */
  matchReason: string;

  /** Confidence level (0-1) */
  confidence: number;
}

export interface CorrectionIndex {
  /** Version of the index format */
  version: string;

  /** Last update timestamp */
  lastUpdated: string;

  /** Total number of corrections */
  totalCorrections: number;

  /** Brief summaries for quick lookup */
  corrections: Array<{
    id: string;
    wrongBehavior: string;
    severity: "minor" | "moderate" | "major";
    createdAt: string;
  }>;
}
