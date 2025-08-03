/**
 * MCP Context Tools - Optimized Content Pump with Intelligent Filtering
 *
 * This module provides the external LLM with optimized, relevant context
 * through intelligent filtering, caching, and relevance scoring to handle
 * growing experience libraries efficiently.
 */

import { MCPWorkflow } from "../common/types.js";
import fs from "fs-extra";
import * as path from "path";
import crypto from "crypto";

interface ToolResult {
  output: string;
  success: boolean;
}

interface Experience {
  userInput: string;
  response: string;
  timestamp: string;
  tags?: string[];
  category?: string;
  relevance?: number;
}

interface ContextEnhancementOptions {
  maxExperiences?: number;
  timeFilter?: number; // days
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

    const experiencesDir = path.join(this.projectRoot, "docs", "experiences");

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
    if (content.includes("測試")) tags.push("testing");
    if (content.includes("修復")) tags.push("bugfix");
    if (content.includes("發佈")) tags.push("release");
    if (content.includes("工具")) tags.push("tools");
    if (content.includes("伺服器")) tags.push("server");

    return tags;
  }

  private categorizeExperience(experience: Experience): string {
    const content =
      `${experience.userInput} ${experience.response}`.toLowerCase();

    if (content.includes("mcp")) return "mcp";
    if (content.includes("測試")) return "testing";
    if (content.includes("修復")) return "bugfix";
    if (content.includes("發佈")) return "release";
    if (content.includes("工具")) return "tools";

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
    if (userInput.includes("測試") || response.includes("測試")) {
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

  private async contextEnhancerTool(args: any = {}): Promise<ToolResult> {
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
          output: "<!-- No experiences found in the library. -->",
          success: true,
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
        output: `${summary}\n\n${formattedExperiences}`,
        success: true,
      };
    } catch (error: any) {
      console.error("Error in contextEnhancerTool:", error);
      return {
        output: `<!-- Error fetching experiences: ${error.message} -->`,
        success: false,
      };
    }
  }

  private async experienceRecorderTool(
    params: Record<string, any>
  ): Promise<ToolResult> {
    const { context } = params;
    if (context && context.userInput) {
      // Ensure timestamp is current time, not hardcoded
      const currentTimestamp = new Date().toISOString();
      const experienceData = {
        ...context,
        timestamp: currentTimestamp,
      };

      const hash = this.getExperienceHash(context.userInput);
      const experiencePath = path.join(
        this.projectRoot,
        "docs",
        "experiences",
        `${hash}.json`
      );

      try {
        await fs.ensureDir(path.dirname(experiencePath));
        await fs.writeJson(experiencePath, experienceData, { spaces: 2 });

        // Clear cache to force reload
        this.experiencesCache.clear();

        return {
          output: `Experience for "${context.userInput}" saved successfully to ${path.basename(experiencePath)} at ${currentTimestamp}.`,
          success: true,
        };
      } catch (error: any) {
        console.error(`Failed to save experience to ${experiencePath}:`, error);
        return {
          output: `Failed to save experience: ${error.message}`,
          success: false,
        };
      }
    }
    return {
      output:
        "Invalid context for recording experience. 'userInput' is required.",
      success: false,
    };
  }
}

export function createMCPContextTools(
  mcpWorkflow: MCPWorkflow,
  projectRoot: string
): MCPContextTools {
  return new MCPContextTools(mcpWorkflow, projectRoot);
}
