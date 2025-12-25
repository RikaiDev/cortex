/**
 * Dependency Types
 *
 * Types for dependency version management and compatibility checking
 */

/**
 * Represents a single dependency
 */
export interface Dependency {
  /** Package name */
  name: string;

  /** Version constraint (e.g., "^1.2.3", ">=2.0.0") */
  version: string;

  /** Installed version (if available) */
  installedVersion?: string;

  /** Whether this is a dev dependency */
  isDev?: boolean;

  /** Package manager type */
  manager: "npm" | "pip" | "go" | "cargo" | "maven";

  /** Source file */
  source: string;
}

/**
 * Deprecated API warning
 */
export interface DeprecationWarning {
  /** Package name */
  package: string;

  /** Deprecated API/method name */
  api: string;

  /** Version when deprecated */
  deprecatedIn: string;

  /** Version when removed (if known) */
  removedIn?: string;

  /** Replacement API */
  replacement?: string;

  /** Warning message */
  message: string;

  /** File where usage was detected */
  file?: string;

  /** Line number */
  line?: number;
}

/**
 * Dependency conflict
 */
export interface DependencyConflict {
  /** Package that has the conflict */
  package: string;

  /** Conflicting dependencies */
  conflicts: Array<{
    /** Dependency name */
    name: string;

    /** Required version by this package */
    requiredVersion: string;

    /** Current/installed version */
    currentVersion: string;

    /** Conflicting package that requires different version */
    conflictsWith?: string;
  }>;

  /** Severity */
  severity: "error" | "warning";

  /** Suggested resolution */
  suggestion?: string;
}

/**
 * Version compatibility check result
 */
export interface VersionCompatibilityResult {
  /** Whether all dependencies are compatible */
  isCompatible: boolean;

  /** List of deprecation warnings */
  deprecations: DeprecationWarning[];

  /** List of conflicts */
  conflicts: DependencyConflict[];

  /** Outdated packages */
  outdated: Array<{
    name: string;
    current: string;
    latest: string;
    breaking: boolean;
  }>;
}

/**
 * Dependency analysis result
 */
export interface DependencyAnalysis {
  /** All dependencies */
  dependencies: Dependency[];

  /** Total dependency count */
  totalCount: number;

  /** Dependency breakdown by manager */
  byManager: Record<string, number>;

  /** Direct vs transitive */
  direct: number;
  transitive?: number;
}

/**
 * Known deprecated APIs database
 */
export interface DeprecatedAPIsDatabase {
  [packageName: string]: Array<{
    api: string;
    deprecatedIn: string;
    removedIn?: string;
    replacement?: string;
    pattern: string; // Regex pattern to match usage
  }>;
}
