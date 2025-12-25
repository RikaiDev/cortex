/**
 * Performance Analyzer Service
 *
 * Detects performance anti-patterns in code
 */

import * as path from "node:path";
import fs from "fs-extra";
import type {
  PerformancePattern,
  PerformanceIssue,
  PerformanceAnalysisResult,
  PerformanceConfig,
  PerformanceCategory,
} from "../types/performance.js";

export class PerformanceAnalyzer {
  private config: PerformanceConfig;
  private patterns: PerformancePattern[];

  constructor(private projectRoot: string) {
    this.config = {
      enabled: true,
      customPatterns: [],
      disabledPatterns: [],
      severityOverrides: {},
    };
    this.patterns = this.getBuiltInPatterns();
  }

  /**
   * Load configuration from .cortex/performance.json
   */
  async loadConfig(): Promise<void> {
    const configPath = path.join(
      this.projectRoot,
      ".cortex",
      "performance.json"
    );

    if (await fs.pathExists(configPath)) {
      try {
        const config = await fs.readJson(configPath);
        this.config = { ...this.config, ...config };

        // Merge custom patterns
        if (config.customPatterns) {
          this.patterns = [...this.patterns, ...config.customPatterns];
        }
      } catch {
        // If config is invalid, use defaults
      }
    }
  }

  /**
   * Save configuration to .cortex/performance.json
   */
  async saveConfig(config: Partial<PerformanceConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    const configPath = path.join(
      this.projectRoot,
      ".cortex",
      "performance.json"
    );

    await fs.ensureDir(path.dirname(configPath));
    await fs.writeJson(configPath, this.config, { spaces: 2 });
  }

  /**
   * Analyze files for performance issues
   */
  async analyzeFiles(files: string[]): Promise<PerformanceAnalysisResult> {
    await this.loadConfig();

    const issues: PerformanceIssue[] = [];

    for (const file of files) {
      const fileIssues = await this.analyzeFile(file);
      issues.push(...fileIssues);
    }

    // Group by category
    const issuesByCategory: Record<PerformanceCategory, PerformanceIssue[]> = {
      database: [],
      async: [],
      memory: [],
      rendering: [],
      computation: [],
      io: [],
      "resource-leak": [],
    };

    for (const issue of issues) {
      issuesByCategory[issue.category].push(issue);
    }

    // Count by severity
    const criticalCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    const infoCount = issues.filter((i) => i.severity === "info").length;

    return {
      hasIssues: issues.length > 0,
      issues,
      issuesByCategory,
      criticalCount,
      warningCount,
      infoCount,
    };
  }

  /**
   * Analyze a single file
   */
  private async analyzeFile(file: string): Promise<PerformanceIssue[]> {
    const fullPath = path.join(this.projectRoot, file);

    if (!(await fs.pathExists(fullPath))) return [];

    try {
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");
      const issues: PerformanceIssue[] = [];

      // Check each pattern
      for (const pattern of this.patterns) {
        // Skip disabled patterns
        if (this.config.disabledPatterns.includes(pattern.name)) {
          continue;
        }

        // Check file pattern match
        if (pattern.filePatterns && pattern.filePatterns.length > 0) {
          const matches = pattern.filePatterns.some((fp) =>
            this.matchesPattern(file, fp)
          );
          if (!matches) continue;
        }

        // Check exclude patterns
        if (pattern.excludePatterns && pattern.excludePatterns.length > 0) {
          const excluded = pattern.excludePatterns.some((ep) =>
            this.matchesPattern(file, ep)
          );
          if (excluded) continue;
        }

        // Search for pattern in file
        const patternIssues = this.findPatternInFile(
          file,
          content,
          lines,
          pattern
        );
        issues.push(...patternIssues);
      }

      return issues;
    } catch {
      return [];
    }
  }

  /**
   * Find pattern matches in file
   */
  private findPatternInFile(
    file: string,
    content: string,
    lines: string[],
    pattern: PerformancePattern
  ): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const regex = new RegExp(pattern.regex, "gm");

    let match;
    while ((match = regex.exec(content)) !== null) {
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split("\n").length;

      // Check context if specified
      if (pattern.contextRegex) {
        const hasContext = this.checkContext(
          content,
          match.index,
          pattern.contextRegex
        );
        if (!hasContext) continue;
      }

      // Get severity (check overrides)
      const severity =
        this.config.severityOverrides[pattern.name] || pattern.severity;

      // Extract code snippet
      const codeSnippet = lines[lineNumber - 1]?.trim() || "";

      issues.push({
        file,
        line: lineNumber,
        pattern: pattern.name,
        severity,
        description: pattern.description,
        suggestion: pattern.suggestion,
        code: codeSnippet,
        category: pattern.category,
      });
    }

