/**
 * Smell Detector
 *
 * Detects test smells and quality issues
 */

import * as path from "node:path";
import fs from "fs-extra";
import type {
  TestFile,
  TestSmell,
  TestSmellCategory,
  TestIssueSeverity,
} from "../../types/test-coverage.js";

interface SmellPattern {
  category: TestSmellCategory;
  severity: TestIssueSeverity;
  description: string;
  suggestion: string;
  detect: (testFile: TestFile, content: string) => TestSmell[];
}

type DetectFunction = (testFile: TestFile, content: string) => TestSmell[];

export class SmellDetector {
  private patterns: SmellPattern[];

  constructor(private projectRoot: string) {
    this.patterns = this.initializePatterns();
  }

  /**
   * Initialize smell detection patterns
   */
  private initializePatterns(): SmellPattern[] {
    return [
      {
        category: "no-assertions",
        severity: "error",
        description: "Test has no assertions",
        suggestion: "Add expect() or assert() statements to verify behavior",
        detect: ((testFile): TestSmell[] => {
          return testFile.testCases
            .filter((tc) => tc.assertions === 0 && !tc.isSkipped)
            .map((tc) => ({
              file: testFile.path,
              line: tc.line,
              testName: tc.name,
              category: "no-assertions" as TestSmellCategory,
              severity: "error" as TestIssueSeverity,
              description: `Test '${tc.name}' has no assertions`,
              suggestion:
                "Add expect() or assert() statements to verify behavior",
            }));
        }) as DetectFunction,
      },
      {
        category: "only-happy-path",
        severity: "warning",
        description: "Test only covers happy path",
        suggestion: "Add edge cases and error scenarios",
        detect: ((testFile): TestSmell[] => {
          const smells: TestSmell[] = [];

          // Check if describe block has tests for error/edge cases
          const describeGroups = new Map<string, number>();
          for (const tc of testFile.testCases) {
            const describe = tc.describe || "default";
            describeGroups.set(
              describe,
              (describeGroups.get(describe) || 0) + 1
            );
          }

          for (const [describe, count] of describeGroups) {
            if (count === 1) {
              const tc = testFile.testCases.find(
                (t) => (t.describe || "default") === describe
              );
              if (tc && !tc.name.toLowerCase().includes("error")) {
                smells.push({
                  file: testFile.path,
                  line: tc.line,
                  testName: tc.name,
                  category: "only-happy-path",
                  severity: "warning",
                  description: `Only one test case for '${describe}'`,
                  suggestion: "Add edge cases and error scenarios",
                });
              }
            }
          }

          return smells;
        }) as DetectFunction,
      },
      {
        category: "missing-mocks",
        severity: "info",
        description: "Async test without mocks",
        suggestion: "Consider mocking external dependencies",
        detect: ((testFile): TestSmell[] => {
          return testFile.testCases
            .filter((tc) => tc.isAsync && !tc.hasMocks && !tc.isSkipped)
            .map((tc) => ({
              file: testFile.path,
              line: tc.line,
              testName: tc.name,
              category: "missing-mocks" as TestSmellCategory,
              severity: "info" as TestIssueSeverity,
              description: `Async test '${tc.name}' has no mocks`,
              suggestion:
                "Consider mocking external dependencies for isolation",
            }));
        }) as DetectFunction,
      },
      {
        category: "duplicate-test",
        severity: "warning",
        description: "Similar test names detected",
        suggestion: "Consolidate or differentiate test cases",
        detect: ((testFile): TestSmell[] => {
          const smells: TestSmell[] = [];
          const names = testFile.testCases.map((tc) => tc.name.toLowerCase());

          for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
              if (this.areSimilar(names[i], names[j])) {
                smells.push({
                  file: testFile.path,
                  line: testFile.testCases[i].line,
                  testName: testFile.testCases[i].name,
                  category: "duplicate-test",
                  severity: "warning",
                  description: `Similar to test '${testFile.testCases[j].name}'`,
                  suggestion: "Consolidate or differentiate test cases",
                });
              }
            }
          }

          return smells;
        }) as DetectFunction,
      },
      {
        category: "unclear-name",
        severity: "info",
        description: "Test name is unclear",
        suggestion: "Use descriptive names: 'should [action] when [condition]'",
        detect: ((testFile): TestSmell[] => {
          return testFile.testCases
            .filter((tc) => {
              const name = tc.name.toLowerCase();
              // Too short or generic names
              return (
                name.length < 10 ||
                name === "test" ||
                name === "works" ||
                name.startsWith("test ") ||
                (!name.includes("should") &&
                  !name.includes("when") &&
                  !name.includes("returns") &&
                  !name.includes("throws"))
              );
            })
            .map((tc) => ({
              file: testFile.path,
              line: tc.line,
              testName: tc.name,
              category: "unclear-name" as TestSmellCategory,
              severity: "info" as TestIssueSeverity,
              description: `Test name '${tc.name}' could be more descriptive`,
              suggestion: "Use pattern: 'should [action] when [condition]'",
            }));
        }) as DetectFunction,
      },
      {
        category: "large-test",
        severity: "warning",
        description: "Test has too many assertions",
        suggestion: "Split into smaller, focused test cases",
        detect: ((testFile): TestSmell[] => {
          return testFile.testCases
            .filter((tc) => tc.assertions > 5)
            .map((tc) => ({
              file: testFile.path,
              line: tc.line,
              testName: tc.name,
              category: "large-test" as TestSmellCategory,
              severity: "warning" as TestIssueSeverity,
              description: `Test '${tc.name}' has ${tc.assertions} assertions`,
              suggestion: "Split into smaller, focused test cases",
            }));
        }) as DetectFunction,
      },
      {
        category: "flaky-test",
        severity: "error",
        description: "Potential flaky test detected",
        suggestion: "Use deterministic values instead of random/time-based",
        detect: ((_testFile, content): TestSmell[] => {
          const smells: TestSmell[] = [];
          const lines = content.split("\n");

          const flakyPatterns = [
            { regex: /Math\.random\(\)/, desc: "Random values" },
            { regex: /new Date\(\)/, desc: "Current date/time" },
            { regex: /Date\.now\(\)/, desc: "Current timestamp" },
            { regex: /setTimeout\s*\(/, desc: "setTimeout in test" },
            { regex: /setInterval\s*\(/, desc: "setInterval in test" },
          ];

          for (let i = 0; i < lines.length; i++) {
            for (const pattern of flakyPatterns) {
              if (pattern.regex.test(lines[i])) {
                smells.push({
                  file: _testFile.path,
                  line: i + 1,
                  testName: `Line ${i + 1}`,
                  category: "flaky-test",
                  severity: "error",
                  description: `${pattern.desc} may cause flaky tests`,
                  suggestion: "Use deterministic values or mock time functions",
                });
              }
            }
          }

          return smells;
        }) as DetectFunction,
      },
      {
        category: "hardcoded-values",
        severity: "info",
        description: "Magic numbers or hardcoded strings",
        suggestion: "Use constants or test fixtures",
        detect: ((_testFile, content): TestSmell[] => {
          const smells: TestSmell[] = [];
          const lines = content.split("\n");

          // Look for suspicious hardcoded values in assertions
          const hardcodedPattern =
            /expect\s*\([^)]+\)\s*\.(?:toBe|toEqual)\s*\(\s*(\d{4,}|['"][^'"]{50,}['"])/;

          for (let i = 0; i < lines.length; i++) {
            if (hardcodedPattern.test(lines[i])) {
              smells.push({
                file: _testFile.path,
                line: i + 1,
                testName: `Line ${i + 1}`,
                category: "hardcoded-values",
                severity: "info",
                description: "Large hardcoded value in assertion",
                suggestion: "Extract to a constant or use test fixtures",
              });
            }
          }

          return smells;
        }) as DetectFunction,
      },
    ];
  }

