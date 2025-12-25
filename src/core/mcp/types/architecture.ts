/**
 * Architecture Types
 *
 * Type definitions for architecture validation and governance
 */

/**
 * Layer definition with import constraints
 */
export interface LayerRule {
  /** Layers this layer can import from */
  canImportFrom: string[];
  /** Layers this layer cannot import from (takes precedence) */
  cannotImport: string[];
  /** Directory patterns that belong to this layer */
  patterns: string[];
}

/**
 * Naming convention rule
 */
export interface NamingConvention {
  /** Pattern to match (glob-style) */
  pattern: string;
  /** Description of what this convention applies to */
  description: string;
  /** Example of correct naming */
  example: string;
}

/**
 * File organization rule
 */
export interface FileOrganizationRule {
  /** Pattern to match files */
  filePattern: string;
  /** Required parent directory pattern */
  requiredPath: string;
  /** Reason for this rule */
  reason: string;
}

/**
 * Complete architecture configuration
 */
export interface ArchitectureConfig {
  /** Layer definitions and their import rules */
  layers: Record<string, LayerRule>;
  /** Naming convention rules */
  naming: Record<string, NamingConvention>;
  /** File organization rules */
  fileOrganization: FileOrganizationRule[];
  /** Directories to exclude from validation */
  excludePaths: string[];
  /** Custom rules (extensible) */
  customRules?: CustomArchitectureRule[];
}

/**
 * Custom architecture rule for extensibility
 */
export interface CustomArchitectureRule {
  /** Unique rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Severity level */
  severity: ViolationSeverity;
  /** Pattern to match files */
  filePattern: string;
  /** Regex pattern to detect violation in file content */
  contentPattern?: string;
  /** Import pattern to disallow */
  disallowImport?: string;
}

/**
 * Violation severity levels
 */
export type ViolationSeverity = "error" | "warning" | "info";

/**
 * Architecture violation
 */
export interface ArchitectureViolation {
  /** Type of violation */
  type: ViolationType;
  /** Severity of the violation */
  severity: ViolationSeverity;
  /** File where violation occurred */
  file: string;
  /** Line number (if applicable) */
  line?: number;
  /** Description of the violation */
  message: string;
  /** Rule that was violated */
  rule: string;
  /** Suggestion for fixing */
  suggestion: string;
}

/**
 * Types of architecture violations
 */
export type ViolationType =
  | "layer-violation"
  | "naming-convention"
  | "file-organization"
  | "circular-dependency"
  | "forbidden-import"
  | "custom-rule";

/**
 * Layer assignment for a file
 */
export interface FileLayerInfo {
  /** File path */
  file: string;
  /** Detected layer */
  layer: string | null;
  /** Imports found in the file */
  imports: ImportInfo[];
  /** Whether file matches layer patterns */
  matchedPattern: string | null;
}

/**
 * Import information extracted from a file
 */
export interface ImportInfo {
  /** Import statement as written */
  raw: string;
  /** Resolved module path */
  module: string;
  /** Line number */
  line: number;
  /** Whether it's a relative import */
  isRelative: boolean;
  /** Target layer (if detected) */
  targetLayer: string | null;
}

/**
 * Validation result for architecture check
 */
export interface ArchitectureValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Total files checked */
  totalFiles: number;
  /** Files with violations */
  filesWithViolations: number;
  /** All violations found */
  violations: ArchitectureViolation[];
  /** Violations by severity */
  bySeverity: Record<ViolationSeverity, number>;
  /** Violations by type */
  byType: Record<ViolationType, number>;
  /** Layer coverage statistics */
  layerStats: LayerStats[];
  /** Timestamp of validation */
  validatedAt: string;
}

/**
 * Statistics for a single layer
 */
export interface LayerStats {
  /** Layer name */
  layer: string;
  /** Number of files in this layer */
  fileCount: number;
  /** Number of violations in this layer */
  violationCount: number;
  /** Files that import from forbidden layers */
  forbiddenImports: number;
}

/**
 * File check result (single file validation)
 */