    return issues;
  }

  /**
   * Check if pattern appears in specific context
   */
  private checkContext(
    content: string,
    matchIndex: number,
    contextRegex: string
  ): boolean {
    // Look for context in surrounding code (100 chars before and after)
    const start = Math.max(0, matchIndex - 500);
    const end = Math.min(content.length, matchIndex + 500);
    const contextCode = content.substring(start, end);

    const regex = new RegExp(contextRegex, "s");
    return regex.test(contextCode);
  }

  /**
   * Check if file matches a pattern (glob-like)
   */
  private matchesPattern(file: string, pattern: string): boolean {
    const regex = new RegExp(
      pattern.replace(/\*/g, ".*").replace(/\?/g, "."),
      "i"
    );
    return regex.test(file);
  }

  /**
   * Get built-in performance patterns
   */
  private getBuiltInPatterns(): PerformancePattern[] {
    return [
      // Database N+1 patterns
      {
        name: "database-query-in-loop",
        category: "database",
        description: "Database query inside a loop (potential N+1 problem)",
        regex:
          "(for|while|forEach|map)\\s*\\([^)]*\\)\\s*\\{[^}]*\\.(query|findOne|findMany|find|exec|execute)\\s*\\(",
        severity: "error",
        suggestion:
          "Move database queries outside loops. Use bulk operations or joins instead.",
        filePatterns: ["*.ts", "*.js", "*.tsx", "*.jsx"],
      },
      {
        name: "sequential-database-calls",
        category: "database",
        description: "Sequential await calls in loop (should use Promise.all)",
        regex: "(for|while)\\s*\\([^)]*\\)\\s*\\{[^}]*await\\s+",
        severity: "warning",
        suggestion: "Use Promise.all() to parallelize independent async operations.",
        filePatterns: ["*.ts", "*.js", "*.tsx", "*.jsx"],
      },

      // React/Rendering patterns
      {
        name: "missing-dependency-array",
        category: "rendering",
        description: "useEffect without dependency array (runs on every render)",
        regex: "useEffect\\s*\\([^,)]+\\)\\s*(?!,)",
        severity: "warning",
        suggestion:
          "Add dependency array to useEffect to control when it runs.",
        filePatterns: ["*.tsx", "*.jsx"],
      },
      {
        name: "missing-cleanup-function",
        category: "resource-leak",
        description:
          "useEffect with subscription/listener but no cleanup function",
        regex:
          "useEffect\\s*\\(\\s*\\(\\)\\s*=>\\s*\\{[^}]*(addEventListener|subscribe|setInterval|setTimeout)[^}]*\\}\\s*,",
        severity: "error",
        suggestion:
          "Return cleanup function from useEffect to prevent memory leaks.",
        filePatterns: ["*.tsx", "*.jsx"],
      },
      {
        name: "inline-function-in-render",
        category: "rendering",
        description:
          "Inline function in JSX props (creates new function on every render)",
        regex: "<\\w+[^>]*\\s(on\\w+)=\\{\\([^)]*\\)\\s*=>",
        severity: "info",
        suggestion:
          "Use useCallback or define function outside render to prevent unnecessary re-renders.",
        filePatterns: ["*.tsx", "*.jsx"],
      },
      {
        name: "missing-key-in-list",
        category: "rendering",
        description: "Missing key prop in mapped list items",
        regex: "\\.map\\([^}]*return\\s*<[^>]*(?!key=)",
        severity: "warning",
        suggestion: "Add unique 'key' prop to list items for efficient rendering.",
        filePatterns: ["*.tsx", "*.jsx"],
      },

      // Async/Await patterns
      {
        name: "sync-io-in-async",
        category: "io",
        description: "Synchronous file I/O in async function",
        regex:
          "async\\s+(function|\\([^)]*\\)\\s*=>)[^}]*(readFileSync|writeFileSync|existsSync)",
        severity: "warning",
        suggestion:
          "Use async file operations (readFile, writeFile) instead of sync versions.",
        filePatterns: ["*.ts", "*.js"],
      },
      {
        name: "unhandled-promise",
        category: "async",
        description: "Promise without await or .catch() (potential unhandled rejection)",
        regex: "\\b(?<!await\\s)\\w+\\.(?:query|find|fetch|request)\\([^)]*\\)(?!\\.(then|catch|finally))",
        severity: "warning",
        suggestion: "Add await or .catch() to handle promise rejection.",
        filePatterns: ["*.ts", "*.js", "*.tsx", "*.jsx"],
      },

      // Memory patterns
      {
        name: "large-array-operation",
        category: "computation",
        description:
          "Large array operation without streaming (filter + map + filter)",
        regex: "\\.(filter|map|reduce)\\([^)]+\\)\\.(filter|map|reduce)\\([^)]+\\)\\.(filter|map|reduce)",
        severity: "info",
        suggestion:
          "Consider using a single reduce or streaming for better performance.",
        filePatterns: ["*.ts", "*.js"],
      },
      {
        name: "json-parse-in-loop",
        category: "computation",
        description: "JSON.parse inside a loop (expensive operation)",
        regex: "(for|while|forEach|map)\\s*\\([^)]*\\)\\s*\\{[^}]*JSON\\.parse\\s*\\(",
        severity: "warning",
        suggestion: "Parse JSON outside loops when possible.",
        filePatterns: ["*.ts", "*.js"],
      },

      // Resource leak patterns
      {
        name: "missing-event-cleanup",
        category: "resource-leak",
        description:
          "addEventListener without corresponding removeEventListener",
        regex: "addEventListener\\s*\\([^)]+\\)(?![\\s\\S]{0,500}removeEventListener)",
        contextRegex: "(?!return\\s*\\(\\)\\s*=>)",
        severity: "warning",
        suggestion:
          "Add cleanup to remove event listeners when component unmounts.",
        filePatterns: ["*.ts", "*.js", "*.tsx", "*.jsx"],
      },
      {
        name: "unclosed-db-connection",
        category: "resource-leak",
        description: "Database connection opened but not closed",
        regex: "\\.connect\\s*\\((?![\\s\\S]{0,1000}\\.(close|end|disconnect)\\s*\\()",
        severity: "error",
        suggestion:
          "Always close database connections in finally block or using try-with-resources.",
        filePatterns: ["*.ts", "*.js"],
      },

      // Blocking operations
      {
        name: "sync-crypto-in-async",
        category: "computation",
        description: "Synchronous crypto operation in async context",
        regex:
          "async\\s+(function|\\([^)]*\\)\\s*=>)[^}]*(pbkdf2Sync|scryptSync|randomBytes(?!Sync))",
        severity: "warning",
        suggestion: "Use async crypto operations to avoid blocking.",
        filePatterns: ["*.ts", "*.js"],
      },
      {
        name: "blocking-regex",
        category: "computation",
        description: "Potentially catastrophic backtracking in regex",
        regex: "new\\s+RegExp\\s*\\([^)]*\\([^)]*\\+[^)]*\\)[^)]*\\)",
        severity: "info",
        suggestion:
          "Review regex for catastrophic backtracking. Test with long inputs.",
        filePatterns: ["*.ts", "*.js"],
      },
    ];
  }

  /**
   * Add custom pattern
   */
  async addCustomPattern(pattern: PerformancePattern): Promise<void> {
    await this.loadConfig();

    // Validate regex
    try {
      new RegExp(pattern.regex);
    } catch {
      throw new Error(`Invalid regex pattern: ${pattern.regex}`);
    }

    // Add to config
    this.config.customPatterns.push(pattern);
    await this.saveConfig(this.config);

    // Add to active patterns
    this.patterns.push(pattern);
  }

  /**
   * Get all patterns (built-in + custom)
   */
  getPatterns(): PerformancePattern[] {
    return this.patterns;
  }

  /**
   * Disable a pattern
   */
  async disablePattern(patternName: string): Promise<void> {
    await this.loadConfig();

    if (!this.config.disabledPatterns.includes(patternName)) {
      this.config.disabledPatterns.push(patternName);
      await this.saveConfig(this.config);
    }
  }

  /**
   * Enable a pattern
   */
  async enablePattern(patternName: string): Promise<void> {
    await this.loadConfig();

    this.config.disabledPatterns = this.config.disabledPatterns.filter(
      (p) => p !== patternName
    );
    await this.saveConfig(this.config);
  }
}
