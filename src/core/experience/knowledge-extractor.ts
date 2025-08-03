/**
 * Knowledge Extractor - Long-term Memory System
 *
 * This module extracts knowledge patterns from experiences and converts them
 * into structured documentation for long-term memory.
 */

import fs from "fs-extra";
import * as path from "path";

export interface Experience {
  userInput: string;
  response: string;
  timestamp: string;
  tags?: string[];
  category?: string;
  relevance?: number;
}

export interface KnowledgePattern {
  id: string;
  title: string;
  description: string;
  category: "technical" | "process" | "design" | "management";
  patterns: string[];
  solutions: string[];
  bestPractices: string[];
  examples: string[];
  relatedExperiences: string[];
  createdAt: string;
  updatedAt: string;
  frequency: number;
}

export interface LongTermMemory {
  patterns: KnowledgePattern[];
  architectureDecisions: ArchitectureDecision[];
  bestPractices: BestPractice[];
  projectConventions: ProjectConvention[];
}

export interface ArchitectureDecision {
  id: string;
  title: string;
  context: string;
  decision: string;
  consequences: string[];
  alternatives: string[];
  timestamp: string;
  status: "active" | "deprecated" | "under-review";
}

export interface BestPractice {
  id: string;
  title: string;
  description: string;
  category: string;
  examples: string[];
  frequency: number;
  lastUsed: string;
}

export interface ProjectConvention {
  id: string;
  title: string;
  description: string;
  enforcement: "strict" | "recommended" | "optional";
  examples: string[];
  rationale: string;
}

