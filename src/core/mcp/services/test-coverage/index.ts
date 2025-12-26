/**
 * Test Coverage Service
 *
 * Analyzes test coverage, quality, and provides suggestions
 */

import type {
  TestAnalysisResult,
  TestFile,
  CoverageMetrics,
  TestSmell,
  UntestedCode,
  TestSuggestion,
  TestFramework,
  TestAnalysisOptions,
} from "../../types/test-coverage.js";
import { TestParser } from "./test-parser.js";
import { CoverageMapper } from "./coverage-mapper.js";
import { SmellDetector } from "./smell-detector.js";

/**
 * Service for analyzing test coverage and test quality.
 *
 * Parses test files, maps coverage data, detects test smells,
 * and suggests tests for uncovered code paths.
 */
export class TestCoverageService {
  private parser: TestParser;
  private mapper: CoverageMapper;
  private smellDetector: SmellDetector;
  private cachedAnalysis: TestAnalysisResult | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * @param projectRoot - Root directory of the project
   */
  constructor(private projectRoot: string) {
    this.parser = new TestParser(projectRoot);
    this.mapper = new CoverageMapper(projectRoot);
    this.smellDetector = new SmellDetector(projectRoot);
  }

  /**
   * Analyze all tests in the project
   */
  async analyzeTests(
    options: TestAnalysisOptions = {}
  ): Promise<TestAnalysisResult> {
    // Return cached result if valid
    if (
      this.cachedAnalysis &&
      Date.now() - new Date(this.cachedAnalysis.analyzedAt).getTime() <
        this.CACHE_DURATION
    ) {
      return this.cachedAnalysis;
    }

    // Parse all test files
    const testFiles = await this.parser.parseAllTestFiles();

    // Filter by framework if specified
    const filteredTests = options.frameworks
      ? testFiles.filter((t) => options.frameworks!.includes(t.framework))
      : testFiles;

    // Create source-to-test mappings
    const mappings = await this.mapper.createMappings(filteredTests);

    // Calculate metrics
    const metrics = this.mapper.calculateMetrics(filteredTests, mappings);

    // Detect smells if requested
    const smells = options.analyzeSmells !== false
      ? await this.smellDetector.detectSmells(filteredTests)
      : [];
    metrics.smellCount = smells.length;

    // Find untested code if requested
    const untestedCode = options.findUntested !== false
      ? await this.mapper.findUntestedCode(mappings)
      : [];

    // Detect framework
    const framework = this.detectPrimaryFramework(filteredTests);

    const result: TestAnalysisResult = {
      projectRoot: this.projectRoot,
      framework,
      testFiles: filteredTests,
      mappings,
      metrics,
      smells,
      untestedCode,
      analyzedAt: new Date().toISOString(),
    };

    this.cachedAnalysis = result;
    return result;
  }

  /**
   * Get tests for a specific source file
   */
  async getTestsForFile(sourceFile: string): Promise<TestFile[]> {
    const testFiles = await this.parser.parseAllTestFiles();
    const mappings = await this.mapper.createMappings(testFiles);

    const mapping = mappings.find((m) => m.sourceFile === sourceFile);
    if (!mapping) {
      return [];
    }

    return testFiles.filter((t) => mapping.testFiles.includes(t.path));
  }

  /**
   * Get coverage metrics
   */
  async getCoverageMetrics(): Promise<CoverageMetrics> {
    const analysis = await this.analyzeTests({ analyzeSmells: false });
    return analysis.metrics;
  }

  /**
   * Find untested code
   */
  async findUntested(): Promise<UntestedCode[]> {
    const analysis = await this.analyzeTests({ findUntested: true });
    return analysis.untestedCode;
  }

  /**
   * Detect test smells
   */
  async detectTestSmells(): Promise<TestSmell[]> {
    const analysis = await this.analyzeTests({ analyzeSmells: true });
    return analysis.smells;
  }

  /**
   * Suggest tests for a file
   */
  async suggestTests(sourceFile: string): Promise<TestSuggestion> {
    const functions = await this.mapper.extractFunctions(sourceFile);
    const existingTests = await this.getTestsForFile(sourceFile);
    const testedFunctions = existingTests.flatMap((t) =>
      t.testCases.map((tc) => tc.name)
    );

    // Identify untested functions
    const untestedFunctions = functions.filter(
      (f) =>
        !testedFunctions.some(
          (t) =>
            t.toLowerCase().includes(f.toLowerCase()) ||
            f.toLowerCase().includes(t.toLowerCase())
        )
    );

    // Generate test suggestions
    const testCases: TestSuggestion["testCases"] = [];

    for (const func of untestedFunctions) {
      // Basic happy path test
      testCases.push({
        name: `should ${this.camelToWords(func)} correctly`,
        description: `Test the basic functionality of ${func}`,
        type: "unit",
      });

      // Edge case test
      testCases.push({
        name: `should handle edge cases in ${func}`,
        description: `Test boundary conditions and edge cases`,
        type: "edge-case",
      });
    }

    // If already has tests, suggest improvements
    if (existingTests.length > 0 && testCases.length === 0) {
      const avgAssertions =
        existingTests.reduce((sum, t) => sum + t.totalAssertions, 0) /
        existingTests.reduce((sum, t) => sum + t.totalTests, 0);

      if (avgAssertions < 2) {
        testCases.push({
          name: "Add more assertions to existing tests",
          description:
            "Current tests have few assertions. Add more expect() calls.",
          type: "unit",
        });
      }
    }

    return {
      sourceFile,
      suggestedTestFile: this.suggestTestPath(sourceFile),
      testCases,
      reason:
        untestedFunctions.length > 0
          ? `Found ${untestedFunctions.length} untested function(s)`
          : "All functions appear to be tested",
    };
  }

  /**
   * Check test quality for a file
   */
  async checkQuality(
    testFile: string
  ): Promise<{
    score: number;
    issues: TestSmell[];
    summary: string;
  }> {
    const parsed = await this.parser.parseTestFile(testFile);
    return this.smellDetector.checkQuality(parsed);
  }

  /**
   * Detect primary test framework
   */
  private detectPrimaryFramework(
    testFiles: TestFile[]
  ): TestFramework | "unknown" {
    const counts: Record<TestFramework, number> = {
      jest: 0,
      vitest: 0,
      mocha: 0,
      playwright: 0,
    };

    for (const file of testFiles) {
      counts[file.framework]++;
    }

    const max = Math.max(...Object.values(counts));
    if (max === 0) return "unknown";

    const entries = Object.entries(counts) as Array<[TestFramework, number]>;
    return entries.find(([, count]) => count === max)?.[0] || "unknown";
  }

  /**
   * Convert camelCase to words
   */
  private camelToWords(str: string): string {
    return str
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .trim();
  }

  /**
   * Suggest test file path for a source file
   */
  private suggestTestPath(sourcePath: string): string {
    const ext = sourcePath.match(/\.(ts|tsx|js|jsx)$/)?.[0] || ".ts";
    const base = sourcePath.replace(/\.(ts|tsx|js|jsx)$/, "");
    return `${base}.test${ext}`;
  }

  /**
   * Clear cached analysis
   */
  clearCache(): void {
    this.cachedAnalysis = null;
  }
}
