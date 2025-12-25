/**
 * Correction Service
 *
 * Stores and retrieves developer corrections to AI behavior.
 * Uses AI-native detection - corrections are explicitly recorded
 * when the AI recognizes user feedback as a correction.
 */

import * as path from "node:path";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import type {
  Correction,
  CorrectionWarning,
  CorrectionIndex,
} from "../types/correction.js";

export class CorrectionService {
  private correctionsPath: string;
  private indexPath: string;
  private cachedCorrections: Correction[] | null = null;

  constructor(private projectRoot: string) {
    const memoryDir = path.join(projectRoot, ".cortex", "memory");
    this.correctionsPath = path.join(memoryDir, "corrections");
    this.indexPath = path.join(memoryDir, "corrections-index.json");
  }

  /**
   * Initialize corrections directory
   */
  async initialize(): Promise<void> {
    await fs.ensureDir(this.correctionsPath);
    if (!(await fs.pathExists(this.indexPath))) {
      const emptyIndex: CorrectionIndex = {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        totalCorrections: 0,
        corrections: [],
      };
      await fs.writeJson(this.indexPath, emptyIndex, { spaces: 2 });
    }
  }

  /**
   * Record a correction to memory
   */
  async recordCorrection(correction: Partial<Correction>): Promise<string> {
    await this.initialize();

    const fullCorrection: Correction = {
      id: correction.id || uuidv4(),
      wrongBehavior: correction.wrongBehavior || "",
      correctBehavior: correction.correctBehavior || "",
      context: correction.context || {
        filePatterns: [],
        techStack: [],
        triggerKeywords: [],
        phases: [],
      },
      severity: correction.severity || "moderate",
      createdAt: new Date().toISOString(),
      warnCount: 0,
      workflowIds: correction.workflowIds || [],
      tags: correction.tags || this.extractTags(correction),
    };

    // Save correction file
    const fileName = `${fullCorrection.id}.json`;
    const filePath = path.join(this.correctionsPath, fileName);
    await fs.writeJson(filePath, fullCorrection, { spaces: 2 });

    // Update index
    await this.updateIndex(fullCorrection);

    // Invalidate cache
    this.cachedCorrections = null;

    return fullCorrection.id;
  }

  /**
   * Get warnings for current context
   */
  async getWarnings(currentContext: {
    taskDescription: string;
    files?: string[];
    techStack?: string[];
    phase?: string;
  }): Promise<CorrectionWarning[]> {
    await this.initialize();
    const corrections = await this.loadAllCorrections();
    const warnings: CorrectionWarning[] = [];

    for (const correction of corrections) {
      const matchResult = this.matchCorrection(correction, currentContext);
      if (matchResult.matches) {
        warnings.push({
          correction,
          matchReason: matchResult.reason,
          confidence: matchResult.confidence,
        });

        // Increment warn count
        correction.warnCount++;
        await this.saveCorrection(correction);
      }
    }

    // Sort by confidence descending
    warnings.sort((a, b) => b.confidence - a.confidence);

    return warnings.slice(0, 5); // Return top 5 warnings
  }

