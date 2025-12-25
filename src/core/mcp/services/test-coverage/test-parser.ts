/**
 * Test Parser
 *
 * Parses test files to extract test cases and metadata
 */

import * as path from "node:path";
import fs from "fs-extra";
import type {
  TestFile,
  TestCase,
  TestFramework,
} from "../../types/test-coverage.js";

export class TestParser {
  private readonly TEST_PATTERNS = [
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.test.js",
    "**/*.test.jsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/*.spec.js",
    "**/*.spec.jsx",
    "**/__tests__/**/*.ts",
    "**/__tests__/**/*.tsx",
    "**/__tests__/**/*.js",
    "**/__tests__/**/*.jsx",
  ];

  private readonly EXCLUDE_DIRS = [
    "node_modules",
    "dist",
    "build",
    ".git",
    "coverage",
    ".next",
  ];

  constructor(private projectRoot: string) {}

  /**
   * Find all test files in the project
   */
  async findTestFiles(): Promise<string[]> {
    const testFiles: string[] = [];
    await this.walkDirectory(this.projectRoot, testFiles);
    return testFiles;
  }

  /**
   * Walk directory to find test files
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
        } else if (this.isTestFile(entry.name)) {
          const relativePath = path.relative(this.projectRoot, fullPath);
          results.push(relativePath);
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  /**
   * Check if a file is a test file
   */
  private isTestFile(fileName: string): boolean {
    return (
      fileName.endsWith(".test.ts") ||
      fileName.endsWith(".test.tsx") ||
      fileName.endsWith(".test.js") ||
      fileName.endsWith(".test.jsx") ||
      fileName.endsWith(".spec.ts") ||
      fileName.endsWith(".spec.tsx") ||
      fileName.endsWith(".spec.js") ||
      fileName.endsWith(".spec.jsx")
    );
  }

  /**
   * Parse a single test file
   */
  async parseTestFile(filePath: string): Promise<TestFile> {
    const fullPath = path.join(this.projectRoot, filePath);
    const content = await fs.readFile(fullPath, "utf-8");

    const framework = this.detectFramework(content);
    const testCases = this.extractTestCases(content, filePath);
    const sourceFile = this.inferSourceFile(filePath);

    return {
      path: filePath,
      framework,
      testCases,
      totalTests: testCases.length,
      skippedTests: testCases.filter((t) => t.isSkipped).length,
      focusedTests: testCases.filter((t) => t.isFocused).length,
      totalAssertions: testCases.reduce((sum, t) => sum + t.assertions, 0),
      sourceFile,
    };
  }

  /**
   * Detect test framework from content
   */
  detectFramework(content: string): TestFramework {
    if (
      content.includes("from 'vitest'") ||
      content.includes('from "vitest"')
    ) {
      return "vitest";
    }
    if (
      content.includes("from '@playwright/test'") ||
      content.includes('from "@playwright/test"')
    ) {
      return "playwright";
    }
    if (content.includes("from 'mocha'") || content.includes('from "mocha"')) {
      return "mocha";
    }
    // Default to jest (most common, often no explicit import)
    return "jest";
  }

