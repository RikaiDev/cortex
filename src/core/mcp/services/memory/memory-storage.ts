/**
 * Memory Storage
 *
 * Core CRUD operations for experience storage and retrieval
 */

import * as path from "node:path";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import type {
  Experience,
  MemoryIndex,
  MemorySearchResult,
  ExperienceIndexEntry,
} from "../../types/memory.js";

export class MemoryStorage {
  private indexPath: string;
  private experiencesPath: string;
  private cachedIndex: MemoryIndex | null = null;

  constructor(private projectRoot: string) {
    const memoryDir = path.join(projectRoot, ".cortex", "memory");
    this.indexPath = path.join(memoryDir, "index.json");
    this.experiencesPath = path.join(memoryDir, "experiences");
  }

  /**
   * Get the experiences path for external access
   */
  getExperiencesPath(): string {
    return this.experiencesPath;
  }

  /**
   * Get the index path for external access
   */
  getIndexPath(): string {
    return this.indexPath;
  }

  /**
   * Initialize memory directory structure
   */
  async initialize(): Promise<void> {
    await fs.ensureDir(this.experiencesPath);
    await fs.ensureDir(path.join(this.experiencesPath, "patterns"));
    await fs.ensureDir(path.join(this.experiencesPath, "decisions"));
    await fs.ensureDir(path.join(this.experiencesPath, "solutions"));
    await fs.ensureDir(path.join(this.experiencesPath, "lessons"));

    if (!(await fs.pathExists(this.indexPath))) {
      await this.createEmptyIndex();
    }
  }

  /**
   * Create empty index structure
   */
  async createEmptyIndex(): Promise<void> {
    const emptyIndex: MemoryIndex = {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      totalExperiences: 0,
      categories: {
        patterns: 0,
        decisions: 0,
        solutions: 0,
        lessons: 0,
      },
      index: [],
    };

    await fs.writeJson(this.indexPath, emptyIndex, { spaces: 2 });
    this.cachedIndex = emptyIndex;
  }

  /**
   * Record a new experience to memory
   */
  async recordExperience(exp: Partial<Experience>): Promise<string> {
    const experience: Experience = {
      id: exp.id || uuidv4(),
      type: exp.type || "pattern",
      title: exp.title || "Untitled Experience",
      content: exp.content || "",
      tags: exp.tags || [],
      date: exp.date || new Date().toISOString(),
      workflowIds: exp.workflowIds || [],
      successRate: exp.successRate,
      metadata: exp.metadata || {},
    };

    const fileName = `${experience.id}.md`;
    const categoryPath = path.join(
      this.experiencesPath,
      `${experience.type}s`,
      fileName
    );
    const content = this.formatExperienceFile(experience);
    await fs.writeFile(categoryPath, content, "utf-8");

    await this.updateIndex(experience);

    return experience.id;
  }

  /**
   * Format experience as markdown file with frontmatter
   */
  formatExperienceFile(exp: Experience): string {
    const frontmatter = [
      "---",
      `id: "${exp.id}"`,
      `type: "${exp.type}"`,
      `title: "${exp.title}"`,
      `tags: [${exp.tags.map((t) => `"${t}"`).join(", ")}]`,
      `date: "${exp.date}"`,
      `workflowIds: [${exp.workflowIds.map((id) => `"${id}"`).join(", ")}]`,
      exp.successRate !== undefined ? `successRate: ${exp.successRate}` : "",
      "---",
      "",
    ]
      .filter(Boolean)
      .join("\n");

    return frontmatter + exp.content;
  }

  /**
   * Update memory index with new experience
   */
  async updateIndex(experience: Experience): Promise<void> {
    const index = await this.loadIndex();

    const entry: ExperienceIndexEntry = {
      id: experience.id,
      type: experience.type,
      title: experience.title,
      tags: experience.tags,
      path: `experiences/${experience.type}s/${experience.id}.md`,
      relevanceScore: 0,
      usageCount: experience.workflowIds.length,
    };

    index.index.push(entry);
    index.totalExperiences = index.index.length;
    index.categories[`${experience.type}s` as keyof typeof index.categories]++;
    index.lastUpdated = new Date().toISOString();

    await fs.writeJson(this.indexPath, index, { spaces: 2 });
    this.cachedIndex = index;
  }