export interface FileCheckResult {
  /** File path */
  file: string;
  /** Detected layer for this file */
  layer: string | null;
  /** Whether file passes all checks */
  isValid: boolean;
  /** Violations found in this file */
  violations: ArchitectureViolation[];
  /** Imports analysis */
  imports: ImportInfo[];
  /** Naming convention status */
  namingStatus: NamingCheckResult;
  /** File organization status */
  organizationStatus: OrganizationCheckResult;
}

/**
 * Naming convention check result
 */
export interface NamingCheckResult {
  /** Whether naming matches conventions */
  isValid: boolean;
  /** Expected pattern (if invalid) */
  expectedPattern?: string;
  /** Matched convention name (if valid) */
  matchedConvention?: string;
}

/**
 * File organization check result
 */
export interface OrganizationCheckResult {
  /** Whether file is in correct location */
  isValid: boolean;
  /** Expected path (if invalid) */
  expectedPath?: string;
  /** Matched rule (if valid) */
  matchedRule?: string;
}

/**
 * Placement suggestion for a file
 */
export interface PlacementSuggestion {
  /** Original file path */
  originalFile: string;
  /** Detected file type/purpose */
  detectedType: string;
  /** Suggested layer */
  suggestedLayer: string;
  /** Suggested directory */
  suggestedPath: string;
  /** Suggested file name (if rename needed) */
  suggestedName: string;
  /** Reasoning for suggestion */
  reason: string;
  /** Confidence level */
  confidence: "high" | "medium" | "low";
  /** Alternative suggestions */
  alternatives: Array<{
    path: string;
    reason: string;
  }>;
}

/**
 * Default architecture configuration
 */
export const DEFAULT_ARCHITECTURE_CONFIG: ArchitectureConfig = {
  layers: {
    ui: {
      canImportFrom: ["core", "utils", "types"],
      cannotImport: ["database", "infrastructure"],
      patterns: ["src/ui/**", "src/components/**", "src/views/**"],
    },
    core: {
      canImportFrom: ["utils", "types", "domain"],
      cannotImport: ["ui", "infrastructure"],
      patterns: ["src/core/**", "src/domain/**", "src/services/**"],
    },
    infrastructure: {
      canImportFrom: ["core", "utils", "types"],
      cannotImport: ["ui"],
      patterns: ["src/infrastructure/**", "src/database/**", "src/external/**"],
    },
    utils: {
      canImportFrom: ["types"],
      cannotImport: ["ui", "core", "infrastructure"],
      patterns: ["src/utils/**", "src/helpers/**", "src/lib/**"],
    },
    types: {
      canImportFrom: [],
      cannotImport: ["ui", "core", "infrastructure", "utils"],
      patterns: ["src/types/**", "**/*.d.ts"],
    },
  },
  naming: {
    services: {
      pattern: "*-service.ts",
      description: "Service files should end with -service.ts",
      example: "user-service.ts",
    },
    handlers: {
      pattern: "*-handler.ts",
      description: "Handler files should end with -handler.ts",
      example: "auth-handler.ts",
    },
    types: {
      pattern: "*.ts",
      description: "Type files should be in types directory",
      example: "src/types/user.ts",
    },
    tests: {
      pattern: "*.test.ts|*.spec.ts",
      description: "Test files should end with .test.ts or .spec.ts",
      example: "user-service.test.ts",
    },
  },
  fileOrganization: [
    {
      filePattern: "*-service.ts",
      requiredPath: "**/services/**",
      reason: "Services should be in a services directory",
    },
    {
      filePattern: "*-handler.ts",
      requiredPath: "**/handlers/**",
      reason: "Handlers should be in a handlers directory",
    },
    {
      filePattern: "*.test.ts",
      requiredPath: "**/__tests__/**|**/tests/**|**/*.test.ts",
      reason: "Test files should be in test directories or co-located",
    },
  ],
  excludePaths: [
    "node_modules/**",
    "dist/**",
    "build/**",
    ".git/**",
    "coverage/**",
  ],
};

/**
 * Options for architecture validation
 */
export interface ArchitectureValidationOptions {
  /** Only check specific layers */
  layers?: string[];
  /** Only check specific file patterns */
  filePatterns?: string[];
  /** Minimum severity to report */
  minSeverity?: ViolationSeverity;
  /** Include suggestions in output */
  includeSuggestions?: boolean;
  /** Maximum violations to report */
  maxViolations?: number;
}