  /**
   * Extract test cases from file content
   */
  extractTestCases(content: string, filePath: string): TestCase[] {
    const testCases: TestCase[] = [];
    const lines = content.split("\n");

    let currentDescribe: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Track describe blocks
      const describeMatch = line.match(
        /describe\s*\(\s*['"`](.+?)['"`]/
      );
      if (describeMatch) {
        currentDescribe = describeMatch[1];
      }

      // Match test/it blocks
      const testMatch = line.match(
        /(?:it|test)\s*\(\s*['"`](.+?)['"`]/
      );
      if (testMatch) {
        const isSkipped =
          line.includes(".skip") ||
          line.includes("xit(") ||
          line.includes("xtest(");
        const isFocused =
          line.includes(".only") ||
          line.includes("fit(") ||
          line.includes("ftest(");

        // Count assertions in this test block
        const testBlock = this.extractTestBlock(lines, i);
        const assertions = this.countAssertions(testBlock);
        const hasMocks = this.detectMocks(testBlock);
        const isAsync =
          testBlock.includes("async") || testBlock.includes("await");

        testCases.push({
          name: testMatch[1],
          file: filePath,
          line: lineNumber,
          describe: currentDescribe,
          assertions,
          hasMocks,
          isAsync,
          isSkipped,
          isFocused,
        });
      }
    }

    return testCases;
  }

  /**
   * Extract a test block (from it/test to closing bracket)
   */
  private extractTestBlock(lines: string[], startIndex: number): string {
    let depth = 0;
    let started = false;
    const blockLines: string[] = [];

    for (let i = startIndex; i < lines.length && i < startIndex + 100; i++) {
      const line = lines[i];
      blockLines.push(line);

      for (const char of line) {
        if (char === "{" || char === "(") {
          depth++;
          started = true;
        } else if (char === "}" || char === ")") {
          depth--;
        }
      }

      if (started && depth <= 0) {
        break;
      }
    }

    return blockLines.join("\n");
  }

  /**
   * Count assertions in a test block
   */
  countAssertions(block: string): number {
    const assertionPatterns = [
      /expect\s*\(/g,
      /assert\s*\./g,
      /\.toEqual\s*\(/g,
      /\.toBe\s*\(/g,
      /\.toHaveBeenCalled/g,
      /\.toThrow\s*\(/g,
      /\.toContain\s*\(/g,
      /\.toMatch\s*\(/g,
      /\.toBeTruthy\s*\(/g,
      /\.toBeFalsy\s*\(/g,
      /\.toBeNull\s*\(/g,
      /\.toBeDefined\s*\(/g,
      /\.toBeUndefined\s*\(/g,
      /\.toHaveLength\s*\(/g,
      /\.toHaveProperty\s*\(/g,
      /\.resolves\./g,
      /\.rejects\./g,
    ];

    let count = 0;
    for (const pattern of assertionPatterns) {
      const matches = block.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }

    return count;
  }

  /**
   * Detect if mocks are used in a test block
   */
  detectMocks(block: string): boolean {
    const mockPatterns = [
      /jest\.mock\s*\(/,
      /jest\.fn\s*\(/,
      /jest\.spyOn\s*\(/,
      /vi\.mock\s*\(/,
      /vi\.fn\s*\(/,
      /vi\.spyOn\s*\(/,
      /sinon\./,
      /mockImplementation/,
      /mockReturnValue/,
      /mockResolvedValue/,
      /mockRejectedValue/,
    ];

    return mockPatterns.some((pattern) => pattern.test(block));
  }

  /**
   * Infer source file from test file path
   */
  inferSourceFile(testPath: string): string | undefined {
    // Remove test extensions
    let sourcePath = testPath
      .replace(/\.test\.(ts|tsx|js|jsx)$/, ".$1")
      .replace(/\.spec\.(ts|tsx|js|jsx)$/, ".$1");

    // Handle __tests__ directory
    if (sourcePath.includes("__tests__")) {
      sourcePath = sourcePath.replace("/__tests__", "");
    }

    // Check if source file exists
    const possiblePaths = [
      sourcePath,
      sourcePath.replace("/tests/", "/src/"),
      sourcePath.replace("/test/", "/src/"),
      path.join("src", sourcePath),
    ];

    for (const p of possiblePaths) {
      const fullPath = path.join(this.projectRoot, p);
      if (fs.existsSync(fullPath)) {
        return p;
      }
    }

    return undefined;
  }

  /**
   * Parse all test files in project
   */
  async parseAllTestFiles(): Promise<TestFile[]> {
    const testFilePaths = await this.findTestFiles();
    const testFiles: TestFile[] = [];

    for (const filePath of testFilePaths) {
      try {
        const testFile = await this.parseTestFile(filePath);
        testFiles.push(testFile);
      } catch {
        // Skip files that can't be parsed
      }
    }

    return testFiles;
  }
}
