/**
 * Impact Calculator
 *
 * Analyzes the impact of code changes on dependent files
 */

import type {
  ChangeImpactResult,
  ImpactDetail,
  BreakingChange,
  ImpactAnalysisOptions,
} from "../../types/change-impact.js";
import { DependencyGraphBuilder } from "./dependency-graph-builder.js";

export class ImpactCalculator {
  constructor(private graphBuilder: DependencyGraphBuilder) {}

  /**
   * Analyze impact of changing specific files
   */
  async analyzeImpact(
    targetFiles: string[],
    options: ImpactAnalysisOptions = {}
  ): Promise<ChangeImpactResult> {
    // Ensure graph is built
    const graph = await this.graphBuilder.buildGraph();

    const affectedFiles = new Set<string>();
    const details: ImpactDetail[] = [];
    const breakingChanges: BreakingChange[] = [];

    // Normalize target files to relative paths
    const normalizedTargets = targetFiles.map((f) =>
      this.graphBuilder.normalizePath(f)
    );

    // Also create .js versions for ESM import matching
    // TypeScript files are stored with .ts but imports use .js (ESM convention)
    const targetVariants = new Set<string>();
    for (const target of normalizedTargets) {
      targetVariants.add(target);
      // Add .js variant for .ts files
      if (target.endsWith(".ts")) {
        targetVariants.add(target.replace(/\.ts$/, ".js"));
      }
      if (target.endsWith(".tsx")) {
        targetVariants.add(target.replace(/\.tsx$/, ".js"));
      }
    }

    // Find all files that depend on the targets
    const maxDepth = options.maxDepth || 10;
    const visited = new Set<string>();

    const traverse = (file: string, depth: number): void => {
      if (depth > maxDepth || visited.has(file)) return;
      visited.add(file);

      const deps = graph.dependents.get(file);
      if (!deps) return;

      for (const dependent of deps) {
        // Skip if excluded
        if (this.shouldExclude(dependent, options.excludePatterns)) {
          continue;
        }

        // Skip test files if requested
        if (
          !options.includeTests &&
          (dependent.includes(".test.") || dependent.includes(".spec."))
        ) {
          continue;
        }

        affectedFiles.add(dependent);

        // Get import details
        const node = graph.nodes.get(dependent);
        if (node) {
          const relevantImports = node.imports.filter((imp) => {
            const resolved = this.graphBuilder.resolveImportPath(
              dependent,
              imp.source
            );
            return normalizedTargets.includes(resolved);
          });

          if (relevantImports.length > 0) {
            details.push({
              file: dependent,
              reason: `Imports from ${file}`,
              importedSymbols: relevantImports.flatMap((i) => i.specifiers),
              usageCount: relevantImports.length,
              severity: "warning",
            });
          }
        }

        // Recursively find dependents
        traverse(dependent, depth + 1);
      }
    };

    // Traverse from each target file (including .js variants for ESM)
    for (const target of targetVariants) {
      traverse(target, 0);
    }

    // Determine impact level
    const impactLevel = this.calculateImpactLevel(affectedFiles.size);

    // Generate suggestions
    const suggestions = this.generateSuggestions(
      normalizedTargets,
      Array.from(affectedFiles)
    );

    return {
      targetFiles: normalizedTargets,
      affectedFiles: Array.from(affectedFiles).sort(),
      impactLevel,
      details,
      suggestions,
      breakingChanges,
    };
  }

  /**
   * Calculate impact level based on affected files count
   */
  calculateImpactLevel(
    affectedCount: number
  ): "low" | "medium" | "high" | "critical" {
    if (affectedCount === 0) return "low";
    if (affectedCount <= 3) return "low";
    if (affectedCount <= 10) return "medium";
    if (affectedCount <= 25) return "high";
    return "critical";
  }

  /**
   * Generate suggestions based on impact analysis
   */
  generateSuggestions(
    targetFiles: string[],
    affectedFiles: string[]
  ): string[] {
    const suggestions: string[] = [];

    if (affectedFiles.length === 0) {
      suggestions.push("No files depend on the target files. Safe to modify.");
      return suggestions;
    }

    suggestions.push(
      `Review ${affectedFiles.length} affected file${affectedFiles.length > 1 ? "s" : ""} after making changes.`
    );

    // Check for test files
    const testFiles = affectedFiles.filter(
      (f) => f.includes(".test.") || f.includes(".spec.")
    );
    if (testFiles.length > 0) {
      suggestions.push(
        `Update ${testFiles.length} test file${testFiles.length > 1 ? "s" : ""} to match changes.`
      );
    }

    // Check for high-impact files (many dependents)
    if (affectedFiles.length > 10) {
      suggestions.push(
        "Consider making changes backward-compatible to minimize breaking changes."
      );
      suggestions.push(
        "Consider adding deprecation warnings before removing functionality."
      );
    }

    return suggestions;
  }

  /**
   * Check if file should be excluded
   */
  private shouldExclude(file: string, patterns: string[] | undefined): boolean {
    if (!patterns || patterns.length === 0) return false;

    return patterns.some((pattern) => {
      // Simple glob-like matching
      const regex = new RegExp(
        pattern.replace(/\*/g, ".*").replace(/\?/g, ".")
      );
      return regex.test(file);
    });
  }
}
