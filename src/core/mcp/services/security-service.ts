/**
 * Security Scanner Service
 *
 * Scans for security vulnerabilities, secrets, and dependency issues
 */

import { promises as fs } from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { v4 as uuidv4 } from "uuid";
import type {
  SecurityIssue,
  SecurityScanResult,
  SecurityScanOptions,
  SecuritySeverity,
  SecurityCategory,
  SecurityPattern,
  VulnerableDependency,
  DependencyCheckResult,
  DependencyCheckOptions,
  SecretFinding,
  SecretDetectionResult,
  SecretDetectionOptions,
  SecretPattern,
  SecretType,
} from "../types/security.js";

export class SecurityService {
  /** Directories to exclude from scanning */
  private static readonly EXCLUDE_DIRS = [
    "node_modules",
    "dist",
    "build",
    ".git",
    "coverage",
    ".next",
    ".cache",
    "vendor",
  ];

  /** Security patterns for code scanning */
  private securityPatterns: SecurityPattern[] = [];

  /** Secret patterns for detection */
  private secretPatterns: SecretPattern[] = [];

  constructor(private projectRoot: string) {
    this.initializePatterns();
  }

  /**
   * Initialize security and secret patterns
   */
  private initializePatterns(): void {
    // Security patterns (OWASP-aligned)
    this.securityPatterns = [
      // Injection
      {
        id: "sql-injection",
        name: "SQL Injection",
        category: "injection",
        severity: "critical",
        pattern: /(\$\{.*\}|['"`]\s*\+\s*\w+|\w+\s*\+\s*['"`]).*(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION)/gi,
        fileTypes: [".ts", ".js", ".tsx", ".jsx"],
        description: "Potential SQL injection vulnerability",
        remediation: "Use parameterized queries or prepared statements",
        owasp: "A03:2021-Injection",
        cweId: "CWE-89",
      },
      {
        id: "command-injection",
        name: "Command Injection",
        category: "injection",
        severity: "critical",
        pattern: /(?:exec|spawn|execSync|spawnSync)\s*\(\s*(?:\$\{|`.*\$\{|['"`]\s*\+)/gi,
        fileTypes: [".ts", ".js"],
        description: "Potential command injection vulnerability",
        remediation: "Avoid executing user input as commands. Use allowlists and sanitization",
        owasp: "A03:2021-Injection",
        cweId: "CWE-78",
      },
      {
        id: "path-traversal",
        name: "Path Traversal",
        category: "injection",
        severity: "high",
        pattern: /(?:readFile|writeFile|readdir|unlink|rmdir)\s*\([^)]*(?:req\.|params\.|query\.|body\.)/gi,
        fileTypes: [".ts", ".js"],
        description: "Potential path traversal vulnerability",
        remediation: "Validate and sanitize file paths. Use path.resolve() and check against base directory",
        owasp: "A01:2021-Broken-Access-Control",
        cweId: "CWE-22",
      },

      // XSS
      {
        id: "xss-innerhtml",
        name: "XSS via innerHTML",
        category: "xss",
        severity: "high",
        pattern: /\.innerHTML\s*=\s*(?!\s*['"`])/gi,
        fileTypes: [".ts", ".js", ".tsx", ".jsx"],
        description: "Setting innerHTML with dynamic content can lead to XSS",
        remediation: "Use textContent or sanitize HTML with DOMPurify",
        owasp: "A03:2021-Injection",
        cweId: "CWE-79",
      },
      {
        id: "xss-dangerously",
        name: "XSS via dangerouslySetInnerHTML",
        category: "xss",
        severity: "high",
        pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/gi,
        fileTypes: [".tsx", ".jsx"],
        description: "dangerouslySetInnerHTML can lead to XSS if not properly sanitized",
        remediation: "Sanitize HTML content with DOMPurify before using",
        owasp: "A03:2021-Injection",
        cweId: "CWE-79",
      },
      {
        id: "xss-document-write",
        name: "XSS via document.write",
        category: "xss",
        severity: "high",
        pattern: /document\.write\s*\(/gi,
        fileTypes: [".ts", ".js", ".tsx", ".jsx"],
        description: "document.write can lead to XSS vulnerabilities",
        remediation: "Use DOM manipulation methods instead",
        owasp: "A03:2021-Injection",
        cweId: "CWE-79",
      },

      // Cryptographic Issues
      {
        id: "weak-crypto-md5",
        name: "Weak Cryptography (MD5)",
        category: "crypto",
        severity: "medium",
        pattern: /createHash\s*\(\s*['"`]md5['"`]\s*\)/gi,
        fileTypes: [".ts", ".js"],
        description: "MD5 is cryptographically weak and should not be used for security",
        remediation: "Use SHA-256 or stronger hash functions",
        owasp: "A02:2021-Cryptographic-Failures",
        cweId: "CWE-328",
      },
      {
        id: "weak-crypto-sha1",
        name: "Weak Cryptography (SHA1)",
        category: "crypto",
        severity: "medium",
        pattern: /createHash\s*\(\s*['"`]sha1['"`]\s*\)/gi,
        fileTypes: [".ts", ".js"],
        description: "SHA1 is cryptographically weak for security purposes",
        remediation: "Use SHA-256 or stronger hash functions",
        owasp: "A02:2021-Cryptographic-Failures",
        cweId: "CWE-328",
      },
      {
        id: "hardcoded-iv",
        name: "Hardcoded Initialization Vector",
        category: "crypto",
        severity: "high",
        pattern: /(?:iv|initializationVector|IV)\s*=\s*['"`][a-zA-Z0-9+/=]{16,}['"`]/gi,
        fileTypes: [".ts", ".js"],
        description: "Hardcoded IV weakens encryption",
        remediation: "Generate random IVs for each encryption operation",
        owasp: "A02:2021-Cryptographic-Failures",
        cweId: "CWE-329",
      },

      // Authentication Issues
      {
        id: "jwt-none-algorithm",
        name: "JWT None Algorithm",
        category: "auth",
        severity: "critical",
        pattern: /algorithm\s*:\s*['"`]none['"`]/gi,
        fileTypes: [".ts", ".js"],
        description: "JWT with 'none' algorithm bypasses signature verification",
        remediation: "Always use a secure algorithm like RS256 or HS256",
        owasp: "A07:2021-Auth-Failures",
        cweId: "CWE-347",
      },
      {
        id: "hardcoded-jwt-secret",
        name: "Hardcoded JWT Secret",
        category: "auth",
        severity: "critical",
        pattern: /(?:jwt|jsonwebtoken)\.sign\s*\([^)]+,\s*['"`][^'"`]{8,}['"`]/gi,
        fileTypes: [".ts", ".js"],
        description: "Hardcoded JWT secret in source code",
        remediation: "Use environment variables for secrets",
        owasp: "A07:2021-Auth-Failures",
        cweId: "CWE-798",
      },

      // Configuration Issues
      {
        id: "cors-wildcard",
        name: "CORS Wildcard Origin",
        category: "configuration",
        severity: "medium",
        pattern: /(?:Access-Control-Allow-Origin|origin)\s*[:=]\s*['"`]\*['"`]/gi,
        fileTypes: [".ts", ".js"],
        description: "CORS wildcard allows any origin",
        remediation: "Specify allowed origins explicitly",
        owasp: "A05:2021-Security-Misconfiguration",
        cweId: "CWE-942",
      },
      {
        id: "disable-security",
        name: "Security Features Disabled",
        category: "configuration",
        severity: "high",
        pattern: /(?:helmet|csrf|xss|security)\s*[:=]\s*(?:false|null|undefined)/gi,
        fileTypes: [".ts", ".js", ".json"],
        description: "Security features appear to be disabled",
        remediation: "Enable security features in production",
        owasp: "A05:2021-Security-Misconfiguration",
        cweId: "CWE-16",
      },

      // Eval and Dynamic Code
      {
        id: "eval-usage",
        name: "Eval Usage",
        category: "injection",
        severity: "high",
        pattern: /\beval\s*\(/gi,
        fileTypes: [".ts", ".js", ".tsx", ".jsx"],
        description: "eval() can execute arbitrary code",
        remediation: "Avoid eval(). Use safer alternatives like JSON.parse()",
        owasp: "A03:2021-Injection",
        cweId: "CWE-95",
      },
      {
        id: "new-function",
        name: "Dynamic Function Creation",
        category: "injection",
        severity: "medium",
        pattern: /new\s+Function\s*\(/gi,
        fileTypes: [".ts", ".js", ".tsx", ".jsx"],
        description: "new Function() can execute arbitrary code",
        remediation: "Avoid dynamic function creation with user input",
        owasp: "A03:2021-Injection",
        cweId: "CWE-95",
      },

      // Data Exposure
      {
        id: "console-sensitive",
        name: "Sensitive Data in Console",
        category: "data-exposure",
        severity: "medium",
        pattern: /console\.(?:log|debug|info)\s*\([^)]*(?:password|secret|token|key|credential|auth)/gi,
        fileTypes: [".ts", ".js", ".tsx", ".jsx"],
        description: "Potentially logging sensitive data",
        remediation: "Remove or redact sensitive data from logs",
        owasp: "A09:2021-Logging-Failures",
        cweId: "CWE-532",
      },
      {
        id: "error-sensitive",
        name: "Sensitive Data in Error Messages",
        category: "data-exposure",
        severity: "medium",
        pattern: /(?:throw|Error)\s*\([^)]*(?:password|secret|token|key|credential)/gi,
        fileTypes: [".ts", ".js"],
        description: "Error messages may contain sensitive data",
        remediation: "Use generic error messages for users",
        owasp: "A09:2021-Logging-Failures",
        cweId: "CWE-209",
      },

      // Input Validation
      {
        id: "regex-dos",
        name: "ReDoS Vulnerability",
        category: "input-validation",
        severity: "medium",
        pattern: /new\s+RegExp\s*\([^)]*(?:req\.|params\.|query\.|body\.)/gi,
        fileTypes: [".ts", ".js"],
        description: "User input in RegExp can cause ReDoS",
        remediation: "Validate and limit regex patterns. Use safe-regex library",
        owasp: "A03:2021-Injection",
        cweId: "CWE-1333",
      },
      {
        id: "prototype-pollution",
        name: "Prototype Pollution",
        category: "injection",
        severity: "high",
        pattern: /\[(?:req\.|params\.|query\.|body\.)[^\]]+\]\s*=/gi,
        fileTypes: [".ts", ".js"],
        description: "Dynamic property assignment can lead to prototype pollution",
        remediation: "Use Object.hasOwnProperty() or Map for dynamic keys",
        owasp: "A03:2021-Injection",
        cweId: "CWE-1321",
      },
    ];

    // Secret patterns
    this.secretPatterns = [
      {
        id: "aws-access-key",
        type: "aws-credentials",
        pattern: /AKIA[0-9A-Z]{16}/g,
        confidence: "high",
        description: "AWS Access Key ID",
      },
      {
        id: "aws-secret-key",
        type: "aws-credentials",
        pattern: /(?:aws|AWS).{0,20}(?:secret|SECRET).{0,20}['"`][A-Za-z0-9/+=]{40}['"`]/g,
        confidence: "high",
        description: "AWS Secret Access Key",
      },
      {
        id: "github-token",
        type: "token",
        pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
        confidence: "high",
        description: "GitHub Token",
      },
      {
        id: "github-pat",
        type: "token",
        pattern: /github_pat_[A-Za-z0-9_]{22,}/g,
        confidence: "high",
        description: "GitHub Personal Access Token",
      },
      {
        id: "jwt-token",
        type: "token",
        pattern: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
        confidence: "medium",
        description: "JWT Token",
      },
      {
        id: "private-key",
        type: "private-key",
        pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
        confidence: "high",
        description: "Private Key",
      },
      {
        id: "api-key-generic",
        type: "api-key",
        pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"`][A-Za-z0-9-_]{20,}['"`]/gi,
        confidence: "medium",
        description: "Generic API Key",
      },
      {
        id: "password-assignment",
        type: "password",
        pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"`][^'"`]{8,}['"`]/gi,
        confidence: "medium",
        description: "Hardcoded Password",
      },
      {
        id: "database-url",
        type: "database-url",
        pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^:]+:[^@]+@/gi,
        confidence: "high",
        description: "Database Connection String with Credentials",
      },
      {
        id: "oauth-secret",
        type: "oauth-secret",
        pattern: /(?:client[_-]?secret|oauth[_-]?secret)\s*[:=]\s*['"`][A-Za-z0-9-_]{20,}['"`]/gi,
        confidence: "high",
        description: "OAuth Client Secret",
      },
      {
        id: "slack-webhook",
        type: "webhook-secret",
        pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/g,
        confidence: "high",
        description: "Slack Webhook URL",
      },
      {
        id: "stripe-key",
        type: "api-key",
        pattern: /sk_(?:live|test)_[A-Za-z0-9]{24,}/g,
        confidence: "high",
        description: "Stripe Secret Key",
      },
      {
        id: "sendgrid-key",
        type: "api-key",
        pattern: /SG\.[A-Za-z0-9-_]{22,}\.[A-Za-z0-9-_]{22,}/g,
        confidence: "high",
        description: "SendGrid API Key",
      },
      {
        id: "npm-token",
        type: "token",
        pattern: /npm_[A-Za-z0-9]{36}/g,
        confidence: "high",
        description: "NPM Access Token",
      },
    ];
  }

  /**
   * Scan files for security issues
   */
  async scanFiles(options: SecurityScanOptions = {}): Promise<SecurityScanResult> {
    const files = await this.getSourceFiles(options.files);
    const issues: SecurityIssue[] = [];
    const owaspCoverage = new Set<string>();

    for (const file of files) {
      const fileIssues = await this.scanFile(file, options);
      issues.push(...fileIssues);

      for (const issue of fileIssues) {
        if (issue.owasp) {
          owaspCoverage.add(issue.owasp);
        }
      }
    }

    // Filter by severity
    let filteredIssues = issues;
    if (options.minSeverity) {
      filteredIssues = this.filterBySeverity(issues, options.minSeverity);
    }

    // Limit results
    if (options.maxIssues && filteredIssues.length > options.maxIssues) {
      filteredIssues = filteredIssues.slice(0, options.maxIssues);
    }

    // Calculate stats
    const bySeverity = this.countBySeverity(filteredIssues);
    const byCategory = this.countByCategory(filteredIssues);

    return {
      scannedAt: new Date().toISOString(),
      filesScanned: files.length,
      totalIssues: filteredIssues.length,
      bySeverity,
      byCategory,
      issues: filteredIssues,
      owaspCoverage: Array.from(owaspCoverage),
      summary: this.generateScanSummary(filteredIssues, files.length),
    };
  }

  /**
   * Check dependencies for vulnerabilities
   */
  async checkDependencies(
    options: DependencyCheckOptions = {}
  ): Promise<DependencyCheckResult> {
    const vulnerabilities: VulnerableDependency[] = [];
    let totalDependencies = 0;
    let outdatedCount = 0;

    try {
      // Run npm audit
      const auditResult = this.runNpmAudit(options);
      vulnerabilities.push(...auditResult.vulnerabilities);
      totalDependencies = auditResult.totalDependencies;

      // Check outdated if requested
      if (options.includeOutdated) {
        outdatedCount = await this.countOutdatedPackages();
      }
    } catch (error) {
      // Return empty result if audit fails
      return {
        checkedAt: new Date().toISOString(),
        totalDependencies: 0,
        vulnerableCount: 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        vulnerabilities: [],
        outdatedCount: 0,
        riskLevel: "none",
        recommendations: [
          `Failed to check dependencies: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }

    // Filter by severity
    let filtered = vulnerabilities;
    if (options.minSeverity) {
      filtered = vulnerabilities.filter(
        (v) => this.severityToNumber(v.severity) >= this.severityToNumber(options.minSeverity!)
      );
    }

    const bySeverity = this.countVulnBySeverity(filtered);
    const riskLevel = this.calculateRiskLevel(bySeverity);

    return {
      checkedAt: new Date().toISOString(),
      totalDependencies,
      vulnerableCount: filtered.length,
      bySeverity,
      vulnerabilities: filtered,
      outdatedCount,
      riskLevel,
      recommendations: this.generateDependencyRecommendations(filtered, riskLevel),
    };
  }

  /**
   * Detect secrets in files
   */
  async detectSecrets(
    options: SecretDetectionOptions = {}
  ): Promise<SecretDetectionResult> {
    const files = await this.getSourceFiles(options.files);
    const secrets: SecretFinding[] = [];
    let highEntropyCount = 0;

    for (const file of files) {
      // Skip binary files and common non-secret files
      if (this.shouldSkipSecretScan(file)) {
        continue;
      }

      const fileSecrets = await this.scanFileForSecrets(file, options);
      secrets.push(...fileSecrets);

      // Count high entropy findings
      highEntropyCount += fileSecrets.filter(
        (s) => s.detectedBy === "entropy" || s.detectedBy === "both"
      ).length;
    }

    // Filter by confidence
    let filtered = secrets;
    if (options.minConfidence) {
      filtered = this.filterByConfidence(secrets, options.minConfidence);
    }

    // Filter by type
    if (options.secretTypes && options.secretTypes.length > 0) {
      filtered = filtered.filter((s) => options.secretTypes!.includes(s.type));
    }

    const byType = this.countBySecretType(filtered);

    return {
      detectedAt: new Date().toISOString(),
      filesScanned: files.length,
      totalSecrets: filtered.length,
      byType,
      secrets: filtered,
      highEntropyCount,
      gitHistoryScanned: options.checkGitHistory || false,
      suggestions: this.generateSecretSuggestions(filtered),
    };
  }

  /**
   * Scan a single file for security issues
   */
  private async scanFile(
    filePath: string,
    options: SecurityScanOptions
  ): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const relativePath = path.relative(this.projectRoot, filePath);
    const ext = path.extname(filePath);

    let content: string;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch {
      return issues;
    }

    const lines = content.split("\n");

    for (const pattern of this.securityPatterns) {
      // Skip if not applicable to this file type
      if (pattern.fileTypes.length > 0 && !pattern.fileTypes.includes(ext)) {
        continue;
      }

      // Skip if category filtered out
      if (options.categories && !options.categories.includes(pattern.category)) {
        continue;
      }

      // Skip if in skip patterns
      if (options.skipPatterns?.includes(pattern.id)) {
        continue;
      }

      // Find matches
      pattern.pattern.lastIndex = 0;
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const line = this.getLineNumber(content, match.index);
        const codeSnippet = lines[line - 1]?.trim().substring(0, 100);

        issues.push({
          id: uuidv4(),
          severity: pattern.severity,
          category: pattern.category,
          owasp: pattern.owasp,
          file: relativePath,
          line,
          title: pattern.name,
          description: pattern.description,
          codeSnippet,
          remediation: pattern.remediation,
          cweId: pattern.cweId,
        });
      }
    }

    return issues;
  }

  /**
   * Scan file for secrets
   */
  private async scanFileForSecrets(
    filePath: string,
    options: SecretDetectionOptions
  ): Promise<SecretFinding[]> {
    const secrets: SecretFinding[] = [];
    const relativePath = path.relative(this.projectRoot, filePath);

    let content: string;
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch {
      return secrets;
    }

    const lines = content.split("\n");

    // Pattern-based detection
    for (const pattern of this.secretPatterns) {
      pattern.pattern.lastIndex = 0;
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const line = this.getLineNumber(content, match.index);
        const matchText = match[0];

        secrets.push({
          type: pattern.type,
          severity: this.getSecretSeverity(pattern.type),
          file: relativePath,
          line,
          match: this.redactSecret(matchText),
          detectedBy: "pattern",
          confidence: pattern.confidence,
          suggestion: `Remove this ${pattern.description.toLowerCase()} from source code`,
        });
      }
    }

    // Entropy-based detection
    const entropyThreshold = options.entropyThreshold || 4.5;
    for (let i = 0; i < lines.length; i++) {
      const highEntropyStrings = this.findHighEntropyStrings(
        lines[i],
        entropyThreshold
      );

      for (const str of highEntropyStrings) {
        // Check if already detected by pattern
        const alreadyFound = secrets.some(
          (s) => s.file === relativePath && s.line === i + 1
        );

        if (alreadyFound) {
          // Update existing finding
          const existing = secrets.find(
            (s) => s.file === relativePath && s.line === i + 1
          );
          if (existing) {
            existing.detectedBy = "both";
            existing.entropy = str.entropy;
          }
        } else {
          secrets.push({
            type: "generic-secret",
            severity: "medium",
            file: relativePath,
            line: i + 1,
            match: this.redactSecret(str.value),
            detectedBy: "entropy",
            entropy: str.entropy,
            confidence: "low",
            suggestion: "Review this high-entropy string for potential secrets",
          });
        }
      }
    }

    return secrets;
  }

  /**
   * Run npm audit
   */
  private runNpmAudit(options: DependencyCheckOptions): {
    vulnerabilities: VulnerableDependency[];
    totalDependencies: number;
  } {
    try {
      const auditFlags = options.includeDev ? "" : "--production";
      const result = execSync(`npm audit --json ${auditFlags}`, {
        cwd: this.projectRoot,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });

      return this.parseNpmAuditResult(result);
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error && typeof error === "object" && "stdout" in error) {
        const stdout = (error as { stdout: string }).stdout;
        if (stdout) {
          return this.parseNpmAuditResult(stdout);
        }
      }
      throw error;
    }
  }

  /**
   * Parse npm audit JSON result
   */
  private parseNpmAuditResult(jsonResult: string): {
    vulnerabilities: VulnerableDependency[];
    totalDependencies: number;
  } {
    try {
      const data = JSON.parse(jsonResult);
      const vulnerabilities: VulnerableDependency[] = [];

      // npm audit v2 format
      if (data.vulnerabilities) {
        for (const [name, vuln] of Object.entries(data.vulnerabilities)) {
          const v = vuln as {
            severity: string;
            via: Array<{ title?: string; url?: string; cve?: string[] } | string>;
            isDirect: boolean;
            effects: string[];
            fixAvailable?: { version: string } | boolean;
            range: string;
          };

          // Get CVEs and description from 'via' array
          const viaDetails = v.via.filter((item): item is { title?: string; url?: string; cve?: string[] } =>
            typeof item !== "string"
          );

          const cves = viaDetails.flatMap((item) => item.cve || []);
          const title = viaDetails[0]?.title || `Vulnerability in ${name}`;
          const advisoryUrl = viaDetails[0]?.url;

          vulnerabilities.push({
            name,
            version: v.range,
            severity: this.mapNpmSeverity(v.severity),
            cves,
            title,
            description: title,
            fixedIn: typeof v.fixAvailable === "object" ? v.fixAvailable.version : undefined,
            dependencyPath: [name, ...v.effects],
            isDirect: v.isDirect,
            advisoryUrl,
          });
        }
      }

      return {
        vulnerabilities,
        totalDependencies: data.metadata?.dependencies || 0,
      };
    } catch {
      return { vulnerabilities: [], totalDependencies: 0 };
    }
  }

  /**
   * Count outdated packages
   */
  private async countOutdatedPackages(): Promise<number> {
    try {
      const result = execSync("npm outdated --json", {
        cwd: this.projectRoot,
        encoding: "utf-8",
      });
      const data = JSON.parse(result);
      return Object.keys(data).length;
    } catch {
      return 0;
    }
  }

  /**
   * Get source files for scanning
   */
  private async getSourceFiles(patterns?: string[]): Promise<string[]> {
    const results: string[] = [];
    await this.walkDirectory(this.projectRoot, results, patterns);
    return results;
  }

  /**
   * Walk directory recursively
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
          if (!SecurityService.EXCLUDE_DIRS.includes(entry.name)) {
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
   * Check if file should be scanned
   */
  private isSourceFile(fileName: string, patterns?: string[]): boolean {
    const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".json", ".yml", ".yaml", ".env"];

    if (patterns && patterns.length > 0) {
      return patterns.some((p) => fileName.endsWith(p) || fileName.includes(p));
    }

    return sourceExtensions.some((ext) => fileName.endsWith(ext));
  }

  /**
   * Check if file should skip secret scanning
   */
  private shouldSkipSecretScan(filePath: string): boolean {
    const skipPatterns = [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      ".min.js",
      ".min.css",
      ".map",
    ];

    return skipPatterns.some((p) => filePath.includes(p));
  }

  /**
   * Get line number from character index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length;
  }

  /**
   * Calculate Shannon entropy
   */
  private calculateEntropy(str: string): number {
    const len = str.length;
    const frequencies = new Map<string, number>();

    for (const char of str) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }

    let entropy = 0;
    for (const count of frequencies.values()) {
      const probability = count / len;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * Find high entropy strings in a line
   */
  private findHighEntropyStrings(
    line: string,
    threshold: number
  ): Array<{ value: string; entropy: number }> {
    const results: Array<{ value: string; entropy: number }> = [];

    // Match quoted strings
    const stringPattern = /['"`]([A-Za-z0-9+/=_-]{20,})['"`]/g;
    let match;

    while ((match = stringPattern.exec(line)) !== null) {
      const value = match[1];
      const entropy = this.calculateEntropy(value);

      if (entropy >= threshold) {
        results.push({ value, entropy });
      }
    }

    return results;
  }

  /**
   * Redact secret for display
   */
  private redactSecret(secret: string): string {
    if (secret.length <= 8) {
      return "***";
    }
    return secret.substring(0, 4) + "***" + secret.substring(secret.length - 4);
  }

  /**
   * Get severity for secret type
   */
  private getSecretSeverity(type: SecretType): SecuritySeverity {
    const highSeverity: SecretType[] = [
      "aws-credentials",
      "private-key",
      "database-url",
      "oauth-secret",
    ];

    if (highSeverity.includes(type)) {
      return "critical";
    }
    return "high";
  }

  /**
   * Map npm severity to our severity
   */
  private mapNpmSeverity(severity: string): SecuritySeverity {
    const mapping: Record<string, SecuritySeverity> = {
      critical: "critical",
      high: "high",
      moderate: "medium",
      low: "low",
      info: "info",
    };
    return mapping[severity.toLowerCase()] || "medium";
  }

  /**
   * Convert severity to number for comparison
   */
  private severityToNumber(severity: SecuritySeverity): number {
    const order: Record<SecuritySeverity, number> = {
      info: 0,
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    return order[severity];
  }

  /**
   * Filter issues by severity
   */
  private filterBySeverity(
    issues: SecurityIssue[],
    minSeverity: SecuritySeverity
  ): SecurityIssue[] {
    const minLevel = this.severityToNumber(minSeverity);
    return issues.filter(
      (i) => this.severityToNumber(i.severity) >= minLevel
    );
  }

  /**
   * Filter secrets by confidence
   */
  private filterByConfidence(
    secrets: SecretFinding[],
    minConfidence: "high" | "medium" | "low"
  ): SecretFinding[] {
    const order = { low: 0, medium: 1, high: 2 };
    const minLevel = order[minConfidence];
    return secrets.filter((s) => order[s.confidence] >= minLevel);
  }

  /**
   * Count issues by severity
   */
  private countBySeverity(
    issues: SecurityIssue[]
  ): Record<SecuritySeverity, number> {
    const counts: Record<SecuritySeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const issue of issues) {
      counts[issue.severity]++;
    }

    return counts;
  }

  /**
   * Count vulnerabilities by severity
   */
  private countVulnBySeverity(
    vulns: VulnerableDependency[]
  ): Record<SecuritySeverity, number> {
    const counts: Record<SecuritySeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    for (const vuln of vulns) {
      counts[vuln.severity]++;
    }

    return counts;
  }

  /**
   * Count issues by category
   */
  private countByCategory(
    issues: SecurityIssue[]
  ): Record<SecurityCategory, number> {
    const counts: Record<SecurityCategory, number> = {
      injection: 0,
      xss: 0,
      csrf: 0,
      auth: 0,
      crypto: 0,
      secrets: 0,
      dependencies: 0,
      configuration: 0,
      "data-exposure": 0,
      "access-control": 0,
      "input-validation": 0,
      "error-handling": 0,
      logging: 0,
      other: 0,
    };

    for (const issue of issues) {
      counts[issue.category]++;
    }

    return counts;
  }

  /**
   * Count secrets by type
   */
  private countBySecretType(
    secrets: SecretFinding[]
  ): Record<SecretType, number> {
    const counts: Record<SecretType, number> = {
      "api-key": 0,
      password: 0,
      token: 0,
      "private-key": 0,
      certificate: 0,
      "aws-credentials": 0,
      "database-url": 0,
      "oauth-secret": 0,
      "jwt-secret": 0,
      "encryption-key": 0,
      "webhook-secret": 0,
      "generic-secret": 0,
    };

    for (const secret of secrets) {
      counts[secret.type]++;
    }

    return counts;
  }

  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(
    bySeverity: Record<SecuritySeverity, number>
  ): DependencyCheckResult["riskLevel"] {
    if (bySeverity.critical > 0) return "critical";
    if (bySeverity.high > 0) return "high";
    if (bySeverity.medium > 0) return "medium";
    if (bySeverity.low > 0) return "low";
    return "none";
  }

  /**
   * Generate scan summary
   */
  private generateScanSummary(issues: SecurityIssue[], filesScanned: number): string {
    if (issues.length === 0) {
      return `Scanned ${filesScanned} files. No security issues found.`;
    }

    const critical = issues.filter((i) => i.severity === "critical").length;
    const high = issues.filter((i) => i.severity === "high").length;

    let summary = `Scanned ${filesScanned} files. Found ${issues.length} issue(s)`;
    if (critical > 0) summary += ` (${critical} critical)`;
    if (high > 0) summary += ` (${high} high)`;
    summary += ".";

    return summary;
  }

  /**
   * Generate dependency recommendations
   */
  private generateDependencyRecommendations(
    vulns: VulnerableDependency[],
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    if (vulns.length === 0) {
      recommendations.push("No vulnerable dependencies found. Keep dependencies updated.");
      return recommendations;
    }

    if (riskLevel === "critical" || riskLevel === "high") {
      recommendations.push("URGENT: Update vulnerable packages immediately");
    }

    // Find fixable vulnerabilities
    const fixable = vulns.filter((v) => v.fixedIn);
    if (fixable.length > 0) {
      recommendations.push(
        `Run 'npm audit fix' to automatically fix ${fixable.length} vulnerability(ies)`
      );
    }

    // Direct dependencies
    const direct = vulns.filter((v) => v.isDirect);
    if (direct.length > 0) {
      recommendations.push(
        `${direct.length} direct dependency(ies) have vulnerabilities - update them directly`
      );
    }

    return recommendations;
  }

  /**
   * Generate secret detection suggestions
   */
  private generateSecretSuggestions(secrets: SecretFinding[]): string[] {
    const suggestions: string[] = [];

    if (secrets.length === 0) {
      suggestions.push("No secrets detected. Good job keeping secrets out of code!");
      return suggestions;
    }

    suggestions.push("Move secrets to environment variables or a secrets manager");
    suggestions.push("Add detected files to .gitignore if they contain secrets");
    suggestions.push("Consider using git-secrets or pre-commit hooks to prevent future leaks");

    const highConfidence = secrets.filter((s) => s.confidence === "high");
    if (highConfidence.length > 0) {
      suggestions.push(
        `${highConfidence.length} high-confidence secret(s) found - rotate these immediately`
      );
    }

    return suggestions;
  }
}
