/**
 * Team Knowledge Service
 *
 * Manages shared knowledge across team members
 */

import * as path from "node:path";
import fs from "fs-extra";
import { execSync } from "child_process";
import { v4 as uuidv4 } from "uuid";
import type {
  TeamInsight,
  PRReviewPattern,
  ConflictDetection,
  TeamKnowledgeConfig,
  TeamKnowledgeStats,
} from "../types/team-knowledge.js";

export class TeamKnowledgeService {
  private config: TeamKnowledgeConfig;
  private teamKnowledgePath: string;

  constructor(private projectRoot: string) {
    this.teamKnowledgePath = path.join(
      projectRoot,
      ".cortex",
      "team-knowledge"
    );
    this.config = {
      enabled: true,
      syncStrategy: "git",
      autoSync: false,
      conflictResolution: "manual",
    };
  }

  /**
   * Load team knowledge configuration
   */
  async loadConfig(): Promise<void> {
    const configPath = path.join(
      this.projectRoot,
      ".cortex",
      "team-knowledge.json"
    );

    if (await fs.pathExists(configPath)) {
      try {
        this.config = await fs.readJson(configPath);
      } catch {
        // Use defaults
      }
    }
  }

  /**
   * Save team knowledge configuration
   */
  async saveConfig(config: Partial<TeamKnowledgeConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    const configPath = path.join(
      this.projectRoot,
      ".cortex",
      "team-knowledge.json"
    );

    await fs.ensureDir(path.dirname(configPath));
    await fs.writeJson(configPath, this.config, { spaces: 2 });
  }

  /**
   * Share an insight with the team
   */
  async shareInsight(
    insight: Omit<TeamInsight, "id" | "timestamp">
  ): Promise<string> {
    await this.loadConfig();

    if (!this.config.enabled) {
      throw new Error("Team knowledge sharing is disabled");
    }

    const teamInsight: TeamInsight = {
      ...insight,
      id: uuidv4(),
      timestamp: new Date(),
    };

    // Save to team knowledge directory
    const insightsPath = path.join(this.teamKnowledgePath, "insights.json");
    await fs.ensureDir(this.teamKnowledgePath);

    let insights: TeamInsight[] = [];
    if (await fs.pathExists(insightsPath)) {
      insights = await fs.readJson(insightsPath);
    }

    insights.push(teamInsight);
    await fs.writeJson(insightsPath, insights, { spaces: 2 });

    // Check for conflicts
    await this.detectConflicts(teamInsight);

    // Auto-sync if enabled
    if (this.config.autoSync && this.config.syncStrategy === "git") {
      await this.syncToGit();
    }

    return teamInsight.id;
  }

  /**
   * Get all team insights
   */
  async getTeamInsights(filters?: {
    author?: string;
    type?: string;
    tags?: string[];
  }): Promise<TeamInsight[]> {
    const insightsPath = path.join(this.teamKnowledgePath, "insights.json");

    if (!(await fs.pathExists(insightsPath))) {
      return [];
    }

    let insights: TeamInsight[] = await fs.readJson(insightsPath);

    // Apply filters
    if (filters) {
      if (filters.author) {
        insights = insights.filter((i) => i.author === filters.author);
      }
      if (filters.type) {
        insights = insights.filter((i) => i.type === filters.type);
      }
      if (filters.tags && filters.tags.length > 0) {
        insights = insights.filter((i) =>
          filters.tags!.some((tag) => i.tags.includes(tag))
        );
      }
    }

    return insights;
  }

