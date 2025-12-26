/**
 * Coverage Mapper
 *
 * Maps test files to source files and calculates coverage
 */

import * as path from "node:path";
import fs from "fs-extra";
import type {
  TestFile,
  TestMapping,
  CoverageMetrics,
  UntestedCode,
} from "../../types/test-coverage.js";

export class CoverageMapper {
  private readonly SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
  private readonly EXCLUDE_DIRS = [
    "node_modules",
    "dist",
    "build",
    ".git",
    "coverage",
    ".next",
    "__tests__",
  ];
  private readonly EXCLUDE_FILES = [
    ".d.ts",
    ".test.",
    ".spec.",
    "index.ts",
    "index.js",
  ];

  constructor(private projectRoot: string) {}

  /**
   * Find all source files in the project
   */
  async findSourceFiles(): Promise<string[]> {
    const sourceFiles: string[] = [];
    await this.walkDirectory(this.projectRoot, sourceFiles);
    return sourceFiles;
  }

  /**
   * Walk directory to find source files
   */
  private async walkDirectory(dir: string, results: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!this.EXCLUDE_DIRS.includes(entry.name)) {
            await this.walkDirectory(fullPath, results);
          }
        } else if (this.isSourceFile(entry.name)) {
          const relativePath = path.relative(this.projectRoot, fullPath);
          results.push(relativePath);
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  /**
   * Check if a file is a source file
   */
  private isSourceFile(fileName: string): boolean {
    // Must have source extension
    const hasSourceExt = this.SOURCE_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );
    if (!hasSourceExt) return false;

    // Must not be excluded
    return !this.EXCLUDE_FILES.some((pattern) => fileName.includes(pattern));
  }

  /**
   * Create mappings between source files and test files
   */
  async createMappings(testFiles: TestFile[]): Promise<TestMapping[]> {
    const sourceFiles = await this.findSourceFiles();
    const mappings: TestMapping[] = [];

    for (const sourceFile of sourceFiles) {
      const matchingTests = this.findTestsForSource(sourceFile, testFiles);
      const functions = await this.extractFunctions(sourceFile);
      const testedFunctions = this.findTestedFunctions(
        functions,
        matchingTests
      );

      const coveragePercent =
        functions.length > 0
          ? (testedFunctions.length / functions.length) * 100
          : 0;

      mappings.push({
        sourceFile,
        testFiles: matchingTests.map((t) => t.path),
        coveredFunctions: testedFunctions,
        uncoveredFunctions: functions.filter(
          (f) => !testedFunctions.includes(f)
        ),
        coveragePercent,
      });
    }

    return mappings;
  }

  /**
   * Find test files that cover a source file
   */
  private findTestsForSource(
    sourceFile: string,
    testFiles: TestFile[]
  ): TestFile[] {
    const baseName = path
      .basename(sourceFile)
      .replace(/\.(ts|tsx|js|jsx)$/, "");
    const dirName = path.dirname(sourceFile);

    return testFiles.filter((testFile) => {
      // Check if test file explicitly maps to source
      if (testFile.sourceFile === sourceFile) {
        return true;
      }

      // Check naming convention
      const testBaseName = path.basename(testFile.path);
      if (
        testBaseName.includes(baseName + ".test.") ||
        testBaseName.includes(baseName + ".spec.")
      ) {
        return true;
      }

      // Check if test is in same directory or __tests__ subdirectory
      const testDir = path.dirname(testFile.path);
      if (testDir === dirName || testDir === path.join(dirName, "__tests__")) {
        return testBaseName.includes(baseName);
      }

      return false;
    });
  }

  /**
   * Extract exported function names from a source file
   */
  async extractFunctions(filePath: string): Promise<string[]> {
    const fullPath = path.join(this.projectRoot, filePath);

    try {
      const content = await fs.readFile(fullPath, "utf-8");
      const functions: string[] = [];

      // Export function declarations
      const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        functions.push(match[1]);
      }

      // Export const arrow functions
      const arrowRegex = /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
      while ((match = arrowRegex.exec(content)) !== null) {
        functions.push(match[1]);
      }

      // Export class methods (simplified)
      const classRegex = /export\s+(?:abstract\s+)?class\s+(\w+)/g;
      while ((match = classRegex.exec(content)) !== null) {
        functions.push(match[1]);
      }

      return functions;
    } catch {
      return [];
    }
  }

  /**
   * Find which functions are likely tested
   */
  private findTestedFunctions(
    functions: string[],
    testFiles: TestFile[]
  ): string[] {
    const testedFunctions: string[] = [];

    for (const func of functions) {
      const isTested = testFiles.some((testFile) =>
        testFile.testCases.some(
          (tc) =>
            tc.name.toLowerCase().includes(func.toLowerCase()) ||
            (tc.describe?.toLowerCase().includes(func.toLowerCase()) ?? false)
        )
      );

      if (isTested) {
        testedFunctions.push(func);
      }
    }

    return testedFunctions;
  }

  /**
   * Calculate coverage metrics
   */
  calculateMetrics(
    testFiles: TestFile[],
    mappings: TestMapping[]
  ): CoverageMetrics {
    const totalSourceFiles = mappings.length;
    const testedFiles = mappings.filter((m) => m.testFiles.length > 0).length;
    const untestedFiles = totalSourceFiles - testedFiles;

    const totalTests = testFiles.reduce((sum, f) => sum + f.totalTests, 0);
    const totalAssertions = testFiles.reduce(
      (sum, f) => sum + f.totalAssertions,
      0
    );

    const avgAssertionsPerTest =
      totalTests > 0 ? totalAssertions / totalTests : 0;
    const fileCoveragePercent =
      totalSourceFiles > 0 ? (testedFiles / totalSourceFiles) * 100 : 0;
    const testToCodeRatio =
      totalSourceFiles > 0 ? testFiles.length / totalSourceFiles : 0;

    return {
      totalSourceFiles,
      testedFiles,
      untestedFiles,
      totalTests,
      totalAssertions,
      avgAssertionsPerTest: Math.round(avgAssertionsPerTest * 10) / 10,
      fileCoveragePercent: Math.round(fileCoveragePercent * 10) / 10,
      testToCodeRatio: Math.round(testToCodeRatio * 100) / 100,
      smellCount: 0, // Will be set by smell detector
    };
  }

  /**
   * Find untested code
   */
  async findUntestedCode(mappings: TestMapping[]): Promise<UntestedCode[]> {
    const untested: UntestedCode[] = [];

    for (const mapping of mappings) {
      // Completely untested files
      if (mapping.testFiles.length === 0) {
        const functions = await this.extractFunctions(mapping.sourceFile);
        const priority = this.calculatePriority(mapping.sourceFile, functions);

        untested.push({
          file: mapping.sourceFile,
          type: "file",
          name: path.basename(mapping.sourceFile),
          line: 1,
          exportedSymbols: functions,
          priority,
          suggestion: `Create test file: ${this.suggestTestPath(mapping.sourceFile)}`,
        });
      }

      // Partially tested - list uncovered functions
      for (const func of mapping.uncoveredFunctions) {
        untested.push({
          file: mapping.sourceFile,
          type: "function",
          name: func,
          line: await this.findFunctionLine(mapping.sourceFile, func),
          exportedSymbols: [func],
          priority: "medium",
          suggestion: `Add test case for '${func}' in existing test file`,
        });
      }
    }

    return untested.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Calculate priority for untested code
   */
  private calculatePriority(
    filePath: string,
    functions: string[]
  ): "high" | "medium" | "low" {
    // High priority for core/critical paths
    if (
      filePath.includes("/core/") ||
      filePath.includes("/services/") ||
      filePath.includes("/handlers/")
    ) {
      return "high";
    }

    // High priority if many exported functions
    if (functions.length > 5) {
      return "high";
    }

    // Low priority for utilities/helpers
    if (
      filePath.includes("/utils/") ||
      filePath.includes("/helpers/") ||
      filePath.includes("/types/")
    ) {
      return "low";
    }

    return "medium";
  }

  /**
   * Suggest test file path for a source file
   */
  private suggestTestPath(sourcePath: string): string {
    const ext = path.extname(sourcePath);
    const base = path.basename(sourcePath, ext);
    const dir = path.dirname(sourcePath);

    return path.join(dir, `${base}.test${ext}`);
  }

  /**
   * Find the line number of a function in a file
   */
  private async findFunctionLine(
    filePath: string,
    funcName: string
  ): Promise<number> {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].includes(`function ${funcName}`) ||
          lines[i].includes(`const ${funcName}`) ||
          lines[i].includes(`class ${funcName}`)
        ) {
          return i + 1;
        }
      }
    } catch {
      // Ignore errors
    }
    return 1;
  }
}
