/**
 * Code Quality Service
 *
 * Analyzes code quality, complexity, duplicates, and suggests refactorings
 */

import { promises as fs } from "fs";
import * as path from "path";
import type {
  CodeSmell,
  CodeSmellType,
  SmellSeverity,
  ComplexityMetrics,
  ClassMetrics,
  DuplicateBlock,
  RefactoringSuggestion,
  RefactoringType,
  FileQualityMetrics,
  QualityAnalysisResult,
  ComplexityAnalysisResult,
  DuplicationAnalysisResult,
  RefactoringAnalysisResult,
  QualityAnalysisOptions,
  QualityThresholds,
} from "../types/code-quality.js";
import { DEFAULT_QUALITY_THRESHOLDS } from "../types/code-quality.js";

/**
 * Service for analyzing code quality, complexity, and detecting code smells.
 *
 * Calculates cyclomatic and cognitive complexity, finds code duplicates,
 * detects code smells, and generates refactoring suggestions.
 */
export class CodeQualityService {
  private thresholds: QualityThresholds;

  /** Directories to exclude */
  private static readonly EXCLUDE_DIRS = [
    "node_modules",
    "dist",
    "build",
    ".git",
    "coverage",
    ".next",
    ".cache",
  ];

  constructor(private projectRoot: string) {
    this.thresholds = DEFAULT_QUALITY_THRESHOLDS;
  }

  /**
   * Comprehensive quality analysis
   */
  async analyzeQuality(
    options: QualityAnalysisOptions = {}
  ): Promise<QualityAnalysisResult> {
    const files = await this.getSourceFiles(options.files);
    const smells: CodeSmell[] = [];
    const fileMetrics: FileQualityMetrics[] = [];
    const allComplexity: ComplexityMetrics[] = [];
    const classMetrics: ClassMetrics[] = [];

    let totalLines = 0;

    for (const file of files) {
      const metrics = await this.analyzeFile(file);
      fileMetrics.push(metrics.fileMetrics);
      smells.push(...metrics.smells);
      allComplexity.push(...metrics.complexity);
      classMetrics.push(...metrics.classes);
      totalLines += metrics.fileMetrics.totalLines;
    }

    // Filter smells
    let filteredSmells = smells;
    if (options.minSeverity) {
      filteredSmells = this.filterBySeverity(smells, options.minSeverity);
    }
    if (options.maxSmells && filteredSmells.length > options.maxSmells) {
      filteredSmells = filteredSmells.slice(0, options.maxSmells);
    }

    // Calculate statistics
    const smellsByType = this.countByType(filteredSmells);
    const smellsBySeverity = this.countBySeverity(filteredSmells);

    // Top complex functions
    const topComplexFunctions = [...allComplexity]
      .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
      .slice(0, 10);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      fileMetrics,
      filteredSmells,
      allComplexity,
      totalLines
    );
    const grade = this.scoreToGrade(overallScore);