  /**
   * Check if two test names are similar
   */
  private areSimilar(name1: string, name2: string): boolean {
    // Simple similarity check - same words, different order
    const words1 = new Set(name1.split(/\s+/));
    const words2 = new Set(name2.split(/\s+/));

    let common = 0;
    for (const word of words1) {
      if (words2.has(word)) common++;
    }

    const similarity = common / Math.max(words1.size, words2.size);
    return similarity > 0.8;
  }

  /**
   * Detect all smells in test files
   */
  async detectSmells(testFiles: TestFile[]): Promise<TestSmell[]> {
    const allSmells: TestSmell[] = [];

    for (const testFile of testFiles) {
      try {
        const fullPath = path.join(this.projectRoot, testFile.path);
        const content = await fs.readFile(fullPath, "utf-8");

        for (const pattern of this.patterns) {
          const smells = pattern.detect(testFile, content);
          allSmells.push(...smells);
        }
      } catch {
        // Skip files that can't be read
      }
    }

    // Sort by severity
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return allSmells.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  }

  /**
   * Get smell detection patterns
   */
  getPatterns(): Array<{
    category: TestSmellCategory;
    severity: TestIssueSeverity;
    description: string;
  }> {
    return this.patterns.map((p) => ({
      category: p.category,
      severity: p.severity,
      description: p.description,
    }));
  }

  /**
   * Check quality for a specific test file
   */
  async checkQuality(testFile: TestFile): Promise<{
    score: number;
    issues: TestSmell[];
    summary: string;
  }> {
    const fullPath = path.join(this.projectRoot, testFile.path);
    let content = "";

    try {
      content = await fs.readFile(fullPath, "utf-8");
    } catch {
      return {
        score: 0,
        issues: [],
        summary: "Could not read test file",
      };
    }

    const issues: TestSmell[] = [];
    for (const pattern of this.patterns) {
      issues.push(...pattern.detect(testFile, content));
    }

    // Calculate quality score (100 - deductions)
    let score = 100;
    for (const issue of issues) {
      switch (issue.severity) {
        case "error":
          score -= 15;
          break;
        case "warning":
          score -= 5;
          break;
        case "info":
          score -= 2;
          break;
      }
    }
    score = Math.max(0, score);

    // Generate summary
    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    const infoCount = issues.filter((i) => i.severity === "info").length;

    let summary: string;
    if (score >= 90) {
      summary = "Excellent test quality";
    } else if (score >= 70) {
      summary = "Good test quality with minor improvements needed";
    } else if (score >= 50) {
      summary = "Moderate test quality - consider addressing issues";
    } else {
      summary = "Poor test quality - significant improvements needed";
    }

    if (errorCount > 0) {
      summary += ` (${errorCount} errors, ${warningCount} warnings, ${infoCount} info)`;
    }

    return { score, issues, summary };
  }
}