  /**
   * Format warnings as context injection
   */
  formatWarningsAsContext(warnings: CorrectionWarning[]): string {
    if (warnings.length === 0) return "";

    const lines = [
      "",
      "## ⚠️ Previous Corrections (IMPORTANT)",
      "",
      "The following corrections have been recorded from past sessions. **Avoid repeating these mistakes:**",
      "",
    ];

    for (let i = 0; i < warnings.length; i++) {
      const warning = warnings[i];
      lines.push(`### ${i + 1}. Correction (${warning.correction.severity})`);
      lines.push(`**❌ Wrong**: ${warning.correction.wrongBehavior}`);
      lines.push(`**✅ Correct**: ${warning.correction.correctBehavior}`);
      if (warning.matchReason) {
        lines.push(`**Why this warning**: ${warning.matchReason}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Extract tags from correction content
   */
  private extractTags(correction: Partial<Correction>): string[] {
    const tags: string[] = [];

    // Extract from wrong/correct behavior
    const text = `${correction.wrongBehavior || ""} ${correction.correctBehavior || ""}`;
    const words = text.toLowerCase().split(/\s+/);

    // Common tech terms
    const techTerms = [
      "lodash",
      "react",
      "typescript",
      "javascript",
      "node",
      "npm",
      "api",
      "async",
      "promise",
      "error",
      "test",
      "component",
    ];

    for (const term of techTerms) {
      if (words.includes(term)) {
        tags.push(term);
      }
    }

    // Add context tags
    if (correction.context?.techStack) {
      tags.push(...correction.context.techStack.map((t) => t.toLowerCase()));
    }

    // Deduplicate
    return Array.from(new Set(tags));
  }

  /**
   * Match correction against current context
   */
  private matchCorrection(
    correction: Correction,
    context: {
      taskDescription: string;
      files?: string[];
      techStack?: string[];
      phase?: string;
    }
  ): { matches: boolean; reason: string; confidence: number } {
    let score = 0;
    const reasons: string[] = [];

    // Check keyword matches
    const keywords = correction.context.triggerKeywords;
    for (const keyword of keywords) {
      if (
        context.taskDescription.toLowerCase().includes(keyword.toLowerCase())
      ) {
        score += 0.3;
        reasons.push(`Keyword match: "${keyword}"`);
      }
    }

    // Check file pattern matches
    if (context.files) {
      for (const file of context.files) {
        for (const pattern of correction.context.filePatterns) {
          if (file.includes(pattern) || pattern.includes(path.basename(file))) {
            score += 0.2;
            reasons.push(`File pattern match: "${pattern}"`);
          }
        }
      }
    }

    // Check tech stack match
    if (context.techStack) {
      for (const tech of context.techStack) {
        if (
          correction.context.techStack
            .map((t) => t.toLowerCase())
            .includes(tech.toLowerCase())
        ) {
          score += 0.15;
          reasons.push(`Tech stack match: "${tech}"`);
        }
      }
    }

    // Check phase match
    if (
      context.phase &&
      (correction.context.phases as string[]).includes(context.phase)
    ) {
      score += 0.15;
      reasons.push(`Phase match: "${context.phase}"`);
    }

    // Check tag overlap
    const taskWords = context.taskDescription.toLowerCase().split(/\s+/);
    const tagMatches = correction.tags.filter((tag) =>
      taskWords.includes(tag.toLowerCase())
    );
    if (tagMatches.length > 0) {
      score += tagMatches.length * 0.1;
      reasons.push(`Tag matches: ${tagMatches.join(", ")}`);
    }

    // Check wrongBehavior similarity (simple keyword overlap)
    const wrongWords = correction.wrongBehavior.toLowerCase().split(/\s+/);
    const overlap = wrongWords.filter(
      (w) => taskWords.includes(w) && w.length > 3
    );
    if (overlap.length > 2) {
      score += 0.25;
      reasons.push(`Content similarity: ${overlap.length} common words`);
    }

    return {
      matches: score >= 0.25, // Lower threshold for better recall
      reason: reasons.join("; ") || "Low similarity",
      confidence: Math.min(score, 1.0),
    };
  }

  /**
   * Load all corrections from disk
   */
  private async loadAllCorrections(): Promise<Correction[]> {
    if (this.cachedCorrections) return this.cachedCorrections;

    const corrections: Correction[] = [];
    if (await fs.pathExists(this.correctionsPath)) {
      const files = await fs.readdir(this.correctionsPath);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const content = await fs.readJson(
            path.join(this.correctionsPath, file)
          );
          corrections.push(content);
        }
      }
    }
    this.cachedCorrections = corrections;
    return corrections;
  }

  /**
   * Save a correction back to disk
   */
  private async saveCorrection(correction: Correction): Promise<void> {
    const fileName = `${correction.id}.json`;
    const filePath = path.join(this.correctionsPath, fileName);
    await fs.writeJson(filePath, correction, { spaces: 2 });
  }

  /**
   * Update index with new correction
   */
  private async updateIndex(correction: Correction): Promise<void> {
    const index: CorrectionIndex = await fs.readJson(this.indexPath);
    index.corrections.push({
      id: correction.id,
      wrongBehavior: correction.wrongBehavior.slice(0, 100),
      severity: correction.severity,
      createdAt: correction.createdAt,
    });
    index.totalCorrections = index.corrections.length;
    index.lastUpdated = new Date().toISOString();
    await fs.writeJson(this.indexPath, index, { spaces: 2 });
  }
}