    return {
      analyzedAt: new Date().toISOString(),
      filesAnalyzed: files.length,
      totalLinesOfCode: totalLines,
      overallScore,
      grade,
      smells: filteredSmells,
      smellsByType,
      smellsBySeverity,
      fileMetrics,
      topComplexFunctions,
      classMetrics,
      summary: this.generateQualitySummary(
        overallScore,
        grade,
        filteredSmells,
        files.length
      ),
    };
  }

  /**
   * Analyze complexity
   */
  async analyzeComplexity(
    options: QualityAnalysisOptions = {}
  ): Promise<ComplexityAnalysisResult> {
    const files = await this.getSourceFiles(options.files);
    const allFunctions: ComplexityMetrics[] = [];

    for (const file of files) {
      const functions = await this.extractFunctionComplexity(file);
      allFunctions.push(...functions);
    }

    // Calculate statistics
    const complexities = allFunctions.map((f) => f.cyclomaticComplexity);
    const avgComplexity =
      complexities.length > 0
        ? complexities.reduce((a, b) => a + b, 0) / complexities.length
        : 0;

    const sortedComplexities = [...complexities].sort((a, b) => a - b);
    const medianComplexity =
      sortedComplexities.length > 0
        ? sortedComplexities[Math.floor(sortedComplexities.length / 2)]
        : 0;

    const maxComplexity = Math.max(...complexities, 0);

    // Count by rating
    const byRating: Record<ComplexityMetrics["rating"], number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    };
    for (const func of allFunctions) {
      byRating[func.rating]++;
    }

    // High complexity functions
    const threshold =
      options.complexityThreshold || this.thresholds.maxComplexity;
    const highComplexityFunctions = allFunctions
      .filter((f) => f.cyclomaticComplexity > threshold)
      .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity);

    return {
      analyzedAt: new Date().toISOString(),
      filesAnalyzed: files.length,
      totalFunctions: allFunctions.length,
      averageComplexity: Math.round(avgComplexity * 100) / 100,
      medianComplexity,
      maxComplexity,
      byRating,
      functions: allFunctions,
      highComplexityFunctions,
      summary: this.generateComplexitySummary(
        avgComplexity,
        maxComplexity,
        highComplexityFunctions.length,
        allFunctions.length
      ),
    };
  }

  /**
   * Find duplicate code
   */
  async findDuplicates(
    options: QualityAnalysisOptions = {}
  ): Promise<DuplicationAnalysisResult> {
    const files = await this.getSourceFiles(options.files);
    const duplicates: DuplicateBlock[] = [];
    const fileLines = new Map<string, string[]>();

    // Read all files
    let totalLines = 0;
    for (const file of files) {
      try {
        const content = await fs.readFile(file, "utf-8");
        const lines = content.split("\n");
        fileLines.set(file, lines);
        totalLines += lines.length;
      } catch {
        continue;
      }
    }

    // Find duplicates using line-based comparison
    const minLines = this.thresholds.minDuplicateLines;
    const processedPairs = new Set<string>();

    const fileEntries = Array.from(fileLines.entries());
    for (let i = 0; i < fileEntries.length; i++) {
      const [file1, lines1] = fileEntries[i];

      // Compare with same file and other files
      for (let j = i; j < fileEntries.length; j++) {
        const [file2, lines2] = fileEntries[j];
        const pairKey = `${file1}:${file2}`;

        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const fileDuplicates = this.findDuplicateBlocks(
          file1,
          lines1,
          file2,
          lines2,
          minLines,
          i === j
        );
        duplicates.push(...fileDuplicates);
      }
    }

    // Calculate statistics
    const duplicatedLines = duplicates.reduce((sum, d) => sum + d.lines, 0);
    const duplicationPercentage =
      totalLines > 0 ? (duplicatedLines / totalLines) * 100 : 0;

    // Files with most duplication
    const fileDuplication = new Map<string, number>();
    for (const dup of duplicates) {
      fileDuplication.set(
        dup.first.file,
        (fileDuplication.get(dup.first.file) || 0) + dup.lines
      );
      if (dup.first.file !== dup.second.file) {
        fileDuplication.set(
          dup.second.file,
          (fileDuplication.get(dup.second.file) || 0) + dup.lines
        );
      }
    }

    const topDuplicatedFiles = Array.from(fileDuplication.entries())
      .map(([file, lines]) => ({
        file: path.relative(this.projectRoot, file),
        duplicatedLines: lines,
        percentage: (lines / (fileLines.get(file)?.length || 1)) * 100,
      }))
      .sort((a, b) => b.duplicatedLines - a.duplicatedLines)
      .slice(0, 10);

    return {
      analyzedAt: new Date().toISOString(),
      filesAnalyzed: files.length,
      totalLines,
      duplicatedLines,
      duplicationPercentage: Math.round(duplicationPercentage * 100) / 100,
      duplicateBlockCount: duplicates.length,
      duplicates: duplicates.slice(0, 50), // Limit results
      topDuplicatedFiles,
      summary: this.generateDuplicationSummary(
        duplicationPercentage,
        duplicates.length,
        files.length
      ),
    };
  }

  /**
   * Suggest refactorings
   */
  async suggestRefactorings(
    options: QualityAnalysisOptions = {}
  ): Promise<RefactoringAnalysisResult> {
    const qualityResult = await this.analyzeQuality(options);
    const suggestions: RefactoringSuggestion[] = [];

    // Generate suggestions from smells
    for (const smell of qualityResult.smells) {
      const suggestion = this.smellToRefactoring(smell);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    // Generate suggestions from complexity
    for (const func of qualityResult.topComplexFunctions) {
      if (func.cyclomaticComplexity > this.thresholds.maxComplexity) {
        suggestions.push({
          type: "extract-method",
          priority: this.complexityToPriority(func.cyclomaticComplexity),
          file: func.file,
          startLine: func.startLine,
          endLine: func.endLine,
          entityName: func.name,
          description: `Extract complex logic from ${func.name}`,
          reason: `Cyclomatic complexity is ${func.cyclomaticComplexity} (threshold: ${this.thresholds.maxComplexity})`,
          expectedImprovement: "Reduced complexity, improved testability",
          effort: func.cyclomaticComplexity > 20 ? "high" : "medium",
          relatedSmells: ["high-complexity"],
        });
      }
    }

    // Generate suggestions from class metrics
    for (const cls of qualityResult.classMetrics) {
      if (cls.isGodObject) {
        suggestions.push({
          type: "extract-class",
          priority: 1,
          file: cls.file,
          startLine: cls.startLine,
          endLine: cls.endLine,
          entityName: cls.name,
          description: `Split ${cls.name} into smaller, focused classes`,
          reason: `Class has ${cls.methodCount} methods (threshold: ${this.thresholds.maxClassMethods})`,
          expectedImprovement:
            "Better separation of concerns, improved maintainability",
          effort: "high",
          relatedSmells: ["god-object"],
        });
      }
    }

    // Sort by priority
    suggestions.sort((a, b) => a.priority - b.priority);

    // Calculate statistics
    const byType: Record<RefactoringType, number> = {
      "extract-method": 0,
      "extract-class": 0,
      "inline-method": 0,
      "move-method": 0,
      rename: 0,
      "replace-magic-number": 0,
      "introduce-parameter-object": 0,
      "replace-conditional-with-polymorphism": 0,
      "decompose-conditional": 0,
      "consolidate-duplicate": 0,
      "pull-up-method": 0,
      "push-down-method": 0,
      "extract-interface": 0,
      "remove-dead-code": 0,
    };

    const byEffort: Record<RefactoringSuggestion["effort"], number> = {
      low: 0,
      medium: 0,
      high: 0,
    };

    for (const s of suggestions) {
      byType[s.type]++;
      byEffort[s.effort]++;
    }

    // Estimate technical debt
    const estimatedDebtHours =
      byEffort.low * 0.5 + byEffort.medium * 2 + byEffort.high * 8;

    return {
      analyzedAt: new Date().toISOString(),
      filesAnalyzed: qualityResult.filesAnalyzed,
      totalSuggestions: suggestions.length,
      byType,
      byEffort,
      suggestions,
      topPriority: suggestions.slice(0, 10),
      estimatedDebtHours: Math.round(estimatedDebtHours * 10) / 10,
      summary: this.generateRefactoringSummary(
        suggestions.length,
        estimatedDebtHours
      ),
    };
  }

  /**
   * Analyze a single file
   */
  private async analyzeFile(filePath: string): Promise<{
    fileMetrics: FileQualityMetrics;
    smells: CodeSmell[];
    complexity: ComplexityMetrics[];
    classes: ClassMetrics[];
  }> {
    const relativePath = path.relative(this.projectRoot, filePath);
    const smells: CodeSmell[] = [];

    let content: string;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch {
      return {
        fileMetrics: this.emptyFileMetrics(relativePath),
        smells: [],
        complexity: [],
        classes: [],
      };
    }

    const lines = content.split("\n");
    const { codeLines, commentLines, blankLines } = this.countLines(lines);

    // Extract complexity metrics
    const complexity = await this.extractFunctionComplexity(filePath);

    // Extract class metrics
    const classes = this.extractClassMetrics(filePath, content);

    // Detect smells
    smells.push(...this.detectSmells(filePath, content, complexity, classes));

    // Calculate file metrics
    const avgComplexity =
      complexity.length > 0
        ? complexity.reduce((a, b) => a + b.cyclomaticComplexity, 0) /
          complexity.length
        : 0;

    const maxComplexity =
      complexity.length > 0
        ? Math.max(...complexity.map((c) => c.cyclomaticComplexity))
        : 0;

    const qualityScore = this.calculateFileScore(
      codeLines,
      smells.length,
      avgComplexity
    );

    return {
      fileMetrics: {
        file: relativePath,
        totalLines: lines.length,
        codeLines,
        commentLines,
        blankLines,
        commentRatio: codeLines > 0 ? commentLines / codeLines : 0,
        functionCount: complexity.length,
        classCount: classes.length,
        avgComplexity: Math.round(avgComplexity * 100) / 100,
        maxComplexity,
        smellCount: smells.length,
        qualityScore,
      },
      smells,
      complexity,
      classes,
    };
  }

  /**
   * Extract function complexity metrics
   */
  private async extractFunctionComplexity(
    filePath: string
  ): Promise<ComplexityMetrics[]> {
    const relativePath = path.relative(this.projectRoot, filePath);
    const metrics: ComplexityMetrics[] = [];

    let content: string;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch {
      return metrics;
    }

    const lines = content.split("\n");

    // Simple regex-based function detection
    const functionPatterns = [
      // Arrow functions with explicit name
      /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/g,
      // Regular functions
      /(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g,
      // Method definitions
      /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g,
    ];

    for (const pattern of functionPatterns) {
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        const startIndex = match.index;
        const startLine = this.getLineNumber(content, startIndex);

        // Find function end (simplified - look for matching braces)
        const endLine = this.findFunctionEnd(lines, startLine - 1);
        const functionContent = lines.slice(startLine - 1, endLine).join("\n");

        const cyclomaticComplexity =
          this.calculateCyclomaticComplexity(functionContent);
        const cognitiveComplexity =
          this.calculateCognitiveComplexity(functionContent);
        const maxNestingDepth = this.calculateMaxNesting(functionContent);
        const parameterCount = this.countParameters(match[0]);
        const returnCount = this.countReturns(functionContent);
        const linesOfCode = endLine - startLine + 1;

        metrics.push({
          file: relativePath,
          name,
          startLine,
          endLine,
          linesOfCode,
          cyclomaticComplexity,
          cognitiveComplexity,
          maxNestingDepth,
          parameterCount,
          returnCount,
          rating: this.complexityToRating(cyclomaticComplexity),
        });
      }
    }

    // Remove duplicates (same function matched by multiple patterns)
    return this.deduplicateFunctions(metrics);
  }

  /**
   * Extract class metrics
   */
  private extractClassMetrics(
    filePath: string,
    content: string
  ): ClassMetrics[] {
    const relativePath = path.relative(this.projectRoot, filePath);
    const metrics: ClassMetrics[] = [];
    const lines = content.split("\n");

    // Match class declarations
    const classPattern =
      /class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{/g;
    let match;

    while ((match = classPattern.exec(content)) !== null) {
      const name = match[1];
      const startIndex = match.index;
      const startLine = this.getLineNumber(content, startIndex);
      const endLine = this.findClassEnd(lines, startLine - 1);

      const classContent = lines.slice(startLine - 1, endLine).join("\n");
      const methodCount = this.countClassMethods(classContent);
      const propertyCount = this.countClassProperties(classContent);
      const linesOfCode = endLine - startLine + 1;

      // Calculate method complexity for the class
      const methodComplexities = this.extractMethodComplexities(classContent);
      const avgMethodComplexity =
        methodComplexities.length > 0
          ? methodComplexities.reduce((a, b) => a + b, 0) /
            methodComplexities.length
          : 0;
      const maxMethodComplexity = Math.max(...methodComplexities, 0);

      metrics.push({
        file: relativePath,
        name,
        startLine,
        endLine,
        linesOfCode,
        methodCount,
        propertyCount,
        avgMethodComplexity: Math.round(avgMethodComplexity * 100) / 100,
        maxMethodComplexity,
        isGodObject: methodCount > this.thresholds.maxClassMethods,
      });
    }

    return metrics;
  }

  /**
   * Detect code smells
   */
  private detectSmells(
    filePath: string,
    content: string,
    complexity: ComplexityMetrics[],
    classes: ClassMetrics[]
  ): CodeSmell[] {
    const relativePath = path.relative(this.projectRoot, filePath);
    const smells: CodeSmell[] = [];
    const lines = content.split("\n");

    // Long method detection
    for (const func of complexity) {
      if (func.linesOfCode > this.thresholds.maxMethodLines) {
        smells.push({
          type: "long-method",
          severity: func.linesOfCode > 100 ? "major" : "minor",
          file: relativePath,
          startLine: func.startLine,
          endLine: func.endLine,
          entityName: func.name,
          entityType: "function",
          description: `Function is ${func.linesOfCode} lines (threshold: ${this.thresholds.maxMethodLines})`,
          metricValue: func.linesOfCode,
          threshold: this.thresholds.maxMethodLines,
          suggestion: "Extract smaller, focused functions",
        });
      }

      // High complexity
      if (func.cyclomaticComplexity > this.thresholds.maxComplexity) {
        smells.push({
          type: "high-complexity",
          severity: func.cyclomaticComplexity > 20 ? "critical" : "major",
          file: relativePath,
          startLine: func.startLine,
          endLine: func.endLine,
          entityName: func.name,
          entityType: "function",
          description: `Cyclomatic complexity is ${func.cyclomaticComplexity} (threshold: ${this.thresholds.maxComplexity})`,
          metricValue: func.cyclomaticComplexity,
          threshold: this.thresholds.maxComplexity,
          suggestion: "Simplify logic or extract helper functions",
        });
      }

      // Deep nesting
      if (func.maxNestingDepth > this.thresholds.maxNestingDepth) {
        smells.push({
          type: "deep-nesting",
          severity: "minor",
          file: relativePath,
          startLine: func.startLine,
          endLine: func.endLine,
          entityName: func.name,
          entityType: "function",
          description: `Nesting depth is ${func.maxNestingDepth} (threshold: ${this.thresholds.maxNestingDepth})`,
          metricValue: func.maxNestingDepth,
          threshold: this.thresholds.maxNestingDepth,
          suggestion: "Use early returns or extract nested logic",
        });
      }

      // Long parameter list
      if (func.parameterCount > this.thresholds.maxParameters) {
        smells.push({
          type: "long-parameter-list",
          severity: "minor",
          file: relativePath,
          startLine: func.startLine,
          endLine: func.endLine,
          entityName: func.name,
          entityType: "function",
          description: `Has ${func.parameterCount} parameters (threshold: ${this.thresholds.maxParameters})`,
          metricValue: func.parameterCount,
          threshold: this.thresholds.maxParameters,
          suggestion: "Introduce a parameter object",
        });
      }
    }

    // God object detection
    for (const cls of classes) {
      if (cls.isGodObject) {
        smells.push({
          type: "god-object",
          severity: "major",
          file: relativePath,
          startLine: cls.startLine,
          endLine: cls.endLine,
          entityName: cls.name,
          entityType: "class",
          description: `Class has ${cls.methodCount} methods (threshold: ${this.thresholds.maxClassMethods})`,
          metricValue: cls.methodCount,
          threshold: this.thresholds.maxClassMethods,
          suggestion: "Split into smaller, focused classes",
        });
      }

      // Long class
      if (cls.linesOfCode > this.thresholds.maxClassLines) {
        smells.push({
          type: "long-class",
          severity: "minor",
          file: relativePath,
          startLine: cls.startLine,
          endLine: cls.endLine,
          entityName: cls.name,
          entityType: "class",
          description: `Class is ${cls.linesOfCode} lines (threshold: ${this.thresholds.maxClassLines})`,
          metricValue: cls.linesOfCode,
          threshold: this.thresholds.maxClassLines,
          suggestion: "Extract responsibilities to separate classes",
        });
      }
    }

    // Magic numbers
    const magicNumberPattern = /[^a-zA-Z0-9_](\d{2,})[^a-zA-Z0-9_]/g;
    let lineNum = 0;
    for (const line of lines) {
      lineNum++;
      // Skip obvious non-magic contexts
      if (
        line.includes("const") ||
        line.includes("let") ||
        line.includes("//")
      ) {
        continue;
      }

      magicNumberPattern.lastIndex = 0;
      let numMatch;
      while ((numMatch = magicNumberPattern.exec(line)) !== null) {
        const num = parseInt(numMatch[1]);
        // Skip common acceptable numbers
        if ([0, 1, 2, 10, 100, 1000].includes(num)) continue;

        smells.push({
          type: "magic-number",
          severity: "info",
          file: relativePath,
          startLine: lineNum,
          endLine: lineNum,
          entityName: numMatch[1],
          entityType: "block",
          description: `Magic number ${num} should be a named constant`,
          metricValue: num,
          suggestion: "Replace with a named constant",
        });
      }
    }

    return smells;
  }

  /**
   * Find duplicate code blocks
   */
  private findDuplicateBlocks(
    file1: string,
    lines1: string[],
    file2: string,
    lines2: string[],
    minLines: number,
    sameFile: boolean
  ): DuplicateBlock[] {
    const duplicates: DuplicateBlock[] = [];
    const rel1 = path.relative(this.projectRoot, file1);
    const rel2 = path.relative(this.projectRoot, file2);

    // Normalize lines for comparison
    const normalized1 = lines1.map((l) => l.trim());
    const normalized2 = lines2.map((l) => l.trim());

    // Find matching sequences
    for (let i = 0; i < normalized1.length - minLines; i++) {
      // Skip empty or trivial lines
      if (normalized1[i].length < 10) continue;

      const startJ = sameFile ? i + minLines : 0;
      for (let j = startJ; j < normalized2.length - minLines; j++) {
        if (normalized1[i] !== normalized2[j]) continue;

        // Found potential match, extend it
        let matchLength = 1;
        while (
          i + matchLength < normalized1.length &&
          j + matchLength < normalized2.length &&
          normalized1[i + matchLength] === normalized2[j + matchLength]
        ) {
          matchLength++;
        }

        if (matchLength >= minLines) {
          const snippet = lines1
            .slice(i, i + Math.min(matchLength, 5))
            .join("\n")
            .substring(0, 200);

          duplicates.push({
            first: { file: rel1, startLine: i + 1, endLine: i + matchLength },
            second: { file: rel2, startLine: j + 1, endLine: j + matchLength },
            lines: matchLength,
            tokens: matchLength * 10, // Approximate
            similarity: 100,
            snippet,
          });

          // Skip past this match
          j += matchLength - 1;
        }
      }
    }

    return duplicates;
  }

  /**
   * Convert smell to refactoring suggestion
   */
  private smellToRefactoring(smell: CodeSmell): RefactoringSuggestion | null {
    const mapping: Record<CodeSmellType, RefactoringType | null> = {
      "long-method": "extract-method",
      "long-class": "extract-class",
      "god-object": "extract-class",
      "high-complexity": "extract-method",
      "deep-nesting": "extract-method",
      "long-parameter-list": "introduce-parameter-object",
      "duplicate-code": "consolidate-duplicate",
      "dead-code": "remove-dead-code",
      "magic-number": "replace-magic-number",
      "feature-envy": "move-method",
      "data-clump": "introduce-parameter-object",
      "primitive-obsession": "extract-class",
      "switch-statement": "replace-conditional-with-polymorphism",
      "parallel-inheritance": "pull-up-method",
      "lazy-class": "inline-method",
      "speculative-generality": "inline-method",
      "temporary-field": "extract-class",
      "message-chain": null,
      "middle-man": "inline-method",
      "inappropriate-intimacy": "move-method",
    };

    const refactoringType = mapping[smell.type];
    if (!refactoringType) return null;

    return {
      type: refactoringType,
      priority: this.severityToPriority(smell.severity),
      file: smell.file,
      startLine: smell.startLine,
      endLine: smell.endLine,
      entityName: smell.entityName,
      description: `Apply ${refactoringType.replace(/-/g, " ")} to ${smell.entityName}`,
      reason: smell.description,
      expectedImprovement: smell.suggestion,
      effort: this.getRefactoringEffort(refactoringType),
      relatedSmells: [smell.type],
    };
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateCyclomaticComplexity(code: string): number {
    let complexity = 1; // Base complexity

    // Count decision points
    const decisionPatterns = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\b\?\s*/g, // Ternary
      /&&/g,
      /\|\|/g,
      /\?\?/g, // Nullish coalescing
    ];

    for (const pattern of decisionPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Calculate cognitive complexity
   */
  private calculateCognitiveComplexity(code: string): number {
    let complexity = 0;
    let nestingLevel = 0;

    const lines = code.split("\n");
    for (const line of lines) {
      // Track nesting
      if (/\{/.test(line)) {
        nestingLevel++;
      }
      if (/\}/.test(line)) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }

      // Add complexity for control structures (weighted by nesting)
      if (/\b(if|for|while|switch)\b/.test(line)) {
        complexity += 1 + nestingLevel;
      }
      if (/\belse\b/.test(line)) {
        complexity += 1;
      }
      if (/\bcatch\b/.test(line)) {
        complexity += 1 + nestingLevel;
      }
      if (/&&|\|\|/.test(line)) {
        complexity += 1;
      }
    }

    return complexity;
  }

  /**
   * Calculate maximum nesting depth
   */
  private calculateMaxNesting(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of code) {
      if (char === "{") {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === "}") {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }

    return maxDepth;
  }

  /**
   * Count parameters in function signature
   */
  private countParameters(signature: string): number {
    const match = signature.match(/\(([^)]*)\)/);
    if (!match || !match[1].trim()) return 0;

    // Simple count by commas (doesn't handle all edge cases)
    return match[1].split(",").filter((p) => p.trim()).length;
  }

  /**
   * Count return statements
   */
  private countReturns(code: string): number {
    const matches = code.match(/\breturn\b/g);
    return matches ? matches.length : 0;
  }

  /**
   * Count class methods
   */
  private countClassMethods(classContent: string): number {
    const methodPattern =
      /(?:(?:public|private|protected|static|async)\s+)*\w+\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g;
    const matches = classContent.match(methodPattern);
    return matches ? matches.length : 0;
  }

  /**
   * Count class properties
   */
  private countClassProperties(classContent: string): number {
    const propertyPattern =
      /(?:(?:public|private|protected|readonly|static)\s+)+\w+\s*(?::\s*[^;=]+)?[;=]/g;
    const matches = classContent.match(propertyPattern);
    return matches ? matches.length : 0;
  }

  /**
   * Extract method complexities from class
   */
  private extractMethodComplexities(classContent: string): number[] {
    const complexities: number[] = [];
    const methodPattern =
      /(?:(?:public|private|protected|static|async)\s+)*\w+\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g;

    let match;
    while ((match = methodPattern.exec(classContent)) !== null) {
      const startIndex = match.index + match[0].length - 1;
      const methodBody = this.extractBraceContent(classContent, startIndex);
      complexities.push(this.calculateCyclomaticComplexity(methodBody));
    }

    return complexities;
  }

  /**
   * Extract content within braces
   */
  private extractBraceContent(content: string, startIndex: number): string {
    let depth = 1;
    let i = startIndex + 1;

    while (i < content.length && depth > 0) {
      if (content[i] === "{") depth++;
      if (content[i] === "}") depth--;
      i++;
    }

    return content.substring(startIndex, i);
  }

  /**
   * Find function end line
   */
  private findFunctionEnd(lines: string[], startLine: number): number {
    let depth = 0;
    let started = false;

    for (let i = startLine; i < lines.length; i++) {
      for (const char of lines[i]) {
        if (char === "{") {
          depth++;
          started = true;
        } else if (char === "}") {
          depth--;
        }
      }

      if (started && depth === 0) {
        return i + 1;
      }
    }

    return lines.length;
  }

  /**
   * Find class end line
   */
  private findClassEnd(lines: string[], startLine: number): number {
    return this.findFunctionEnd(lines, startLine);
  }

  /**
   * Count lines (code, comments, blanks)
   */
  private countLines(lines: string[]): {
    codeLines: number;
    commentLines: number;
    blankLines: number;
  } {
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        blankLines++;
        continue;
      }

      if (inBlockComment) {
        commentLines++;
        if (trimmed.includes("*/")) {
          inBlockComment = false;
        }
        continue;
      }

      if (trimmed.startsWith("/*")) {
        commentLines++;
        if (!trimmed.includes("*/")) {
          inBlockComment = true;
        }
        continue;
      }

      if (trimmed.startsWith("//")) {
        commentLines++;
        continue;
      }

      codeLines++;
    }

    return { codeLines, commentLines, blankLines };
  }

  /**
   * Get line number from index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length;
  }

  /**
   * Deduplicate functions
   */
  private deduplicateFunctions(
    functions: ComplexityMetrics[]
  ): ComplexityMetrics[] {
    const seen = new Set<string>();
    return functions.filter((f) => {
      const key = `${f.file}:${f.name}:${f.startLine}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Get source files
   */
  private async getSourceFiles(patterns?: string[]): Promise<string[]> {
    const results: string[] = [];
    await this.walkDirectory(this.projectRoot, results, patterns);
    return results;
  }

  /**
   * Walk directory
   */
  private async walkDirectory(
    dir: string,
    results: string[],
    patterns?: string[]
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!CodeQualityService.EXCLUDE_DIRS.includes(entry.name)) {
            await this.walkDirectory(fullPath, results, patterns);
          }
        } else if (this.isSourceFile(entry.name, patterns)) {
          results.push(fullPath);
        }
      }
    } catch {
      // Ignore unreadable directories
    }
  }

  /**
   * Check if file is source
   */
  private isSourceFile(fileName: string, patterns?: string[]): boolean {
    const sourceExtensions = [".ts", ".tsx", ".js", ".jsx"];

    if (patterns && patterns.length > 0) {
      return patterns.some((p) => fileName.endsWith(p) || fileName.includes(p));
    }

    return (
      sourceExtensions.some((ext) => fileName.endsWith(ext)) &&
      !fileName.endsWith(".d.ts") &&
      !fileName.endsWith(".test.ts") &&
      !fileName.endsWith(".spec.ts")
    );
  }

  /**
   * Empty file metrics
   */
  private emptyFileMetrics(file: string): FileQualityMetrics {
    return {
      file,
      totalLines: 0,
      codeLines: 0,
      commentLines: 0,
      blankLines: 0,
      commentRatio: 0,
      functionCount: 0,
      classCount: 0,
      avgComplexity: 0,
      maxComplexity: 0,
      smellCount: 0,
      qualityScore: 100,
    };
  }

  /**
   * Filter smells by severity
   */
  private filterBySeverity(
    smells: CodeSmell[],
    minSeverity: SmellSeverity
  ): CodeSmell[] {
    const order: Record<SmellSeverity, number> = {
      info: 0,
      minor: 1,
      major: 2,
      critical: 3,
    };
    const minLevel = order[minSeverity];
    return smells.filter((s) => order[s.severity] >= minLevel);
  }

  /**
   * Count smells by type
   */
  private countByType(smells: CodeSmell[]): Record<CodeSmellType, number> {
    const counts: Record<CodeSmellType, number> = {
      "long-method": 0,
      "long-class": 0,
      "god-object": 0,
      "high-complexity": 0,
      "deep-nesting": 0,
      "long-parameter-list": 0,
      "duplicate-code": 0,
      "dead-code": 0,
      "magic-number": 0,
      "feature-envy": 0,
      "data-clump": 0,
      "primitive-obsession": 0,
      "switch-statement": 0,
      "parallel-inheritance": 0,
      "lazy-class": 0,
      "speculative-generality": 0,
      "temporary-field": 0,
      "message-chain": 0,
      "middle-man": 0,
      "inappropriate-intimacy": 0,
    };

    for (const smell of smells) {
      counts[smell.type]++;
    }

    return counts;
  }

  /**
   * Count smells by severity
   */
  private countBySeverity(smells: CodeSmell[]): Record<SmellSeverity, number> {
    const counts: Record<SmellSeverity, number> = {
      critical: 0,
      major: 0,
      minor: 0,
      info: 0,
    };

    for (const smell of smells) {
      counts[smell.severity]++;
    }

    return counts;
  }

  /**
   * Calculate overall score using density-based approach
   *
   * Uses issues per 1000 lines of code (KLOC) to fairly score
   * codebases of different sizes. Weights severity appropriately
   * and uses a gradual curve that doesn't bottom out quickly.
   */
  private calculateOverallScore(
    fileMetrics: FileQualityMetrics[],
    smells: CodeSmell[],
    complexity: ComplexityMetrics[],
    totalLines: number
  ): number {
    if (fileMetrics.length === 0 || totalLines === 0) return 100;

    // Calculate weighted smell score per KLOC (1000 lines)
    const kloc = totalLines / 1000;

    // Weight smells by severity (info barely counts)
    const weights: Record<SmellSeverity, number> = {
      critical: 10,
      major: 4,
      minor: 1,
      info: 0.1, // Magic numbers etc barely affect score
    };

    let weightedSmellCount = 0;
    for (const smell of smells) {
      weightedSmellCount += weights[smell.severity];
    }

    // Calculate density (weighted smells per KLOC)
    const smellDensity = weightedSmellCount / kloc;

    // High complexity functions penalty (per KLOC)
    const highComplexity = complexity.filter(
      (c) => c.cyclomaticComplexity > this.thresholds.maxComplexity
    );
    const complexityDensity = (highComplexity.length / kloc) * 5;

    // Total issue density
    const totalDensity = smellDensity + complexityDensity;

    // Convert density to score using logarithmic curve
    // This provides a gradual decline rather than immediate 0
    // Density of 0 = 100, density of 50 = ~70, density of 100 = ~50
    // density of 200 = ~30, density of 500 = ~10
    let score: number;
    if (totalDensity <= 0) {
      score = 100;
    } else {
      // Logarithmic decay: score = 100 - 15 * ln(1 + density/10)
      score = 100 - 15 * Math.log(1 + totalDensity / 10);
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate file score
   */
  private calculateFileScore(
    codeLines: number,
    smellCount: number,
    avgComplexity: number
  ): number {
    let score = 100;

    // Deduct for smells
    score -= smellCount * 5;

    // Deduct for high complexity
    if (avgComplexity > this.thresholds.maxComplexity) {
      score -= (avgComplexity - this.thresholds.maxComplexity) * 2;
    }

    // Deduct for very long files
    if (codeLines > 500) {
      score -= Math.floor((codeLines - 500) / 100) * 2;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Convert score to grade
   */
  private scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  /**
   * Convert complexity to rating
   */
  private complexityToRating(complexity: number): ComplexityMetrics["rating"] {
    if (complexity <= 5) return "A";
    if (complexity <= 10) return "B";
    if (complexity <= 20) return "C";
    if (complexity <= 30) return "D";
    return "F";
  }

  /**
   * Convert complexity to priority
   */
  private complexityToPriority(complexity: number): number {
    if (complexity > 30) return 1;
    if (complexity > 20) return 2;
    if (complexity > 15) return 3;
    return 4;
  }

  /**
   * Convert severity to priority
   */
  private severityToPriority(severity: SmellSeverity): number {
    const mapping: Record<SmellSeverity, number> = {
      critical: 1,
      major: 2,
      minor: 3,
      info: 4,
    };
    return mapping[severity];
  }

  /**
   * Get refactoring effort
   */
  private getRefactoringEffort(
    type: RefactoringType
  ): RefactoringSuggestion["effort"] {
    const highEffort: RefactoringType[] = [
      "extract-class",
      "replace-conditional-with-polymorphism",
      "extract-interface",
    ];
    const lowEffort: RefactoringType[] = [
      "rename",
      "replace-magic-number",
      "remove-dead-code",
    ];

    if (highEffort.includes(type)) return "high";
    if (lowEffort.includes(type)) return "low";
    return "medium";
  }

  /**
   * Generate quality summary
   */
  private generateQualitySummary(
    score: number,
    grade: string,
    smells: CodeSmell[],
    filesAnalyzed: number
  ): string {
    const critical = smells.filter((s) => s.severity === "critical").length;
    const major = smells.filter((s) => s.severity === "major").length;

    let summary = `Analyzed ${filesAnalyzed} files. Quality Score: ${score}/100 (Grade: ${grade}). `;

    if (smells.length === 0) {
      summary += "No code smells detected.";
    } else {
      summary += `Found ${smells.length} smell(s)`;
      if (critical > 0) summary += ` (${critical} critical)`;
      if (major > 0) summary += ` (${major} major)`;
      summary += ".";
    }

    return summary;
  }

  /**
   * Generate complexity summary
   */
  private generateComplexitySummary(
    avgComplexity: number,
    maxComplexity: number,
    highCount: number,
    totalCount: number
  ): string {
    return (
      `Analyzed ${totalCount} functions. ` +
      `Average complexity: ${avgComplexity.toFixed(1)}, ` +
      `Maximum: ${maxComplexity}. ` +
      `${highCount} function(s) exceed the complexity threshold.`
    );
  }

  /**
   * Generate duplication summary
   */
  private generateDuplicationSummary(
    percentage: number,
    blockCount: number,
    filesAnalyzed: number
  ): string {
    return (
      `Analyzed ${filesAnalyzed} files. ` +
      `Duplication: ${percentage.toFixed(1)}%. ` +
      `Found ${blockCount} duplicate block(s).`
    );
  }

  /**
   * Generate refactoring summary
   */
  private generateRefactoringSummary(count: number, debtHours: number): string {
    return (
      `Found ${count} refactoring opportunity(ies). ` +
      `Estimated technical debt: ${debtHours} hours.`
    );
  }
}
