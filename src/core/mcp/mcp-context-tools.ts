/**
 * MCP Context Tools - Linus Torvalds' Knowledge Management System
 *
 * **I am Linus Torvalds**, creator and chief architect of the Linux kernel, 30 years of kernel maintenance experience, reviewed millions of lines of code.
 * I define Cortex AI's MCP context tools system:
 *
 * 1. **"Good Taste"** - Context processing must be simple and effective, eliminating unnecessary complexity
 * 2. **Pragmatism** - Only provide truly valuable context, not theoretically perfect but actually useless information
 * 3. **Backward Compatibility** - Context system must consider existing knowledge compatibility, cannot break existing functionality
 * 4. **Quality First** - Better to have simple context than complex but defective context
 *
 * This module provides the external LLM with optimized, relevant context
 * through intelligent filtering, caching, and relevance scoring to handle
 * growing experience libraries efficiently.
 */

import { MCPWorkflow, AnyToolResult } from "../common/types.js";
import fs from "fs-extra";
import * as path from "path";
import crypto from "crypto";
import { Experience, ContextEnhancementOptions } from "./types.js";

interface ContextEnhancerArgs {
  maxExperiences?: number;
  timeFilter?: number;
  semanticFilter?: boolean;
  categoryFilter?: string[];
  minRelevance?: number;
}

export class MCPContextTools {
  private mcpWorkflow: MCPWorkflow;
  private projectRoot: string;
  private experiencesCache: Map<string, Experience[]> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(mcpWorkflow: MCPWorkflow, projectRoot: string) {
    this.mcpWorkflow = mcpWorkflow;
    this.projectRoot = projectRoot;
    this.registerContextTools();
  }

  private registerContextTools(): void {
    if (!this.mcpWorkflow.registerTool) {
      console.warn("MCP workflow does not support tool registration");
      return;
    }

    this.mcpWorkflow.registerTool(
      "context-enhancer",
      this.contextEnhancerTool.bind(this)
    );

    this.mcpWorkflow.registerTool(
      "experience-recorder",
      this.experienceRecorderTool.bind(this)
    );
  }

