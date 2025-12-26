/**
 * Code Quality Types
 *
 * Type definitions for code quality analysis and smell detection
 */

/**
 * Code smell categories
 */
export type CodeSmellType =
  | "long-method"
  | "long-class"
  | "god-object"
  | "high-complexity"
  | "deep-nesting"
  | "long-parameter-list"
  | "duplicate-code"
  | "dead-code"
  | "magic-number"
  | "feature-envy"
  | "data-clump"
  | "primitive-obsession"
  | "switch-statement"
  | "parallel-inheritance"
  | "lazy-class"
  | "speculative-generality"
  | "temporary-field"
  | "message-chain"
  | "middle-man"
  | "inappropriate-intimacy";

/**
 * Severity levels for code smells
 */
export type SmellSeverity = "critical" | "major" | "minor" | "info";

/**
 * Refactoring technique types
 */
export type RefactoringType =
  | "extract-method"
  | "extract-class"
  | "inline-method"
  | "move-method"
  | "rename"
  | "replace-magic-number"
  | "introduce-parameter-object"
  | "replace-conditional-with-polymorphism"
  | "decompose-conditional"
  | "consolidate-duplicate"
  | "pull-up-method"
  | "push-down-method"
  | "extract-interface"
  | "remove-dead-code";

/**
 * Individual code smell finding
 */
export interface CodeSmell {
  /** Smell type */
  type: CodeSmellType;
  /** Severity level */
  severity: SmellSeverity;
  /** File path */
  file: string;
  /** Start line */
  startLine: number;
  /** End line */
  endLine: number;
  /** Entity name (function, class, etc.) */
  entityName: string;
  /** Entity type */
  entityType: "function" | "method" | "class" | "module" | "block";
  /** Description of the smell */
  description: string;
  /** Metric value that triggered the smell */
  metricValue?: number;
  /** Threshold that was exceeded */
  threshold?: number;
  /** Suggested fix */
  suggestion: string;
}

/**
 * Complexity metrics for a function/method
 */
export interface ComplexityMetrics {
  /** File path */
  file: string;
  /** Function/method name */
  name: string;
  /** Start line */
  startLine: number;
  /** End line */
  endLine: number;
  /** Lines of code */
  linesOfCode: number;
  /** Cyclomatic complexity (McCabe) */
  cyclomaticComplexity: number;
  /** Cognitive complexity */
  cognitiveComplexity: number;
  /** Maximum nesting depth */
  maxNestingDepth: number;
  /** Number of parameters */
  parameterCount: number;
  /** Number of return statements */
  returnCount: number;
  /** Complexity rating */
  rating: "A" | "B" | "C" | "D" | "F";
}

/**
 * Class metrics
 */
export interface ClassMetrics {
  /** File path */
  file: string;
  /** Class name */
  name: string;
  /** Start line */
  startLine: number;
  /** End line */
  endLine: number;
  /** Lines of code */
  linesOfCode: number;
  /** Number of methods */
  methodCount: number;
  /** Number of properties */
  propertyCount: number;
  /** Average method complexity */
  avgMethodComplexity: number;
  /** Maximum method complexity */
  maxMethodComplexity: number;
  /** Lack of Cohesion of Methods (LCOM) */
  lcom?: number;
  /** Coupling Between Objects (CBO) */
  cbo?: number;
  /** Is a God Object */
  isGodObject: boolean;
}

/**
 * Duplicate code block
 */
export interface DuplicateBlock {
  /** First occurrence */
  first: {
    file: string;
    startLine: number;
    endLine: number;
  };
  /** Second occurrence */
  second: {
    file: string;
    startLine: number;
    endLine: number;
  };
  /** Number of lines */
  lines: number;
  /** Number of tokens */
  tokens: number;
  /** Similarity percentage */
  similarity: number;
  /** Code snippet (truncated) */
  snippet: string;
}

/**
 * Refactoring suggestion
 */
export interface RefactoringSuggestion {
  /** Refactoring type */
  type: RefactoringType;
  /** Priority (1 = highest) */
  priority: number;
  /** File path */
  file: string;
  /** Start line */
  startLine: number;
  /** End line */
  endLine: number;
  /** Target entity name */
  entityName: string;
  /** Description of the refactoring */
  description: string;
  /** Reason for suggestion */
  reason: string;
  /** Expected improvement */
  expectedImprovement: string;
  /** Effort estimate */
  effort: "low" | "medium" | "high";
  /** Related smells */
  relatedSmells: CodeSmellType[];
}

/**
 * File quality metrics
 */
