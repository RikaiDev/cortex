/**
 * Security Types
 *
 * Type definitions for security scanning and vulnerability detection
 */

/**
 * Security issue severity levels
 */
export type SecuritySeverity = "critical" | "high" | "medium" | "low" | "info";

/**
 * OWASP Top 10 categories
 */
export type OWASPCategory =
  | "A01:2021-Broken-Access-Control"
  | "A02:2021-Cryptographic-Failures"
  | "A03:2021-Injection"
  | "A04:2021-Insecure-Design"
  | "A05:2021-Security-Misconfiguration"
  | "A06:2021-Vulnerable-Components"
  | "A07:2021-Auth-Failures"
  | "A08:2021-Software-Integrity-Failures"
  | "A09:2021-Logging-Failures"
  | "A10:2021-SSRF";

/**
 * Security issue categories
 */
export type SecurityCategory =
  | "injection"
  | "xss"
  | "csrf"
  | "auth"
  | "crypto"
  | "secrets"
  | "dependencies"
  | "configuration"
  | "data-exposure"
  | "access-control"
  | "input-validation"
  | "error-handling"
  | "logging"
  | "other";

/**
 * Secret type categories
 */
export type SecretType =
  | "api-key"
  | "password"
  | "token"
  | "private-key"
  | "certificate"
  | "aws-credentials"
  | "database-url"
  | "oauth-secret"
  | "jwt-secret"
  | "encryption-key"
  | "webhook-secret"
  | "generic-secret";

/**
 * Individual security issue
 */
export interface SecurityIssue {
  /** Issue ID */
  id: string;
  /** Severity level */
  severity: SecuritySeverity;
  /** Category of issue */
  category: SecurityCategory;
  /** OWASP category if applicable */
  owasp?: OWASPCategory;
  /** File where issue was found */
  file: string;
  /** Line number */
  line?: number;
  /** Column number */
  column?: number;
  /** Issue title */
  title: string;
  /** Detailed description */
  description: string;
  /** Code snippet showing the issue */
  codeSnippet?: string;
  /** Remediation suggestion */
  remediation: string;
  /** CWE ID if applicable */
  cweId?: string;
  /** Reference URL */
  reference?: string;
}

/**
 * Vulnerable dependency information
 */
export interface VulnerableDependency {
  /** Package name */
  name: string;
  /** Installed version */
  version: string;
  /** Vulnerability severity */
  severity: SecuritySeverity;
  /** CVE IDs */
  cves: string[];
  /** Vulnerability title */
  title: string;
  /** Description of vulnerability */
  description: string;
  /** Fixed in version (if available) */
  fixedIn?: string;
  /** Path in dependency tree */
  dependencyPath: string[];
  /** Is this a direct dependency? */
  isDirect: boolean;
  /** Advisory URL */
  advisoryUrl?: string;
}

/**
 * Detected secret/credential
 */
export interface SecretFinding {
  /** Type of secret */
  type: SecretType;
  /** Severity (usually high or critical) */
  severity: SecuritySeverity;
  /** File where secret was found */
  file: string;
  /** Line number */
  line: number;
  /** Partial match (redacted) */
  match: string;
  /** Detection method */
  detectedBy: "pattern" | "entropy" | "both";
  /** Entropy score if applicable */
  entropy?: number;
  /** Confidence level */
  confidence: "high" | "medium" | "low";
  /** Suggestion */
  suggestion: string;
}

/**
 * Security scan result
 */
export interface SecurityScanResult {
  /** Scan timestamp */
  scannedAt: string;
  /** Files scanned */
  filesScanned: number;
  /** Total issues found */
  totalIssues: number;
  /** Issues by severity */
  bySeverity: Record<SecuritySeverity, number>;
  /** Issues by category */
  byCategory: Record<SecurityCategory, number>;
  /** All security issues */
  issues: SecurityIssue[];
  /** OWASP coverage */
  owaspCoverage: string[];
  /** Summary */
  summary: string;
}

/**
 * Dependency check result
 */
export interface DependencyCheckResult {
  /** Check timestamp */
  checkedAt: string;
  /** Total dependencies */
  totalDependencies: number;
  /** Vulnerable dependencies count */
  vulnerableCount: number;
  /** Vulnerabilities by severity */
  bySeverity: Record<SecuritySeverity, number>;
  /** All vulnerable dependencies */
  vulnerabilities: VulnerableDependency[];
  /** Outdated dependencies (not vulnerable but old) */
  outdatedCount: number;
  /** Overall risk level */
  riskLevel: "critical" | "high" | "medium" | "low" | "none";
  /** Recommended actions */
  recommendations: string[];
}

/**
 * Secret detection result
 */
export interface SecretDetectionResult {
  /** Detection timestamp */
  detectedAt: string;
  /** Files scanned */
  filesScanned: number;
  /** Total secrets found */
  totalSecrets: number;
  /** Secrets by type */
  byType: Record<SecretType, number>;
  /** All secret findings */
  secrets: SecretFinding[];
  /** High entropy strings (potential secrets) */
  highEntropyCount: number;
  /** Git history scan results */
  gitHistoryScanned: boolean;
  /** Suggestions */
  suggestions: string[];
}

/**
 * Security pattern for detection
 */
export interface SecurityPattern {
  /** Pattern ID */
  id: string;
  /** Pattern name */
  name: string;
  /** Category */
  category: SecurityCategory;
  /** Severity if matched */
  severity: SecuritySeverity;
  /** Regex pattern */
  pattern: RegExp;
  /** File types to check (empty = all) */
  fileTypes: string[];
  /** Description */
  description: string;
  /** Remediation */
  remediation: string;
  /** OWASP category */
  owasp?: OWASPCategory;
  /** CWE ID */
  cweId?: string;
}

/**
 * Secret pattern for detection
 */
export interface SecretPattern {
  /** Pattern ID */
  id: string;
  /** Secret type */
  type: SecretType;
  /** Regex pattern */
  pattern: RegExp;
  /** Confidence level */
  confidence: "high" | "medium" | "low";
  /** Description */
  description: string;
}

/**
 * Security scan options
 */
export interface SecurityScanOptions {
  /** Files to scan (glob patterns) */
  files?: string[];
  /** Categories to check */
  categories?: SecurityCategory[];
  /** Minimum severity to report */
  minSeverity?: SecuritySeverity;
  /** Maximum issues to report */
  maxIssues?: number;
  /** Include OWASP mappings */
  includeOwasp?: boolean;
  /** Skip certain patterns */
  skipPatterns?: string[];
}

/**
 * Dependency check options
 */
export interface DependencyCheckOptions {
  /** Include dev dependencies */
  includeDev?: boolean;
  /** Minimum severity to report */
  minSeverity?: SecuritySeverity;
  /** Include outdated (non-vulnerable) */
  includeOutdated?: boolean;
  /** Package manager */
  packageManager?: "npm" | "yarn" | "pnpm";
}

/**
 * Secret detection options
 */
export interface SecretDetectionOptions {
  /** Files to scan */
  files?: string[];
  /** Minimum entropy threshold */
  entropyThreshold?: number;
  /** Check git history */
  checkGitHistory?: boolean;
  /** Secret types to check */
  secretTypes?: SecretType[];
  /** Minimum confidence */
  minConfidence?: "high" | "medium" | "low";
}