  private async loadExperiencesWithCache(): Promise<Experience[]> {
    const now = Date.now();

    // Check cache validity
    if (
      this.experiencesCache.has("all") &&
      now - this.cacheTimestamp < this.CACHE_TTL
    ) {
      return this.experiencesCache.get("all") || [];
    }

    const experiencesDir = path.join(
      this.projectRoot,
      ".cortex",
      "experiences"
    );

    // Also ensure the directory exists
    await fs.ensureDir(experiencesDir);

    if (!(await fs.pathExists(experiencesDir))) {
      return [];
    }

    const files = await fs.readdir(experiencesDir);
    const experiences: Experience[] = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(experiencesDir, file);
        const fileContent = await fs.readFile(filePath, "utf-8");
        const experience = JSON.parse(fileContent);

        // Add metadata
        experience.tags = this.extractTags(experience);
        experience.category = this.categorizeExperience(experience);
        experience.relevance = this.calculateRelevance(experience);

        experiences.push(experience);
      }
    }

    // Update cache
    this.experiencesCache.set("all", experiences);
    this.cacheTimestamp = now;

    return experiences;
  }

  private applyFilters(
    experiences: Experience[],
    options: ContextEnhancementOptions
  ): Experience[] {
    let filtered = experiences;

    // Time filter
    if (options.timeFilter) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.timeFilter);

      filtered = filtered.filter((exp) => {
        const expDate = new Date(exp.timestamp);
        return expDate >= cutoffDate;
      });
    }

    // Category filter
    if (options.categoryFilter && options.categoryFilter.length > 0) {
      filtered = filtered.filter(
        (exp) => exp.category && options.categoryFilter!.includes(exp.category)
      );
    }

    // Relevance filter
    if (options.minRelevance) {
      filtered = filtered.filter(
        (exp) => exp.relevance && exp.relevance >= options.minRelevance!
      );
    }

    return filtered;
  }

  private sortExperiences(experiences: Experience[]): Experience[] {
    return experiences.sort((a, b) => {
      // Primary sort: relevance (descending)
      const relevanceDiff = (b.relevance || 0) - (a.relevance || 0);
      if (Math.abs(relevanceDiff) > 0.1) {
        return relevanceDiff;
      }

      // Secondary sort: recency (descending)
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });
  }

  private formatExperiences(experiences: Experience[]): string {
    if (experiences.length === 0) {
      return "<!-- No relevant experiences found. -->";
    }

    return experiences
      .map((exp, index) => {
        const tags = exp.tags?.length ? ` [${exp.tags.join(", ")}]` : "";
        const relevance = exp.relevance
          ? ` (relevance: ${(exp.relevance * 100).toFixed(1)}%)`
          : "";

        return `--- Experience ${index + 1}${tags}${relevance} ---
Input: ${exp.userInput}
Response: ${exp.response}
Timestamp: ${exp.timestamp}
Category: ${exp.category || "general"}`;
      })
      .join("\n\n");
  }

  private generateSummary(
    allExperiences: Experience[],
    selectedExperiences: Experience[],
    options: ContextEnhancementOptions
  ): string {
    const totalExperiences = allExperiences.length;
    const selectedCount = selectedExperiences.length;
    const filteredPercentage = (
      (selectedCount / totalExperiences) *
      100
    ).toFixed(1);

    const categories = this.getCategoryBreakdown(selectedExperiences);
    const avgRelevance =
      selectedExperiences.reduce((sum, exp) => sum + (exp.relevance || 0), 0) /
      selectedExperiences.length;

    return `<!-- Context Enhancement Summary -->
Total experiences in library: ${totalExperiences}
Selected experiences: ${selectedCount} (${filteredPercentage}%)
Average relevance: ${(avgRelevance * 100).toFixed(1)}%
Categories: ${categories}
Filters applied: ${this.describeFilters(options)} -->`;
  }

  private extractTags(experience: Experience): string[] {
    const tags: string[] = [];

    // Extract tags from content
    const content =
      `${experience.userInput} ${experience.response}`.toLowerCase();

    if (content.includes("mcp")) tags.push("mcp");
    if (content.includes("test")) tags.push("testing");
    if (content.includes("fix")) tags.push("bugfix");
    if (content.includes("release")) tags.push("release");
    if (content.includes("tool")) tags.push("tools");
    if (content.includes("server")) tags.push("server");

    return tags;
  }

  private categorizeExperience(experience: Experience): string {
    const content =
      `${experience.userInput} ${experience.response}`.toLowerCase();

    if (content.includes("mcp")) return "mcp";
    if (content.includes("test")) return "testing";
    if (content.includes("fix")) return "bugfix";
    if (content.includes("release")) return "release";
    if (content.includes("tool")) return "tools";

    return "general";
  }

  private calculateRelevance(experience: Experience): number {
    let relevance = 0.5; // Base relevance

    // Boost for recent experiences
    const daysOld =
      (Date.now() - new Date(experience.timestamp).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysOld < 7) relevance += 0.3;
    else if (daysOld < 30) relevance += 0.1;

    // Boost for MCP-related experiences
    const userInput = experience.userInput || "";
    const response = experience.response || "";

    if (userInput.includes("MCP") || response.includes("MCP")) {
      relevance += 0.2;
    }

    // Boost for testing experiences
    if (userInput.includes("test") || response.includes("test")) {
      relevance += 0.1;
    }

    return Math.min(relevance, 1.0);
  }

  private getCategoryBreakdown(experiences: Experience[]): string {
    const categories: Record<string, number> = {};

    experiences.forEach((exp) => {
      const category = exp.category || "general";
      categories[category] = (categories[category] || 0) + 1;
    });

    return Object.entries(categories)
      .map(([cat, count]) => `${cat}:${count}`)
      .join(", ");
  }

  private describeFilters(options: ContextEnhancementOptions): string {
    const filters: string[] = [];

    if (options.timeFilter) filters.push(`time:${options.timeFilter}d`);
    if (options.maxExperiences) filters.push(`max:${options.maxExperiences}`);
    if (options.categoryFilter?.length)
      filters.push(`categories:${options.categoryFilter.join(",")}`);
    if (options.minRelevance) filters.push(`relevance:${options.minRelevance}`);

    return filters.length ? filters.join(", ") : "none";
  }

  private getExperienceHash(input: string): string {
    return crypto.createHash("sha256").update(input).digest("hex");
  }

  private async contextEnhancerTool(
    args: ContextEnhancerArgs = {}
  ): Promise<AnyToolResult> {
    const options: ContextEnhancementOptions = {
      maxExperiences: args.maxExperiences || 10,
      timeFilter: args.timeFilter || 30, // 30 days
      semanticFilter: args.semanticFilter || false,
      categoryFilter: args.categoryFilter || [],
      minRelevance: args.minRelevance || 0.5,
    };

    try {
      const experiences = await this.loadExperiencesWithCache();

      if (experiences.length === 0) {
        return {
          success: true,
          data: "<!-- No experiences found in the library. -->",
        };
      }

      // Apply filters
      const filteredExperiences = this.applyFilters(experiences, options);

      // Sort by relevance and recency
      const sortedExperiences = this.sortExperiences(filteredExperiences);

      // Limit to max experiences
      const limitedExperiences = sortedExperiences.slice(
        0,
        options.maxExperiences
      );

      // Format output
      const formattedExperiences = this.formatExperiences(limitedExperiences);

      const summary = this.generateSummary(
        experiences,
        limitedExperiences,
        options
      );

      return {
        success: true,
        data: `${summary}\n\n${formattedExperiences}`,
      };
    } catch (error: unknown) {
      console.error("Error in contextEnhancerTool:", error);
      return {
        success: false,
        error: `Error fetching experiences: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private async experienceRecorderTool(
    params: Record<string, unknown>
  ): Promise<AnyToolResult> {
    const contextObj = params.context;
    if (
      contextObj &&
      typeof contextObj === "object" &&
      "userInput" in contextObj &&
      typeof contextObj.userInput === "string"
    ) {
      // Ensure timestamp is current time, not hardcoded
      const currentTimestamp = new Date().toISOString();
      const experienceData = {
        ...contextObj,
        timestamp: currentTimestamp,
      };

      const hash = this.getExperienceHash(contextObj.userInput);
      const experiencePath = path.join(
        this.projectRoot,
        ".cortex",
        "experiences",
        `${hash}.json`
      );

      try {
        await fs.ensureDir(path.dirname(experiencePath));
        await fs.writeJson(experiencePath, experienceData, { spaces: 2 });

        // Clear cache to force reload
        this.experiencesCache.clear();

        return {
          success: true,
          data: `Experience for "${contextObj.userInput}" saved successfully to ${path.basename(experiencePath)} at ${currentTimestamp}.`,
        };
      } catch (error: unknown) {
        console.error(`Failed to save experience to ${experiencePath}:`, error);
        return {
          success: false,
          error: `Failed to save experience: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }
    return {
      success: false,
      error:
        "Invalid context for recording experience. 'userInput' is required.",
    };
  }

  /**
   * Extract component name from natural language query
   * Linus: Keep it simple, don't over-engineer
   */
  extractComponentFromQuery(query: string): string | null {
    // Universal approach: extract any noun phrase that could be a component
    // Linus: Find the essence, don't over-engineer with specific cases

    const cleanQuery = query
      .replace(/^為什麼\s*/, "") // Remove "why" in Chinese
      .replace(/^why\s*/i, "") // Remove "why" in English
      .replace(/\s*沒有顯示\s*$/, "") // Remove "not showing" in Chinese
      .replace(/\s*not showing\s*$/i, "") // Remove "not showing" in English
      .replace(/\s*無法正確渲染\s*$/, "") // Remove "cannot render properly" in Chinese
      .trim();

    // Extract potential component names using linguistic patterns
    const componentPatterns = [
      // Pattern 1: "X 的 Y" (Chinese possessive) -> extract Y
      /(.+?)的(.+)/,
      // Pattern 2: "X's Y" (English possessive) -> extract Y
      /(.+?)'s\s*(.+)/i,
      // Pattern 3: Multi-word component with type indicator
      /(\w+(?:\s+\w+)+?)\s+(?:engine|component|handler|service|list|page|view|screen)/i,
      // Pattern 4: Simple multi-word component
      /(\w+(?:\s+\w+){1,2})/,
      // Pattern 5: Single word (fallback)
      /(\w+)/,
    ];

    for (const pattern of componentPatterns) {
      const match = cleanQuery.match(pattern);
      if (match) {
        // Use the most specific capture group
        const component = match[match.length - 1]?.trim().toLowerCase();

        if (
          component &&
          component.length > 1 &&
          !this.isCommonWord(component)
        ) {
          return component;
        }
      }
    }

    return null;
  }

  /**
   * Check if word is a common non-component word
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      "the",
      "a",
      "an",
      "this",
      "that",
      "my",
      "your",
      "his",
      "her",
      "its",
      "our",
      "their",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "and",
      "or",
      "but",
      "if",
      "then",
      "else",
      "when",
      "where",
      "how",
      "what",
      "which",
      "的",
      "了",
      "嗎",
      "呢",
      "吧",
      "啊",
      "呀",
      "哦",
      "嗯",
    ];
    return commonWords.includes(word);
  }
}

export function createMCPContextTools(
  mcpWorkflow: MCPWorkflow,
  projectRoot: string
): MCPContextTools {
  return new MCPContextTools(mcpWorkflow, projectRoot);
}