export interface FileQualityMetrics {
  /** File path */
  file: string;
  /** Total lines */
  totalLines: number;
  /** Code lines (excluding comments/blanks) */
  codeLines: number;
  /** Comment lines */
  commentLines: number;
  /** Blank lines */
  blankLines: number;
  /** Comment ratio */
  commentRatio: number;
  /** Number of functions/methods */
  functionCount: number;
  /** Number of classes */
  classCount: number;
  /** Average complexity */
  avgComplexity: number;
  /** Maximum complexity */
  maxComplexity: number;
  /** Number of smells */
  smellCount: number;
  /** Quality score (0-100) */
  qualityScore: number;
}

/**
 * Overall quality analysis result
 */
export interface QualityAnalysisResult {
  /** Analysis timestamp */
  analyzedAt: string;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Total lines of code */
  totalLinesOfCode: number;
  /** Overall quality score (0-100) */
  overallScore: number;
  /** Quality grade */
  grade: "A" | "B" | "C" | "D" | "F";
  /** All code smells */
  smells: CodeSmell[];
  /** Smells by type */
  smellsByType: Record<CodeSmellType, number>;
  /** Smells by severity */
  smellsBySeverity: Record<SmellSeverity, number>;
  /** File metrics */
  fileMetrics: FileQualityMetrics[];
  /** Top complex functions */
  topComplexFunctions: ComplexityMetrics[];
  /** Class metrics */
  classMetrics: ClassMetrics[];
  /** Summary */
  summary: string;
}

/**
 * Complexity analysis result
 */
export interface ComplexityAnalysisResult {
  /** Analysis timestamp */
  analyzedAt: string;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Total functions analyzed */
  totalFunctions: number;
  /** Average complexity */
  averageComplexity: number;
  /** Median complexity */
  medianComplexity: number;
  /** Max complexity */
  maxComplexity: number;
  /** Functions by rating */
  byRating: Record<ComplexityMetrics["rating"], number>;
  /** All function metrics */
  functions: ComplexityMetrics[];
  /** High complexity functions (>10) */
  highComplexityFunctions: ComplexityMetrics[];
  /** Summary */
  summary: string;
}

/**
 * Duplication analysis result
 */
export interface DuplicationAnalysisResult {
  /** Analysis timestamp */
  analyzedAt: string;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Total lines analyzed */
  totalLines: number;
  /** Duplicated lines */
  duplicatedLines: number;
  /** Duplication percentage */
  duplicationPercentage: number;
  /** Number of duplicate blocks */
  duplicateBlockCount: number;
  /** Duplicate blocks */
  duplicates: DuplicateBlock[];
  /** Files with most duplication */
  topDuplicatedFiles: Array<{
    file: string;
    duplicatedLines: number;
    percentage: number;
  }>;
  /** Summary */
  summary: string;
}

/**
 * Refactoring analysis result
 */
export interface RefactoringAnalysisResult {
  /** Analysis timestamp */
  analyzedAt: string;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Total suggestions */
  totalSuggestions: number;
  /** Suggestions by type */
  byType: Record<RefactoringType, number>;
  /** Suggestions by effort */
  byEffort: Record<RefactoringSuggestion["effort"], number>;
  /** All suggestions */
  suggestions: RefactoringSuggestion[];
  /** Top priority suggestions */
  topPriority: RefactoringSuggestion[];
  /** Estimated technical debt (hours) */
  estimatedDebtHours: number;
  /** Summary */
  summary: string;
}

/**
 * Quality analysis options
 */
export interface QualityAnalysisOptions {
  /** Files to analyze */
  files?: string[];
  /** Include detailed metrics */
  includeMetrics?: boolean;
  /** Minimum severity to report */
  minSeverity?: SmellSeverity;
  /** Maximum smells to report */
  maxSmells?: number;
  /** Complexity threshold */
  complexityThreshold?: number;
  /** Method length threshold */
  methodLengthThreshold?: number;
  /** Class length threshold */
  classLengthThreshold?: number;
}

/**
 * Thresholds for code quality
 */
export interface QualityThresholds {
  /** Max cyclomatic complexity */
  maxComplexity: number;
  /** Max cognitive complexity */
  maxCognitiveComplexity: number;
  /** Max method lines */
  maxMethodLines: number;
  /** Max class lines */
  maxClassLines: number;
  /** Max class methods (god object threshold) */
  maxClassMethods: number;
  /** Max nesting depth */
  maxNestingDepth: number;
  /** Max parameters */
  maxParameters: number;
  /** Min duplicate lines to report */
  minDuplicateLines: number;
}

/**
 * Default quality thresholds
 */
export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  maxComplexity: 10,
  maxCognitiveComplexity: 15,
  maxMethodLines: 50,
  maxClassLines: 300,
  maxClassMethods: 10,
  maxNestingDepth: 4,
  maxParameters: 5,
  minDuplicateLines: 6,
};
