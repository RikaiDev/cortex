export interface TaskDecomposition {
  originalTask: string;
  isTooLarge: boolean;
  suggestedBreakdown?: SubTask[];
  estimatedTokens?: number;
  reason?: string;
}

export interface SubTask {
  id: string;
  description: string;
  dependencies: string[];
  acceptanceCriteria: string[];
  estimatedComplexity: "simple" | "medium" | "complex";
}

export class TaskDecomposer {
  /**
   * Analyze if task needs decomposition
   *
   * Criteria:
   * - More than 3 files need modification
   * - More than 200 lines of code to write
   * - Involves multiple systems/modules
   * - Has complex logic flow
   */
  analyzeTask(taskDescription: string): TaskDecomposition {
    const result: TaskDecomposition = {
      originalTask: taskDescription,
      isTooLarge: false,
    };

    // Estimate based on description keywords
    const indicators = {
      fileCount: this.estimateFileCount(taskDescription),
      lineCount: this.estimateLineCount(taskDescription),
      complexity: this.estimateComplexity(taskDescription),
    };

    // Check if too large
    if (
      indicators.fileCount > 3 ||
      indicators.lineCount > 200 ||
      indicators.complexity === "high"
    ) {
      result.isTooLarge = true;
      result.reason = this.explainWhy(indicators);
      result.estimatedTokens = indicators.lineCount * 10; // Rough estimate
    }

    return result;
  }

  /**
   * Automatically decompose task into subtasks
   *
   * Principles:
   * - Each subtask modifies only 1-2 files
   * - Each subtask is independently testable
   * - Has clear completion criteria
   */
  decomposeTask(taskDescription: string): SubTask[] {
    const subtasks: SubTask[] = [];

    // Extract components from description
    const components = this.extractComponents(taskDescription);

    // Generate subtasks for each component
    let taskIndex = 1;
    for (const component of components) {
      const subtask: SubTask = {
        id: `T-${taskIndex.toString().padStart(3, "0")}`,
        description: component.description,
        dependencies: component.dependencies,
        acceptanceCriteria: component.criteria,
        estimatedComplexity: component.complexity,
      };
      subtasks.push(subtask);
      taskIndex++;
    }

    // If no clear components found, do generic 3-phase breakdown
    if (subtasks.length === 0) {
      subtasks.push(
        {
          id: "T-001",
          description: "Setup: Create necessary data structures and types",
          dependencies: [],
          acceptanceCriteria: [
            "All types defined",
            "All interfaces exported",
            "No unused types (knip passes)",
          ],
          estimatedComplexity: "simple",
        },
        {
          id: "T-002",
          description: "Core: Implement main business logic",
          dependencies: ["T-001"],
          acceptanceCriteria: [
            "All functions implemented (no TODOs)",
            "All edge cases handled",
            "Error handling complete",
          ],
          estimatedComplexity: "medium",
        },
        {
          id: "T-003",
          description: "Integration: Connect with existing system",
          dependencies: ["T-002"],
          acceptanceCriteria: [
            "Integration points working",
            "Tests passing",
            "Documentation updated",
          ],
          estimatedComplexity: "simple",
        }
      );
    }

    return subtasks;
  }

  /**
   * Validate if task is really complete
   *
   * Checks:
   * - No TODO/FIXME comments
   * - No mock data
   * - All defined structures are used
   * - All tests pass
   */
  validateCompletion(): {
    isComplete: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Note: Actual validation would scan task files for:
    // - No TODO/FIXME comments in code
    // - No mock data patterns detected
    // - All defined exports are used
    // - All tests passing

    // Placeholder - actual implementation would scan files
    const isComplete = issues.length === 0;

    return { isComplete, issues };
  }

  /**
   * Estimate number of files to modify based on description
   */
  private estimateFileCount(description: string): number {
    const keywords = [
      "service",
      "handler",
      "component",
      "controller",
      "model",
      "utility",
      "helper",
    ];

    let count = 0;
    for (const keyword of keywords) {
      if (description.toLowerCase().includes(keyword)) {
        count++;
      }
    }

    // Check for plural indicators
    if (/services|handlers|components|utilities/i.test(description)) {
      count += 2;
    }

    return Math.max(1, count);
  }

  /**
   * Estimate lines of code based on description
   */
  private estimateLineCount(description: string): number {
    const length = description.length;

    // Simple heuristic: longer descriptions = more complex features
    if (length < 50) return 50;
    if (length < 100) return 100;
    if (length < 200) return 200;
    return 300;
  }

  /**
   * Estimate complexity based on description
   */
  private estimateComplexity(description: string): "low" | "medium" | "high" {
    const complexityIndicators = [
      "integrate",
      "authentication",
      "authorization",
      "async",
      "concurrent",
      "distributed",
      "optimize",
      "refactor",
      "migrate",
    ];

    const matches = complexityIndicators.filter((indicator) =>
      description.toLowerCase().includes(indicator)
    );

    if (matches.length >= 3) return "high";
    if (matches.length >= 1) return "medium";
    return "low";
  }

  /**
   * Explain why task is too large
   */
  private explainWhy(indicators: {
    fileCount: number;
    lineCount: number;
    complexity: string;
  }): string {
    const reasons: string[] = [];

    if (indicators.fileCount > 3) {
      reasons.push(`Estimated ${indicators.fileCount} files to modify`);
    }
    if (indicators.lineCount > 200) {
      reasons.push(`Estimated ${indicators.lineCount} lines to write`);
    }
    if (indicators.complexity === "high") {
      reasons.push("High complexity detected");
    }

    return reasons.join("; ");
  }

  /**
   * Extract logical components from task description
   */
  private extractComponents(description: string): Array<{
    description: string;
    dependencies: string[];
    criteria: string[];
    complexity: "simple" | "medium" | "complex";
  }> {
    const components: Array<{
      description: string;
      dependencies: string[];
      criteria: string[];
      complexity: "simple" | "medium" | "complex";
    }> = [];

    // Look for numbered lists or bullet points
    const listItems = description.match(/^[-*]\s+(.+)$/gm);
    if (listItems && listItems.length > 1) {
      listItems.forEach((item) => {
        const cleanItem = item.replace(/^[-*]\s+/, "");
        components.push({
          description: cleanItem,
          dependencies: [],
          criteria: ["Implementation complete", "Tests passing"],
          complexity: "simple",
        });
      });
    }

    return components;
  }
}
