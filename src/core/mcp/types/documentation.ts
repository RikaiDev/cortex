/**
 * Documentation Types
 *
 * Type definitions for documentation analysis and coverage tracking
 */

/**
 * Documentation status for an entity
 */
export type DocStatus = "documented" | "partial" | "missing" | "outdated";

/**
 * Entity types that can be documented
 */
export type DocumentableEntity =
  | "class"
  | "interface"
  | "type"
  | "enum"
  | "function"
  | "method"
  | "property"
  | "constant"
  | "variable";

/**
 * Documentation quality level
 */
export type DocQuality = "excellent" | "good" | "fair" | "poor" | "none";

/**
 * JSDoc/TSDoc tag types
 */
export type DocTagType =
  | "param"
  | "returns"
  | "throws"
  | "example"
  | "deprecated"
  | "see"
  | "since"
  | "author"
  | "description"
  | "type"
  | "default"
  | "readonly"
  | "private"
  | "public"
  | "protected"
  | "internal";

/**
 * Parsed documentation tag
 */
export interface DocTag {
  /** Tag type */
  type: DocTagType;
  /** Tag name (for @param) */
  name?: string;
  /** Tag value/description */
  value: string;
  /** Line number */
  line: number;
}

/**
 * Parsed documentation block
 */
export interface DocBlock {
  /** Description text */
  description: string;
  /** Parsed tags */
  tags: DocTag[];
  /** Start line of doc block */
  startLine: number;
  /** End line of doc block */
  endLine: number;
  /** Raw documentation text */
  raw: string;
}

/**
 * Documentable entity information
 */
export interface DocumentableItem {
  /** Entity name */
  name: string;
  /** Entity type */
  type: DocumentableEntity;
  /** File path */
  file: string;
  /** Start line */
  startLine: number;
  /** End line */
  endLine: number;
  /** Is exported/public */
  isPublic: boolean;
  /** Documentation status */
  status: DocStatus;
  /** Documentation block (if exists) */
  documentation?: DocBlock;
  /** Parameters (for functions/methods) */
  parameters?: Array<{
    name: string;
    type?: string;
    isDocumented: boolean;
  }>;
  /** Return type (for functions/methods) */
  returnType?: string;
  /** Is return documented */
  isReturnDocumented?: boolean;
}

/**
 * Documentation coverage metrics
 */
export interface DocCoverageMetrics {
  /** Total documentable items */
  total: number;
  /** Documented items */
  documented: number;
  /** Partially documented items */
  partial: number;
  /** Missing documentation */
  missing: number;
  /** Coverage percentage */
  coverage: number;
  /** By entity type */
  byType: Record<DocumentableEntity, { total: number; documented: number }>;
}

/**
 * File documentation analysis
 */
export interface FileDocAnalysis {
  /** File path */
  file: string;
  /** All documentable items */
  items: DocumentableItem[];
  /** Coverage metrics */
  coverage: DocCoverageMetrics;
  /** Quality score (0-100) */
  qualityScore: number;
  /** Quality rating */
  quality: DocQuality;
}

/**
 * Code example in documentation
 */
export interface DocExample {
  /** File path */
  file: string;
  /** Line number */
  line: number;
  /** Entity name */
  entityName: string;
  /** Example code */
  code: string;
  /** Is valid syntax */
  isValid: boolean;
  /** Validation error (if invalid) */
  error?: string;
  /** Language (if specified) */
  language?: string;
}

/**
 * Documentation issue/problem
 */
export interface DocIssue {
  /** Issue type */
  type:
    | "missing-doc"
    | "missing-param"
    | "missing-return"
    | "missing-throws"
    | "invalid-example"
    | "outdated"
    | "empty-description"
    | "missing-example";
  /** Severity */
  severity: "error" | "warning" | "info";
  /** File path */
  file: string;
  /** Line number */
  line: number;
  /** Entity name */
  entityName: string;
  /** Issue description */
  description: string;
  /** Suggested fix */
  suggestion: string;
}

/**
 * Generated documentation template
 */
export interface DocTemplate {
  /** Entity name */
  entityName: string;
  /** Entity type */
  entityType: DocumentableEntity;
  /** File path */
  file: string;
  /** Line to insert before */
  insertLine: number;
  /** Generated documentation */
  template: string;
  /** Confidence score */
  confidence: number;
}

/**
 * Documentation analysis result
 */
export interface DocAnalysisResult {
  /** Analysis timestamp */
  analyzedAt: string;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Total items found */
  totalItems: number;
  /** Overall coverage */
  coverage: DocCoverageMetrics;
  /** Quality score (0-100) */
  qualityScore: number;
  /** Quality rating */
  quality: DocQuality;
  /** File-level analysis */
  files: FileDocAnalysis[];
  /** All issues found */
  issues: DocIssue[];
  /** Summary */
  summary: string;
}

/**
 * Missing documentation result
 */
export interface MissingDocResult {
  /** Analysis timestamp */
  analyzedAt: string;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Total missing */
  totalMissing: number;
  /** Missing items by type */
  byType: Record<DocumentableEntity, number>;
  /** Missing items by file */
  byFile: Array<{
    file: string;
    count: number;
    items: DocumentableItem[];
  }>;
  /** Priority items (public APIs) */
  priorityItems: DocumentableItem[];
  /** Summary */
  summary: string;
}

/**
 * Documentation validation result
 */
export interface DocValidationResult {
  /** Analysis timestamp */
  analyzedAt: string;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Total examples found */
  totalExamples: number;
  /** Valid examples */
  validExamples: number;
  /** Invalid examples */
  invalidExamples: number;
  /** Examples */
  examples: DocExample[];
  /** Issues found */
  issues: DocIssue[];
  /** Summary */
  summary: string;
}

/**
 * Documentation generation result
 */
export interface DocGenerationResult {
  /** Generation timestamp */
  generatedAt: string;
  /** Files processed */
  filesProcessed: number;
  /** Templates generated */
  templatesGenerated: number;
  /** Templates */
  templates: DocTemplate[];
  /** Summary */
  summary: string;
}

/**
 * Documentation analysis options
 */
export interface DocAnalysisOptions {
  /** Files to analyze */
  files?: string[];
  /** Include private members */
  includePrivate?: boolean;
  /** Minimum coverage to pass */
  minCoverage?: number;
  /** Check examples */
  validateExamples?: boolean;
  /** Entity types to analyze */
  entityTypes?: DocumentableEntity[];
}

/**
 * Documentation thresholds
 */
export interface DocThresholds {
  /** Minimum coverage for "good" rating */
  goodCoverage: number;
  /** Minimum coverage for "fair" rating */
  fairCoverage: number;
  /** Require @param for all parameters */
  requireParams: boolean;
  /** Require @returns for functions */
  requireReturns: boolean;
  /** Require @throws for errors */
  requireThrows: boolean;
  /** Require @example for public APIs */
  requireExamples: boolean;
}

/**
 * Default documentation thresholds
 */
export const DEFAULT_DOC_THRESHOLDS: DocThresholds = {
  goodCoverage: 80,
  fairCoverage: 50,
  requireParams: true,
  requireReturns: true,
  requireThrows: false,
  requireExamples: false,
};
