/**
 * Environment Types
 *
 * Types for environment-specific constraints and runtime awareness
 */

/**
 * Represents an environment profile with its constraints
 */
export interface EnvironmentProfile {
  /** Environment name (e.g., production, staging, ci, local) */
  name: string;

  /** Description of this environment */
  description?: string;

  /** Runtime version constraints */
  runtime?: {
    /** Node.js version (e.g., "18.x", ">=16.0.0") */
    node?: string;

    /** Python version */
    python?: string;

    /** Other runtime versions */
    [key: string]: string | undefined;
  };

  /** Environment variables */
  envVars?: {
    /** Environment variables that are missing in this environment */
    missing?: string[];

    /** Environment variables that are present */
    present?: string[];

    /** Environment variables with specific values/patterns */
    constraints?: Array<{
      name: string;
      pattern?: string;
      description: string;
    }>;
  };

  /** File system constraints */
  fileSystem?: {
    /** Read-only paths */
    readOnlyPaths?: string[];

    /** Paths that don't exist */
    missingPaths?: string[];

    /** Temporary directory location */
    tempDir?: string;

    /** Maximum file size for writes */
    maxFileSize?: number;
  };

  /** Container/Docker specific */
  container?: {
    /** Whether this environment runs in Docker */
    isDocker: boolean;

    /** Working directory inside container */
    workDir?: string;

    /** Path prefix differences */
    pathPrefix?: string;

    /** User/permissions constraints */
    user?: string;
  };

  /** General constraints */
  constraints?: string[];

  /** Whether this is the default/local environment */
  isDefault?: boolean;

  /** How this profile was created */
  source: "manual" | "auto-detected" | "inferred";
}

/**
 * Configuration file format for environments
 */
export interface EnvironmentConfig {
  /** Current/active environment for validation */
  activeEnvironment?: string;

  /** All environment profiles */
  environments: EnvironmentProfile[];
}

/**
 * Result of environment compatibility check
 */
export interface EnvironmentCheckResult {
  /** Whether the code is compatible with all environments */
  isCompatible: boolean;

  /** List of compatibility warnings */
  warnings: EnvironmentWarning[];

  /** Environments checked */
  environments: string[];
}

/**
 * A single environment compatibility warning
 */
export interface EnvironmentWarning {
  /** Environment this warning applies to */
  environment: string;

  /** Type of warning */
  type:
    | "runtime-version"
    | "env-var"
    | "file-system"
    | "syntax"
    | "api"
    | "general";

  /** Severity level */
  severity: "error" | "warning" | "info";

  /** Warning message */
  message: string;

  /** Specific location if applicable */
  location?: {
    file: string;
    line?: number;
  };

  /** Suggested fix */
  suggestion?: string;
}

/**
 * Auto-detection result from project files
 */
export interface AutoDetectionResult {
  /** Detected environments */
  environments: EnvironmentProfile[];

  /** Files that were analyzed */
  sources: Array<{
    file: string;
    type: "dockerfile" | "ci" | "package-json" | "deployment-config";
    detectedConstraints: string[];
  }>;
}
