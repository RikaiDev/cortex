/**
 * Team Knowledge Sharing Types
 *
 * Types for cross-developer knowledge sharing and collaboration
 */

export interface TeamInsight {
  id: string;
  type: "learning" | "pattern" | "decision" | "pr-review";
  title: string;
  content: string;
  author: string; // Developer who contributed this
  timestamp: Date;
  source: "manual" | "pr-review" | "workflow" | "correction";
  tags: string[];
  scope?: string; // File pattern this applies to
  votes: number; // Team agreement score
  conflicts?: string[]; // IDs of conflicting insights
}

export interface PRReviewPattern {
  pattern: string; // What was reviewed (e.g., "missing error handling")
  description: string;
  examples: string[]; // Code snippets from PR
  frequency: number; // How many times this appeared in reviews
  reviewers: string[]; // Who made these comments
  files: string[]; // Files this pattern was seen in
}

export interface ConflictDetection {
  conflictId: string;
  type: "decision" | "pattern" | "approach";
  description: string;
  insights: TeamInsight[];
  suggestions: string[];
  resolved: boolean;
}

export interface TeamKnowledgeConfig {
  enabled: boolean;
  syncStrategy: "git" | "none"; // Future: "cloud", "hybrid"
  teamRepository?: string; // Git remote for team knowledge
  autoSync: boolean;
  conflictResolution: "manual" | "vote"; // How to handle conflicts
}

export interface TeamKnowledgeStats {
  totalInsights: number;
  byAuthor: Record<string, number>;
  byType: Record<string, number>;
  prPatterns: number;
  conflicts: number;
  resolvedConflicts: number;
}
