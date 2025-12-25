/**
 * Dependency Graph Builder
 *
 * Builds and manages the dependency graph for code analysis
 */

import * as path from "node:path";
import fs from "fs-extra";
import type {
  DependencyGraph,
  DependencyNode,
  ImportReference,
  ExportReference,
} from "../../types/change-impact.js";

export class DependencyGraphBuilder {
  private graph: DependencyGraph | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private projectRoot: string) {}

  /**
   * Get the current graph (may be null if not built)
   */
  getGraph(): DependencyGraph | null {
    return this.graph;
  }

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
   * Parse a file to extract imports and exports
   */
  async parseFile(file: string): Promise<DependencyNode | null> {
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
  parseImports(content: string): ImportReference[] {
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
  parseExports(content: string): ExportReference[] {
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
  resolveImportPath(importerFile: string, importPath: string): string {
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
  normalizePath(file: string): string {
    if (path.isAbsolute(file)) {
      return path.relative(this.projectRoot, file);
    }
    return file;
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