  /**
   * Extract patterns from PR review comments
   */
  async extractPRPatterns(prNumber: number): Promise<PRReviewPattern[]> {
    try {
      // Get PR review comments using gh CLI
      const reviewsJson = execSync(
        `gh pr view ${prNumber} --json reviews,comments`,
        {
          cwd: this.projectRoot,
          encoding: "utf-8",
        }
      );

      const data = JSON.parse(reviewsJson);
      const patterns: Map<string, PRReviewPattern> = new Map();

      // Process review comments
      if (data.reviews) {
        for (const review of data.reviews) {
          if (review.body) {
            this.extractPatternsFromComment(
              review.body,
              review.author.login,
              patterns
            );
          }
        }
      }

      // Process inline comments
      if (data.comments) {
        for (const comment of data.comments) {
          if (comment.body) {
            this.extractPatternsFromComment(
              comment.body,
              comment.author.login,
              patterns
            );
          }
        }
      }

      // Save patterns
      const patternsPath = path.join(
        this.teamKnowledgePath,
        "pr-patterns.json"
      );
      await fs.ensureDir(this.teamKnowledgePath);

      let existingPatterns: PRReviewPattern[] = [];
      if (await fs.pathExists(patternsPath)) {
        existingPatterns = await fs.readJson(patternsPath);
      }

      // Merge with existing patterns
      const mergedPatterns = this.mergePatterns(
        existingPatterns,
        Array.from(patterns.values())
      );

      await fs.writeJson(patternsPath, mergedPatterns, { spaces: 2 });

      return Array.from(patterns.values());
    } catch (error) {
      throw new Error(
        `Failed to extract PR patterns: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extract patterns from a single comment
   */
  private extractPatternsFromComment(
    comment: string,
    reviewer: string,
    patterns: Map<string, PRReviewPattern>
  ): void {
    // Common review patterns to detect
    const reviewPatterns = [
      {
        regex: /missing\s+error\s+handling/i,
        pattern: "missing-error-handling",
      },
      { regex: /add\s+(tests?|unit\s+tests?)/i, pattern: "missing-tests" },
      { regex: /(consider|use)\s+async\/await/i, pattern: "use-async-await" },
      { regex: /missing\s+validation/i, pattern: "missing-validation" },
      {
        regex: /extract\s+(to\s+)?(\w+\s+)?(function|method|constant)/i,
        pattern: "extract-function",
      },
      { regex: /typo|spelling/i, pattern: "typo" },
      {
        regex: /performance|optimize|inefficient/i,
        pattern: "performance-concern",
      },
      { regex: /security|vulnerable|sanitize/i, pattern: "security-issue" },
      { regex: /naming|rename|better\s+name/i, pattern: "naming-improvement" },
      { regex: /duplicate|DRY|don't\s+repeat/i, pattern: "code-duplication" },
    ];

    for (const { regex, pattern: patternKey } of reviewPatterns) {
      if (regex.test(comment)) {
        const existing = patterns.get(patternKey);

        if (existing) {
          existing.frequency++;
          if (!existing.reviewers.includes(reviewer)) {
            existing.reviewers.push(reviewer);
          }
          existing.examples.push(comment.substring(0, 200));
        } else {
          patterns.set(patternKey, {
            pattern: patternKey,
            description: this.getPatternDescription(patternKey),
            examples: [comment.substring(0, 200)],
            frequency: 1,
            reviewers: [reviewer],
            files: [],
          });
        }
      }
    }
  }

  /**
   * Get human-readable description for pattern
   */
  private getPatternDescription(pattern: string): string {
    const descriptions: Record<string, string> = {
      "missing-error-handling": "Error handling is missing or incomplete",
      "missing-tests": "Tests should be added for this code",
      "use-async-await":
        "Consider using async/await instead of callbacks/promises",
      "missing-validation": "Input validation is missing",
      "extract-function": "Code should be extracted to a separate function",
      typo: "Spelling or grammar issues",
      "performance-concern": "Performance optimization needed",
      "security-issue": "Security vulnerability or concern",
      "naming-improvement": "Variable/function naming could be improved",
      "code-duplication": "Code is duplicated and should be refactored",
    };

    return descriptions[pattern] || pattern;
  }

  /**
   * Merge new patterns with existing ones
   */
  private mergePatterns(
    existing: PRReviewPattern[],
    newPatterns: PRReviewPattern[]
  ): PRReviewPattern[] {
    const merged = new Map<string, PRReviewPattern>();

    // Add existing patterns
    for (const pattern of existing) {
      merged.set(pattern.pattern, pattern);
    }

    // Merge new patterns
    for (const pattern of newPatterns) {
      const existingPattern = merged.get(pattern.pattern);

      if (existingPattern) {
        existingPattern.frequency += pattern.frequency;
        existingPattern.examples.push(...pattern.examples);
        existingPattern.reviewers = [
          ...new Set([...existingPattern.reviewers, ...pattern.reviewers]),
        ];
        existingPattern.files = [
          ...new Set([...existingPattern.files, ...pattern.files]),
        ];
      } else {
        merged.set(pattern.pattern, pattern);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Detect conflicts between team insights
   */
  async detectConflicts(newInsight: TeamInsight): Promise<ConflictDetection[]> {
    const insights = await this.getTeamInsights();
    const conflicts: ConflictDetection[] = [];

    // Look for conflicting decisions or patterns
    for (const existingInsight of insights) {
      if (
        existingInsight.id === newInsight.id ||
        existingInsight.author === newInsight.author
      ) {
        continue; // Skip same insight or same author
      }

      // Check for scope overlap
      if (
        existingInsight.scope &&
        newInsight.scope &&
        this.scopesOverlap(existingInsight.scope, newInsight.scope)
      ) {
        // Check for content conflict (simple heuristic)
        if (
          this.hasContentConflict(existingInsight.content, newInsight.content)
        ) {
          const conflictId = `conflict-${Date.now()}`;

          const conflict: ConflictDetection = {
            conflictId,
            type: "approach",
            description: `Different approaches suggested for ${newInsight.scope || "same scope"}`,
            insights: [existingInsight, newInsight],
            suggestions: [
              "Review both approaches and choose the most suitable",
              "Discuss with team to establish a standard",
              "Consider context-specific application of each approach",
            ],
            resolved: false,
          };

          conflicts.push(conflict);

          // Save conflict
          await this.saveConflict(conflict);
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if two scopes overlap
   */
  private scopesOverlap(scope1: string, scope2: string): boolean {
    // Simple pattern matching
    return (
      scope1 === scope2 || scope1.includes(scope2) || scope2.includes(scope1)
    );
  }

  /**
   * Check if two contents conflict
   */
  private hasContentConflict(content1: string, content2: string): boolean {
    // Simple heuristic: look for opposing keywords
    const opposites = [
      ["should", "should not"],
      ["use", "avoid"],
      ["prefer", "don't use"],
      ["always", "never"],
    ];

    const lower1 = content1.toLowerCase();
    const lower2 = content2.toLowerCase();

    for (const [word1, word2] of opposites) {
      if (
        (lower1.includes(word1) && lower2.includes(word2)) ||
        (lower1.includes(word2) && lower2.includes(word1))
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Save conflict
   */
  private async saveConflict(conflict: ConflictDetection): Promise<void> {
    const conflictsPath = path.join(this.teamKnowledgePath, "conflicts.json");
    await fs.ensureDir(this.teamKnowledgePath);

    let conflicts: ConflictDetection[] = [];
    if (await fs.pathExists(conflictsPath)) {
      conflicts = await fs.readJson(conflictsPath);
    }

    conflicts.push(conflict);
    await fs.writeJson(conflictsPath, conflicts, { spaces: 2 });

    // Mark insights as conflicted
    const insightsPath = path.join(this.teamKnowledgePath, "insights.json");
    const insights: TeamInsight[] = await fs.readJson(insightsPath);

    for (const insight of insights) {
      for (const conflictInsight of conflict.insights) {
        if (insight.id === conflictInsight.id) {
          if (!insight.conflicts) {
            insight.conflicts = [];
          }
          insight.conflicts.push(conflict.conflictId);
        }
      }
    }

    await fs.writeJson(insightsPath, insights, { spaces: 2 });
  }

  /**
   * Get unresolved conflicts
   */
  async getConflicts(resolved = false): Promise<ConflictDetection[]> {
    const conflictsPath = path.join(this.teamKnowledgePath, "conflicts.json");

    if (!(await fs.pathExists(conflictsPath))) {
      return [];
    }

    const conflicts: ConflictDetection[] = await fs.readJson(conflictsPath);
    return conflicts.filter((c) => c.resolved === resolved);
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(conflictId: string, resolution: string): Promise<void> {
    const conflictsPath = path.join(this.teamKnowledgePath, "conflicts.json");

    if (!(await fs.pathExists(conflictsPath))) {
      throw new Error("No conflicts found");
    }

    const conflicts: ConflictDetection[] = await fs.readJson(conflictsPath);
    const conflict = conflicts.find((c) => c.conflictId === conflictId);

    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    conflict.resolved = true;
    conflict.suggestions = [resolution];

    await fs.writeJson(conflictsPath, conflicts, { spaces: 2 });
  }

  /**
   * Sync team knowledge to git repository
   */
  async syncToGit(): Promise<void> {
    try {
      // Check if .cortex/team-knowledge is tracked
      execSync("git add .cortex/team-knowledge/", {
        cwd: this.projectRoot,
      });

      // Check if there are changes
      const status = execSync(
        "git status --porcelain .cortex/team-knowledge/",
        {
          cwd: this.projectRoot,
          encoding: "utf-8",
        }
      );

      if (status.trim()) {
        // Commit changes
        execSync('git commit -m "chore: sync team knowledge insights"', {
          cwd: this.projectRoot,
        });
      }
    } catch {
      // Ignore errors (might not be a git repo or no changes)
    }
  }

  /**
   * Pull team knowledge from git repository
   */
  async pullFromGit(): Promise<void> {
    try {
      execSync("git pull", {
        cwd: this.projectRoot,
      });
    } catch {
      // Ignore errors
    }
  }

  /**
   * Get team knowledge statistics
   */
  async getStats(): Promise<TeamKnowledgeStats> {
    const insights = await this.getTeamInsights();
    const conflicts = await this.getConflicts(false);
    const resolvedConflicts = await this.getConflicts(true);

    const patternsPath = path.join(this.teamKnowledgePath, "pr-patterns.json");
    let prPatterns = 0;
    if (await fs.pathExists(patternsPath)) {
      const patterns: PRReviewPattern[] = await fs.readJson(patternsPath);
      prPatterns = patterns.length;
    }

    const byAuthor: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const insight of insights) {
      byAuthor[insight.author] = (byAuthor[insight.author] || 0) + 1;
      byType[insight.type] = (byType[insight.type] || 0) + 1;
    }

    return {
      totalInsights: insights.length,
      byAuthor,
      byType,
      prPatterns,
      conflicts: conflicts.length,
      resolvedConflicts: resolvedConflicts.length,
    };
  }
}
