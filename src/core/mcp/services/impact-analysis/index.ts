/**
 * Impact Analysis Module
 *
 * Analyzes code dependencies and impact of changes
 */

import type {
  ChangeImpactResult,
  BreakingChange,
  ImpactAnalysisOptions,
  DependencyGraph,
} from "../../types/change-impact.js";
import { DependencyGraphBuilder } from "./dependency-graph-builder.js";
import { ImpactCalculator } from "./impact-calculator.js";
import { BreakingChangeDetector } from "./breaking-change-detector.js";

/**
 * ImpactAnalyzer - Facade class for backward compatibility
 *
 * Maintains the same public API as the original ImpactAnalyzer class
 * while delegating to specialized sub-modules.
 */
/**
 * Service for analyzing the impact of code changes.
 *
 * Builds dependency graphs, calculates affected files, detects breaking
 * changes, and provides risk assessments for proposed modifications.
 */
export class ImpactAnalyzer {
  private graphBuilder: DependencyGraphBuilder;
  private calculator: ImpactCalculator;
  private breakingChangeDetector: BreakingChangeDetector;

  /**
   * @param projectRoot - Root directory of the project
   */
  constructor(projectRoot: string) {
    this.graphBuilder = new DependencyGraphBuilder(projectRoot);
    this.calculator = new ImpactCalculator(this.graphBuilder);
    this.breakingChangeDetector = new BreakingChangeDetector(this.graphBuilder);
  }

  /**
   * Build or refresh the dependency graph
   */
  async buildGraph(forceRebuild = false): Promise<DependencyGraph> {
    return this.graphBuilder.buildGraph(forceRebuild);
  }

  /**
   * Analyze impact of changing specific files
   */
  async analyzeImpact(
    targetFiles: string[],
    options: ImpactAnalysisOptions = {}
  ): Promise<ChangeImpactResult> {
    return this.calculator.analyzeImpact(targetFiles, options);
  }

  /**
   * Detect breaking changes between old and new versions
   */
  async detectBreakingChanges(
    file: string,
    oldContent: string,
    newContent: string
  ): Promise<BreakingChange[]> {
    return this.breakingChangeDetector.detectBreakingChanges(
      file,
      oldContent,
      newContent
    );
  }

  /**
   * Get graph statistics
   */
  getGraphStats(): {
    fileCount: number;
    totalImports: number;
    totalExports: number;
    lastBuilt: Date | null;
  } {
    return this.graphBuilder.getGraphStats();
  }
}
