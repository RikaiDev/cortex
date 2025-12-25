/**
 * Learning Extractor
 *
 * Extracts patterns, decisions, solutions, and lessons from workflow executions
 */

import type { PhaseResult } from "../../types/workflow.js";
import { WorkflowService } from "../workflow-service.js";
import { MemoryStorage } from "./memory-storage.js";

export class LearningExtractor {
  private workflowService: WorkflowService;

  constructor(
    private storage: MemoryStorage,
    projectRoot: string
  ) {
    this.workflowService = new WorkflowService(projectRoot);
  }

  /**
   * Extract learnings from workflow execution
   */
  async extractLearnings(workflowId: string): Promise<void> {
    try {
      const workflow = await this.workflowService.loadWorkflow(workflowId);

      for (const phase of workflow.phases) {
        if (phase.status === "success") {
          await this.analyzePhaseForLearnings(workflowId, phase);
        }
      }

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
      const content = await this.workflowService.loadPhaseContent(
        workflowId,
        phase.phase
      );

      const patterns = this.extractPatterns(content, phase);
      for (const pattern of patterns) {
        await this.storage.recordExperience({
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

      const decisions = this.extractKeyDecisions(content, phase);
      for (const decision of decisions) {
        await this.storage.recordExperience({
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

      const solutions = this.extractSolutions(content, phase);
      for (const solution of solutions) {
        await this.storage.recordExperience({
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
  extractPatterns(
    content: string,
    phase: PhaseResult
  ): Array<{ title: string; content: string; tags: string[] }> {
    const patterns: Array<{ title: string; content: string; tags: string[] }> =
      [];

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
  extractKeyDecisions(
    content: string,
    phase: PhaseResult
  ): Array<{ title: string; content: string; tags: string[] }> {
    const decisions: Array<{ title: string; content: string; tags: string[] }> =
      [];

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

    return decisions.slice(0, 10);
  }

  /**
   * Extract solutions from phase content
   */
  extractSolutions(
    content: string,
    phase: PhaseResult
  ): Array<{ title: string; content: string; tags: string[] }> {
    const solutions: Array<{ title: string; content: string; tags: string[] }> =
      [];

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
  async detectLessonsLearned(
    workflowId: string,
    phases: PhaseResult[]
  ): Promise<void> {
    const lessons: Array<{ title: string; content: string; tags: string[] }> =
      [];

    const failedPhases = phases.filter((p) => p.status === "failure");
    for (const failed of failedPhases) {
      try {
        const content = await this.workflowService.loadPhaseContent(
          workflowId,
          failed.phase
        );

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
        continue;
      }
    }

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

    for (const lesson of lessons) {
      await this.storage.recordExperience({
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
  extractTagsFromText(text: string): string[] {
    const tags: string[] = [];

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

    return tags.slice(0, 5);
  }
}
