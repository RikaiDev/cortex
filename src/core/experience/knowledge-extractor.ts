/**
 * Knowledge Extractor - Linus Torvalds' Wisdom Distillation System
 *
 * **I am Linus Torvalds**, creator and chief architect of the Linux kernel, 30 years of kernel maintenance experience, reviewed millions of lines of code.
 * I define Cortex AI's knowledge extraction system:
 *
 * 1. **"Good Taste"** - Knowledge extraction must be simple and effective, eliminating unnecessary complexity
 * 2. **Pragmatism** - Only extract truly valuable knowledge, not theoretically perfect but actually useless information
 * 3. **Backward Compatibility** - Knowledge system must consider existing experience compatibility, cannot break existing functionality
 * 4. **Quality First** - Better to have simple knowledge than complex but defective knowledge
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
    this.docsDir = path.join(projectRoot, ".cortex", "docs");
    this.experiencesDir = path.join(projectRoot, ".cortex", "experiences");
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
    if (allContent.includes("MCP") && allContent.includes("tool")) {
      themes.push("MCP tool development and testing");
    }

    if (allContent.includes("test") && allContent.includes("validation")) {
      themes.push("System testing and validation process");
    }

    if (
      allContent.includes("performance") &&
      allContent.includes("optimization")
    ) {
      themes.push("Performance optimization and scalability");
    }

    if (
      allContent.includes("documentation") &&
      allContent.includes("recording")
    ) {
      themes.push("Documentation-driven development");
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
        exp.response.includes("solve") ||
        exp.response.includes("fix") ||
        exp.response.includes("optimize")
      ) {
        // Extract solution from response
        const solutionMatch = exp.response.match(
          /(?:solve|fix|optimize)[：:]\s*(.+)/
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
        exp.response.includes("best practice") ||
        exp.response.includes("recommend") ||
        exp.response.includes("should")
      ) {
        // Extract practice from response
        const practiceMatch = exp.response.match(
          /(?:best practice|recommend|should)[：:]\s*(.+)/
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
    return `${theme} - ${category} pattern`;
  }

  /**
   * Generate pattern description
   */
  private generatePatternDescription(experiences: Experience[]): string {
    const count = experiences.length;
    const firstExp = experiences[0];
    const lastExp = experiences[experiences.length - 1];

    return `Pattern identified from ${count} related experiences. From ${firstExp.timestamp} to ${lastExp.timestamp}, the team encountered recurring problems and solutions in the ${firstExp.category || "general"} area.`;
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
          practice.includes("should") ||
          practice.includes("must") ||
          practice.includes("standard")
        ) {
          conventions.push({
            id: this.generateConventionId(practice),
            title: practice,
            description: `Development standard summarized from ${pattern.frequency} experiences`,
            enforcement: "recommended",
            examples: pattern.examples.slice(0, 3), // Take first 3 examples
            rationale: `Best practice identified from ${pattern.title} pattern`,
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
          context: `Recurring problems encountered during ${pattern.category} development`,
          decision: pattern.solutions[0] || "Adopt identified best practices",
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
   * Generate Cursor Adapter documentation
   */
  async generateCursorAdapterDocs(patterns: KnowledgePattern[]): Promise<void> {
    await this.generateArchitectureDoc(patterns);
    await this.generateCodePatternsDoc(patterns);
    await this.generateProjectKnowledgeDoc(patterns);
    await this.generateProjectStructureDoc(patterns);
    await this.generateToolsDoc(patterns);
  }

  /**
   * Generate architecture documentation for Cursor Adapter
   */
  private async generateArchitectureDoc(
    patterns: KnowledgePattern[]
  ): Promise<void> {
    const architecturePath = path.join(this.docsDir, "architecture.md");

    let content = `# Architecture Documentation\n\n_Generated on ${new Date().toISOString()}_\n\n`;

    // Extract architecture decisions from patterns
    const architecturePatterns = patterns.filter(
      (p) => p.category === "technical"
    );

    if (architecturePatterns.length > 0) {
      content += `## Architecture Decisions\n\n`;

      architecturePatterns.forEach((pattern) => {
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

    await fs.writeFile(architecturePath, content, "utf-8");
  }

  /**
   * Generate code patterns documentation for Cursor Adapter
   */
  private async generateCodePatternsDoc(
    patterns: KnowledgePattern[]
  ): Promise<void> {
    const codePatternsPath = path.join(this.docsDir, "code-patterns.md");

    let content = `# Code Patterns\n\n_Generated on ${new Date().toISOString()}_\n\n`;

    // Extract code-related patterns
    const codePatterns = patterns.filter(
      (p) =>
        p.category === "technical" ||
        p.patterns.some(
          (pattern) =>
            pattern.includes("code") ||
            pattern.includes("implementation") ||
            pattern.includes("function")
        )
    );

    if (codePatterns.length > 0) {
      codePatterns.forEach((pattern) => {
        content += `## ${pattern.title}\n\n`;
        content += `${pattern.description}\n\n`;
        content += `**Patterns:**\n`;
        pattern.patterns.forEach((p) => (content += `- ${p}\n`));
        content += `\n**Solutions:**\n`;
        pattern.solutions.forEach((s) => (content += `- ${s}\n`));
        content += `\n**Examples:**\n`;
        pattern.examples.forEach((e) => (content += `- ${e}\n`));
        content += `\n**Frequency:** ${pattern.frequency} occurrences\n\n`;
      });
    }

    await fs.writeFile(codePatternsPath, content, "utf-8");
  }

  /**
   * Generate project knowledge documentation for Cursor Adapter
   */
  private async generateProjectKnowledgeDoc(
    patterns: KnowledgePattern[]
  ): Promise<void> {
    const projectKnowledgePath = path.join(
      this.docsDir,
      "project-knowledge.md"
    );

    let content = `# Project Knowledge\n\n_Generated on ${new Date().toISOString()}_\n\n`;

    // Extract all knowledge from patterns
    const allKnowledge = patterns.flatMap((p) => [
      ...p.patterns,
      ...p.solutions,
      ...p.bestPractices,
    ]);

    const uniqueKnowledge = [...new Set(allKnowledge)];

    if (uniqueKnowledge.length > 0) {
      content += `## Knowledge Points\n\n`;

      uniqueKnowledge.forEach((knowledge) => {
        const relatedPatterns = patterns.filter(
          (p) =>
            p.patterns.includes(knowledge) ||
            p.solutions.includes(knowledge) ||
            p.bestPractices.includes(knowledge)
        );

        content += `### ${knowledge}\n\n`;
        content += `**Related Patterns:** ${relatedPatterns.map((p) => p.title).join(", ")}\n\n`;
        content += `**Frequency:** ${relatedPatterns.length} patterns\n\n`;
      });
    }

    await fs.writeFile(projectKnowledgePath, content, "utf-8");
  }

  /**
   * Generate project structure documentation for Cursor Adapter
   */
  private async generateProjectStructureDoc(
    patterns: KnowledgePattern[]
  ): Promise<void> {
    const projectStructurePath = path.join(
      this.docsDir,
      "project-structure.md"
    );

    let content = `# Project Structure\n\n_Generated on ${new Date().toISOString()}_\n\n`;

    // Extract structure-related patterns
    const structurePatterns = patterns.filter(
      (p) =>
        p.category === "design" ||
        p.patterns.some(
          (pattern) =>
            pattern.includes("structure") ||
            pattern.includes("organization") ||
            pattern.includes("layout")
        )
    );

    if (structurePatterns.length > 0) {
      content += `## Structure Patterns\n\n`;

      structurePatterns.forEach((pattern) => {
        content += `### ${pattern.title}\n\n`;
        content += `${pattern.description}\n\n`;
        content += `**Patterns:**\n`;
        pattern.patterns.forEach((p) => (content += `- ${p}\n`));
        content += `\n**Solutions:**\n`;
        pattern.solutions.forEach((s) => (content += `- ${s}\n`));
        content += `\n**Frequency:** ${pattern.frequency} occurrences\n\n`;
      });
    }

    await fs.writeFile(projectStructurePath, content, "utf-8");
  }

  /**
   * Generate tools documentation for Cursor Adapter
   */
  private async generateToolsDoc(patterns: KnowledgePattern[]): Promise<void> {
    const toolsPath = path.join(this.docsDir, "tools.md");

    let content = `# Tools and Utilities\n\n_Generated on ${new Date().toISOString()}_\n\n`;

    // Extract tool-related patterns
    const toolPatterns = patterns.filter((p) =>
      p.patterns.some(
        (pattern) =>
          pattern.includes("tool") ||
          pattern.includes("command") ||
          pattern.includes("utility") ||
          pattern.includes("script")
      )
    );

    if (toolPatterns.length > 0) {
      content += `## Tool Usage Patterns\n\n`;

      toolPatterns.forEach((pattern) => {
        content += `### ${pattern.title}\n\n`;
        content += `${pattern.description}\n\n`;
        content += `**Patterns:**\n`;
        pattern.patterns.forEach((p) => (content += `- ${p}\n`));
        content += `\n**Solutions:**\n`;
        pattern.solutions.forEach((s) => (content += `- ${s}\n`));
        content += `\n**Examples:**\n`;
        pattern.examples.forEach((e) => (content += `- ${e}\n`));
        content += `\n**Frequency:** ${pattern.frequency} occurrences\n\n`;
      });
    }

    await fs.writeFile(toolsPath, content, "utf-8");
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