export class KnowledgeExtractor {
  private projectRoot: string;
  private docsDir: string;
  private experiencesDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.docsDir = path.join(projectRoot, "docs");
    this.experiencesDir = path.join(projectRoot, "docs", "experiences");
  }

  /**
   * Extract knowledge patterns from recent experiences
   */
  async extractKnowledgePatterns(
    experiences: Experience[]
  ): Promise<KnowledgePattern[]> {
    const patterns: KnowledgePattern[] = [];

    // Group experiences by category
    const groupedExperiences = this.groupExperiencesByCategory(experiences);

    for (const [category, categoryExperiences] of Object.entries(
      groupedExperiences
    )) {
      if (categoryExperiences.length >= 2) {
        // Need at least 2 experiences to form a pattern
        const pattern = await this.identifyPattern(
          category,
          categoryExperiences
        );
        if (pattern) {
          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }

  /**
   * Identify patterns from experiences
   */
  private async identifyPattern(
    category: string,
    experiences: Experience[]
  ): Promise<KnowledgePattern | null> {
    const commonThemes = this.extractCommonThemes(experiences);

    if (commonThemes.length === 0) {
      return null;
    }

    const pattern: KnowledgePattern = {
      id: this.generatePatternId(category, commonThemes[0]),
      title: this.generatePatternTitle(category, commonThemes[0]),
      description: this.generatePatternDescription(experiences),
      category: this.mapCategory(category),
      patterns: commonThemes,
      solutions: this.extractSolutions(experiences),
      bestPractices: this.extractBestPractices(experiences),
      examples: experiences.map((exp) => exp.userInput),
      relatedExperiences: experiences.map((exp) => exp.timestamp),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      frequency: experiences.length,
    };

    return pattern;
  }

  /**
   * Extract common themes from experiences
   */
  private extractCommonThemes(experiences: Experience[]): string[] {
    const themes: string[] = [];

    // Extract themes based on content analysis
    const allContent = experiences
      .map((exp) => `${exp.userInput} ${exp.response}`)
      .join(" ");

    // Common technical themes
    if (allContent.includes("MCP") && allContent.includes("工具")) {
      themes.push("MCP工具開發和測試");
    }

    if (allContent.includes("測試") && allContent.includes("驗證")) {
      themes.push("系統測試和驗證流程");
    }

    if (allContent.includes("效能") && allContent.includes("優化")) {
      themes.push("效能優化和擴展性");
    }

    if (allContent.includes("文檔") && allContent.includes("記錄")) {
      themes.push("文檔驅動開發");
    }

    return themes;
  }

  /**
   * Extract solutions from experiences
   */
  private extractSolutions(experiences: Experience[]): string[] {
    const solutions: string[] = [];

    experiences.forEach((exp) => {
      if (
        exp.response.includes("解決") ||
        exp.response.includes("修復") ||
        exp.response.includes("優化")
      ) {
        // Extract solution from response
        const solutionMatch = exp.response.match(
          /(?:解決|修復|優化)[：:]\s*(.+)/
        );
        if (solutionMatch) {
          solutions.push(solutionMatch[1]);
        }
      }
    });

    return [...new Set(solutions)]; // Remove duplicates
  }

  /**
   * Extract best practices from experiences
   */
  private extractBestPractices(experiences: Experience[]): string[] {
    const practices: string[] = [];

    experiences.forEach((exp) => {
      if (
        exp.response.includes("最佳實踐") ||
        exp.response.includes("建議") ||
        exp.response.includes("應該")
      ) {
        // Extract practice from response
        const practiceMatch = exp.response.match(
          /(?:最佳實踐|建議|應該)[：:]\s*(.+)/
        );
        if (practiceMatch) {
          practices.push(practiceMatch[1]);
        }
      }
    });

    return [...new Set(practices)]; // Remove duplicates
  }

  /**
   * Group experiences by category
   */
  private groupExperiencesByCategory(
    experiences: Experience[]
  ): Record<string, Experience[]> {
    const grouped: Record<string, Experience[]> = {};

    experiences.forEach((exp) => {
      const category = exp.category || "general";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(exp);
    });

    return grouped;
  }

  /**
   * Map experience category to knowledge category
   */
  private mapCategory(category: string): KnowledgePattern["category"] {
    switch (category) {
      case "mcp":
      case "tools":
      case "server":
        return "technical";
      case "testing":
        return "process";
      case "release":
      case "deployment":
        return "management";
      default:
        return "technical";
    }
  }

  /**
   * Generate pattern ID
   */
  private generatePatternId(category: string, theme: string): string {
    return `${category}-${theme.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;
  }

  /**
   * Generate pattern title
   */
  private generatePatternTitle(category: string, theme: string): string {
    return `${theme} - ${category} 模式`;
  }

  /**
   * Generate pattern description
   */
  private generatePatternDescription(experiences: Experience[]): string {
    const count = experiences.length;
    const firstExp = experiences[0];
    const lastExp = experiences[experiences.length - 1];

    return `基於 ${count} 個相關經驗識別的模式。從 ${firstExp.timestamp} 到 ${lastExp.timestamp} 期間，團隊在 ${firstExp.category || "general"} 領域遇到了重複的問題和解決方案。`;
  }

  /**
   * Update long-term memory documentation
   */
  async updateLongTermMemory(patterns: KnowledgePattern[]): Promise<void> {
    // Update patterns documentation
    await this.updatePatternsDocumentation(patterns);

    // Update best practices
    await this.updateBestPractices(patterns);

    // Update project conventions
    await this.updateProjectConventions(patterns);

    // Update architecture decisions
    await this.updateArchitectureDecisions(patterns);
  }

  /**
   * Update patterns documentation
   */
  private async updatePatternsDocumentation(
    patterns: KnowledgePattern[]
  ): Promise<void> {
    const patternsPath = path.join(this.docsDir, "patterns.md");

    let content = `# Knowledge Patterns\n\n_Generated on ${new Date().toISOString()}_\n\n`;

    // Group patterns by category
    const groupedPatterns = this.groupPatternsByCategory(patterns);

    for (const [category, categoryPatterns] of Object.entries(
      groupedPatterns
    )) {
      content += `## ${category}\n\n`;

      categoryPatterns.forEach((pattern) => {
        content += `### ${pattern.title}\n\n`;
        content += `${pattern.description}\n\n`;
        content += `**Patterns:**\n`;
        pattern.patterns.forEach((p) => (content += `- ${p}\n`));
        content += `\n**Solutions:**\n`;
        pattern.solutions.forEach((s) => (content += `- ${s}\n`));
        content += `\n**Best Practices:**\n`;
        pattern.bestPractices.forEach((bp) => (content += `- ${bp}\n`));
        content += `\n**Frequency:** ${pattern.frequency} occurrences\n\n`;
      });
    }

    await fs.writeFile(patternsPath, content, "utf-8");
  }

  /**
   * Update best practices documentation
   */
  private async updateBestPractices(
    patterns: KnowledgePattern[]
  ): Promise<void> {
    const bestPracticesPath = path.join(this.docsDir, "best-practices.md");

    let content = `# Best Practices\n\n_Generated on ${new Date().toISOString()}_\n\n`;

    const allPractices = patterns.flatMap((p) => p.bestPractices);
    const uniquePractices = [...new Set(allPractices)];

    uniquePractices.forEach((practice) => {
      const relatedPatterns = patterns.filter((p) =>
        p.bestPractices.includes(practice)
      );
      content += `## ${practice}\n\n`;
      content += `**Related Patterns:** ${relatedPatterns.map((p) => p.title).join(", ")}\n\n`;
      content += `**Frequency:** ${relatedPatterns.length} patterns\n\n`;
    });

    await fs.writeFile(bestPracticesPath, content, "utf-8");
  }

  /**
   * Update project conventions
   */
  private async updateProjectConventions(
    patterns: KnowledgePattern[]
  ): Promise<void> {
    const conventionsPath = path.join(this.docsDir, "conventions.md");

    // Read existing conventions
    let existingContent = "";
    if (await fs.pathExists(conventionsPath)) {
      existingContent = await fs.readFile(conventionsPath, "utf-8");
    }

    // Extract new conventions from patterns
    const newConventions = this.extractConventionsFromPatterns(patterns);

    // Merge with existing conventions
    const updatedContent = this.mergeConventions(
      existingContent,
      newConventions
    );

    await fs.writeFile(conventionsPath, updatedContent, "utf-8");
  }

  /**
   * Update architecture decisions
   */
  private async updateArchitectureDecisions(
    patterns: KnowledgePattern[]
  ): Promise<void> {
    const decisionsPath = path.join(this.docsDir, "architecture-decisions.md");

    let content = `# Architecture Decisions\n\n_Generated on ${new Date().toISOString()}_\n\n`;

    const decisions = this.extractArchitectureDecisions(patterns);

    decisions.forEach((decision) => {
      content += `## ${decision.title}\n\n`;
      content += `**Context:** ${decision.context}\n\n`;
      content += `**Decision:** ${decision.decision}\n\n`;
      content += `**Consequences:**\n`;
      decision.consequences.forEach((c) => (content += `- ${c}\n`));
      content += `\n**Status:** ${decision.status}\n\n`;
    });

    await fs.writeFile(decisionsPath, content, "utf-8");
  }

  /**
   * Group patterns by category
   */
  private groupPatternsByCategory(
    patterns: KnowledgePattern[]
  ): Record<string, KnowledgePattern[]> {
    const grouped: Record<string, KnowledgePattern[]> = {};

    patterns.forEach((pattern) => {
      const category = pattern.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(pattern);
    });

    return grouped;
  }

  /**
   * Extract conventions from patterns
   */
  private extractConventionsFromPatterns(
    patterns: KnowledgePattern[]
  ): ProjectConvention[] {
    const conventions: ProjectConvention[] = [];

    patterns.forEach((pattern) => {
      pattern.bestPractices.forEach((practice) => {
        if (
          practice.includes("應該") ||
          practice.includes("必須") ||
          practice.includes("規範")
        ) {
          conventions.push({
            id: this.generateConventionId(practice),
            title: practice,
            description: `基於 ${pattern.frequency} 個經驗總結的開發規範`,
            enforcement: "recommended",
            examples: pattern.examples.slice(0, 3), // Take first 3 examples
            rationale: `從 ${pattern.title} 模式中識別的最佳實踐`,
          });
        }
      });
    });

    return conventions;
  }

  /**
   * Extract architecture decisions from patterns
   */
  private extractArchitectureDecisions(
    patterns: KnowledgePattern[]
  ): ArchitectureDecision[] {
    const decisions: ArchitectureDecision[] = [];

    patterns.forEach((pattern) => {
      if (pattern.category === "technical" && pattern.frequency >= 3) {
        decisions.push({
          id: `ad-${pattern.id}`,
          title: pattern.title,
          context: `在 ${pattern.category} 開發中遇到重複問題`,
          decision: pattern.solutions[0] || "採用識別出的最佳實踐",
          consequences: pattern.bestPractices,
          alternatives: [],
          timestamp: pattern.createdAt,
          status: "active",
        });
      }
    });

    return decisions;
  }

  /**
   * Generate convention ID
   */
  private generateConventionId(practice: string): string {
    return practice.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  }

  /**
   * Merge conventions
   */
  private mergeConventions(
    existingContent: string,
    newConventions: ProjectConvention[]
  ): string {
    // Simple merge - append new conventions
    let content = existingContent;

    if (newConventions.length > 0) {
      content += "\n\n## New Conventions (Auto-generated)\n\n";

      newConventions.forEach((convention) => {
        content += `### ${convention.title}\n\n`;
        content += `${convention.description}\n\n`;
        content += `**Enforcement:** ${convention.enforcement}\n\n`;
        content += `**Rationale:** ${convention.rationale}\n\n`;
      });
    }

    return content;
  }

  /**
   * Process experiences and update long-term memory
   */
  async processExperiencesForLongTermMemory(): Promise<void> {
    // Load all experiences
    const experiences = await this.loadAllExperiences();

    // Extract knowledge patterns
    const patterns = await this.extractKnowledgePatterns(experiences);

    // Update long-term memory documentation
    await this.updateLongTermMemory(patterns);

    console.log(
      `Processed ${experiences.length} experiences, extracted ${patterns.length} patterns`
    );
  }

  /**
   * Load all experiences
   */
  private async loadAllExperiences(): Promise<Experience[]> {
    if (!(await fs.pathExists(this.experiencesDir))) {
      return [];
    }

    const files = await fs.readdir(this.experiencesDir);
    const experiences: Experience[] = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(this.experiencesDir, file);
        const fileContent = await fs.readFile(filePath, "utf-8");
        const experience = JSON.parse(fileContent);
        experiences.push(experience);
      }
    }

    return experiences;
  }
}
