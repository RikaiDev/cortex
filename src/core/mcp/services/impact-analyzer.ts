/**
 * Impact Analyzer Service
 *
 * Analyzes code dependencies and impact of changes
 */

import * as path from "node:path";
import fs from "fs-extra";
import type {
  DependencyGraph,
  DependencyNode,
  ImportReference,
  ExportReference,
  ChangeImpactResult,
  ImpactDetail,
  BreakingChange,
  ImpactAnalysisOptions,
} from "../types/change-impact.js";

export class ImpactAnalyzer {
  private graph: DependencyGraph | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private projectRoot: string) {}

  /**
   * Build or refresh the dependency graph
   */
  async buildGraph(forceRebuild = false): Promise<DependencyGraph> {
    // Return cached graph if still valid
    if (
      !forceRebuild &&
      this.graph &&
      Date.now() - this.graph.lastBuilt.getTime() < this.CACHE_DURATION
    ) {
      return this.graph;
    }

    const nodes = new Map<string, DependencyNode>();
    const dependents = new Map<string, Set<string>>();

    // Find all TypeScript/JavaScript files
    const files = await this.findSourceFiles();

    // Parse each file
    for (const file of files) {
      const node = await this.parseFile(file);
      if (node) {
        nodes.set(file, node);

        // Build reverse dependency map
        for (const imp of node.imports) {
          const resolvedSource = this.resolveImportPath(file, imp.source);
          if (!dependents.has(resolvedSource)) {
            dependents.set(resolvedSource, new Set());
          }
          dependents.get(resolvedSource)!.add(file);
        }
      }
    }

    this.graph = {
      nodes,
      dependents,
      lastBuilt: new Date(),
      fileCount: files.length,
    };

    return this.graph;
  }

  /**
   * Analyze impact of changing specific files
   */
  async analyzeImpact(
    targetFiles: string[],
    options: ImpactAnalysisOptions = {}
  ): Promise<ChangeImpactResult> {
    // Ensure graph is built
    await this.buildGraph();

    if (!this.graph) {
      throw new Error("Failed to build dependency graph");
    }

    const affectedFiles = new Set<string>();
    const details: ImpactDetail[] = [];
    const breakingChanges: BreakingChange[] = [];

    // Normalize target files to relative paths
    const normalizedTargets = targetFiles.map((f) => this.normalizePath(f));

    // Find all files that depend on the targets
    const maxDepth = options.maxDepth || 10;
    const visited = new Set<string>();

    const traverse = (file: string, depth: number): void => {
      if (depth > maxDepth || visited.has(file)) return;
      visited.add(file);

      const deps = this.graph!.dependents.get(file);
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
        const node = this.graph!.nodes.get(dependent);
        if (node) {
          const relevantImports = node.imports.filter((imp) => {
            const resolved = this.resolveImportPath(dependent, imp.source);
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

    // Traverse from each target file
    for (const target of normalizedTargets) {
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
   * Detect breaking changes between old and new versions
   */
  async detectBreakingChanges(
    file: string,
    oldContent: string,
    newContent: string
  ): Promise<BreakingChange[]> {
    const breakingChanges: BreakingChange[] = [];

    // Parse old and new exports
    const oldExports = this.parseExports(oldContent);
    const newExports = this.parseExports(newContent);

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
    await this.buildGraph();

    if (!this.graph) return [];

    const normalizedSource = this.normalizePath(sourceFile);
    const importers: string[] = [];

    const dependents = this.graph.dependents.get(normalizedSource);
    if (!dependents) return [];

    for (const dependent of dependents) {
      const node = this.graph.nodes.get(dependent);
      if (!node) continue;

      for (const imp of node.imports) {
        const resolved = this.resolveImportPath(dependent, imp.source);
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

  /**
   * Parse a file to extract imports and exports
   */
  private async parseFile(file: string): Promise<DependencyNode | null> {
    const fullPath = path.join(this.projectRoot, file);

    if (!(await fs.pathExists(fullPath))) return null;

    try {
      const content = await fs.readFile(fullPath, "utf-8");
      const imports = this.parseImports(content);
      const exports = this.parseExports(content);

      return {
        file,
        imports,
        exports,
        references: [], // References would require more sophisticated parsing
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse import statements from file content
   */
  private parseImports(content: string): ImportReference[] {
    const imports: ImportReference[] = [];
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Named imports: import { a, b } from "module"
      const namedMatch = line.match(
        /import\s+\{([^}]+)\}\s+from\s+['"](.*)['"]/
      );
      if (namedMatch) {
        const specifiers = namedMatch[1]
          .split(",")
          .map((s) =>
            s
              .trim()
              .split(/\s+as\s+/)[0]
              .trim()
          )
          .filter((s) => s);

        imports.push({
          source: namedMatch[2],
          specifiers,
          importType: "named",
          line: lineNumber,
        });
        continue;
      }

      // Default import: import X from "module"
      const defaultMatch = line.match(/import\s+(\w+)\s+from\s+['"](.*)['"]/);
      if (defaultMatch) {
        imports.push({
          source: defaultMatch[2],
          specifiers: [defaultMatch[1]],
          importType: "default",
          line: lineNumber,
        });
        continue;
      }

      // Namespace import: import * as X from "module"
      const namespaceMatch = line.match(
        /import\s+\*\s+as\s+(\w+)\s+from\s+['"](.*)['"]/
      );
      if (namespaceMatch) {
        imports.push({
          source: namespaceMatch[2],
          specifiers: [namespaceMatch[1]],
          importType: "namespace",
          line: lineNumber,
        });
        continue;
      }

      // Side-effect import: import "module"
      const sideEffectMatch = line.match(/import\s+['"](.*)['"]/);
      if (sideEffectMatch) {
        imports.push({
          source: sideEffectMatch[1],
          specifiers: [],
          importType: "side-effect",
          line: lineNumber,
        });
      }
    }

    return imports;
  }

  /**
   * Parse export statements from file content
   */
  private parseExports(content: string): ExportReference[] {
    const exports: ExportReference[] = [];
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Export function
      if (line.match(/export\s+(async\s+)?function\s+(\w+)/)) {
        const match = line.match(/export\s+(async\s+)?function\s+(\w+)/);
        if (match) {
          exports.push({
            name: match[2],
            type: "function",
            line: lineNumber,
          });
        }
        continue;
      }

      // Export class
      if (line.match(/export\s+(abstract\s+)?class\s+(\w+)/)) {
        const match = line.match(/export\s+(abstract\s+)?class\s+(\w+)/);
        if (match) {
          exports.push({
            name: match[2],
            type: "class",
            line: lineNumber,
          });
        }
        continue;
      }

      // Export interface/type
      if (line.match(/export\s+(interface|type)\s+(\w+)/)) {
        const match = line.match(/export\s+(interface|type)\s+(\w+)/);
        if (match) {
          exports.push({
            name: match[2],
            type: match[1] as "interface" | "type",
            line: lineNumber,
          });
        }
        continue;
      }

      // Export const/let/var
      if (line.match(/export\s+(const|let|var)\s+(\w+)/)) {
        const match = line.match(/export\s+(const|let|var)\s+(\w+)/);
        if (match) {
          exports.push({
            name: match[2],
            type: "const",
            line: lineNumber,
          });
        }
        continue;
      }

      // Named exports: export { a, b }
      if (line.match(/export\s+\{([^}]+)\}/)) {
        const match = line.match(/export\s+\{([^}]+)\}/);
        if (match) {
          const names = match[1]
            .split(",")
            .map((s) =>
              s
                .trim()
                .split(/\s+as\s+/)
                .pop()!
                .trim()
            )
            .filter((s) => s);

          for (const name of names) {
            exports.push({
              name,
              type: "const",
              line: lineNumber,
            });
          }
        }
        continue;
      }

      // Re-exports: export { a } from "module"
      if (line.match(/export\s+\{([^}]+)\}\s+from\s+['"](.*)['"]/)) {
        const match = line.match(/export\s+\{([^}]+)\}\s+from\s+['"](.*)['"]/);
        if (match) {
          const names = match[1]
            .split(",")
            .map((s) =>
              s
                .trim()
                .split(/\s+as\s+/)
                .pop()!
                .trim()
            )
            .filter((s) => s);

          for (const name of names) {
            exports.push({
              name,
              type: "const",
              line: lineNumber,
              isReExport: true,
              originalSource: match[2],
            });
          }
        }
        continue;
      }

      // Default export
      if (line.match(/export\s+default\s+/)) {
        exports.push({
          name: "default",
          type: "default",
          line: lineNumber,
        });
      }
    }

    return exports;
  }

  /**
   * Find all TypeScript/JavaScript source files
   */
  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
    const excludeDirs = [
      "node_modules",
      "dist",
      "build",
      ".git",
      "coverage",
      ".next",
    ];

    const walk = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.projectRoot, fullPath);

        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            await walk(fullPath);
          }
        } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
          files.push(relativePath);
        }
      }
    };

    try {
      await walk(this.projectRoot);
    } catch {
      // Ignore errors
    }

    return files;
  }

  /**
   * Resolve import path relative to importing file
   */
  private resolveImportPath(importerFile: string, importPath: string): string {
    // Skip node_modules imports
    if (!importPath.startsWith(".")) {
      return importPath;
    }

    const importerDir = path.dirname(importerFile);
    const resolved = path.normalize(path.join(importerDir, importPath));

    // Add .ts/.js extension if missing
    if (!path.extname(resolved)) {
      // Try common extensions
      for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
        const withExt = resolved + ext;
        if (this.graph?.nodes.has(withExt)) {
          return withExt;
        }
      }
      // Try index files
      for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
        const indexFile = path.join(resolved, `index${ext}`);
        if (this.graph?.nodes.has(indexFile)) {
          return indexFile;
        }
      }
    }

    return resolved;
  }

  /**
   * Normalize file path to be relative to project root
   */
  private normalizePath(file: string): string {
    if (path.isAbsolute(file)) {
      return path.relative(this.projectRoot, file);
    }
    return file;
  }

  /**
   * Calculate impact level based on affected files count
   */
  private calculateImpactLevel(
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
  private generateSuggestions(
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

  /**
   * Get graph statistics
   */
  getGraphStats(): {
    fileCount: number;
    totalImports: number;
    totalExports: number;
    lastBuilt: Date | null;
  } {
    if (!this.graph) {
      return {
        fileCount: 0,
        totalImports: 0,
        totalExports: 0,
        lastBuilt: null,
      };
    }

    let totalImports = 0;
    let totalExports = 0;

    for (const node of this.graph.nodes.values()) {
      totalImports += node.imports.length;
      totalExports += node.exports.length;
    }

    return {
      fileCount: this.graph.fileCount,
      totalImports,
      totalExports,
      lastBuilt: this.graph.lastBuilt,
    };
  }
}
