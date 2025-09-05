/**
 * Export all core modules
 */

// Experience modules - simplified, no complex preference management needed

// Common types - explicitly export to avoid conflicts
export {
  type ProjectKnowledge,
  type ThinkingStep,
  type MessageProcessor,
  type Role as BaseRole, // Rename the common Role to avoid conflict
} from "./common/types.js";

// MCP modules
export { CortexMCPServer, createCortexMCPServer } from "./mcp/server.js";

// Project modules - simplified

// Simple Cortex Core for MCP
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";

/**
 * Unified Knowledge Manager - Integrates all knowledge sources
 */
export class UnifiedKnowledgeManager {
  private projectRoot: string;
  private docsDir: string;
  private internalDir: string;
  private templatesDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.docsDir = path.join(projectRoot, "docs");
    this.internalDir = path.join(projectRoot, "internal");
    this.templatesDir = path.join(projectRoot, "templates");
  }

  /**
   * Search across all knowledge sources
   */
  async searchKnowledge(
    query: string,
    maxResults: number = 5
  ): Promise<KnowledgeResult[]> {
    const results: KnowledgeResult[] = [];

    // Search project documentation
    const docResults = await this.searchDocumentation(
      query,
      Math.ceil(maxResults / 3)
    );
    results.push(...docResults);

    // Search internal knowledge
    const internalResults = await this.searchInternalKnowledge(
      query,
      Math.ceil(maxResults / 3)
    );
    results.push(...internalResults);

    // Search templates
    const templateResults = await this.searchTemplates(
      query,
      Math.ceil(maxResults / 3)
    );
    results.push(...templateResults);

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxResults);
  }

  /**
   * Search project documentation
   */
  private async searchDocumentation(
    query: string,
    maxResults: number
  ): Promise<KnowledgeResult[]> {
    const results: KnowledgeResult[] = [];

    try {
      const files = await fs.readdir(this.docsDir);
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      for (const file of mdFiles) {
        const filePath = path.join(this.docsDir, file);
        const content = await fs.readFile(filePath, "utf-8");

        const relevance = this.calculateRelevance(content, query);
        if (relevance > 0) {
          results.push({
            title: file.replace(".md", ""),
            content: this.extractRelevantSnippet(content, query),
            source: "docs",
            relevance,
            path: filePath,
          });
        }
      }
    } catch (error) {
      console.warn("Error searching documentation:", error);
    }

    return results.slice(0, maxResults);
  }

  /**
   * Search internal knowledge
   */
  private async searchInternalKnowledge(
    query: string,
    maxResults: number
  ): Promise<KnowledgeResult[]> {
    const results: KnowledgeResult[] = [];

    try {
      const subdirs = ["ai-collaboration", "experiences"];
      for (const subdir of subdirs) {
        const subdirPath = path.join(this.internalDir, subdir);
        if (await fs.pathExists(subdirPath)) {
          const files = await fs.readdir(subdirPath);
          const mdFiles = files.filter((file) => file.endsWith(".md"));

          for (const file of mdFiles) {
            const filePath = path.join(subdirPath, file);
            const content = await fs.readFile(filePath, "utf-8");

            const relevance = this.calculateRelevance(content, query);
            if (relevance > 0) {
              results.push({
                title: file.replace(".md", ""),
                content: this.extractRelevantSnippet(content, query),
                source: `internal/${subdir}`,
                relevance,
                path: filePath,
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn("Error searching internal knowledge:", error);
    }

    return results.slice(0, maxResults);
  }

  /**
   * Search role templates
   */
  private async searchTemplates(
    query: string,
    maxResults: number
  ): Promise<KnowledgeResult[]> {
    const results: KnowledgeResult[] = [];

    try {
      const rolesDir = path.join(this.templatesDir, "roles");
      if (await fs.pathExists(rolesDir)) {
        const files = await fs.readdir(rolesDir);
        const mdFiles = files.filter((file) => file.endsWith(".md"));

        for (const file of mdFiles) {
          const filePath = path.join(rolesDir, file);
          const content = await fs.readFile(filePath, "utf-8");

          const relevance = this.calculateRelevance(content, query);
          if (relevance > 0) {
            results.push({
              title: file.replace(".md", ""),
              content: this.extractRelevantSnippet(content, query),
              source: "templates/roles",
              relevance,
              path: filePath,
            });
          }
        }
      }
    } catch (error) {
      console.warn("Error searching templates:", error);
    }

    return results.slice(0, maxResults);
  }

  /**
   * Calculate relevance score for content against query
   */
  private calculateRelevance(content: string, query: string): number {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(" ");

    let score = 0;
    for (const word of queryWords) {
      if (lowerContent.includes(word)) {
        score += 1;
      }
    }

    // Boost score for exact phrase matches
    if (lowerContent.includes(lowerQuery)) {
      score *= 2;
    }

    return score;
  }

  /**
   * Extract relevant snippet from content
   */
  private extractRelevantSnippet(content: string, query: string): string {
    const lines = content.split("\n");
    const lowerQuery = query.toLowerCase();

    // Find lines containing query terms
    const relevantLines = lines.filter((line) =>
      line.toLowerCase().includes(lowerQuery.split(" ")[0])
    );

    if (relevantLines.length === 0) {
      return content.substring(0, 200) + "...";
    }

    return relevantLines.slice(0, 3).join("\n").substring(0, 300) + "...";
  }
}

/**
 * Knowledge search result
 */
export interface KnowledgeResult {
  title: string;
  content: string;
  source: string;
  relevance: number;
  path: string;
}

/**
 * Dynamic Rule System - Adapts behavior based on project context
 */
export class DynamicRuleSystem {
  private projectRoot: string;
  private knowledgeManager: UnifiedKnowledgeManager;

  constructor(projectRoot: string, knowledgeManager: UnifiedKnowledgeManager) {
    this.projectRoot = projectRoot;
    this.knowledgeManager = knowledgeManager;
  }

  /**
   * Analyze project context and generate dynamic rules
   */
  async generateDynamicRules(context: string): Promise<DynamicRule[]> {
    const rules: DynamicRule[] = [];

    // Search for relevant project knowledge
    const knowledgeResults = await this.knowledgeManager.searchKnowledge(
      context,
      3
    );

    // Generate rules based on found knowledge
    for (const result of knowledgeResults) {
      const rule = this.extractRuleFromKnowledge(result, context);
      if (rule) {
        rules.push(rule);
      }
    }

    // Add default rules if no specific knowledge found
    if (rules.length === 0) {
      rules.push(...this.getDefaultRules());
    }

    return rules;
  }

  /**
   * Extract a rule from knowledge result
   */
  private extractRuleFromKnowledge(
    result: KnowledgeResult,
    context: string
  ): DynamicRule | null {
    // Analyze the knowledge content to extract relevant rules
    const content = result.content.toLowerCase();
    const contextLower = context.toLowerCase();

    // Look for patterns that suggest specific rules
    if (content.includes("typescript") && contextLower.includes("typescript")) {
      return {
        id: `typescript-${result.source}`,
        priority: 8,
        condition: "typescript-related-task",
        action: "apply-typescript-best-practices",
        description: "Apply TypeScript best practices from project knowledge",
        source: result.source,
      };
    }

    if (content.includes("react") && contextLower.includes("react")) {
      return {
        id: `react-${result.source}`,
        priority: 8,
        condition: "react-related-task",
        action: "apply-react-patterns",
        description: "Apply React patterns from project knowledge",
        source: result.source,
      };
    }

    if (content.includes("test") && contextLower.includes("test")) {
      return {
        id: `testing-${result.source}`,
        priority: 7,
        condition: "testing-related-task",
        action: "apply-testing-practices",
        description: "Apply testing practices from project knowledge",
        source: result.source,
      };
    }

    return null;
  }

  /**
   * Get default rules when no specific knowledge is found
   */
  private getDefaultRules(): DynamicRule[] {
    return [
      {
        id: "general-code-quality",
        priority: 5,
        condition: "any-coding-task",
        action: "ensure-code-quality",
        description: "Ensure code quality standards are met",
        source: "default",
      },
      {
        id: "documentation-practice",
        priority: 4,
        condition: "complex-task",
        action: "document-solution",
        description: "Document complex solutions for future reference",
        source: "default",
      },
      {
        id: "testing-requirement",
        priority: 6,
        condition: "feature-implementation",
        action: "include-tests",
        description: "Include appropriate tests for new features",
        source: "default",
      },
    ];
  }

  /**
   * Apply dynamic rules to a given context
   */
  async applyRules(context: string): Promise<AppliedRule[]> {
    const rules = await this.generateDynamicRules(context);
    const appliedRules: AppliedRule[] = [];

    // Sort rules by priority (highest first)
    rules.sort((a, b) => b.priority - a.priority);

    for (const rule of rules) {
      if (this.shouldApplyRule(rule, context)) {
        appliedRules.push({
          rule,
          applied: true,
          timestamp: new Date().toISOString(),
          context,
        });
      }
    }

    return appliedRules;
  }

  /**
   * Determine if a rule should be applied to the current context
   */
  private shouldApplyRule(rule: DynamicRule, context: string): boolean {
    const contextLower = context.toLowerCase();

    switch (rule.condition) {
      case "typescript-related-task":
        return (
          contextLower.includes("typescript") || contextLower.includes("type")
        );
      case "react-related-task":
        return (
          contextLower.includes("react") || contextLower.includes("component")
        );
      case "testing-related-task":
        return contextLower.includes("test") || contextLower.includes("spec");
      case "any-coding-task":
        return (
          contextLower.includes("code") || contextLower.includes("implement")
        );
      case "complex-task":
        return this.isComplexTask(context);
      case "feature-implementation":
        return (
          contextLower.includes("feature") || contextLower.includes("implement")
        );
      default:
        return false;
    }
  }

  /**
   * Determine if a task is complex based on context analysis
   */
  private isComplexTask(context: string): boolean {
    const complexityIndicators = [
      "architecture",
      "system",
      "design",
      "complex",
      "multiple",
      "integration",
      "optimization",
      "refactor",
      "large",
    ];

    const contextLower = context.toLowerCase();
    return complexityIndicators.some((indicator) =>
      contextLower.includes(indicator)
    );
  }
}

/**
 * Dynamic rule definition
 */
export interface DynamicRule {
  id: string;
  priority: number; // 1-10, higher = more important
  condition: string;
  action: string;
  description: string;
  source: string;
}

/**
 * Applied rule result
 */
export interface AppliedRule {
  rule: DynamicRule;
  applied: boolean;
  timestamp: string;
  context: string;
}

export interface Experience {
  input: string;
  output: string;
  category: string;
  tags?: string[];
  timestamp: string;
}

export class CortexCore {
  private projectRoot: string;
  private experiencesDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.experiencesDir = path.join(projectRoot, ".cortex", "experiences");
  }

  async findRelevantExperiences(
    query: string,
    maxItems: number = 5,
    timeRange: number = 30
  ): Promise<Experience[]> {
    try {
      await fs.ensureDir(this.experiencesDir);

      if (!(await fs.pathExists(this.experiencesDir))) {
        return [];
      }

      const files = await fs.readdir(this.experiencesDir);
      const experiences: Experience[] = [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(this.experiencesDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const experience = JSON.parse(content) as Experience;

          // Check time range
          const expDate = new Date(experience.timestamp);
          if (expDate < cutoffDate) continue;

          // Simple relevance check
          const searchText =
            `${experience.input} ${experience.output}`.toLowerCase();
          const queryWords = query.toLowerCase().split(" ");
          const matches = queryWords.some((word) => searchText.includes(word));

          if (matches) {
            experiences.push(experience);
          }
        }
      }

      // Sort by recency and return top results
      return experiences
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, maxItems);
    } catch (error) {
      console.error("Error finding relevant experiences:", error);
      return [];
    }
  }

  async recordExperience(experience: Experience): Promise<void> {
    try {
      await fs.ensureDir(this.experiencesDir);

      const hash = crypto
        .createHash("sha256")
        .update(`${experience.input}${experience.output}${Date.now()}`)
        .digest("hex");

      const filePath = path.join(this.experiencesDir, `${hash}.json`);
      await fs.writeJson(filePath, experience, { spaces: 2 });
    } catch (error) {
      console.error("Error recording experience:", error);
      throw error;
    }
  }
}
