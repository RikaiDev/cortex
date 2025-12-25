/**
 * Memory Service
 *
 * Manages long-term knowledge storage and retrieval for experiences,
 * patterns, decisions, solutions, and lessons learned.
 */

import * as path from "node:path";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import type {
  Experience,
  MemoryIndex,
  MemorySearchResult,
  ExperienceIndexEntry,
} from "../types/memory.js";
import { WorkflowService } from "./workflow-service.js";
import type { PhaseResult } from "../types/workflow.js";

export class MemoryService {
  private indexPath: string;
  private experiencesPath: string;
  private cachedIndex: MemoryIndex | null = null;
  private workflowService: WorkflowService;

  constructor(private projectRoot: string) {
    const memoryDir = path.join(projectRoot, ".cortex", "memory");
    this.indexPath = path.join(memoryDir, "index.json");
    this.experiencesPath = path.join(memoryDir, "experiences");
    this.workflowService = new WorkflowService(projectRoot);
  }

  /**
   * Initialize memory directory structure
   */
  async initialize(): Promise<void> {
    // Create experiences directories
    await fs.ensureDir(this.experiencesPath);
    await fs.ensureDir(path.join(this.experiencesPath, "patterns"));
    await fs.ensureDir(path.join(this.experiencesPath, "decisions"));
    await fs.ensureDir(path.join(this.experiencesPath, "solutions"));
    await fs.ensureDir(path.join(this.experiencesPath, "lessons"));

    // Initialize index if not exists
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

    // Save experience file with frontmatter
    const fileName = `${experience.id}.md`;
    const categoryPath = path.join(
      this.experiencesPath,
      `${experience.type}s`,
      fileName
    );
    const content = this.formatExperienceFile(experience);
    await fs.writeFile(categoryPath, content, "utf-8");

    // Update index
    await this.updateIndex(experience);

    return experience.id;
  }