  /**
   * Load memory index (with caching)
   */
  async loadIndex(): Promise<MemoryIndex> {
    if (this.cachedIndex) {
      return this.cachedIndex;
    }

    if (await fs.pathExists(this.indexPath)) {
      this.cachedIndex = await fs.readJson(this.indexPath);
      return this.cachedIndex!;
    }

    await this.createEmptyIndex();
    return this.cachedIndex!;
  }

  /**
   * Search experiences by query with relevance scoring
   */
  async searchExperiences(
    query: string,
    limit = 5
  ): Promise<MemorySearchResult> {
    const startTime = Date.now();
    const index = await this.loadIndex();

    const queryTokens = query.toLowerCase().split(/\s+/);

    const scoredEntries = index.index.map((entry) => {
      let score = 0;

      const titleLower = entry.title.toLowerCase();
      for (const token of queryTokens) {
        if (titleLower === token) score += 2.0;
        else if (titleLower.includes(token)) score += 1.0;
      }

      for (const tag of entry.tags) {
        const tagLower = tag.toLowerCase();
        for (const token of queryTokens) {
          if (tagLower === token) score += 1.5;
          else if (tagLower.includes(token)) score += 0.5;
        }
      }

      score *= 1 + entry.usageCount * 0.1;

      return { entry, score };
    });

    const topEntries = scoredEntries
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const experiences = await Promise.all(
      topEntries.map(async ({ entry, score }) => {
        const filePath = path.join(path.dirname(this.indexPath), entry.path);
        const content = await fs.readFile(filePath, "utf-8");
        const exp = this.parseExperienceFile(content);
        return { ...exp, relevanceScore: score };
      })
    );

    const searchTime = Date.now() - startTime;

    return {
      experiences: experiences as Experience[],
      query,
      totalMatches: topEntries.length,
      searchTime,
    };
  }

  /**
   * Parse experience file with frontmatter
   */
  parseExperienceFile(content: string): Partial<Experience> {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      return { content };
    }

    const [, frontmatter, body] = frontmatterMatch;
    const exp: Partial<Experience> = { content: body };

    const idMatch = frontmatter.match(/id: "(.+?)"/);
    if (idMatch) exp.id = idMatch[1];

    const typeMatch = frontmatter.match(/type: "(.+?)"/);
    if (typeMatch) exp.type = typeMatch[1] as Experience["type"];

    const titleMatch = frontmatter.match(/title: "(.+?)"/);
    if (titleMatch) exp.title = titleMatch[1];

    const tagsMatch = frontmatter.match(/tags: \[(.*?)\]/);
    if (tagsMatch) {
      exp.tags = tagsMatch[1]
        .split(",")
        .map((t) => t.trim().replace(/"/g, ""))
        .filter(Boolean);
    }

    const dateMatch = frontmatter.match(/date: "(.+?)"/);
    if (dateMatch) exp.date = dateMatch[1];

    const workflowIdsMatch = frontmatter.match(/workflowIds: \[(.*?)\]/);
    if (workflowIdsMatch) {
      exp.workflowIds = workflowIdsMatch[1]
        .split(",")
        .map((id) => id.trim().replace(/"/g, ""))
        .filter(Boolean);
    }

    const successRateMatch = frontmatter.match(/successRate: ([\d.]+)/);
    if (successRateMatch) exp.successRate = parseFloat(successRateMatch[1]);

    return exp;
  }

  /**
   * Enhance context by retrieving relevant experiences
   */
  async enhanceContext(currentTask: string): Promise<string> {
    const searchResult = await this.searchExperiences(currentTask, 5);

    if (searchResult.experiences.length === 0) {
      return "";
    }

    const contextParts = [
      "## Relevant Past Experiences",
      "",
      `Found ${searchResult.totalMatches} relevant experience(s) (search took ${searchResult.searchTime}ms):`,
      "",
    ];

    for (const exp of searchResult.experiences) {
      contextParts.push(`### ${exp.title} (${exp.type})`);
      contextParts.push(`**Tags**: ${exp.tags.join(", ")}`);
      contextParts.push(`**Used in**: ${exp.workflowIds.length} workflow(s)`);
      if (exp.successRate !== undefined) {
        contextParts.push(
          `**Success Rate**: ${(exp.successRate * 100).toFixed(0)}%`
        );
      }
      contextParts.push("");
      contextParts.push(exp.content);
      contextParts.push("");
      contextParts.push("---");
      contextParts.push("");
    }

    return contextParts.join("\n");
  }
}
