/**
 * Breaking Change Detector
 *
 * Detects breaking changes between old and new versions of code
 */

import type { BreakingChange } from "../../types/change-impact.js";
import { DependencyGraphBuilder } from "./dependency-graph-builder.js";

export class BreakingChangeDetector {
  constructor(private graphBuilder: DependencyGraphBuilder) {}

  /**
   * Detect breaking changes between old and new versions
   */
  async detectBreakingChanges(
    file: string,
    oldContent: string,
    newContent: string
  ): Promise<BreakingChange[]> {
    const breakingChanges: BreakingChange[] = [];

    // Parse old and new exports
    const oldExports = this.graphBuilder.parseExports(oldContent);
    const newExports = this.graphBuilder.parseExports(newContent);

    const newExportNames = new Set(newExports.map((e) => e.name));

    // Find removed exports
    for (const oldExport of oldExports) {
      if (!newExportNames.has(oldExport.name)) {
        // Get files that import this symbol
        const affectedFiles = await this.findFilesImporting(
          file,
          oldExport.name
        );

        if (affectedFiles.length > 0) {
          breakingChanges.push({
            file,
            symbol: oldExport.name,
            changeType: "removed",
            affectedFiles,
            suggestion: `Export '${oldExport.name}' was removed. Consider deprecating instead or updating all imports.`,
          });
        }
      }
    }

    // Detect signature changes (simplified - real implementation would use AST)
    for (const newExport of newExports) {
      const oldExport = oldExports.find((e) => e.name === newExport.name);
      if (oldExport && oldExport.type === "function") {
        // Very basic signature change detection
        const oldLine = oldContent.split("\n")[oldExport.line - 1] || "";
        const newLine = newContent.split("\n")[newExport.line - 1] || "";

        // Check parameter count (rough heuristic)
        const oldParamCount = (oldLine.match(/,/g) || []).length + 1;
        const newParamCount = (newLine.match(/,/g) || []).length + 1;

        if (oldParamCount !== newParamCount) {
          const affectedFiles = await this.findFilesImporting(
            file,
            newExport.name
          );

          if (affectedFiles.length > 0) {
            breakingChanges.push({
              file,
              symbol: newExport.name,
              changeType: "signature-changed",
              affectedFiles,
              suggestion: `Function signature changed. Review all ${affectedFiles.length} call sites.`,
            });
          }
        }
      }
    }

    return breakingChanges;
  }

  /**
   * Find all files that import a specific symbol from a file
   */
  private async findFilesImporting(
    sourceFile: string,
    symbol: string
  ): Promise<string[]> {
    const graph = await this.graphBuilder.buildGraph();

    const normalizedSource = this.graphBuilder.normalizePath(sourceFile);
    const importers: string[] = [];

    const dependents = graph.dependents.get(normalizedSource);
    if (!dependents) return [];

    for (const dependent of dependents) {
      const node = graph.nodes.get(dependent);
      if (!node) continue;

      for (const imp of node.imports) {
        const resolved = this.graphBuilder.resolveImportPath(
          dependent,
          imp.source
        );
        if (
          resolved === normalizedSource &&
          (imp.specifiers.includes(symbol) || imp.importType === "namespace")
        ) {
          importers.push(dependent);
          break;
        }
      }
    }

    return importers;
  }
}