  /**
   * Format experience as markdown file with frontmatter
   */
  private formatExperienceFile(exp: Experience): string {
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

    // Add to index
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
  private async loadIndex(): Promise<MemoryIndex> {
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

    // Tokenize query
    const queryTokens = query.toLowerCase().split(/\s+/);

    // Score each entry
    const scoredEntries = index.index.map((entry) => {
      let score = 0;

      // Title matching (higher weight)
      const titleLower = entry.title.toLowerCase();
      for (const token of queryTokens) {
        if (titleLower === token)
          score += 2.0; // Exact match
        else if (titleLower.includes(token)) score += 1.0; // Partial match
      }

      // Tag matching
      for (const tag of entry.tags) {
        const tagLower = tag.toLowerCase();
        for (const token of queryTokens) {
          if (tagLower === token)
            score += 1.5; // Exact tag match
          else if (tagLower.includes(token)) score += 0.5; // Partial tag match
        }
      }

      // Boost by usage count (proven patterns score higher)
      score *= 1 + entry.usageCount * 0.1;

      return { entry, score };
    });

    // Sort by relevance and take top N
    const topEntries = scoredEntries
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Load full experiences
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
  private parseExperienceFile(content: string): Partial<Experience> {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      return { content };
    }

    const [, frontmatter, body] = frontmatterMatch;
    const exp: Partial<Experience> = { content: body };

    // Parse frontmatter fields
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

  /**
   * Extract learnings from workflow execution
   */
  async extractLearnings(workflowId: string): Promise<void> {
    try {
      const workflow = await this.workflowService.loadWorkflow(workflowId);

      // Analyze each successful phase
      for (const phase of workflow.phases) {
        if (phase.status === "success") {
          await this.analyzePhaseForLearnings(workflowId, phase);
        }
      }

      // Detect lessons from comparing phases
      await this.detectLessonsLearned(workflowId, workflow.phases);

      console.log(
        `Successfully extracted learnings from workflow: ${workflowId}`
      );
    } catch (error) {
      console.error(
        `Failed to extract learnings from workflow ${workflowId}:`,
        error
      );
    }
  }

  /**
   * Analyze a phase for extractable learnings
   */
  private async analyzePhaseForLearnings(
    workflowId: string,
    phase: PhaseResult
  ): Promise<void> {
    try {
      // Load phase content
      const content = await this.workflowService.loadPhaseContent(
        workflowId,
        phase.phase
      );

      // Extract patterns
      const patterns = this.extractPatterns(content, phase);
      for (const pattern of patterns) {
        await this.recordExperience({
          type: "pattern",
          title: pattern.title,
          content: pattern.content,
          tags: pattern.tags,
          workflowIds: [workflowId],
          metadata: {
            phase: phase.phase,
            validationPassed: phase.validation.passed,
            extractedAt: new Date().toISOString(),
          },
        });
      }

      // Extract decisions
      const decisions = this.extractKeyDecisions(content, phase);
      for (const decision of decisions) {
        await this.recordExperience({
          type: "decision",
          title: decision.title,
          content: decision.content,
          tags: decision.tags,
          workflowIds: [workflowId],
          metadata: {
            phase: phase.phase,
            validationPassed: phase.validation.passed,
            extractedAt: new Date().toISOString(),
          },
        });
      }

      // Extract solutions from phase output
      const solutions = this.extractSolutions(content, phase);
      for (const solution of solutions) {
        await this.recordExperience({
          type: "solution",
          title: solution.title,
          content: solution.content,
          tags: solution.tags,
          workflowIds: [workflowId],
          metadata: {
            phase: phase.phase,
            validationPassed: phase.validation.passed,
            extractedAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error(
        `Failed to analyze phase ${phase.phase} for workflow ${workflowId}:`,
        error
      );
    }
  }

  /**
   * Extract patterns from phase content
   */
  private extractPatterns(
    content: string,
    phase: PhaseResult
  ): Array<{ title: string; content: string; tags: string[] }> {
    const patterns: Array<{ title: string; content: string; tags: string[] }> =
      [];

    // Look for pattern markers in content
    const patternRegex =
      /(?:^|\n)(?:#+\s*)?(?:Pattern|Best Practice):\s*(.+?)(?:\n|$)([\s\S]*?)(?=\n#+|\n(?:Decision|Solution|Lesson):|$)/gi;
    let match;

    while ((match = patternRegex.exec(content)) !== null) {
      const title = match[1].trim();
      const description = match[2].trim().slice(0, 500);

      if (title && description) {
        patterns.push({
          title: `Pattern: ${title}`,
          content: description,
          tags: [phase.phase, "pattern", ...this.extractTagsFromText(title)],
        });
      }
    }

    // Extract patterns from validation messages
    if (phase.validation.passed && phase.validation.messages) {
      for (const msg of phase.validation.messages) {
        if (
          msg.toLowerCase().includes("best practice") ||
          msg.toLowerCase().includes("pattern")
        ) {
          patterns.push({
            title: `Validation Pattern: ${msg.slice(0, 100)}`,
            content: msg,
            tags: [phase.phase, "pattern", "validation"],
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Extract key decisions from phase content
   */
  private extractKeyDecisions(
    content: string,
    phase: PhaseResult
  ): Array<{ title: string; content: string; tags: string[] }> {
    const decisions: Array<{ title: string; content: string; tags: string[] }> =
      [];

    // Look for decision markers
    const decisionRegex =
      /(?:^|\n)(?:#+\s*)?(?:Decision|Technical Choice|Architecture):\s*(.+?)(?:\n|$)([\s\S]*?)(?=\n#+|\n(?:Pattern|Solution|Lesson):|$)/gi;
    let match;

    while ((match = decisionRegex.exec(content)) !== null) {
      const title = match[1].trim();
      const description = match[2].trim().slice(0, 500);

      if (title && description) {
        decisions.push({
          title: `Decision: ${title}`,
          content: description,
          tags: [phase.phase, "decision", ...this.extractTagsFromText(title)],
        });
      }
    }

    // Extract from common decision phrases
    const decisionPhrases = [
      /(?:We|I) (?:chose|selected|decided to use|implemented|adopted)\s+(.+?)(?:\.|,|\n)/gi,
      /(?:Using|Use|Implement|Adopt)\s+(.+?)\s+(?:for|because|to)/gi,
    ];

    for (const regex of decisionPhrases) {
      let phraseMatch;
      while ((phraseMatch = regex.exec(content)) !== null) {
        const tech = phraseMatch[1].trim();
        if (tech.length > 5 && tech.length < 100) {
          decisions.push({
            title: `Technical Choice: ${tech}`,
            content: phraseMatch[0].trim(),
            tags: [
              phase.phase,
              "decision",
              "technical",
              ...this.extractTagsFromText(tech),
            ],
          });
        }
      }
    }

    return decisions.slice(0, 10); // Limit to top 10 decisions
  }

  /**
   * Extract solutions from phase content
   */
  private extractSolutions(
    content: string,
    phase: PhaseResult
  ): Array<{ title: string; content: string; tags: string[] }> {
    const solutions: Array<{ title: string; content: string; tags: string[] }> =
      [];

    // Look for solution markers
    const solutionRegex =
      /(?:^|\n)(?:#+\s*)?(?:Solution|Approach|Implementation):\s*(.+?)(?:\n|$)([\s\S]*?)(?=\n#+|\n(?:Pattern|Decision|Lesson):|$)/gi;
    let match;

    while ((match = solutionRegex.exec(content)) !== null) {
      const title = match[1].trim();
      const description = match[2].trim().slice(0, 500);

      if (title && description) {
        solutions.push({
          title: `Solution: ${title}`,
          content: description,
          tags: [phase.phase, "solution", ...this.extractTagsFromText(title)],
        });
      }
    }

    return solutions;
  }

  /**
   * Detect lessons learned from workflow phases
   */
  private async detectLessonsLearned(
    workflowId: string,
    phases: PhaseResult[]
  ): Promise<void> {
    const lessons: Array<{ title: string; content: string; tags: string[] }> =
      [];

    // Analyze failed phases
    const failedPhases = phases.filter((p) => p.status === "failure");
    for (const failed of failedPhases) {
      try {
        const content = await this.workflowService.loadPhaseContent(
          workflowId,
          failed.phase
        );

        // Extract error patterns
        const errorRegex = /(?:error|failed|issue|problem):\s*(.+?)(?:\n|$)/gi;
        let match;

        while ((match = errorRegex.exec(content)) !== null) {
          const issue = match[1].trim();
          if (issue.length > 10) {
            lessons.push({
              title: `Lesson: Avoid ${issue.slice(0, 80)}`,
              content: `Failed during ${failed.phase} phase: ${issue}`,
              tags: [failed.phase, "lesson", "failure", "avoid"],
            });
          }
        }
      } catch {
        // Phase content might not exist
        continue;
      }
    }

    // Compare partial vs success phases to identify improvements
    const partialPhases = phases.filter((p) => p.status === "partial");
    for (const partial of partialPhases) {
      if (
        partial.validation.messages &&
        partial.validation.messages.length > 0
      ) {
        lessons.push({
          title: `Lesson: Improve ${partial.phase} phase quality`,
          content: `Validation issues:\n${partial.validation.messages.join("\n")}`,
          tags: [partial.phase, "lesson", "improvement"],
        });
      }
    }

    // Record lessons
    for (const lesson of lessons) {
      await this.recordExperience({
        type: "lesson",
        title: lesson.title,
        content: lesson.content,
        tags: lesson.tags,
        workflowIds: [workflowId],
        metadata: {
          extractedAt: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Extract relevant tags from text
   */
  private extractTagsFromText(text: string): string[] {
    const tags: string[] = [];

    // Common technical terms to extract
    const techTerms = [
      "typescript",
      "javascript",
      "react",
      "node",
      "api",
      "rest",
      "graphql",
      "database",
      "sql",
      "nosql",
      "mongodb",
      "postgres",
      "redis",
      "docker",
      "kubernetes",
      "aws",
      "azure",
      "gcp",
      "testing",
      "jest",
      "mocha",
      "cypress",
      "performance",
      "security",
      "optimization",
      "architecture",
      "design",
      "pattern",
    ];

    const lowerText = text.toLowerCase();
    for (const term of techTerms) {
      if (lowerText.includes(term)) {
        tags.push(term);
      }
    }

    return tags.slice(0, 5); // Limit to 5 tags
  }
}
