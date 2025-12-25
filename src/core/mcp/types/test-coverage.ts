/**
 * Test Coverage Types
 *
 * Type definitions for test coverage analysis
 */

/**
 * Supported test frameworks
 */
export type TestFramework = "jest" | "vitest" | "mocha" | "playwright";

/**
 * Test smell categories
 */
export type TestSmellCategory =
  | "no-assertions"
  | "only-happy-path"
  | "missing-mocks"
  | "slow-test"
  | "duplicate-test"
  | "flaky-test"
  | "unclear-name"
  | "large-test"
  | "hardcoded-values";

/**
 * Severity levels for test issues
 */
export type TestIssueSeverity = "info" | "warning" | "error";

/**
 * Individual test case extracted from test files
 */
export interface TestCase {
  name: string;
  file: string;
  line: number;
  describe?: string;
  assertions: number;
  hasMocks: boolean;
  isAsync: boolean;
  isSkipped: boolean;
  isFocused: boolean;
}

/**
 * Test file analysis result
 */
export interface TestFile {
  path: string;
  framework: TestFramework;
  testCases: TestCase[];
  totalTests: number;
  skippedTests: number;
  focusedTests: number;
  totalAssertions: number;
  sourceFile?: string;
}

/**
 * Mapping between source files and their tests
 */
export interface TestMapping {
  sourceFile: string;
  testFiles: string[];
  coveredFunctions: string[];
  uncoveredFunctions: string[];
  coveragePercent: number;
}

/**
 * Individual test smell/issue detected
 */
export interface TestSmell {
  file: string;
  line: number;
  testName: string;
  category: TestSmellCategory;
  severity: TestIssueSeverity;
  description: string;
  suggestion: string;
}

/**
 * Coverage metrics for a project
 */
export interface CoverageMetrics {
  totalSourceFiles: number;
  testedFiles: number;
  untestedFiles: number;
  totalTests: number;
  totalAssertions: number;
  avgAssertionsPerTest: number;
  fileCoveragePercent: number;
  testToCodeRatio: number;
  smellCount: number;
}

/**
 * Untested code finding
 */
export interface UntestedCode {
  file: string;
  type: "file" | "function" | "class" | "method";
  name: string;
  line: number;
  exportedSymbols: string[];
  complexity?: number;
  priority: "high" | "medium" | "low";
  suggestion: string;
}

/**
 * Test suggestion for a file
 */
export interface TestSuggestion {
  sourceFile: string;
  suggestedTestFile: string;
  testCases: Array<{
    name: string;
    description: string;
    type: "unit" | "integration" | "edge-case";
  }>;
  reason: string;
}

/**
 * Complete test analysis result
 */
export interface TestAnalysisResult {
  projectRoot: string;
  framework: TestFramework | "unknown";
  testFiles: TestFile[];
  mappings: TestMapping[];
  metrics: CoverageMetrics;
  smells: TestSmell[];
  untestedCode: UntestedCode[];
  analyzedAt: string;
}


/**
 * Options for test analysis
 */
export interface TestAnalysisOptions {
  includeSkipped?: boolean;
  maxDepth?: number;
  frameworks?: TestFramework[];
  analyzeSmells?: boolean;
  findUntested?: boolean;
}
